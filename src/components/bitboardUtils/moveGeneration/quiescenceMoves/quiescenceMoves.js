import { WHITE } from "../../constants";
import { getBlackPieces, getWhitePieces } from "../../pieceGetters";
import { bishopQuiescence, knightQuiescence } from "./minorPieceQuiescence";
import { pawnQuiescence } from "./pawnQuiescence";

/**
 * A function that gets the moves for a quiescence search. These are captures and promotions.
 */
export const getQuiescenceMoves = (bitboards, player, enPassantSquare) => {
  const moves = [];

  
  const opponentPieces = player === WHITE
    ? getBlackPieces(bitboards)
    : getWhitePieces(bitboards);

  moves.append(pawnQuiescence(bitboards, player, enPassantSquare));
  moves.append(knightQuiescence(bitboards, player, opponentPieces));
  moves.append(bishopQuiescence(bitboards, player, opponentPieces));
};

