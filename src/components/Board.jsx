import Cell from "./Cell";
import "./Board.css";

const Board = ({ board, onSquareClick }) => {
  return (
    <div className="board">
      {board.map((row, rowIndex) =>
        row.map((square, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            piece={square}
            row={rowIndex}
            col={colIndex}
            onSquareClick={onSquareClick}
          />
        ))
      )}
    </div>
  );
};

export default Board;
