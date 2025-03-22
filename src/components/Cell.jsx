import { colSymbols } from "./bitboardUtils/bbHelpers";
import Piece from "./Piece";

/*
  Squares on the board
*/
const Cell = ({ piece, row, col, onSquareClick, isSelected, isMove, userSide }) => {
  const style = {
    backgroundColor: 
      isSelected ? "rgba(255, 191, 89, 0.4)"
      : isMove ? "rgba(255, 100, 100, 0.3)"
      : "transparent",
  };

  const squareColor = (row + col) % 2 === 0 ? "dark" : "light";

  return (
    <div
      className={`cell ${squareColor}`}
      onClick={() => onSquareClick(row, col)}
    >
      {userSide === 'w' && row === 0 && <div className={`rowId ${squareColor}`}>{colSymbols[col]}</div>}
      {userSide === 'b' && row === 7 && <div className={`rowId ${squareColor}`}>{colSymbols[col]}</div>}
      {userSide === 'w' && col === 0 && <div className={`colId ${squareColor}`}>{row + 1}</div>}
      {userSide === 'b' && col === 7 && <div className={`colId ${squareColor}`}>{row + 1}</div>}
      {piece !== "-" && <Piece type={piece} />}
      <div className="selectedCover" style={style}></div>
    </div>
  );
};

export default Cell;
