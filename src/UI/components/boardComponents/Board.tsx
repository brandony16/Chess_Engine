import React, { useMemo, useRef } from "react";

import { useGameStore } from "../../gameStore.ts";
import Cell from "./Cell.tsx";

import "./Board.css";
import useDragDrop from "../hooks/useDragDrop.ts";
import { BLACK, WHITE, type Piece } from "../../../game/chessConstants.ts";
import { getShownMove } from "../../stateUtils.ts";
import { movesToBB } from "../../generalHelpers.ts";

interface BoardProps {
  onSquareClick: (row: number, col: number) => void;
}

export type CellEntry = {
  square: number;
  relRow: number;
  relCol: number;
  piece: Piece;
  isSelected: boolean;
  isMove: boolean;
};

// Creates the board out of Cells
const Board = ({ onSquareClick }: BoardProps) => {
  const boardRef = useRef(null);

  const boardPerspective = useGameStore((state) => state.boardPerspective);
  const displayed = useGameStore(getShownMove);
  const selectedSquare = useGameStore((state) => state.selectedSquare);
  const legalMoves = useGameStore((state) => state.legalMovesForSelected);
  const moveBB = movesToBB(legalMoves);

  const { handleDragStart, handleDragOver, handleDrop } =
    useDragDrop(onSquareClick);

  const cells = useMemo(() => {
    const list: CellEntry[] = [];
    for (let row = 0; row < 8; row++) {
      const actualRow = boardPerspective === BLACK ? row : 7 - row; // Flip row order for Black

      for (let col = 0; col < 8; col++) {
        const actualCol = boardPerspective === WHITE ? col : 7 - col; // Flips columns if viewing from Black
        const square = actualRow * 8 + actualCol; // Flip columns per row
        const isMove = Boolean(moveBB & (1n << BigInt(square)));

        list.push({
          square,
          relRow: actualRow,
          relCol: actualCol,
          piece: displayed.getPiece(square),
          isSelected: selectedSquare === square,
          isMove: isMove,
        });
      }
    }

    return list;
  }, [boardPerspective, displayed, selectedSquare, legalMoves]);

  return (
    <div className="board" role="grid" aria-label="Chess board" ref={boardRef}>
      {cells.map((cell: CellEntry) => (
        <Cell
          key={cell.square}
          aria-selected={cell.isSelected}
          cellInfo={cell}
          onSquareClick={onSquareClick}
          boardPerspecive={boardPerspective}
          dragStart={handleDragStart}
          dragOver={handleDragOver}
          drop={handleDrop}
        />
      ))}
    </div>
  );
};

// Memoize board to prevent unecessary re-renders
const MemoizedBoard = React.memo(Board);
MemoizedBoard.displayName = "Board";

export default MemoizedBoard;
