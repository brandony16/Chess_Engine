import { useCallback } from "react";
import { useGameStore } from "../../gameStore.ts";
import { movesToBB } from "../../generalHelpers.ts";
import { isCurrPosShown } from "../../stateUtils.ts";
import { NO_SQUARE, type File, type Rank } from "../../../game/chessConstants.ts";

/**
 * Custom hook for chess actions.
 * Includes processMove, handleSquareClick, and handlePromotion.
 */
export default function useChessActions() {
  /**
   * Handles when a square is clicked. Sets the selected square, makes a move,
   * handles when its a promotion move
   */
  const handleSquareClick = useCallback(
    (row: Rank, col: File) => {
      const { game, userSide, selectedSquare } = useGameStore.getState();
      if (
        game.isOver() ||
        !isCurrPosShown(useGameStore.getState()) ||
        userSide !== game.sideToMove
      ) {
        return;
      }

      const square = row * 8 + col;
      // Sets a selected square and gets the move bitboard for that piece
      if (game.isPlayersPieceAt(square, game.sideToMove)) {
        useGameStore.setState({ selectedSquare: square });

        const moves = game.generateLegalMoves();
        const movesForPiece = moves.filter((a) => a.from === square);

        useGameStore.setState({
          legalMovesForSelected: movesForPiece,
          promotion: { isHappening: false },
        });
        return;
      }

      // Handles when a move is being made.
      if (selectedSquare !== NO_SQUARE) {
        const moveBitboard = useGameStore.getState().moveBitboard;
        const mask = 1n << BigInt(square);

        if (moveBitboard & mask) {
          const piece = pieceAt[selectedSquare];

          // Promotion
          if (
            (row === 7 || row === 0) &&
            (piece === WHITE_PAWN || piece === BLACK_PAWN)
          ) {
            useGameStore.setState({
              promotion: true,
              promotionMove: { from: selectedSquare, to: square },
            });
            return;
          }

          processMove(selectedSquare, square);
        } else {
          useGameStore.setState({
            selectedSquare: null,
            moveBitboard: null,
            promotion: false,
            promotionMove: null,
          });
        }
      }
    },
    [processMove],
  );

  /**
   * Handles when a promotion happens. Called after the user clicks a piece
   * to promote to.
   * @param {int} piece - the piece to promote to
   */
  const handlePromotion = useCallback(
    (piece) => {
      const { promotionMove } = useGameStore.getState();
      const from = promotionMove.from;
      const to = promotionMove.to;

      processMove(from, to, piece);
    },
    [processMove],
  );

  return { processMove, handleSquareClick, handlePromotion };
}
