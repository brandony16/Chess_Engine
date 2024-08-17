import Piece from "./Piece";

const Cell = ({ piece, row, col, onSquareClick }) => {
  return (
    <div
      className={`cell ${(row + col) % 2 === 0 ? "light" : "dark"}`}
      onClick={() => onSquareClick(row, col)}
    >
      {piece !== "-" && <Piece type={piece} />}
    </div>
  );
};

export default Cell;
