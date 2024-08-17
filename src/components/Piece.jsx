const Piece = ({ type }) => {
  const pieceImages = {
    r: "BlackRook.png",
    n: "BlackKnight.png",
    b: "BlackBishop.png",
    q: "BlackQueen.png",
    k: "BlackKing.png",
    p: "BlackPawn.png",
    R: "WhiteRook.png",
    N: "WhiteKnight.png",
    B: "WhiteBishop.png",
    Q: "WhiteQueen.png",
    K: "WhiteKing.png",
    P: "WhitePawn.png",
  };

  return (
    <img src={`/images/${pieceImages[type]}`} alt={type} className="piece" />
  );
};

export default Piece;
