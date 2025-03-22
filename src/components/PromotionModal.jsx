import "./PromotionModal.css";

const PromotionModal = ({ onPromote, player, square, userPlayer }) => {
  // Pieces for promotion. Are plural because the bitboards are plural
  const pieces = ["Queens", "Rooks", "Knights", "Bishops"];
  
  const col = userPlayer === 'w' ? square % 8 : 7 - square % 8;

  const modalStyle = {
    position: "absolute",
    top: `2rem`,
    left: `calc((70vh - 4rem)/8 * ${col} + 2rem)`,
    zIndex: 1000, 
  };

  return (
    <div className="modalOverlay" style={modalStyle}>
      <div className="modal">
        <div className="promotionOptions">
          {pieces.map((piece) => {
            const fullPlayer = player === 'w' ? "White" : "Black"
            const imageName = fullPlayer + piece.slice(0, -1) + ".png"; // Adds the player and removes the s at the end
            return  (
              <button key={piece} onClick={() => onPromote(piece)} className="promotionButton">
                <img src={`/images/${imageName}`} alt={piece.charAt(0)} className="piece"/>
              </button>
            )})}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal