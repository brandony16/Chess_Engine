import { WHITE } from "../../constants";
import { getBlackPieces, getWhitePieces } from "../../pieceGetters";
import {
  kingQuiescence,
  queenQuiescence,
  rookQuiescence,
} from "./majorPieceQuiescence";
import { bishopQuiescence, knightQuiescence } from "./minorPieceQuiescence";
import { pawnQuiescence } from "./pawnQuiescence";

/**
 * A function that gets the moves for a quiescence search. These are captures and promotions.
 */
export const getQuiescenceMoves = (bitboards, player, enPassantSquare) => {
  const moves = [];

  const opponentPieces =
    player === WHITE ? getBlackPieces(bitboards) : getWhitePieces(bitboards);

  moves.concat(pawnQuiescence(bitboards, player, opponentPieces, enPassantSquare));
  moves.concat(knightQuiescence(bitboards, player, opponentPieces));
  moves.concat(bishopQuiescence(bitboards, player, opponentPieces));
  moves.concat(rookQuiescence(bitboards, player, opponentPieces));
  moves.concat(queenQuiescence(bitboards, player, opponentPieces));
  moves.concat(kingQuiescence(bitboards, player, opponentPieces));
};
