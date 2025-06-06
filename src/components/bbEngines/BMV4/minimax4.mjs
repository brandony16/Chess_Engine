import { updateCastlingRights } from "../../bitboardUtils/moveMaking/castleMoveLogic.mjs";
import {
  makeMove,
  unMakeMove,
} from "../../bitboardUtils/moveMaking/makeMoveLogic.mjs";
import { updateHash } from "../../bitboardUtils/zobristHashing.mjs";
import { checkGameOver } from "../../bitboardUtils/gameOverLogic.mjs";
import {
  getNewEnPassant,
  isInCheck,
} from "../../bitboardUtils/bbChessLogic.mjs";
import {
  getTT,
  setTT,
  TT_FLAG,
} from "../../bitboardUtils/TranspositionTable/transpositionTable.mjs";
import { BLACK, MAX_PLY, WHITE } from "../../bitboardUtils/constants.mjs";
import { rootId } from "./BondMonkeyV4.mjs";
import { evaluate4, weights } from "./evaluation4.mjs";
import { quiesce1 } from "./quiesce.mjs";
import { getAllLegalMoves } from "../../bitboardUtils/moveGeneration/allMoveGeneration.mjs";

// killerMoves[ply] = [firstKillerMove, secondKillerMove]
const killerMoves = Array.from({ length: MAX_PLY }, () => [null, null]);

// historyScores[fromSquare][toSquare] = integer score
const historyScores = Array.from({ length: 64 }, () => Array(64).fill(0));

/**
 * A minimax function that recursively finds the evaluation of the function.
 * V4: Adds quiescence search after depth is reached.
 * 
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {0 | 1} player - the player whose move it is (0 for w, 1 for b)
 * @param {Array<boolean>} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - a map of the previous positions
 * @param {bigint} prevHash - the hash of the current position before moves are simulated.
 * @param {depth} currentDepth - the current depth of the search
 * @param {depth} maxDepth - the maximum depth of the search
 * @param {number} alpha - the alpha value for alpha-beta pruning
 * @param {number} beta - the beta value for alpha-beta pruning
 * @returns {{score: number, move: object}} evaluation of the move and the move
 */

export const minimax4 = (
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
  const opponent = player === WHITE ? BLACK : WHITE;
  const gameOver = checkGameOver(
    bitboards,
    opponent,
    prevPositions,
    enPassantSquare,
    0
  );

  if (gameOver.isGameOver) {
    return {
      score: evaluate4(opponent, gameOver.result, currentDepth),
      move: null,
    };
  }

  if (currentDepth >= maxDepth) {
    // Extends search by one if player is in check
    if (!isInCheck(bitboards, player) || currentDepth !== maxDepth) {
      const q = quiesce1(
        bitboards,
        player,
        alpha,
        beta,
        enPassantSquare,
        castlingRights,
        prevPositions,
        prevHash
      );
      return { score: q.score, move: null };
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
        100_000 +
        (weights[move.captured % 6] || 0) -
        (weights[move.piece % 6] || 0);
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

  // If the game is over, it would have been caught by gameOver check at beginning
  if (scored.length === 0) {
    throw new Error("Issue with move generation. No moves generated");
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  const orderedMoves = scored.map((o) => o.move);

  let bestEval = -Infinity;
  let bestMove = null;

  for (const move of orderedMoves) {
    makeMove(bitboards, move);

    const from = move.from;

    // New game states
    const newEnPassant = getNewEnPassant(move);
    const newCastling = updateCastlingRights(from, move.to, castlingRights);

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
    const oldCount = prevPositions.get(hash) || 0;
    prevPositions.set(hash, oldCount + 1);

    const { score: moveEval } = minimax4(
      bitboards,
      opponent,
      newCastling,
      newEnPassant,
      prevPositions,
      hash,
      currentDepth + 1,
      maxDepth,
      -beta,
      -alpha
    );

    unMakeMove(move, bitboards);
    if (oldCount) prevPositions.set(hash, oldCount);
    else prevPositions.delete(hash);

    const score = -moveEval;
    if (score > bestEval) {
      bestEval = score;
      bestMove = move;
    }

    if (score > alpha) {
      alpha = score;
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

  // Update transposition table
  let flag = TT_FLAG.EXACT;
  const storedEval = bestEval;
  if (storedEval <= origAlpha) {
    flag = TT_FLAG.UPPER_BOUND;
  } else if (storedEval >= beta) {
    flag = TT_FLAG.LOWER_BOUND;
  }
  setTT(key, {
    rootId: rootId,
    depth: maxDepth - currentDepth,
    value: storedEval,
    flag,
    bestMove,
  });

  return { score: bestEval, move: bestMove };
};
