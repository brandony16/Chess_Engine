import { WHITE } from "chess.js";
import { MAX_PLY, WEIGHTS } from "../Core Logic/constants";
import { getNewEnPassant } from "../Core Logic/bbChessLogic";
import { getAllLegalMoves } from "../Core Logic/moveGeneration/allMoveGeneration";
import { pieceAt } from "../Core Logic/pieceGetters";
import { makeMove, unMakeMove } from "../Core Logic/moveMaking/makeMoveLogic";
import { updateHash } from "../Core Logic/zobristHashing";
import { updateAttackMasks } from "../Core Logic/PieceMasks/attackMask";
import { updateCastlingRights } from "../Core Logic/moveMaking/castleMoveLogic";
import { areBigUint64ArraysEqual } from "../Core Logic/debugFunctions";

// killerMoves[ply] = [firstKillerMove, secondKillerMove]
const killerMoves = Array.from({ length: MAX_PLY }, () => [null, null]);

// historyScores[fromSquare][toSquare] = integer score
const historyScores = Array.from({ length: 64 }, () => Array(64).fill(0));

/**
 * A minimax function that recursively finds the evaluation of the function.
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {0 | 1} player - the player whose move it is (0 for w, 1 for b)
 * @param {Array<boolean>} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - a map of the previous positions
 * @param {bigint} prevHash - the hash of the current position before moves are simulated.
 */
export const mockEngine = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  prevHash
) => {
  const side = player === WHITE ? +1 : -1;
  const stateArray = [];

  // // Transpositition table logic
  // const key = prevHash;
  // const origAlpha = alpha;
  // const remaining = maxDepth - currentDepth;
  // const ttEntry = getTT(key);

  // if (ttEntry && ttEntry.depth >= remaining) {
  //   if (ttEntry.flag === TT_FLAG.EXACT) {
  //     return { score: side * ttEntry.value, move: ttEntry.bestMove };
  //   }
  //   if (ttEntry.flag === TT_FLAG.LOWER_BOUND) {
  //     alpha = Math.max(alpha, side * ttEntry.value);
  //   }
  //   if (ttEntry.flag === TT_FLAG.UPPER_BOUND) {
  //     beta = Math.min(beta, side * ttEntry.value);
  //   }
  //   if (alpha >= beta) {
  //     return { score: side * ttEntry.value, move: ttEntry.bestMove };
  //   }
  // }

  // const ttMove = ttEntry?.bestMove || null;

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

    // // 1) Transposition-table move is highest priority
    // if (ttMove && from === ttMove.from && to === ttMove.to) {
    //   score += 1_000_000;
    // }

    // 2) Captures (MVV/LVA: victim value minus your piece value)
    if (move.captured) {
      score +=
        100_000 + (WEIGHTS[pieceAt[to]] || 0) - (WEIGHTS[pieceAt[from]] || 0);
    }

    // // 3) Killer moves at this ply
    // const [k0, k1] = killerMoves[currentDepth];
    // if (k0 && from === k0.from && to === k0.to) {
    //   score += 90_000;
    // } else if (k1 && from === k1.from && to === k1.to) {
    //   score += 80_000;
    // }

    // // 4) History heuristic
    // score += historyScores[from][to];

    return { move, score };
  });

  // If the game is over, it would have been caught by gameOver check at beginning
  if (scored.length === 0) {
    throw new Error("Issue with move generation. No moves generated");
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  const orderedMoves = scored.map((o) => o.move);
  const bitboardsBefore = structuredClone(bitboards);
  for (const move of orderedMoves) {
    const pieceAtBefore = structuredClone(pieceAt);
    makeMove(bitboards, move);
    updateAttackMasks(bitboards, move);

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

    const states = {
      bitboards: structuredClone(bitboards),
      pieceAt: structuredClone(pieceAt),
      move: move,
      newEpFile: newEpFile,
      hash: hash,
      castlingChanged: castlingChanged,
      prevEpFile: prevEpFile,
      prevHash: prevHash,
    };
    stateArray.push(states);

    unMakeMove(move, bitboards);
    if (oldCount) prevPositions.set(hash, oldCount);
    else prevPositions.delete(hash);
    const pieceAtAfter = structuredClone(pieceAt);
    if (JSON.stringify(pieceAtBefore) !== JSON.stringify(pieceAtAfter)) {
      throw new Error("PieceAt is not the same when making & unmaking move");
    }
    if (!areBigUint64ArraysEqual(bitboards, bitboardsBefore)) {
      console.log(move);
      throw new Error("Bitboards not the same");
    }
  }

  // // Update transposition table
  // let flag = TT_FLAG.EXACT;
  // const storedEval = side * bestEval;
  // if (storedEval <= origAlpha) {
  //   flag = TT_FLAG.UPPER_BOUND;
  // } else if (storedEval >= beta) {
  //   flag = TT_FLAG.LOWER_BOUND;
  // }
  // setTT(key, {
  //   rootId: rootId,
  //   depth: maxDepth - currentDepth,
  //   value: storedEval,
  //   flag,
  //   bestMove,
  // });

  return stateArray;
};
