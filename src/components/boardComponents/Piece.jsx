import PropTypes from "prop-types";
import React from "react";

import wP from "../../assets/pieces/wP.svg";
import wN from "../../assets/pieces/wN.svg";
import wB from "../../assets/pieces/wB.svg";
import wR from "../../assets/pieces/wR.svg";
import wQ from "../../assets/pieces/wQ.svg";
import wK from "../../assets/pieces/wK.svg";
import bP from "../../assets/pieces/bP.svg";
import bN from "../../assets/pieces/bN.svg";
import bB from "../../assets/pieces/bB.svg";
import bR from "../../assets/pieces/bR.svg";
import bQ from "../../assets/pieces/bQ.svg";
import bK from "../../assets/pieces/bK.svg";

const pieceImages = {
  P: wP,
  N: wN,
  B: wB,
  R: wR,
  Q: wQ,
  K: wK,
  p: bP,
  n: bN,
  b: bB,
  r: bR,
  q: bQ,
  k: bK,
};

const pieceNames = {
  P: "white pawn",
  N: "white knight",
  B: "white bishop",
  R: "white rook",
  Q: "white queen",
  K: "white king",
  p: "black pawn",
  n: "black knight",
  b: "black bishop",
  r: "black rook",
  q: "black queen",
  k: "black king",
};

/* 
  Returns an image of the piece specified
*/
const Piece = ({ type }) => {
  return (
    <img
      src={pieceImages[type]}
      alt={pieceNames[type]}
      className="piece"
      draggable={false}
    />
  );
};

Piece.propTypes = {
  type: PropTypes.oneOf(Object.keys(pieceImages)).isRequired,
};

const MemoizedPiece = React.memo(Piece);

MemoizedPiece.displayName = "Piece";

export default MemoizedPiece;
