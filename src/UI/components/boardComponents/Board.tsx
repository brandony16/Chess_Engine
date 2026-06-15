import React, { useMemo, useRef } from "react";

import { useGameStore } from "../../gameStore.ts";
import Cell from "./Cell.tsx";

import "./Board.css";
import useDragDrop from "../hooks/useDragDrop.ts";
import {
  FILES,
  RANKS,
  REVERSED_FILES,
  REVERSED_RANKS,
  WHITE,
  type File,
  type Piece,
  type Rank,
  type Square,
} from "../../../game/chessConstants.ts";
import { getShownMove } from "../../stateUtils.ts";
import { movesToBB } from "../../generalHelpers.ts";
import { getSquare } from "../../../game/helpers/boardUtils.ts";

interface BoardProps {
  onSquareClick: (rank: Rank, file: File) => void;
}

export type CellEntry = {
  square: Square;
  relRank: Rank;
  relFile: File;
  piece: Piece;
  isSelected: boolean;
  isMove: boolean;
  highlightSq: boolean;
};

// Creates the board out of Cells
const Board = ({ onSquareClick }: BoardProps) => {
  const boardRef = useRef<HTMLDivElement | null>(null);

  const boardPerspective = useGameStore((state) => state.boardPerspective);
  const displayed = useGameStore(getShownMove);
  const selectedSquare = useGameStore((state) => state.selectedSquare);

  const moveHighlights = useGameStore((state) => state.moveHighlights);

  const legalMoves = useGameStore((state) => state.legalMovesForSelected);
  const moveBB = movesToBB(legalMoves);

  const { handleDragStart, handleDragOver, handleDrop } =
    useDragDrop(onSquareClick);

  const cells = useMemo(() => {
    const list: CellEntry[] = [];
    const ranks = boardPerspective === WHITE ? REVERSED_RANKS : RANKS;
    const files = boardPerspective === WHITE ? FILES : REVERSED_FILES;
    for (const rank of ranks) {
      for (const file of files) {
        const square = getSquare(rank, file); // Flip columns per row
        const isMove = Boolean(moveBB & (1n << BigInt(square)));
        const shouldHighlight =
          square === moveHighlights[0] || square === moveHighlights[1];

        list.push({
          square,
          relRank: rank,
          relFile: file,
          piece: displayed.getPiece(square),
          isSelected: selectedSquare === square,
          isMove: isMove,
          highlightSq: shouldHighlight,
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
