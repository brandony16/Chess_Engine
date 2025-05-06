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
export const getQuiescenceMoves = (
  bitboards,
  player,
  enPassantSquare,
  oppAttackHash
) => {
  const moves = [];

  const opponentPieces =
    player === WHITE ? getBlackPieces(bitboards) : getWhitePieces(bitboards);

  moves.concat(
    pawnQuiescence(
      bitboards,
      player,
      opponentPieces,
      enPassantSquare,
      oppAttackHash
    )
  );
  moves.concat(
    knightQuiescence(bitboards, player, opponentPieces, oppAttackHash)
  );
  moves.concat(
    bishopQuiescence(bitboards, player, opponentPieces, oppAttackHash)
  );
  moves.concat(
    rookQuiescence(bitboards, player, opponentPieces, oppAttackHash)
  );
  moves.concat(
    queenQuiescence(bitboards, player, opponentPieces, oppAttackHash)
  );
  moves.concat(
    kingQuiescence(bitboards, player, opponentPieces, oppAttackHash)
  );

  return moves;
};
