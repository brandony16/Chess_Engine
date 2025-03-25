import { makeMove, updateCastlingRights } from "../bitboardUtils/bbChessLogic";
import { allLegalMovesArr, computeHash, getNumPieces } from "../bitboardUtils/bbHelpers";

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

  let bestMove = moves[0] || null;
  let bestEval = player === "w" ? -Infinity : Infinity;

  for (const move of moves) {
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
    newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

    const moveEval = minimax(bitboards);

    if (
      (player === "w" && moveEval > bestEval) ||
      (player === "b" && moveEval < bestEval)
    ) {
      bestEval = moveEval;
      bestMove = move;
    }
  }

  return bestMove;
};

const minimax = (bitboards, /*player, castlingRights, enPassantSquare, prevPositions, depth*/) => {
  return evaluate(bitboards);
}

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

const evaluate = (bitboards) => {
  // Needs to be a big number but not infinity because then it wont update the move
  // if (player === 'w' && gameState.gameEndState === 'checkmate') {
  //   return -10000000;
  // } else if (player === 'b' && gameState.gameEndState === 'checkmate') {
  //   return 10000000;
  // }
  
  let evaluation = 0;

  for (const bitboard in bitboards) {
    evaluation += getNumPieces(bitboards[bitboard]) * weights[bitboard];
  }

  return evaluation;
};