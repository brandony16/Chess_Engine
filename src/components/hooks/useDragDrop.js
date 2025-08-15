import { useCallback, useRef } from "react";

export default function useDragDrop(onSquareClick) {
  const dragElRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  const ensureDragElement = useCallback((pieceNode) => {
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
    (e) => {
      lastPos.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updatePosition);
      }
    },
    [updatePosition]
  );

  const handleDragStart = useCallback(
    (e, row, col, piece, pieceNode = null) => {
      if (!piece || piece === "-") {
        e.preventDefault();
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 1, 1);

      e.dataTransfer.setDragImage(canvas, 0, 0);

      const dragEl = ensureDragElement(pieceNode);
      dragEl.innerHTML = "";
      console.log("handleDragStart: dragLayerExists?", !!dragElRef.current);

      if (pieceNode) {
        try {
          const cloned = pieceNode.cloneNode(true);

          cloned.style.pointerEvents = "none";
          dragEl.appendChild(cloned);
        } catch {
          console.warn("issue with cloning piece");
          dragEl.textContent = piece;
        }
      } else {
        // fallback: render piece text
        const span = document.createElement("div");
        span.textContent = piece;
        span.style.pointerEvents = "none";
        span.style.fontSize = "28px";
        span.style.lineHeight = "1";
        dragEl.appendChild(span);
      }

      schedulePositionUpdate(e);

      const onWindowDragOver = (e) => {
        schedulePositionUpdate(e);
      };
      window.addEventListener("dragover", onWindowDragOver);

      onSquareClick(row, col);

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
    ]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
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
