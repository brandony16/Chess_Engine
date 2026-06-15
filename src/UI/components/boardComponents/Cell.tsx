import React, { useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";

import PieceImg from "./PieceImg.tsx";
import type { CellEntry } from "./Board.tsx";
import {
  FILE_SYMBOLS,
  NO_PIECE,
  WHITE,
  type File,
  type Piece,
  type Player,
  type Rank,
} from "../../../game/chessConstants.ts";

interface CellProps {
  cellInfo: CellEntry;
  onSquareClick: (rank: Rank, file: File) => void;
  boardPerspecive: Player;

  dragStart: (
    e: React.DragEvent<HTMLButtonElement>,
    rank: Rank,
    file: File,
    piece: Piece,
    currRef: HTMLDivElement,
  ) => void;

  dragOver: (e: React.DragEvent<HTMLButtonElement>) => void;

  drop: (e: React.DragEvent<HTMLButtonElement>, rank: Rank, file: File) => void;
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
    backgroundColor:
      cellInfo.isSelected || cellInfo.highlightSq
        ? "rgba(255, 191, 89, 0.5)"
        : cellInfo.isMove
          ? "rgba(255, 100, 100, 0.3)"
          : "transparent",
  };

  const rank = cellInfo.relRank;
  const file = cellInfo.relFile;

  const squareColor = (rank + file) % 2 === 0 ? "dark" : "light";
  const isWhite = boardPerspecive === WHITE;

  const handleClick = useCallback(
    () => onSquareClick(rank, file),
    [onSquareClick, rank, file],
  );

  const startDrag = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      dragStart(e, rank, file, cellInfo.piece, pieceRef.current!);

      // Handle piece visibility
      setIsPieceVisible(false);

      const onDragEnd = () => {
        document.removeEventListener("dragend", onDragEnd);
        setIsPieceVisible(true);
      };
      document.addEventListener("dragend", onDragEnd);
    },
    [dragStart, rank, file, cellInfo],
  );

  const endDrag = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      drop(e, rank, file);
    },
    [drop, rank, file],
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
      {isWhite && rank === 0 && (
        <div className={`rankId ${squareColor}`}>{FILE_SYMBOLS[file]}</div>
      )}
      {!isWhite && rank === 7 && (
        <div className={`rankId ${squareColor}`}>{FILE_SYMBOLS[file]}</div>
      )}
      {isWhite && file === 0 && (
        <div className={`colId ${squareColor}`}>{rank + 1}</div>
      )}
      {!isWhite && file === 7 && (
        <div className={`colId ${squareColor}`}>{rank + 1}</div>
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
