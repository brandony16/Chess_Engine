import Cell from "./Cell"
import "./Board.css"

const Board = ({ board }) => {
    return (
        <div className="board">
             {board.map((row, rowIndex) =>
                row.map((square, colIndex) => (
                    <Cell
                        key={`${rowIndex}-${colIndex}`}
                        piece={square}
                        row={rowIndex}
                        col={colIndex}
                    />
                ))
            )}
        </div>
    )
}

export default Board