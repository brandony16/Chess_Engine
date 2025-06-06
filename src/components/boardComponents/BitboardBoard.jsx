import Cell from "./Cell";
import "./Board.css";

import PropTypes from "prop-types";
import { BLACK, PIECE_SYMBOLS, WHITE } from "../bitboardUtils/constants.mjs";
import { getPieceAtSquare } from "../bitboardUtils/pieceGetters.mjs";
import { useGameStore } from "../gameStore.mjs";

// Creates the board out of Cells
const BitboardBoard = ({ onSquareClick }) => {
  const { boardViewSide, displayedBitboards, selectedSquare, moveBitboard } =
    useGameStore.getState();

  return (
    <div className="board">
      {Array.from({ length: 8 }, (_, row) => {
        const actualRow = boardViewSide === BLACK ? row : 7 - row; // Flip row order for Black

        return Array.from({ length: 8 }, (_, col) => {
          const actualCol = boardViewSide === WHITE ? col : 7 - col; // Flips columns if viewing from Black
          const square = actualRow * 8 + actualCol; // Flip columns per row
          const piece = getPieceAtSquare(square, displayedBitboards);
          const isSelected = selectedSquare === square;
          let isMove = false;
          if (moveBitboard) {
            isMove = Boolean((moveBitboard >> BigInt(square)) & BigInt(1));
          }

          return (
            <Cell
              key={square}
              piece={piece !== null ? PIECE_SYMBOLS[piece] : "-"}
              row={actualRow}
              col={actualCol}
              onSquareClick={() => onSquareClick(actualRow, actualCol)}
              isSelected={isSelected}
              isMove={isMove}
              boardViewSide={boardViewSide}
            />
          );
        });
      })}
    </div>
  );
};

BitboardBoard.propTypes = {
  onSquareClick: PropTypes.func.isRequired,
};

export default BitboardBoard;
