import { getNewEnPassant } from "../../bbChessLogic.mjs";
import { BLACK, WHITE } from "../../constants.mjs";
import { checkGameOver } from "../../gameOverLogic.mjs";
import { getQuiescenceMoves } from "../../moveGeneration/quiescenceMoves.mjs";
import { updateCastlingRights } from "../../moveMaking/castleMoveLogic.mjs";
import { makeMove, unMakeMove } from "../../moveMaking/makeMoveLogic.mjs";
import { getQTT, setQTT, TT_FLAG } from "../../transpositionTable.mjs";
import { updateHash } from "../../zobristHashing.mjs";
import { evaluate4, weights } from "./evaluation4.mjs";

// Max depth that quiescence search can go to.
const maxQDepth = 6;

// killerMoves[ply] = [firstKillerMove, secondKillerMove]
const killerMoves = Array.from({ length: maxQDepth }, () => [null, null]);

// historyScores[fromSquare][toSquare] = integer score
const historyScores = Array.from({ length: 64 }, () => Array(64).fill(0));

/**
 * Performs a quiescence search, which calculates lines of captures. Only evaluates moves
 * that are captures or promotions to increase tactical capabilities. Implements many of
 * the same features of the minimax search, such as transposition tables, and advanced move
 * sorting.
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} alpha - the alpha value for alpha-beta pruning
 * @param {number} beta - the beta value for alpha-beta pruning
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Array<boolean>} castlingRights - the castling rights
 * @param {Map} prevPositions - a map of the previous positions
 * @param {bigint} prevHash - the hash of the current position before moves are simulated.
 *
 * @returns {{ score: number, move: null }} - an object with the score and move number
 */
export const quiesce4 = (
  bitboards,
  player,
  alpha,
  beta,
  enPassantSquare,
  castlingRights,
  prevPositions,
  prevHash,
  depth = 0
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
      score: evaluate4(opponent, gameOver.result, 0),
      move: null,
    };
  }

  // Static evaluation of the position
  const standPat = evaluate4(player, null, 0);

  if (depth + 1 > maxQDepth) {
    return { score: standPat, move: null };
  }

  // Beta cutoff
  if (standPat >= beta) {
    return { score: beta, move: null };
  }
  const origAlpha = alpha;
  alpha = Math.max(alpha, standPat);

  const ttEntry = getQTT(prevHash);
  const remaining = maxQDepth - depth;
  if (ttEntry && ttEntry.depth >= remaining && ttEntry.isQuiescence) {
    if (ttEntry.flag === TT_FLAG.EXACT) {
      return { score: ttEntry.value, move: null };
    } else if (ttEntry.flag === TT_FLAG.LOWER_BOUND && ttEntry.value > alpha) {
      alpha = ttEntry.value;
    } else if (ttEntry.flag === TT_FLAG.UPPER_BOUND && ttEntry.value < beta) {
      beta = ttEntry.value;
    }
    if (alpha >= beta) {
      return { score: ttEntry.value, move: null };
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
      score += 1_000_000;
    }

    // 2) MVV/LVA: victim value minus your piece value
    if (move.captured) {
      score +=
        100_000 +
        (weights[move.captured % 6] || 0) -
        (weights[move.piece % 6] || 0);
    }

    // 3) Killer moves at this ply
    const [k0, k1] = killerMoves[depth];
    if (k0 && from === k0.from && to === k0.to) {
      score += 90_000;
    } else if (k1 && from === k1.from && to === k1.to) {
      score += 80_000;
    }

    // 4) History heuristic
    score += historyScores[from][to];

    return { move, score };
  });

  // Sort by MVV/LVA
  captures.sort((a, b) => b.score - a.score);
  const orderedCaptures = captures.map((m) => m.move);

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

    const { score: scoreAfterCapture } = quiesce4(
      bitboards,
      opponent,
      -beta,
      -alpha,
      newEnPassant,
      newCastling,
      prevPositions,
      newHash,
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
    }

    if (beta <= alpha) {
      if (move.captured === null) {
        const killer = killerMoves[depth];

        if (
          !killer[0] ||
          move.from !== killer[0].from ||
          move.to !== killer[0].to
        ) {
          killer[1] = killer[0];
          killer[0] = move;
        }

        // Weights this move higher in history
        historyScores[move.from][move.to] += 2 ^ remaining;
      }
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
  });

  return { score: alpha, move: null };
};
