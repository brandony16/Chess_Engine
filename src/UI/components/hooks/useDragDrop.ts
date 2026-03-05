import { useCallback, useRef, type ReactNode } from "react";
import {
  NO_PIECE,
  type File,
  type Piece,
  type Rank,
} from "../../../game/chessConstants.ts";
import { PIECE_NAMES } from "../../utilTypes.ts";

export default function useDragDrop(
  onSquareClick: (rank: Rank, file: File) => void,
) {
  const dragElRef = useRef<HTMLDivElement | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const ensureDragElement = useCallback((pieceNode: HTMLDivElement) => {
    if (dragElRef.current) {
      dragElRef.current.style.visibility = "visible";
      return dragElRef.current;
    }

    const el = document.createElement("div");
    el.className = "drag-layer";

    const boundingRect = pieceNode.getBoundingClientRect();
    const width = boundingRect.width;
    const height = boundingRect.height;

    Object.assign(el.style, {
      position: "fixed",
      left: `-${width / 2}px`,
      top: `-${height / 2}px`,
      pointerEvents: "none",
      zIndex: 9999,
      transform: "translate3d(-9999px,-9999px,0)",
      transition: "none",
      width: `${width}px`,
      height: `${height}px`,
    });

    document.body.appendChild(el);

    dragElRef.current = el;
    return el;
  }, []);

  const removeDragElement = useCallback(() => {
    if (dragElRef.current) {
      dragElRef.current.style.visibility = "hidden";
    }
  }, []);

  const updatePosition = useCallback(() => {
    const el = dragElRef.current;
    if (!el) return;

    const { x, y } = lastPos.current;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    rafRef.current = null;
  }, [dragElRef]);

  const schedulePositionUpdate = useCallback(
    (e: React.DragEvent | DragEvent) => {
      lastPos.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updatePosition);
      }
    },
    [updatePosition],
  );

  const handleDragStart = useCallback(
    (
      e: React.DragEvent,
      rank: Rank,
      file: File,
      piece: Piece,
      pieceNode: HTMLDivElement,
    ) => {
      if (piece === NO_PIECE) {
        e.preventDefault();
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Issue with drag start. No canvas context");
      }
      ctx.clearRect(0, 0, 1, 1);

      e.dataTransfer.setDragImage(canvas, 0, 0);

      const dragEl = ensureDragElement(pieceNode);
      dragEl.innerHTML = "";

      if (pieceNode) {
        try {
          const cloned = pieceNode.cloneNode(true) as HTMLDivElement;

          cloned.style.pointerEvents = "none";
          dragEl.appendChild(cloned);
        } catch {
          console.warn("issue with cloning piece");
          dragEl.textContent = PIECE_NAMES[piece];
        }
      } else {
        // fallback: render piece text
        const span = document.createElement("div");
        span.textContent = PIECE_NAMES[piece];
        span.style.pointerEvents = "none";
        span.style.fontSize = "28px";
        span.style.lineHeight = "1";
        dragEl.appendChild(span);
      }

      schedulePositionUpdate(e);

      const onWindowDragOver = (e: DragEvent) => {
        schedulePositionUpdate(e);
      };
      window.addEventListener("dragover", onWindowDragOver);

      onSquareClick(rank, file);

      const currentTarget = e.currentTarget;
      const onDragEnd = () => {
        removeDragElement();
        window.removeEventListener("dragover", onWindowDragOver);
        currentTarget.removeEventListener("dragend", onDragEnd);
      };
      currentTarget.addEventListener("dragend", onDragEnd);
    },
    [
      onSquareClick,
      ensureDragElement,
      schedulePositionUpdate,
      removeDragElement,
    ],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, rank: Rank, file: File) => {
      e.preventDefault();
      onSquareClick(rank, file);
    },
    [onSquareClick],
  );

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
