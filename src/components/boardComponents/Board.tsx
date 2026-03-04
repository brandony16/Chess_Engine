import React, { useMemo, useRef } from "react";
import PropTypes from "prop-types";

import { useGameStore } from "../gameStore.ts";
import Cell from "./Cell.jsx";

import "./Board.css";
import useDragDrop from "../hooks/useDragDrop.js";
import { BLACK, WHITE } from "../../game/chessConstants.ts";
import { selectShownMove } from "../stateUtils.ts";

interface BoardProps {
  onSquareClick: Function;
}

// Creates the board out of Cells
const Board = ({ onSquareClick }: BoardProps) => {
  const boardRef = useRef(null);

  const boardPerspective = useGameStore((state) => state.boardPerspective);
  const displayed = useGameStore(selectShownMove);
  const selectedSquare = useGameStore((state) => state.selectedSquare);
  const legalMoves = useGameStore((state) => state.legalMovesForSelected);

  const { handleDragStart, handleDragOver, handleDrop } =
    useDragDrop(onSquareClick);

  const cells = useMemo(() => {
    const list = [];
    for (let row = 0; row < 8; row++) {
      const actualRow = boardPerspective === BLACK ? row : 7 - row; // Flip row order for Black

      for (let col = 0; col < 8; col++) {
        const actualCol = boardPerspective === WHITE ? col : 7 - col; // Flips columns if viewing from Black
        const square = actualRow * 8 + actualCol; // Flip columns per row
        const piece = getPieceAtSquare(square, displayed);
        const isSelected = selectedSquare === square;
        const isMove = moveBitboard
          ? Boolean((moveBitboard >> BigInt(square)) & BigInt(1))
          : false;

        list.push({
          square,
          actualRow,
          actualCol,
          symbol: piece != null ? PIECE_SYMBOLS[piece] : "-",
          isSelected,
          isMove,
        });
      }
    }

    return list;
  }, [boardViewSide, displayedBitboards, selectedSquare, moveBitboard]);

  return (
    <div className="board" role="grid" aria-label="Chess board" ref={boardRef}>
      {cells.map(
        ({ square, actualRow, actualCol, symbol, isSelected, isMove }) => (
          <Cell
            key={square}
            role="gridcell"
            aria-selected={isSelected}
            piece={symbol}
            row={actualRow}
            col={actualCol}
            onSquareClick={onSquareClick}
            isSelected={isSelected}
            isMove={isMove}
            boardViewSide={boardViewSide}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
          />
        ),
      )}
    </div>
  );
};

// Memoize board to prevent unecessary re-renders
const MemoizedBoard = React.memo(Board);
MemoizedBoard.displayName = "Board";

export default MemoizedBoard;
