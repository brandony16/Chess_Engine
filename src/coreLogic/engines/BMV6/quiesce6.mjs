import { getNewEnPassant } from "../../bbChessLogic.mjs";
import { BLACK, WHITE } from "../../constants.mjs";
import { checkGameOver } from "../../gameOverLogic.mjs";
import { getQuiescenceMoves } from "../../moveGeneration/quiescenceMoves.mjs";
import { updateCastlingRights } from "../../moveMaking/castleMoveLogic.mjs";
import { makeMove, unMakeMove } from "../../moveMaking/makeMoveLogic.mjs";
import { getQTT, setQTT, TT_FLAG } from "../../transpositionTable.mjs";
import { updateHash } from "../../zobristHashing.mjs";
import { evaluate6, weights } from "./evaluation/evaluation6.mjs";
import { ENGINE_STATS } from "../../debugFunctions.mjs";

// Max depth that quiescence search can go to.
const maxQDepth = 4;

/**
 * Performs a quiescence search, which calculates lines of captures. Only evaluates moves
 * that are captures or promotions to increase tactical capabilities. Uses negamax, a
 * variation of minimax that serves the same purpose.
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} alpha - the alpha value for alpha-beta pruning
 * @param {number} beta - the beta value for alpha-beta pruning
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Array<boolean>} castlingRights - the castling rights
 * @param {Map} prevPositions - a map of the previous positions
 * @param {bigint} prevHash - the hash of the current position before moves are simulated.
 * @param {ENGINE_STATS} stats - an object for logging stats of the search.
 *
 * @returns {{ score: number, move: null }} - an object with the score and move number
 */
export const quiesce6 = (
  bitboards,
  player,
  alpha,
  beta,
  enPassantSquare,
  castlingRights,
  prevPositions,
  prevHash,
  stats,
  depth = 0
) => {
  // Increment node count
  stats.quiesceNodes++;

  // Terminal check for if game is over
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
      score: evaluate6(bitboards, opponent, gameOver.result, 0),
      move: null,
    };
  }

  // Static evaluation of the position
  const standPat = evaluate6(bitboards, player, null, 0);

  if (depth + 1 > maxQDepth) {
    return { score: standPat, move: null };
  }

  // Beta cutoff
  if (standPat >= beta) {
    stats.quiesceBetaCuts++;
    return { score: beta, move: null };
  }

  const origAlpha = alpha;
  alpha = Math.max(alpha, standPat);

  // Use transposition table values
  const ttEntry = getQTT(prevHash);
  const remaining = maxQDepth - depth;
  if (ttEntry && ttEntry.depth >= remaining && ttEntry.isQuiescence) {
    stats.quiesceTtHits++;

    if (ttEntry.flag === TT_FLAG.EXACT) {
      stats.quiesceTtExactHits++;
      return { score: ttEntry.value, move: ttEntry.bestMove };
    }
    if (ttEntry.flag === TT_FLAG.LOWER_BOUND) {
      alpha = Math.max(alpha, ttEntry.value);
    }
    if (ttEntry.flag === TT_FLAG.UPPER_BOUND) {
      beta = Math.min(beta, ttEntry.value);
    }
    if (alpha >= beta) {
      stats.quiesceTtCutoffHits++;
      return { score: ttEntry.value, move: ttEntry.bestMove };
    }
  }

  const ttMove = ttEntry?.bestMove || null;

  // Generates only capture and promotion moves
  const captures = getQuiescenceMoves(
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
      stats.quiesceTtMoveUsed++;
      score += 1_000_000;
    }

    // 2) Captures (MVV/LVA: victim value minus your piece value)
    if (move.captured) {
      const victimValue = weights[move.captured % 6] || 0;
      const attackerValue = weights[move.piece % 6] || 0;
      const diff = victimValue - attackerValue;
      score += 100_000 + diff * 1000;
    }

    return { move, score };
  });

  // Sort by MVV/LVA
  captures.sort((a, b) => b.score - a.score);
  const orderedCaptures = captures.map((m) => m.move);

  let bestMove = null;
  for (const move of orderedCaptures) {
    const victimValue = weights[move.captured % 6] || 0;
    // if even winning the capture can’t push us above alpha, skip it:
    if (standPat + victimValue <= alpha) continue;

    makeMove(bitboards, move);

    const newEnPassant = getNewEnPassant(move);
    const newCastling = updateCastlingRights(
      move.from,
      move.to,
      castlingRights
    );

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
    const newHash = updateHash(
      prevHash,
      move,
      newEpFile,
      prevEpFile,
      castlingChanged
    );
    const oldCount = prevPositions.get(newHash) || 0;
    prevPositions.set(newHash, oldCount + 1);

    const { score: scoreAfterCapture } = quiesce6(
      bitboards,
      opponent,
      -beta,
      -alpha,
      newEnPassant,
      newCastling,
      prevPositions,
      newHash,
      stats,
      depth + 1
    );

    unMakeMove(move, bitboards);
    if (oldCount) prevPositions.set(newHash, oldCount);
    else prevPositions.delete(newHash);

    const score = -scoreAfterCapture;
    if (score >= beta) {
      return { score: beta, move: null };
    }
    if (score > alpha) {
      alpha = score;
      bestMove = move;
    }

    if (beta <= alpha) {
      stats.quiesceBetaCuts++;
      break;
    }
  }

  let flag = TT_FLAG.EXACT;
  if (alpha <= origAlpha) {
    flag = TT_FLAG.UPPER_BOUND;
  } else if (alpha >= beta) {
    flag = TT_FLAG.LOWER_BOUND;
  }
  setQTT(prevHash, {
    value: alpha,
    depth: remaining,
    flag: flag,
    isQuiescence: true,
    bestMove,
  });

  return { score: alpha, move: null };
};
