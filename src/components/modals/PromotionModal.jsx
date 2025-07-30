import PropTypes from "prop-types";
import "./PromotionModal.css";
import { WHITE } from "../../Core Logic/constants.mjs";
import { useCallback } from "react";
import { useGameStore } from "../gameStore.mjs";

const path = "./src/assets/pieces/";

const PROMO_PIECES = [
  { name: "Queen", index: 4, char: "Q" },
  { name: "Rook", index: 3, char: "R" },
  { name: "Knight", index: 1, char: "N" },
  { name: "Bishop", index: 2, char: "B" },
];

const PromotionModal = ({ onPromote, square }) => {
  const userSide = useGameStore((state) => state.userSide);

  const isUserWhite = userSide === WHITE;
  const col = isUserWhite ? square % 8 : 7 - (square % 8);
  const background = isUserWhite ? "promo--dark" : "promo--light";

  const handlePromote = useCallback(
    // Black piece is 6 indexes after the white piece
    (index) => () => onPromote(index + userSide * 6),
    [onPromote, userSide]
  );

  // Build buttons
  const buttons = PROMO_PIECES.map(({ name, index, char }) => {
    const src = `${path}${userSide === WHITE ? "w" : "b"}${char}.svg`;
    return (
      <button
        key={char}
        onClick={handlePromote(index)}
        className={`promotionButton ${background}`}
        aria-label={`Promote to ${name}`}
      >
        <img src={src} alt={name} className="piece" draggable={false} />
      </button>
    );
  });

  return (
    <div
      className="modalOverlay"
      style={{ left: `calc(((70vh - 3rem) / 8) * ${col} + 1.5rem)` }}
    >
      <div className="promo--modal">
        <div className="promotionOptions">{buttons}</div>
      </div>
    </div>
  );
};

PromotionModal.propTypes = {
  onPromote: PropTypes.func.isRequired,
  square: PropTypes.number.isRequired,
};

export default PromotionModal;
