/**
 * @typedef {object} Bitboards
 * @property {bigint} whitePawns - bitboard of the white pawns
 * @property {bigint} whiteKnights - bitboard of the white knights
 * @property {bigint} whiteBishops - bitboard of the white bishops
 * @property {bigint} whiteRooks - bitboard of the white rooks
 * @property {bigint} whiteQueens - bitboard of the white queens
 * @property {bigint} whiteKings - bitboard of the white king
 * @property {bigint} blackPawns - bitboard of the black pawns
 * @property {bigint} blackKnights - bitboard of the black knights
 * @property {bigint} blackBishops - bitboard of the black bishops
 * @property {bigint} blackRooks - bitboard of the black rooks
 * @property {bigint} blackQueens - bitboard of the black queens
 * @property {bigint} blackKings - bitboard of the black king
 */

import { getNumPieces } from "../bitboardUtils/bbUtils";
import { allLegalMovesArr } from "../bitboardUtils/generalHelpers";
import { updateCastlingRights } from "../bitboardUtils/moveMaking/castleMoveLogic";
import { makeMove } from "../bitboardUtils/moveMaking/makeMoveLogic";
import { updateAttackMaskHash } from "../bitboardUtils/PieceMasks/attackMask";
import { computeHash, updateHash } from "../bitboardUtils/zobristHashing";
import { checkGameOver, sortMoves } from "../bitboardUtils/gameOverLogic";
import { isInCheck } from "../bitboardUtils/bbChessLogic";
import {
  clearTT,
  generateTTKey,
  getTT,
  setTT,
  TT_FLAG,
} from "../bitboardUtils/TranspositionTable/transpositionTable";

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * Gets the best move in a position based purely off of material.
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - the player whose move it is ("w" or "b")
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - a map of the previous positions
 * @param {number} depth - the depth to search
 * @param {number} timeLimit - the max time the engine can search in milliseconds.
 * @returns {{ from: number, to: number, promotion: string}, number} the best move found and the evaluation
 */
export function BMV2(
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  maxDepth,
  timeLimit = Infinity
) {
  clearTT(); // Clears transposition table

  const start = performance.now();

  let bestMove = null;
  let bestEval = null;

  for (let depth = 1; depth <= maxDepth; depth++) {
    const { score, move } = minimax(
      bitboards,
      player,
      castlingRights,
      enPassantSquare,
      prevPositions,
      null,
      0,
      depth,
      -Infinity,
      Infinity
    );

    if (move != null) {
      bestEval = score;
      bestMove = move;
    }

    if (Math.abs(score) > CHECKMATE_VALUE - depth) {
      break;
    }

    if (performance.now() - start > timeLimit) {
      break;
    }
  }

  return { ...bestMove, bestEval };
}

/**
 * A minimax function that recursively finds the evaluation of the function.
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - whose move it is ("w" or "b")
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - a map of the previous positions
 * @param {string} result - a string of the result of the game. Null if game not over
 * @param {depth} depth - the depth left to search
 * @param {number} alpha - the alpha value for alpha-beta pruning
 * @param {number} beta - the beta value for alpha-beta pruning
 * @returns {{score: number, move: object}} evaluation of the move and the move
 */
const minimax = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  result,
  currentDepth,
  maxDepth,
  alpha,
  beta
) => {
  if (currentDepth >= maxDepth || result) {
    if (isInCheck(bitboards, player) && currentDepth === maxDepth) {
      maxDepth += 1;
    } else {
      return { score: evaluate(bitboards, player, result), move: null };
    }
  }

  const key = generateTTKey(bitboards, player, enPassantSquare, castlingRights);
  const origAlpha = alpha;
  const ttEntry = getTT(key);
  if (ttEntry && ttEntry.depth >= maxDepth - currentDepth) {
    if (ttEntry.flag === TT_FLAG.EXACT)
      return { score: ttEntry.value, move: ttEntry.bestMove };
    if (ttEntry.flag === TT_FLAG.LOWER_BOUND) {
      alpha = Math.max(alpha, ttEntry.value);
    }
    if (ttEntry.flag === TT_FLAG.UPPER_BOUND) {
      beta = Math.min(beta, ttEntry.value);
    }
    if (alpha >= beta) return { score: ttEntry.value, move: ttEntry.bestMove };
  }

  const moves = allLegalMovesArr(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  );
  const sortedMoves = sortMoves(moves);
  const prevHash = computeHash(bitboards, player, enPassantSquare);
  const prevAttackHash = computeHash(bitboards, player);

  let bestEval, bestMove;

  if (player === "w") {
    bestEval = -Infinity;

    for (const move of sortedMoves) {
      const from = move.from;
      const to = move.to;
      const promotion = move.promotion || null;
      let moveObj = makeMove(
        bitboards,
        from,
        to,
        enPassantSquare,
        promotion,
        prevAttackHash
      );

      // New game states
      const newBitboards = moveObj.bitboards;
      const newEnPassant = moveObj.enPassantSquare;
      const newCastling = updateCastlingRights(from, castlingRights);
      const newPositions = new Map(prevPositions);
      const attackHash = updateAttackMaskHash(
        bitboards,
        newBitboards,
        from,
        to,
        prevAttackHash
      );
      const gameOverObj = checkGameOver(
        newBitboards,
        player,
        newPositions,
        newCastling,
        newEnPassant,
        0,
        attackHash
      );
      const result = gameOverObj.result;

      // Update Hash
      let enPassantChanged = false;
      if (
        (enPassantSquare && !moveObj.enPassantSquare) ||
        (!enPassantSquare && moveObj.enPassantSquare)
      ) {
        enPassantChanged = true;
      }
      const castlingChanged = {
        whiteKingside:
          castlingRights.whiteKingside !== newCastling.whiteKingside,
        whiteQueenside:
          castlingRights.whiteQueenside !== newCastling.whiteQueenside,
        blackKingside:
          castlingRights.blackKingside !== newCastling.blackKingside,
        blackQueenside:
          castlingRights.blackQueenside !== newCastling.blackQueenside,
      };
      const hash = updateHash(
        bitboards,
        newBitboards,
        to,
        from,
        enPassantChanged,
        castlingChanged,
        prevHash
      );
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      const { score: moveEval } = minimax(
        newBitboards,
        "b",
        newCastling,
        newEnPassant,
        newPositions,
        result,
        currentDepth + 1,
        maxDepth,
        alpha,
        beta
      );

      if (moveEval > bestEval) {
        bestEval = moveEval;
        bestMove = move;
      }
      if (moveEval > alpha) {
        alpha = moveEval;
      }

      if (beta <= alpha) {
        break;
      }
    }
  } else {
    bestEval = Infinity;

    for (const move of sortedMoves) {
      const from = move.from;
      const to = move.to;
      const promotion = move.promotion || null;
      let moveObj = makeMove(bitboards, from, to, enPassantSquare, promotion);

      // New game states
      const newBitboards = moveObj.bitboards;
      const newEnPassant = moveObj.enPassantSquare;
      const newCastling = updateCastlingRights(from, castlingRights);
      const newPositions = new Map(prevPositions);
      const attackHash = updateAttackMaskHash(
        bitboards,
        newBitboards,
        from,
        to,
        prevAttackHash
      );
      const gameOverObj = checkGameOver(
        newBitboards,
        player,
        newPositions,
        newCastling,
        newEnPassant,
        0,
        attackHash
      );
      const result = gameOverObj.result;

      // Update Hashes
      let enPassantChanged = false;
      if (
        (enPassantSquare && !moveObj.enPassantSquare) ||
        (!enPassantSquare && moveObj.enPassantSquare)
      ) {
        enPassantChanged = true;
      }
      const castlingChanged = {
        whiteKingside:
          castlingRights.whiteKingside !== newCastling.whiteKingside,
        whiteQueenside:
          castlingRights.whiteQueenside !== newCastling.whiteQueenside,
        blackKingside:
          castlingRights.blackKingside !== newCastling.blackKingside,
        blackQueenside:
          castlingRights.blackQueenside !== newCastling.blackQueenside,
      };
      const hash = updateHash(
        bitboards,
        newBitboards,
        to,
        from,
        enPassantChanged,
        castlingChanged,
        prevHash
      );
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      const { score: moveEval } = minimax(
        newBitboards,
        "w",
        newCastling,
        newEnPassant,
        newPositions,
        result,
        currentDepth + 1,
        maxDepth,
        alpha,
        beta
      );

      if (moveEval < bestEval) {
        bestEval = moveEval;
        bestMove = move;
      }
      if (moveEval < beta) {
        beta = moveEval;
      }

      if (beta <= alpha) {
        break;
      }
    }
  }

  let flag = TT_FLAG.EXACT;
  if (bestEval <= origAlpha) {
    flag = TT_FLAG.UPPER_BOUND;
  } else if (bestEval >= beta) {
    flag = TT_FLAG.LOWER_BOUND;
  }
  setTT(key, {
    depth: maxDepth - currentDepth,
    value: bestEval,
    flag,
    bestMove,
  });

  return { score: bestEval, move: bestMove };
};

// An object of all the weights of the pieces
const weights = {
  blackPawns: -1,
  blackKnights: -3,
  blackBishops: -3,
  blackRooks: -5,
  blackQueens: -9,
  blackKings: -1000000,
  whitePawns: 1,
  whiteKnights: 3,
  whiteBishops: 3,
  whiteRooks: 5,
  whiteQueens: 9,
  whiteKings: 1000000,
};

/**
 * Checkmate constant
 */
const CHECKMATE_VALUE = 10_000_000;

/**
 * Gets the evaluation of the given position based purely off of the material in the position.
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - the opposite player. If black plays checkmate, this is white.
 * @param {string} result - the game over result of the position. Null if game is not over
 * @returns {number} The evaluation
 */
const evaluate = (bitboards, player, result) => {
  // Needs to be a big number but not infinity because then it wont update the move
  if (result) {
    if (result.includes("Checkmate")) {
      return player === "w" ? -CHECKMATE_VALUE : CHECKMATE_VALUE;
    }
    return 0; // Draw
  }

  let evaluation = 0;

  for (const bitboard in bitboards) {
    evaluation += getNumPieces(bitboards[bitboard]) * weights[bitboard];
  }
  return evaluation;
};
