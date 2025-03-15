const PromotionModal = ({ onPromote }) => {
  const pieces = ["Queens", "Rooks", "Knights", "Bishops"];

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Choose a piece for promotion:</h3>
        <div className="promotion-options">
          {pieces.map((piece) => (
            <button key={piece} onClick={() => onPromote(piece)}>
              {piece}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal