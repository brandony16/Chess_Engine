import { getLegalMoves } from "../../utils/pieceMoves"

// V1: Plays a random legal move
export const getBestMove = (board, player, gameState) => {
  const moves = getLegalMoves(board, player, gameState)

  const selectedIndex = Math.floor(Math.random() * moves.length)

  return moves[selectedIndex]
}