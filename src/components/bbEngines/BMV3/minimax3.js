import { updateCastlingRights } from "../../bitboardUtils/moveMaking/castleMoveLogic";
import {
  makeMove,
  unMakeMove,
} from "../../bitboardUtils/moveMaking/makeMoveLogic";
import {
  getAttackMask,
  updateAttackMasks,
} from "../../bitboardUtils/PieceMasks/attackMask";
import { updateHash } from "../../bitboardUtils/zobristHashing";
import { checkGameOver } from "../../bitboardUtils/gameOverLogic";
import { getNewEnPassant, isInCheck } from "../../bitboardUtils/bbChessLogic";
import {
  getTT,
  setTT,
  TT_FLAG,
} from "../../bitboardUtils/TranspositionTable/transpositionTable";
import { getPieceAtSquare } from "../../bitboardUtils/pieceGetters";
import { BLACK, MAX_PLY, WEIGHTS, WHITE } from "../../bitboardUtils/constants";
import { rootId } from "./BondMonkeyV3";
import { evaluate3 } from "./evaluation3";
import { quiesce } from "./quiesce";
import { getAllLegalMoves } from "../../bitboardUtils/moveGeneration/allMoveGeneration";

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
 * @param {bigint} prevHash - the hash of the current position before moves are simulated.
 * @param {bigint} prevAttackMask - the attack hash of the current position before moves are simulated.
 * @param {depth} currentDepth - the current depth of the search
 * @param {depth} maxDepth - the maximum depth of the search
 * @param {number} alpha - the alpha value for alpha-beta pruning
 * @param {number} beta - the beta value for alpha-beta pruning
 * @returns {{score: number, move: object}} evaluation of the move and the move
 */
export const minimax3 = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  prevHash,
  prevAttackMask,
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
    0,
    prevAttackMask
  );

  if (gameOver.isGameOver) {
    return {
      score: evaluate3(bitboards, player, gameOver.result, currentDepth),
      move: null,
    };
  }

  if (currentDepth >= maxDepth) {
    // Extends search by one if player is in check
    if (!isInCheck(bitboards, player) || currentDepth !== maxDepth) {
      return quiesce(
        bitboards,
        player,
        alpha,
        beta,
        enPassantSquare,
        castlingRights,
        prevPositions,
        prevHash,
        prevAttackMask
      );
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
    enPassantSquare,
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
        (WEIGHTS[getPieceAtSquare(to, bitboards)] || 0) -
        (WEIGHTS[getPieceAtSquare(from, bitboards)] || 0);
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

      // New game states
      const newEnPassant = getNewEnPassant(move);
      const newCastling = updateCastlingRights(from, castlingRights);
      const newPositions = new Map(prevPositions);

      // Update Hash
      const newEpFile = newEnPassant ? newEnPassant % 8 : -1;
      const prevEpFile = enPassantSquare ? enPassantSquare % 8 : -1;
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
        prevHash,
        move,
        newEpFile,
        prevEpFile,
        castlingChanged
      );
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      updateAttackMasks(bitboards, move);
      const whiteAttackMask = getAttackMask(WHITE);

      const { score: moveEval } = minimax3(
        bitboards,
        BLACK,
        newCastling,
        newEnPassant,
        newPositions,
        hash,
        whiteAttackMask,
        currentDepth + 1,
        maxDepth,
        alpha,
        beta
      );

      unMakeMove(move, bitboards);

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
      const from = move.from;

      makeMove(bitboards, move);

      // New game states
      const newEnPassant = getNewEnPassant(move);
      const newCastling = updateCastlingRights(from, castlingRights);
      const newPositions = new Map(prevPositions);

      // Update Hash
      const newEpFile = newEnPassant ? newEnPassant % 8 : -1;
      const prevEpFile = enPassantSquare ? enPassantSquare % 8 : -1;
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
        prevHash,
        move,
        newEpFile,
        prevEpFile,
        castlingChanged
      );
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      updateAttackMasks(bitboards, move);
      const blackAttackMask = getAttackMask(BLACK);

      const { score: moveEval } = minimax3(
        bitboards,
        WHITE,
        newCastling,
        newEnPassant,
        newPositions,
        hash,
        blackAttackMask,
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
    console.error("SCORE IS INFINITE");
    console.log("Best Move:", bestMove);
    console.log("Depth:", currentDepth);
    console.log("Max Depth:", maxDepth);
    throw new Error("Score is infinite");
  }

  return { score: bestEval, move: bestMove };
};
