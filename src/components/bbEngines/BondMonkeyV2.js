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
import {
  allLegalMovesArr,
  bigIntFullRep,
} from "../bitboardUtils/generalHelpers";
import { updateCastlingRights } from "../bitboardUtils/moveMaking/castleMoveLogic";
import { makeMove } from "../bitboardUtils/moveMaking/makeMoveLogic";
import {
  getCachedAttackMask,
  updateAttackMaskHash,
} from "../bitboardUtils/PieceMasks/attackMask";
import { computeHash, updateHash } from "../bitboardUtils/zobristHashing";
import { checkGameOver } from "../bitboardUtils/gameOverLogic";
import { isInCheck } from "../bitboardUtils/bbChessLogic";
import {
  clearTT,
  getTT,
  setTT,
  TT_FLAG,
} from "../bitboardUtils/TranspositionTable/transpositionTable";
import { getPieceAtSquare } from "../bitboardUtils/pieceGetters";

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
 * @param {number} depth - the depth to search in ply. 1 ply is one player moving. 2 ply is one move, where each side gets to play.
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
  const opponent = player === "w" ? "b" : "w";

  let bestMove = null;
  let bestEval = null;

  const rootHash = computeHash(
    bitboards,
    player,
    enPassantSquare,
    castlingRights
  );
  const rootAttackHash = computeHash(bitboards, opponent);

  // Ensures the attack mask cache has the attack mask at the rootAttackHash
  getCachedAttackMask(bitboards, opponent, rootAttackHash);

  for (let depth = 1; depth <= maxDepth; depth++) {
    const { score, move } = minimax(
      bitboards,
      player,
      castlingRights,
      enPassantSquare,
      prevPositions,
      rootHash,
      rootAttackHash,
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

    if (Math.abs(score) > CHECKMATE_VALUE - depth && move) {
      console.log("mate break");
      break;
    }

    if (performance.now() - start > timeLimit) {
      console.log("time limit");
      break;
    }
  }
  return { ...bestMove, bestEval };
}

// Maximum search depth
const MAX_PLY = 32;

// killerMoves[ply] = [firstKillerMove, secondKillerMove]
const killerMoves = Array.from({ length: MAX_PLY }, () => [null, null]);

// historyScores[fromSquare][toSquare] = integer score
const historyScores = Array.from({ length: 64 }, () => Array(64).fill(0));

/**
 * A minimax function that recursively finds the evaluation of the function.
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - whose move it is ("w" or "b")
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - a map of the previous positions
 * @param {bigint} prevHash - the hash of the current position before moves are simulated.
 * @param {bigint} prevAttackHash - the attack hash of the current position before moves are simulated.
 * @param {string} result - a string of the result of the game. Null if game not over
 * @param {depth} currentDepth - the current depth of the search
 * @param {depth} maxDepth - the maximum depth of the search
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
  prevHash,
  prevAttackHash,
  result,
  currentDepth,
  maxDepth,
  alpha,
  beta
) => {
  if (currentDepth >= maxDepth) {
    if (!isInCheck(bitboards, player) || currentDepth !== maxDepth) {
      return {
        score: evaluate(bitboards, player, result, currentDepth),
        move: null,
      };
    }
  }

  if (result) {
    return {
      score: evaluate(bitboards, player, result, currentDepth),
      move: null,
    };
  }

  // Transpositition table logic
  const key = prevHash;
  const origAlpha = alpha;
  const ttEntry = getTT(key);
  if (ttEntry && ttEntry.depth >= maxDepth - currentDepth) {
    if (ttEntry.flag === TT_FLAG.EXACT) {
      return { score: ttEntry.value, move: ttEntry.bestMove };
    }
    if (ttEntry.flag === TT_FLAG.LOWER_BOUND) {
      alpha = Math.max(alpha, ttEntry.value);
    }
    if (ttEntry.flag === TT_FLAG.UPPER_BOUND) {
      beta = Math.min(beta, ttEntry.value);
    }
    if (alpha >= beta) {
      return { score: ttEntry.value, move: ttEntry.bestMove };
    }
  }

  const ttMove = ttEntry?.bestMove || null;

  const scored = allLegalMovesArr(
    bitboards,
    player,
    castlingRights,
    enPassantSquare,
    prevAttackHash
  ).map((move) => {
    let score = 0;

    // 1) Transposition-table move is highest priority
    if (ttMove && move.from === ttMove.from && move.to === ttMove.to) {
      score += 1_000_000;
    }

    // 2) Captures (MVV/LVA: victim value minus your piece value)
    if (move.isCapture) {
      score +=
        100_000 +
        (weights[getPieceAtSquare(move.to, bitboards)] || 0) -
        (weights[getPieceAtSquare(move.from, bitboards)] || 0);
    }

    // 3) Killer moves at this ply
    const [k0, k1] = killerMoves[currentDepth];
    if (k0 && move.from === k0.from && move.to === k0.to) {
      score += 90_000;
    } else if (k1 && move.from === k1.from && move.to === k1.to) {
      score += 80_000;
    }

    // 4) History heuristic
    score += historyScores[move.from][move.to];

    return { move, score };
  });

  if (scored.length === 0) {
    throw new Error("Issue with move generation. No moves generated");
  }

  // sort descending
  scored.sort((a, b) => b.score - a.score);
  const orderedMoves = scored.map((o) => o.move);

  let bestEval, bestMove;

  if (player === "w") {
    bestEval = -Infinity;

    for (const move of orderedMoves) {
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
      const whiteAttackHash = updateAttackMaskHash(
        bitboards,
        newBitboards,
        from,
        to,
        prevAttackHash,
        "w",
        newEnPassant
      );

      const gameOverObj = checkGameOver(
        newBitboards,
        "w",
        newPositions,
        newCastling,
        newEnPassant,
        0,
        whiteAttackHash
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
        hash,
        whiteAttackHash,
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
        // Update killer moves and history scores
        if (!move.isCapture) {
          const killer = killerMoves[currentDepth];

          if (
            !killer[0] ||
            move.from !== killer[0].from ||
            move.to !== killer[0].to
          ) {
            killer[1] = killer[0];
            killer[0] = move;
          }

          // Weights this move higher in history
          historyScores[move.from][move.to] += 2 ^ (maxDepth - currentDepth);
        }
        break;
      }
    }
  } else {
    bestEval = Infinity;

    for (const move of orderedMoves) {
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
      const blackAttackHash = updateAttackMaskHash(
        bitboards,
        newBitboards,
        from,
        to,
        prevAttackHash,
        "b",
        newEnPassant
      );

      const gameOverObj = checkGameOver(
        newBitboards,
        "b",
        newPositions,
        newCastling,
        newEnPassant,
        0,
        blackAttackHash
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
        hash,
        blackAttackHash,
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
        // Update killer moves and history scores
        if (!move.isCapture) {
          const killer = killerMoves[currentDepth];

          if (
            !killer[0] ||
            move.from !== killer[0].from ||
            move.to !== killer[0].to
          ) {
            killer[1] = killer[0];
            killer[0] = move;
          }

          // Weights this move higher in history
          historyScores[move.from][move.to] += 2 ^ (maxDepth - currentDepth);
        }
        break;
      }
    }
  }

  // Update transposition table
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

  if (!Number.isFinite(bestEval)) {
    console.log("SCORE IS INFINITE");
    console.log("Best Move:", bestMove);
    console.log("Depth:", currentDepth);
    console.log("Max Depth:", maxDepth);
    console.log(
      bigIntFullRep(getCachedAttackMask(bitboards, player, prevAttackHash))
    );
    throw new Error("Score is infinite");
  }

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
const evaluate = (bitboards, player, result, depth) => {
  // Needs to be a big number but not infinity because then it wont update the move
  if (result) {
    if (result.includes("Checkmate")) {
      return player === "w"
        ? -CHECKMATE_VALUE + depth
        : CHECKMATE_VALUE - depth;
    }
    return 0; // Draw
  }

  let evaluation = 0;

  for (const bitboard in bitboards) {
    evaluation += getNumPieces(bitboards[bitboard]) * weights[bitboard];
  }
  return evaluation;
};
