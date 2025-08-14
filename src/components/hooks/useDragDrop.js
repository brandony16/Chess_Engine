import { useCallback } from "react";
import { PIECE_IMAGES } from "../utilTypes";

export default function useDragDrop(onSquareClick) {
  const handleDragStart = useCallback(
    (e, row, col, piece) => {
      if (!piece || piece === "-") {
        e.preventDefault();
        return;
      }

      const img = new Image();
      img.src = PIECE_IMAGES[piece];

      img.onload = () => {
        const size = 60;

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);

        e.dataTransfer.setDragImage(canvas, size / 2, size / 2);
      };

      e.dataTransfer.effectAllowed = "move";
      onSquareClick(row, col);
    },
    [onSquareClick]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e, row, col) => {
      e.preventDefault();
      onSquareClick(row, col);
    },
    [onSquareClick]
  );

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
