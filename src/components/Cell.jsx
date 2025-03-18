import { colSymbols } from "./bitboardUtils/bbHelpers";
import Piece from "./Piece";

/*
  Squares on the board
*/
const Cell = ({ piece, row, col, onSquareClick, isSelected }) => {
  const style = {
    border: isSelected ? "35px solid rgba(255, 174, 174, 0.57)" : 'none',
  }

  return (
    <div
      className={`cell ${(row + col) % 2 === 0 ? "light" : "dark"}`}
      onClick={() => onSquareClick(row, col)}
    >
      {row === 0 && <div className="rowId">{colSymbols[col]}</div>}
      {col === 0 && <div className="colId">{row + 1}</div>}
      {piece !== "-" && <Piece type={piece} />}
      <div className="selectedCover" style={style}></div>
    </div>
  );
};

export default Cell;
