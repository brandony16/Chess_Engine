import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";

import { BLACK, COLUMN_SYMBOLS, WHITE } from "../../Core Logic/constants.mjs";
import Piece from "./Piece";
import useDragDrop from "../hooks/useDragDrop";

// A board cell
const Cell = ({
  piece,
  row,
  col,
  onSquareClick,
  isSelected,
  isMove,
  boardViewSide,
}) => {
  const [isPieceVisible, setIsPieceVisible] = useState(true);

  const { handleDragStart, handleDragOver, handleDrop } =
    useDragDrop(onSquareClick);

  const style = {
    backgroundColor: isSelected
      ? "rgba(255, 191, 89, 0.4)"
      : isMove
      ? "rgba(255, 100, 100, 0.3)"
      : "transparent",
  };

  const squareColor = (row + col) % 2 === 0 ? "dark" : "light";
  const isWhite = boardViewSide === WHITE;

  const handleClick = useCallback(
    () => onSquareClick(row, col),
    [onSquareClick, row, col]
  );

  const startDrag = useCallback(
    (e) => {
      setIsPieceVisible(false);
      handleDragStart(e, row, col, piece);

      const onDragEnd = () => {
        document.removeEventListener("dragend", onDragEnd);
        setIsPieceVisible(true);
      };
      document.addEventListener("dragend", onDragEnd);
    },
    [handleDragStart, row, col, piece]
  );

  const endDrag = useCallback(
    (e) => {
      handleDrop(e, row, col);
    },
    [handleDrop, row, col]
  );

  // Build class name
  const className = [
    "cell",
    squareColor,
    isSelected && "selected",
    !isSelected && isMove && "move",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={endDrag}
      onDragStart={startDrag}
      draggable={piece !== "-"}
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
      {piece !== "-" && isPieceVisible && <Piece type={piece} />}
      <div className="selectedCover" style={style}></div>
    </button>
  );
};

Cell.propTypes = {
  piece: PropTypes.oneOf([
    "P",
    "p",
    "N",
    "n",
    "B",
    "b",
    "R",
    "r",
    "Q",
    "q",
    "K",
    "k",
    "-",
  ]).isRequired,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  onSquareClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isMove: PropTypes.bool.isRequired,
  boardViewSide: PropTypes.oneOf([WHITE, BLACK]).isRequired,
};

const MemoizedCell = React.memo(Cell);
MemoizedCell.displayName = "Cell";

export default MemoizedCell;
