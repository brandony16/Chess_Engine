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
 * @returns {{ from: number, to: number, promotion: string}} the best move found
 */
export const BMV2 = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  maxDepth,
) => {
  const moves = allLegalMovesArr(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  );
  const sortedMoves = sortMoves(moves);
  const prevHash = computeHash(bitboards, player, enPassantSquare);
  const prevAttackHash = computeHash(bitboards, player);

  let bestMove = sortedMoves[0] || null;
  let bestEval = player === "w" ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  const isPlayerWhite = player === "w";
  const isPlayerBlack = player === "b";

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
    const newPlayer = isPlayerWhite ? "b" : "w";
    const attackHash = updateAttackMaskHash(bitboards, newBitboards, from, to, prevAttackHash);
    const gameOverObj = checkGameOver(
      newBitboards,
      player,
      newPositions,
      newCastling,
      newEnPassant,
      0,
      attackHash,
    );
    const result = gameOverObj.result;

    // Update Hashe
    let enPassantChanged = false;
    if (
      (enPassantSquare && !moveObj.enPassantSquare) ||
      (!enPassantSquare && moveObj.enPassantSquare)
    ) {
      enPassantChanged = true;
    }
    const hash = updateHash(
      bitboards,
      newBitboards,
      to,
      from,
      enPassantChanged,
      prevHash
    );
    newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

    const moveEval = minimax(
      newBitboards,
      newPlayer,
      newCastling,
      newEnPassant,
      newPositions,
      result,
      1,
      maxDepth,
      alpha,
      beta
    );

    if (
      (isPlayerWhite && moveEval > bestEval) ||
      (isPlayerBlack && moveEval < bestEval)
    ) {
      bestEval = moveEval;
      bestMove = move;
    }

    if (isPlayerWhite) {
      alpha = Math.max(alpha, moveEval);
    } else {
      beta = Math.min(beta, moveEval);
    }

    if (beta <= alpha) {
      break;
    }
  }

  return bestMove;
};

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
 * @returns {number} evaluation of the move
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
      return evaluate(bitboards, player, result);
    }
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

  if (player === "w") {
    let maxEval = -Infinity;

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
      const attackHash = updateAttackMaskHash(bitboards, newBitboards, from, to, prevAttackHash);
      const gameOverObj = checkGameOver(
        newBitboards,
        player,
        newPositions,
        newCastling,
        newEnPassant,
        0,
        attackHash,
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
      const hash = updateHash(
        bitboards,
        newBitboards,
        to,
        from,
        enPassantChanged,
        prevHash
      );
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      const moveEval = minimax(
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

      if (moveEval > maxEval) {
        maxEval = moveEval;
      }
      if (moveEval > alpha) {
        alpha = moveEval;
      }

      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;

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
      const attackHash = updateAttackMaskHash(bitboards, newBitboards, from, to, prevAttackHash);
      const gameOverObj = checkGameOver(
        newBitboards,
        player,
        newPositions,
        newCastling,
        newEnPassant,
        0,
        attackHash,
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
      const hash = updateHash(
        bitboards,
        newBitboards,
        to,
        from,
        enPassantChanged,
        prevHash
      );
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      const moveEval = minimax(
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

      if (moveEval < minEval) {
        minEval = moveEval;
      }
      if (moveEval < beta) {
        beta = moveEval;
      }

      if (beta <= alpha) {
        break;
      }
    }
    return minEval;
  }
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
