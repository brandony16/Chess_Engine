import Board from "./Board"
import { initializeBoard } from "../utils/chessLogic"

const Game = () => {
    const board = initializeBoard();

    return (
        <Board board={board}/>
    )
}

export default Game