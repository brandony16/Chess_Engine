import PropTypes from "prop-types";

/* 
  Returns an image of the piece specified
*/
const Piece = ({ type }) => {
  const pieceImages = {
    r: "./images/bR.svg",
    n: "./images/bN.svg",
    b: "./images/bB.svg",
    q: "./images/bQ.svg",
    k: "./images/bK.svg",
    p: "./images/bP.svg",
    R: "./images/wR.svg",
    N: "./images/wN.svg",
    B: "./images/wB.svg",
    Q: "./images/wQ.svg",
    K: "./images/wK.svg",
    P: "./images/wP.svg",
  };

  return (
    <img src={pieceImages[type]} alt={type} className="piece" />
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
