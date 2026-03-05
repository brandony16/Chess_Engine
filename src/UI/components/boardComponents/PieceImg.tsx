import React from "react";
import { PIECE_IMAGES, PIECE_NAMES } from "../../utilTypes.ts";
import type { Piece } from "../../../game/chessConstants.ts";

interface PieceProps {
  type: Exclude<Piece, -1>; // Exclude NO_PIECE
}

/* 
  Returns an image of the piece specified
*/
const PieceImg = ({ type }: PieceProps) => {
  return (
    <img
      src={PIECE_IMAGES[type]}
      alt={PIECE_NAMES[type]}
      className="piece"
      draggable={true}
    />
  );
};

const MemoizedPiece = React.memo(PieceImg);

MemoizedPiece.displayName = "PieceImg";

export default MemoizedPiece;
