import PropTypes from "prop-types";
import React from "react";
import { PIECE_IMAGES, PIECE_NAMES } from "../utilTypes";

/* 
  Returns an image of the piece specified
*/
const Piece = ({ type }) => {
  return (
    <img
      src={PIECE_IMAGES[type]}
      alt={PIECE_NAMES[type]}
      className="piece"
      draggable={true}
    />
  );
};

Piece.propTypes = {
  type: PropTypes.oneOf(Object.keys(PIECE_IMAGES)).isRequired,
};

const MemoizedPiece = React.memo(Piece);

MemoizedPiece.displayName = "Piece";

export default MemoizedPiece;
