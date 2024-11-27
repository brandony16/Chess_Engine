import { getLegalMoves } from "../../utils/pieceMoves"


export const getBestMove = (board, player, gameState) => {
  const moves = getLegalMoves(board, player, gameState)

  const selectedIndex = Math.floor(Math.random() * moves.length)

  return moves[selectedIndex]
}


const evaluateBoard = (board) => {
  const newEval = 0
  return newEval
}