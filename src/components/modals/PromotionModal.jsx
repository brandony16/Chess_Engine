import PropTypes from "prop-types";
import "./PromotionModal.css";
import { BLACK, WHITE } from "../bitboardUtils/constants.mjs";

const PromotionModal = ({ onPromote, square, userPlayer }) => {
  // Pieces for promotion. Are plural because the bitboards are plural
  const pieces = ["Queens", "Rooks", "Knights", "Bishops"];
  const piecesToIndex = {
    Queens: 4,
    Rooks: 3,
    Knights: 1,
    Bishops: 2,
  };

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
            const playerChar = userPlayer === WHITE ? "w" : "b";
            const pieceChar = piece[0] === "K" ? "N" : piece[0]
            const imageName = playerChar + pieceChar + ".svg";
            const src = "./images/" + imageName // Adds the player and removes the s at the end
            return (
              <button
                key={piece}
                onClick={() => onPromote(piecesToIndex[piece] + userPlayer * 6)} // If black, add 6 to get black indexes
                className="promotionButton"
                style={modalStyle}
              >
                <img
                  src={src}
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
