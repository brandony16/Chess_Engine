import { getNewEnPassant } from "../../Core Logic/bbChessLogic.mjs";
import { BLACK_PAWN, WHITE_PAWN } from "../../Core Logic/constants.mjs";
import {
  getOpeningMoves,
  squareToIndex,
} from "../../Core Logic/helpers/FENandUCIHelpers.mjs";
import { checkGameOver } from "../../Core Logic/gameOverLogic.mjs";
import { moveToReadable } from "../../Core Logic/helpers/generalHelpers.mjs";
import { makeMove } from "../../Core Logic/moveMaking/makeMoveLogic.mjs";
import Move from "../../Core Logic/moveMaking/move.mjs";
import { pieceAt } from "../../Core Logic/pieceGetters.mjs";
import { computeHash } from "../../Core Logic/zobristHashing.mjs";
import { useGameStore } from "../gameStore.mjs";
import { engineRegistry } from "./engineRegistry.mjs";
import { isKing } from "../../Core Logic/helpers/pieceUtils";

/**
 * Plays a random 4 move (8 ply) opening
 */
export const playRandomOpening = async () => {
  // Fetches an 8ply opening from openings.json
  const moves = await getOpeningMoves();

  for (const uciMove of moves) {
    const from = squareToIndex(uciMove.slice(0, 2));
    const to = squareToIndex(uciMove.slice(2, 4));
    const promotion = null; // Cant have a promotion in 4 moves

    processMove(from, to, promotion);
  }
};

/**
 * Makes a move with the given engine
 *
 * @param {string} engine - the string of the engine to use for the move.
 * Should be on of the types in the EngineRegistry
 * @param {int} depth - the depth to search
 * @param {int} timeLimit - the time limit the engine has for a move in ms
 */
export const makeEngineMove = (engine, depth = 3, timeLimit = Infinity) => {
  const {
    isCurrPositionShown,
    isGameOver,
    bitboards,
    currPlayer,
    castlingRights,
    enPassantSquare,
    pastPositions,
  } = useGameStore.getState();

  if (!isCurrPositionShown || isGameOver) return;

  const engineFn = engineRegistry[engine];

  const bestMove = engineFn(
    bitboards,
    currPlayer,
    castlingRights,
    enPassantSquare,
    pastPositions,
    depth,
    timeLimit
  );
  const from = bestMove.from;
  const to = bestMove.to;
  const promotion = bestMove.promotion;

  processMove(from, to, promotion);
};

/**
 * Processes a move by making the move and updating state.
 *
 * @param {int} from - the square the piece is moving from
 * @param {int} to - the square the piece is moving to
 * @param {int} promotion - the piece to promote to
 */
const processMove = (from, to, promotion = null) => {
  const {
    bitboards,
    currPlayer,
    castlingRights,
    enPassantSquare,
    pastPositions,
    updateStates,
    fiftyMoveRuleCounter,
  } = useGameStore.getState();

  // Get variables for Move object
  const piece = pieceAt[from];
  const castling = isKing(piece) && Math.abs(from - to) === 2;
  const enPassant =
    to === enPassantSquare && (piece === WHITE_PAWN || piece === BLACK_PAWN);
  let captured = pieceAt[to];
  if (enPassant) {
    captured = piece === WHITE_PAWN ? BLACK_PAWN : WHITE_PAWN;
  }

  const move = new Move(
    from,
    to,
    piece,
    captured,
    promotion,
    castling,
    enPassant
  );

  makeMove(bitboards, move);

  const newEnPassant = getNewEnPassant(move);
  const epFile = newEnPassant ? newEnPassant % 8 : -1;

  const hash = computeHash(bitboards, currPlayer, epFile, castlingRights);

  pastPositions.set(hash, (pastPositions.get(hash) || 0) + 1);

  const gameOverObj = checkGameOver(
    bitboards,
    currPlayer,
    pastPositions,
    newEnPassant,
    fiftyMoveRuleCounter
  );

  const readableMove = moveToReadable(
    bitboards,
    from,
    to,
    move.captured !== null
  );

  updateStates(readableMove, move, gameOverObj);
};
