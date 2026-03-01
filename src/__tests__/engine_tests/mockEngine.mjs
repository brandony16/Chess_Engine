import { WEIGHTS } from "../coreLogic/constants";
import { getNewEnPassant } from "../coreLogic/bbChessLogic";
import { getAllLegalMoves } from "../coreLogic/moveGeneration/allMoveGeneration";
import { pieceAt } from "../coreLogic/pieceGetters";
import { makeMove, unMakeMove } from "../coreLogic/moveMaking/makeMoveLogic";
import { updateHash } from "../coreLogic/zobristHashing";
import { updateAttackMasks } from "../coreLogic/PieceMasks/attackMask";
import { updateCastlingRights } from "../coreLogic/moveMaking/castleMoveLogic";
import { areBigUint64ArraysEqual } from "../coreLogic/debugFunctions";

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
  const stateArray = [];

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

    if (move.captured) {
      score +=
        100_000 + (WEIGHTS[pieceAt[to]] || 0) - (WEIGHTS[pieceAt[from]] || 0);
    }

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

  return stateArray;
};
