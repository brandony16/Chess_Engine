import React from "react";
import { PIECE_IMAGES, PIECE_NAMES } from "../utilTypes.ts";

type PieceType = keyof typeof PIECE_IMAGES;

interface PieceProps {
  type: PieceType;
}

/* 
  Returns an image of the piece specified
*/
const Piece = ({ type }: PieceProps) => {
  return (
    <img
      src={PIECE_IMAGES[type]}
      alt={PIECE_NAMES[type]}
      className="piece"
      draggable={true}
    />
  );
};

const MemoizedPiece = React.memo(Piece);

MemoizedPiece.displayName = "Piece";

export default MemoizedPiece;
