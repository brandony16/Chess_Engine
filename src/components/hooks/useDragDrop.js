import { useCallback } from "react";

export default function useDragDrop(onSquareClick) {
  const handleDragStart = useCallback(
    (e, row, col) => {
      e.dataTransfer.effectAllowed = "move";
      onSquareClick(row, col);
      console.log("drag started");
    },
    [onSquareClick]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    console.log("dragged over");
  }, []);

  const handleDrop = useCallback(
    (e, row, col) => {
      e.preventDefault();
      onSquareClick(row, col);
      console.log("drag end");
    },
    [onSquareClick]
  );

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
