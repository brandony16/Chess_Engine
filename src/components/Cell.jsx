import Piece from "./Piece";

/*
  Squares on the board
*/
const Cell = ({ piece, row, col, onSquareClick, isSelected }) => {
  const style = {
    border: isSelected ? "5px solid white" : 'none',
    boxSizing: "border-box",
  }

  return (
    <div
      style={style}
      className={`cell ${(row + col) % 2 === 0 ? "light" : "dark"}`}
      onClick={() => onSquareClick(row, col)}
    >
      {piece !== "-" && <Piece type={piece} />}
    </div>
  );
};

export default Cell;
