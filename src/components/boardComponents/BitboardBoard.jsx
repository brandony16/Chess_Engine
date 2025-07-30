import React, { useMemo } from "react";
import PropTypes from "prop-types";

import { BLACK, PIECE_SYMBOLS, WHITE } from "../../Core Logic/constants.mjs";
import { getPieceAtSquare } from "../../Core Logic/pieceGetters.mjs";
import { useGameStore } from "../gameStore.mjs";
import Cell from "./Cell";

import "./Board.css";

// Creates the board out of Cells
const BitboardBoard = ({ onSquareClick }) => {
  const boardViewSide = useGameStore((state) => state.boardViewSide);
  const displayedBitboards = useGameStore((state) => state.displayedBitboards);
  const selectedSquare = useGameStore((state) => state.selectedSquare);
  const moveBitboard = useGameStore((state) => state.moveBitboard);

  const cells = useMemo(() => {
    const list = [];
    for (let row = 0; row < 8; row++) {
      const actualRow = boardViewSide === BLACK ? row : 7 - row; // Flip row order for Black

      for (let col = 0; col < 8; col++) {
        const actualCol = boardViewSide === WHITE ? col : 7 - col; // Flips columns if viewing from Black
        const square = actualRow * 8 + actualCol; // Flip columns per row
        const piece = getPieceAtSquare(square, displayedBitboards);
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
    <div className="board" role="grid" aria-label="Chess board">
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
          />
        )
      )}
    </div>
  );
};

BitboardBoard.propTypes = {
  onSquareClick: PropTypes.func.isRequired,
};

// Memoize board to prevent unecessary re-renders
const MemoizedBoard = React.memo(BitboardBoard);
MemoizedBoard.displayName = "BitboardBoard";

export default MemoizedBoard;
