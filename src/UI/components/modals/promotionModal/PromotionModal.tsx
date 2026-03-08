import "./PromotionModal.css";
import { useCallback } from "react";
import { useGameStore } from "../../../gameStore.ts";
import {
  PLAYER_PIECES,
  REVERSED_FILES,
  WHITE,
  type Piece,
  type Square,
} from "../../../../game/chessConstants.ts";
import { getFile } from "../../../../game/helpers/boardUtils.ts";

const path = "./src/assets/pieces/";

const PROMO_PIECES = [
  { name: "Queen", pieceType: 4, char: "Q" },
  { name: "Rook", pieceType: 3, char: "R" },
  { name: "Knight", pieceType: 1, char: "N" },
  { name: "Bishop", pieceType: 2, char: "B" },
];

type PromotionModalProps = {
  onPromote: (piece: Piece) => void;
  square: Square;
};

const PromotionModal = ({ onPromote, square }: PromotionModalProps) => {
  const userSide = useGameStore((state) => state.userSide);

  const isUserWhite = userSide === WHITE;
  const file = isUserWhite ? getFile(square) : REVERSED_FILES[getFile(square)];
  const background = isUserWhite ? "promo--dark" : "promo--light";

  const handlePromote = useCallback(
    // Black piece is 6 indexes after the white piece
    (piece: Piece) => () => onPromote(piece),
    [onPromote, userSide],
  );

  // Build buttons
  const buttons = PROMO_PIECES.map(({ name, pieceType, char }) => {
    const src = `${path}${isUserWhite ? "w" : "b"}${char}.svg`;
    const piece = PLAYER_PIECES[userSide][pieceType];
    return (
      <button
        key={char}
        onClick={handlePromote(piece)}
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
      style={{ left: `calc(((70vh - 3rem) / 8) * ${file} + 1.5rem)` }}
    >
      <div className="promo--modal">
        <div className="promotionOptions">{buttons}</div>
      </div>
    </div>
  );
};

export default PromotionModal;
