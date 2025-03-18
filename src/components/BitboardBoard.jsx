import Cell from "./Cell";
import "./Board.css";
import { getPieceAtSquare, pieceSymbols } from "./bitboardUtils/bbHelpers";

// Creates the board out of Cells
const BitboardBoard = ({ bitboards, onSquareClick, selectedSquare, userSide, moveBitboard }) => {  
  return (
    <div className="board">
      {Array.from({ length: 8 }, (_, row) => {
        const actualRow = userSide === "b" ? row : 7 - row; // Flip row order for Black

        return Array.from({ length: 8 }, (_, col) => {
          const actualCol = userSide === "w" ? col : 7 - col
          const i = actualRow * 8 + actualCol; // Flip columns per row
          const piece = getPieceAtSquare(i, bitboards);
          const isSelected = selectedSquare === i;
          let isMove = false;
          if (moveBitboard) {
            isMove = (moveBitboard >> BigInt(i)) & BigInt(1);
          }

          return (
            <Cell
              key={i}
              piece={piece ? pieceSymbols[piece] : '-'}
              row={actualRow}
              col={actualCol}
              onSquareClick={() => onSquareClick(actualRow, actualCol)}
              isSelected={isSelected}
              isMove={isMove}
              userSide={userSide}
            />
          );
        });
      })}
    </div>
  );
};

export default BitboardBoard;
