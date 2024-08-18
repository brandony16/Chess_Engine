import Cell from "./Cell";
import "./Board.css";

const Board = ({ board, onSquareClick, selectedPiece }) => {
  return (
    <div className="board">
      {board.map((row, rowIndex) =>
        row.map((square, colIndex) => {
          const isSelected = selectedPiece && selectedPiece[0] === rowIndex && selectedPiece[1] === colIndex;
          return (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              piece={square}
              row={rowIndex}
              col={colIndex}
              onSquareClick={onSquareClick}
              isSelected={isSelected}
            />
          )
        })
      )}
    </div>
  );
};

export default Board;
