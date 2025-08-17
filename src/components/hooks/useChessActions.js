import { useCallback } from "react";
import { useGameStore } from "../gameStore.mjs";
import {
  movesToBB,
  moveToReadable,
} from "../../Core Logic/helpers/generalHelpers.mjs";
import { checkGameOver } from "../../Core Logic/gameOverLogic.mjs";
import { computeHash } from "../../Core Logic/zobristHashing.mjs";
import { getNewEnPassant } from "../../Core Logic/bbChessLogic.mjs";
import { makeMove } from "../../Core Logic/moveMaking/makeMoveLogic.mjs";
import Move from "../../Core Logic/moveMaking/move.mjs";
import { BLACK_PAWN, WHITE_PAWN } from "../../Core Logic/constants.mjs";
import {
  isPlayersPieceAtSquare,
  pieceAt,
} from "../../Core Logic/pieceGetters.mjs";
import { getAllLegalMoves } from "../../Core Logic/moveGeneration/allMoveGeneration.mjs";
import { isKing, isPawn } from "../../Core Logic/helpers/pieceUtils";

/**
 * Custom hook for chess actions.
 * Includes processMove, handleSquareClick, and handlePromotion.
 */
export default function useChessActions() {
  /**
   * Processes a move by making the move and updating state.
   *
   * @param {int} from - the square the piece is moving from
   * @param {int} to - the square the piece is moving to
   * @param {int} promotion - the piece to promote to
   */
  const processMove = useCallback((from, to, promotion = null) => {
    const {
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      pastPositions,
      updateStates,
      fiftyMoveRuleCounter,
    } = useGameStore.getState();

    // Get variables for Move object
    const piece = pieceAt[from];
    const castling = isKing(piece) && Math.abs(from - to) === 2;
    const enPassant = to === enPassantSquare && isPawn(piece);
    let captured = pieceAt[to];
    if (enPassant) {
      captured = piece === WHITE_PAWN ? BLACK_PAWN : WHITE_PAWN;
    }

    const move = new Move(
      from,
      to,
      piece,
      captured,
      promotion,
      castling,
      enPassant
    );

    makeMove(bitboards, move);

    const newEnPassant = getNewEnPassant(move);
    const epFile = newEnPassant ? newEnPassant % 8 : -1;

    const hash = computeHash(bitboards, currPlayer, epFile, castlingRights);

    pastPositions.set(hash, (pastPositions.get(hash) || 0) + 1);

    const gameOverObj = checkGameOver(
      bitboards,
      currPlayer,
      pastPositions,
      newEnPassant,
      fiftyMoveRuleCounter
    );

    const readableMove = moveToReadable(
      bitboards,
      from,
      to,
      move.captured !== null
    );

    updateStates(readableMove, move, gameOverObj);
  }, []);

  /**
   * Handles when a square is clicked. Sets the selected square, makes a move,
   * handles when its a promotion move
   *
   * @param {int} row - the row of the square that was clicked
   * @param {int} col - the column of the square that was clicked
   */
  const handleSquareClick = useCallback(
    (row, col) => {
      const {
        isCurrPositionShown,
        isGameOver,
        bitboards,
        currPlayer,
        castlingRights,
        enPassantSquare,
        userSide,
        selectedSquare,
      } = useGameStore.getState();
      if (isGameOver || !isCurrPositionShown || userSide !== currPlayer) return;

      const square = row * 8 + col;
      // Sets a selected square and gets the move bitboard for that piece
      if (isPlayersPieceAtSquare(currPlayer, square, bitboards)) {
        useGameStore.setState({ selectedSquare: square });

        const moves = getAllLegalMoves(
          bitboards,
          currPlayer,
          castlingRights,
          enPassantSquare
        );

        const moveBB = movesToBB(moves.filter((a) => a.from === square));

        useGameStore.setState({
          moveBitboard: moveBB,
          promotion: false,
          promotionMove: null,
        });
        return;
      }

      // Handles when a move is being made.
      if (selectedSquare !== null) {
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
    [processMove]
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
    [processMove]
  );

  return { processMove, handleSquareClick, handlePromotion };
}
