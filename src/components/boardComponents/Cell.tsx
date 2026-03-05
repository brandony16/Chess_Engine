import React, { useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";

import PieceImg from "./PieceImg.tsx";
import type { CellEntry } from "./Board.tsx";
import {
  COLUMN_SYMBOLS,
  NO_PIECE,
  WHITE,
  type Piece,
  type Player,
} from "../../game/chessConstants.ts";

interface CellProps {
  cellInfo: CellEntry;
  onSquareClick: (row: number, col: number) => void;
  boardPerspecive: Player;

  dragStart: (
    e: React.DragEvent<HTMLButtonElement>,
    row: number,
    col: number,
    piece: Piece,
    currRef: HTMLDivElement,
  ) => void;

  dragOver: (e: React.DragEvent<HTMLButtonElement>) => void;

  drop: (
    e: React.DragEvent<HTMLButtonElement>,
    row: number,
    col: number,
  ) => void;
}
// A board cell
const Cell = ({
  cellInfo,
  onSquareClick,
  boardPerspecive,
  dragStart,
  dragOver,
  drop,
}: CellProps) => {
  const [isPieceVisible, setIsPieceVisible] = useState(true);
  const pieceRef = useRef<HTMLDivElement | null>(null);

  const style = {
    backgroundColor: cellInfo.isSelected
      ? "rgba(255, 191, 89, 0.4)"
      : cellInfo.isMove
        ? "rgba(255, 100, 100, 0.3)"
        : "transparent",
  };

  const row = cellInfo.relRow;
  const col = cellInfo.relCol;

  const squareColor = (row + col) % 2 === 0 ? "dark" : "light";
  const isWhite = boardPerspecive === WHITE;

  const handleClick = useCallback(
    () => onSquareClick(row, col),
    [onSquareClick, row, col],
  );

  const startDrag = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      dragStart(e, row, col, cellInfo.piece, pieceRef.current!);

      // Handle piece visibility
      setIsPieceVisible(false);

      const onDragEnd = () => {
        document.removeEventListener("dragend", onDragEnd);
        setIsPieceVisible(true);
      };
      document.addEventListener("dragend", onDragEnd);
    },
    [dragStart, row, col, cellInfo],
  );

  const endDrag = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      drop(e, row, col);
    },
    [drop, row, col],
  );

  // Build class name
  const className = [
    "cell",
    squareColor,
    cellInfo.isSelected && "selected",
    !cellInfo.isSelected && cellInfo.isMove && "move",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      onClick={handleClick}
      onDragOver={dragOver}
      onDrop={endDrag}
      onDragStart={startDrag}
      draggable={cellInfo.piece !== NO_PIECE}
      role="gridcell"
    >
      {isWhite && row === 0 && (
        <div className={`rowId ${squareColor}`}>{COLUMN_SYMBOLS[col]}</div>
      )}
      {!isWhite && row === 7 && (
        <div className={`rowId ${squareColor}`}>{COLUMN_SYMBOLS[col]}</div>
      )}
      {isWhite && col === 0 && (
        <div className={`colId ${squareColor}`}>{row + 1}</div>
      )}
      {!isWhite && col === 7 && (
        <div className={`colId ${squareColor}`}>{row + 1}</div>
      )}
      {cellInfo.piece !== NO_PIECE && isPieceVisible && (
        <div className="pieceWrapper" ref={pieceRef}>
          <PieceImg type={cellInfo.piece} />
        </div>
      )}
      <div className="selectedCover" style={style}></div>
    </button>
  );
};

const MemoizedCell = React.memo(Cell);
MemoizedCell.displayName = "Cell";

export default MemoizedCell;
