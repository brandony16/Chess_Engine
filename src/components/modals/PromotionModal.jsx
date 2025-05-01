import PropTypes from "prop-types";
import "./PromotionModal.css";
import { BLACK, WHITE } from "../bitboardUtils/constants";

const PromotionModal = ({ onPromote, square, userPlayer }) => {
  // Pieces for promotion. Are plural because the bitboards are plural
  const pieces = ["Queens", "Rooks", "Knights", "Bishops"];

  const isUserWhite = userPlayer === WHITE;
  const col = isUserWhite ? square % 8 : 7 - (square % 8);
  const background = isUserWhite ? "#1a1a1a" : "#f3f3f3";

  const modalWrapperStyle = {
    position: "absolute",
    top: `2rem`,
    left: `calc((70vh - 4rem)/8 * ${col} + 2rem)`,
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: background,
  };

  return (
    <div className="modalOverlay" style={modalWrapperStyle}>
      <div className="modal">
        <div className="promotionOptions">
          {pieces.map((piece) => {
            const fullPlayer = isUserWhite ? "White" : "Black";
            const imageName = fullPlayer + piece.slice(0, -1) + ".png"; // Adds the player and removes the s at the end
            return (
              <button
                key={piece}
                onClick={() => onPromote(piece)}
                className="promotionButton"
                style={modalStyle}
              >
                <img
                  src={`/images/${imageName}`}
                  alt={piece.charAt(0)}
                  className="piece"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

PromotionModal.propTypes = {
  onPromote: PropTypes.func.isRequired,
  square: PropTypes.number.isRequired,
  userPlayer: PropTypes.oneOf([WHITE, BLACK]).isRequired,
};

export default PromotionModal;
