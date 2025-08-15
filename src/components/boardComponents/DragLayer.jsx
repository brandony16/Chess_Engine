import PropTypes from "prop-types";
import { PIECE_IMAGES, PIECE_NAMES } from "../utilTypes";
import { useGameStore } from "../gameStore.mjs";
import { pieceAt } from "../../Core Logic/pieceGetters.mjs";

const DragLayer = () => {
  const square = useGameStore((state) => state.selectedSquare);
  const piece = pieceAt[square];

  return (
    <img
      src={PIECE_IMAGES[piece]}
      alt={PIECE_NAMES[piece]}
      className="drag-img"
    />
  );
};

DragLayer.propTypes = {
  piece: PropTypes.number.isRequired,
};

export default DragLayer;
