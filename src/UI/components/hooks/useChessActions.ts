import { useCallback } from "react";
import { game, useGameStore } from "../../gameStore.ts";
import { movesToBB } from "../../generalHelpers.ts";
import { findMove, isCurrPosShown } from "../../stateUtils.ts";
import {
  NO_SQUARE,
  RANK_1,
  RANK_8,
  WHITE,
  type File,
  type Piece,
  type Rank,
} from "../../../game/chessConstants.ts";
import { getSquare } from "../../../game/helpers/boardUtils.ts";
import { isPawn } from "../../../game/pieceUtils/pieceClassifiers.ts";
import { moveFrom } from "../../../game/moveMaking/move.ts";

/**
 * Custom hook for chess actions.
 * Includes processMove, handleSquareClick, and handlePromotion.
 */
export default function useChessActions() {
  /**
   * Handles when a square is clicked. Sets the selected square, makes a move,
   * handles when its a promotion move
   */
  const handleSquareClick = useCallback((rank: Rank, file: File) => {
    const {
      userSide,
      selectedSquare,
      playMove,
      lastMoveTimestamp,
      whiteTimeMs,
      blackTimeMs,
      clockSettings,
      isGameOver,
    } = useGameStore.getState();

    if (
      isGameOver() ||
      !isCurrPosShown(useGameStore.getState()) ||
      userSide !== game.sideToMove
    ) {
      return;
    }

    const square = getSquare(rank, file);
    // Sets a selected square and gets the move bitboard for that piece
    if (game.isPlayersPieceAt(square, game.sideToMove)) {
      useGameStore.setState({ selectedSquare: square });

      const moves = game.generateLegalMoves();
      const movesForPiece = moves.filter((a) => moveFrom(a) === square);

      useGameStore.setState({
        legalMovesForSelected: [...movesForPiece],
        promotion: { isHappening: false },
      });
      return;
    }

    // Handles when a move is being made.
    if (selectedSquare !== NO_SQUARE) {
      const { legalMovesForSelected } = useGameStore.getState();
      const moveBB = movesToBB(legalMovesForSelected);
      const mask = 1n << BigInt(square);

      // Move
      if (moveBB & mask) {
        const piece = game.getPiece(selectedSquare);

        // Promotion
        if ((rank === RANK_8 || rank === RANK_1) && isPawn(piece)) {
          useGameStore.setState({
            promotion: { isHappening: true, square: square },
          });
          return;
        }

        const move = findMove(useGameStore.getState(), selectedSquare, square);

        const timeSpent = Date.now() - lastMoveTimestamp;
        const currTime = userSide === WHITE ? whiteTimeMs : blackTimeMs;
        const newTimeRemaining = Math.max(
          0,
          currTime - timeSpent + clockSettings.increment,
        );
        playMove(move, newTimeRemaining);
      } else {
        useGameStore.setState({
          selectedSquare: NO_SQUARE,
          legalMovesForSelected: [],
          promotion: { isHappening: false },
        });
      }
    }
  }, []);

  /**
   * Handles when a promotion happens. Called after the user clicks a piece
   * to promote to.
   * @param {int} piece - the piece to promote to
   */
  const handlePromotion = useCallback((piece: Piece) => {
    const {
      userSide,
      playMove,
      promotion,
      selectedSquare,
      lastMoveTimestamp,
      whiteTimeMs,
      blackTimeMs,
      clockSettings,
    } = useGameStore.getState();

    if (!selectedSquare || !promotion.isHappening) {
      throw new Error(
        `Promotion called with no selected sq or when promotion is not occuring`,
      );
    }

    const move = findMove(
      useGameStore.getState(),
      selectedSquare,
      promotion.square,
      piece,
    );

    const timeSpent = Date.now() - lastMoveTimestamp;
    const currTime = userSide === WHITE ? whiteTimeMs : blackTimeMs;
    const newTimeRemaining = Math.max(
      0,
      currTime - timeSpent + clockSettings.increment,
    );
    playMove(move, newTimeRemaining);
  }, []);

  return { handleSquareClick, handlePromotion };
}
