import { updateCastlingRights } from "../../bitboardUtils/moveMaking/castleMoveLogic.mjs";
import {
  makeMove,
  unMakeMove,
} from "../../bitboardUtils/moveMaking/makeMoveLogic.mjs";
import { updateHash } from "../../bitboardUtils/zobristHashing.mjs";
import { checkGameOver } from "../../bitboardUtils/gameOverLogic.mjs";
import { getNewEnPassant, isInCheck } from "../../bitboardUtils/bbChessLogic.mjs";
import {
  getTT,
  setTT,
  TT_FLAG,
} from "../../bitboardUtils/TranspositionTable/transpositionTable.mjs";
import { BLACK, MAX_PLY, WEIGHTS, WHITE } from "../../bitboardUtils/constants.mjs";
import { rootId } from "./BondMonkeyV2.mjs";
import { evaluate2 } from "./evaluation2.mjs";
import { getAllLegalMoves } from "../../bitboardUtils/moveGeneration/allMoveGeneration.mjs";
import { updateAttackMasks } from "../../bitboardUtils/PieceMasks/attackMask.mjs";
import { pieceAt } from "../../bitboardUtils/pieceGetters.mjs";

// killerMoves[ply] = [firstKillerMove, secondKillerMove]
const killerMoves = Array.from({ length: MAX_PLY }, () => [null, null]);

// historyScores[fromSquare][toSquare] = integer score
const historyScores = Array.from({ length: 64 }, () => Array(64).fill(0));

/**
 * A minimax function that recursively finds the evaluation of the function.
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - a map of the previous positions
 * @param {bigint} prevHash - the hash of the position before moves are simulated.
 * @param {bigint} prevAttackMask - the attack mask of the position before moves are simulated.
 * @param {depth} currentDepth - the current depth of the search
 * @param {depth} maxDepth - the maximum depth of the search
 * @param {number} alpha - the alpha value for alpha-beta pruning
 * @param {number} beta - the beta value for alpha-beta pruning
 * @returns {{score: number, move: object}} evaluation of the move and the move
 */
export const minimax2 = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  prevHash,
  currentDepth,
  maxDepth,
  alpha,
  beta
) => {
  const gameOver = checkGameOver(
    bitboards,
    player === WHITE ? BLACK : WHITE,
    prevPositions,
    enPassantSquare,
    0
  );

  if (gameOver.isGameOver) {
    return {
      score: evaluate2(bitboards, player, gameOver.result, currentDepth),
      move: null,
    };
  }

  if (currentDepth >= maxDepth) {
    // Extends search by one if player is in check
    if (!isInCheck(bitboards, player) || currentDepth !== maxDepth) {
      return {
        score: evaluate2(bitboards, player, gameOver.result, currentDepth),
        move: null,
      };
    }
  }

  // Transpositition table logic
  const key = prevHash;
  const origAlpha = alpha;
  const remaining = maxDepth - currentDepth;
  const ttEntry = getTT(key);

  if (ttEntry && ttEntry.depth >= remaining && ttEntry.rootId === rootId) {
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

  // Gets the legal moves then assigns them scores based on the transposition table,
  // if the move is a capture, if its a killer move, and if its in history.
  const scored = getAllLegalMoves(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  ).map((move) => {
    let score = 0;
    const from = move.from;
    const to = move.to;

    // 1) Transposition-table move is highest priority
    if (ttMove && from === ttMove.from && to === ttMove.to) {
      score += 1_000_000;
    }

    // 2) Captures (MVV/LVA: victim value minus your piece value)
    if (move.captured) {
      score +=
        100_000 + (WEIGHTS[pieceAt[to]] || 0) - (WEIGHTS[pieceAt[from]] || 0);
    }

    // 3) Killer moves at this ply
    const [k0, k1] = killerMoves[currentDepth];
    if (k0 && from === k0.from && to === k0.to) {
      score += 90_000;
    } else if (k1 && from === k1.from && to === k1.to) {
      score += 80_000;
    }

    // 4) History heuristic
    score += historyScores[from][to];

    return { move, score };
  });

  // If the game is over, it would have been caught by result existing
  if (scored.length === 0) {
    console.log("Depth:", currentDepth);
    console.log("Max Depth:", maxDepth);
    console.log("Player:", player);
    throw new Error("Issue with move generation. No moves generated");
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  const orderedMoves = scored.map((o) => o.move);

  let bestEval, bestMove;

  if (player === WHITE) {
    bestEval = -Infinity;

    for (const move of orderedMoves) {
      const from = move.from;

      makeMove(bitboards, move);
      updateAttackMasks(bitboards, move);

      // New game states
      const newEnPassant = getNewEnPassant(move);
      const newCastling = updateCastlingRights(from, move.to, castlingRights);
      const newPositions = new Map(prevPositions);

      // Update Hash
      const newEpFile = newEnPassant ? newEnPassant % 8 : -1;
      const prevEpFile = enPassantSquare ? enPassantSquare % 8 : -1;
      const castlingChanged = new Array(newCastling.length);
      for (let i = 0; i < newCastling.length; i++) {
        if (castlingRights[i] !== newCastling[i]) {
          castlingChanged[i] = true;
        } else {
          castlingChanged[i] = false;
        }
      }
      const hash = updateHash(
        prevHash,
        move,
        newEpFile,
        prevEpFile,
        castlingChanged
      );
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      const { score: moveEval } = minimax2(
        bitboards,
        BLACK,
        newCastling,
        newEnPassant,
        newPositions,
        hash,
        currentDepth + 1,
        maxDepth,
        alpha,
        beta
      );

      unMakeMove(move, bitboards);
      updateAttackMasks(bitboards, move);

      if (moveEval > bestEval) {
        bestEval = moveEval;
        bestMove = move;
      }
      if (moveEval > alpha) {
        alpha = moveEval;
      }

      if (beta <= alpha) {
        // Update killer moves and history scores
        if (move.captured === null) {
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
      makeMove(bitboards, move);
      updateAttackMasks(bitboards, move);

      const from = move.from;

      // New game states
      const newEnPassant = getNewEnPassant(move);
      const newCastling = updateCastlingRights(from, move.to, castlingRights);
      const newPositions = new Map(prevPositions);

      // Update Hash
      const newEpFile = newEnPassant ? newEnPassant % 8 : -1;
      const prevEpFile = enPassantSquare ? enPassantSquare % 8 : -1;
      const castlingChanged = new Array(newCastling.length);
      for (let i = 0; i < newCastling.length; i++) {
        if (castlingRights[i] !== newCastling[i]) {
          castlingChanged[i] = true;
        } else {
          castlingChanged[i] = false;
        }
      }
      const hash = updateHash(
        prevHash,
        move,
        newEpFile,
        prevEpFile,
        castlingChanged
      );
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      const { score: moveEval } = minimax2(
        bitboards,
        WHITE,
        newCastling,
        newEnPassant,
        newPositions,
        hash,
        currentDepth + 1,
        maxDepth,
        alpha,
        beta
      );

      unMakeMove(move, bitboards);

      if (moveEval < bestEval) {
        bestEval = moveEval;
        bestMove = move;
      }
      if (moveEval < beta) {
        beta = moveEval;
      }

      if (beta <= alpha) {
        // Update killer moves and history scores
        if (move.captured === null) {
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
    rootId: rootId,
    depth: maxDepth - currentDepth,
    value: bestEval,
    flag,
    bestMove,
  });

  if (!Number.isFinite(bestEval)) {
    throw new Error("Score is infinite");
  }

  return { score: bestEval, move: bestMove };
};
