import PropTypes from "prop-types";

/* 
  Returns an image of the piece specified
*/
const Piece = ({ type }) => {
  const pieceImages = {
    r: "bR.svg",
    n: "bN.svg",
    b: "bB.svg",
    q: "bQ.svg",
    k: "bK.svg",
    p: "bP.svg",
    R: "wR.svg",
    N: "wN.svg",
    B: "wB.svg",
    Q: "wQ.svg",
    K: "wK.svg",
    P: "wP.svg",
  };

  return (
    <img src={`/images/${pieceImages[type]}`} alt={type} className="piece" />
  );
};

Piece.propTypes = {
  type: PropTypes.oneOf([
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
    "k",
    "-",
  ]).isRequired,
};

export default Piece;
