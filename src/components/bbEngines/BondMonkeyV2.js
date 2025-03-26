import {
  checkGameOver,
  makeMove,
  sortMoves,
  updateCastlingRights,
} from "../bitboardUtils/bbChessLogic";
import {
  allLegalMovesArr,
  computeHash,
  getNumPieces,
} from "../bitboardUtils/bbHelpers";

// V1: Plays a random legal move
export const getBestMoveBMV2 = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  depth
) => {
  const moves = allLegalMovesArr(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  );
  const sortedMoves = sortMoves(moves);

  let bestMove = sortedMoves[0] || null;
  let bestEval = player === "w" ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of sortedMoves) {
    const from = move.from;
    const to = move.to;
    const promotion = move.promotion || null;
    let moveObj = makeMove(bitboards, from, to, enPassantSquare, promotion);

    // New game states
    const newBitboards = moveObj.bitboards;
    const newEnPassant = moveObj.enPassantSquare;
    const newCastling = updateCastlingRights(from, castlingRights);
    const hash = computeHash(newBitboards, player, moveObj.enPassantSquare);
    const newPositions = new Map(prevPositions);
    const newPlayer = player === "w" ? "b" : "w";
    const gameOverObj = checkGameOver(
      newBitboards,
      player,
      newPositions,
      newCastling,
      newEnPassant
    );
    const result = gameOverObj.result;
    newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

    const moveEval = minimax(
      newBitboards,
      newPlayer,
      newCastling,
      newEnPassant,
      newPositions,
      result,
      depth - 1,
      alpha,
      beta
    );

    if (
      (player === "w" && moveEval > bestEval) ||
      (player === "b" && moveEval < bestEval)
    ) {
      bestEval = moveEval;
      bestMove = move;
    }

    if (player === "w") {
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

const minimax = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  result,
  depth,
  alpha,
  beta
) => {
  if (depth === 0 || result) {
    return evaluate(bitboards, player, result);
  }

  const moves = allLegalMovesArr(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  );
  const sortedMoves = sortMoves(moves);

  if (player === "w") {
    let maxEval = -Infinity;

    for (const move of sortedMoves) {
      const from = move.from;
      const to = move.to;
      const promotion = move.promotion || null;
      let moveObj = makeMove(bitboards, from, to, enPassantSquare, promotion);

      // New game states
      const newBitboards = moveObj.bitboards;
      const newEnPassant = moveObj.enPassantSquare;
      const newCastling = updateCastlingRights(from, castlingRights);
      const hash = computeHash(newBitboards, player, moveObj.enPassantSquare);
      const newPositions = new Map(prevPositions);
      const gameOverObj = checkGameOver(
        newBitboards,
        player,
        newPositions,
        newCastling,
        newEnPassant
      );
      const result = gameOverObj.result;
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      const moveEval = minimax(
        newBitboards,
        "b",
        newCastling,
        newEnPassant,
        newPositions,
        result,
        depth - 1,
        alpha,
        beta
      );

      maxEval = Math.max(maxEval, moveEval);
      alpha = Math.max(alpha, moveEval);

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
      const hash = computeHash(newBitboards, player, moveObj.enPassantSquare);
      const newPositions = new Map(prevPositions);
      const gameOverObj = checkGameOver(
        newBitboards,
        player,
        newPositions,
        newCastling,
        newEnPassant
      );
      const result = gameOverObj.result;
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

      const moveEval = minimax(
        newBitboards,
        "w",
        newCastling,
        newEnPassant,
        newPositions,
        result,
        depth - 1,
        alpha,
        beta
      );

      minEval = Math.min(minEval, moveEval);
      beta = Math.min(beta, moveEval);

      if (beta <= alpha) {
        break;
      }
    }
    return minEval;
  }
};

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

const CHECKMATE_VALUE = 10_000_000
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
