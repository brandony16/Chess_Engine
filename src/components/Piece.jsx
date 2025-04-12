import PropTypes from "prop-types";

/* 
  Returns an image of the piece specified
*/
const Piece = ({ type }) => {
  const pieceImages = {
    r: "BlackRook.png",
    n: "BlackKnight.png",
    b: "BlackBishop.png",
    q: "BlackQueen.png",
    k: "BlackKing.png",
    p: "BlackPawn.png",
    R: "WhiteRook.png",
    N: "WhiteKnight.png",
    B: "WhiteBishop.png",
    Q: "WhiteQueen.png",
    K: "WhiteKing.png",
    P: "WhitePawn.png",
  };

  return (
    <img src={`/images/${pieceImages[type]}`} alt={type} className="piece" />
  );
};

Piece.propTypes = {
  type: PropTypes.oneOf(
    "P",
    "p",
    "N",
    "n",
    "B",
    "b",
    "R",
    "r",
    "Q",
    "q",
    "K",
    "k"
  ).isRequired,
};

export default Piece;
