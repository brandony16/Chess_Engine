import { beforeEach, jest } from "@jest/globals";
import { checkGameOver } from "../components/bitboardUtils/gameOverLogic";
import {
  BLACK_KING,
  BLACK_PAWN,
  WHITE,
  WHITE_KING,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../components/bitboardUtils/constants";
import { computeAllAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks";
import { initializePieceAtArray } from "../components/bitboardUtils/pieceGetters";
import { initializePieceIndicies } from "../components/bitboardUtils/pieceIndicies";

// helper: empty bitboards array of length N (adjust N to your piece-count)
function emptyBitboards() {
  return new BigUint64Array(12).fill(0n);
}

// helper: set a single piece on a square
function placePiece(bbArray, pieceIndex, square) {
  bbArray[pieceIndex] |= 1n << BigInt(square);
}

describe("checkGameOver", () => {
  test("draw by insufficient material (only kings)", () => {
    const bbs = emptyBitboards();
    // white king on e1, black king on e8
    placePiece(bbs, WHITE_KING, 4);
    placePiece(bbs, BLACK_KING, 60);
    initializePieceIndicies(bbs);
    computeAllAttackMasks(bbs);
    initializePieceAtArray(bbs);

    const res = checkGameOver(bbs, WHITE, new Map(), null, 0);
    expect(res.isGameOver).toBe(true);
    expect(res.result).toBe("Draw by Insufficient Material");
  });

  test("draw by fifty-move rule", () => {
    const bbs = emptyBitboards();
    // some material so insufficientMaterial is false
    placePiece(bbs, WHITE_KING, 4);
    placePiece(bbs, WHITE_QUEEN, 5);
    placePiece(bbs, BLACK_KING, 60);
    initializePieceIndicies(bbs);
    computeAllAttackMasks(bbs);
    initializePieceAtArray(bbs);

    // but fiftyMoveCounter at or above threshold
    const res = checkGameOver(bbs, WHITE, new Map(), null, 100);
    expect(res.isGameOver).toBe(true);
    expect(res.result).toBe("Draw By 50 Move Rule");
  });

  test("draw by threefold repetition", () => {
    const bbs = emptyBitboards();
    placePiece(bbs, WHITE_KING, 4);
    placePiece(bbs, WHITE_QUEEN, 5);
    placePiece(bbs, BLACK_KING, 60);
    initializePieceIndicies(bbs);
    computeAllAttackMasks(bbs);
    initializePieceAtArray(bbs);

    const past = new Map();
    past.set("posHash", 3); // repeated three times
    const res = checkGameOver(bbs, WHITE, past, null, 0);
    expect(res.isGameOver).toBe(true);
    expect(res.result).toBe("Draw by Repetition");
  });

  test("stalemate for side to move", () => {
    const bbs = emptyBitboards();
    placePiece(bbs, BLACK_KING, 0);
    placePiece(bbs, WHITE_KING, 7);
    placePiece(bbs, WHITE_QUEEN, 10);
    initializePieceIndicies(bbs);
    computeAllAttackMasks(bbs);
    initializePieceAtArray(bbs);

    const res = checkGameOver(bbs, WHITE, new Map(), null, 0);
    expect(res.isGameOver).toBe(true);
    expect(res.result).toBe("Draw by Stalemate");
  });

  test("checkmate recognized correctly", () => {
    const bbs = emptyBitboards();

    // Ladder mate
    placePiece(bbs, BLACK_KING, 60);
    placePiece(bbs, WHITE_KING, 4);
    placePiece(bbs, WHITE_ROOK, 56);
    placePiece(bbs, WHITE_ROOK, 48);
    initializePieceIndicies(bbs);
    computeAllAttackMasks(bbs);
    initializePieceAtArray(bbs);

    const res = checkGameOver(bbs, WHITE, new Map(), null, 0);
    expect(res.isGameOver).toBe(true);
    expect(res.result).toBe("White Wins by Checkmate");
  });

  test("game continues when legal moves exist", () => {
    const bbs = emptyBitboards();

    placePiece(bbs, WHITE_KING, 4);
    placePiece(bbs, BLACK_KING, 60);
    placePiece(bbs, WHITE_ROOK, 0);
    initializePieceIndicies(bbs);
    computeAllAttackMasks(bbs);
    initializePieceAtArray(bbs);

    const res = checkGameOver(bbs, WHITE, new Map(), null, 0);
    expect(res.isGameOver).toBe(false);
    expect(res.result).toBeNull();
  });
});
