import Cell from "./Cell";
import "./Board.css";

import PropTypes from "prop-types";
import { BLACK, PIECE_SYMBOLS, WHITE } from "../bitboardUtils/constants.mjs";
import { getPieceAtSquare } from "../bitboardUtils/pieceGetters.mjs";

// Creates the board out of Cells
const BitboardBoard = ({
  bitboards,
  onSquareClick,
  selectedSquare,
  userSide,
  moveBitboard,
}) => {
  return (
    <div className="board">
      {Array.from({ length: 8 }, (_, row) => {
        const actualRow = userSide === BLACK ? row : 7 - row; // Flip row order for Black

        return Array.from({ length: 8 }, (_, col) => {
          const actualCol = userSide === WHITE ? col : 7 - col; // Flips columns if viewing from Black
          const square = actualRow * 8 + actualCol; // Flip columns per row
          const piece = getPieceAtSquare(square, bitboards);
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
              userSide={userSide}
            />
          );
        });
      })}
    </div>
  );
};

BitboardBoard.propTypes = {
  bitboards: PropTypes.array.isRequired,
  onSquareClick: PropTypes.func.isRequired,
  selectedSquare: PropTypes.number,
  userSide: PropTypes.oneOf([WHITE, BLACK]).isRequired,
  moveBitboard: PropTypes.object, // Throws a prop validation warning. Is a bigint but PropTypes does not support that.
};

export default BitboardBoard;
