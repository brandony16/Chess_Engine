import {
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_ROOK,
  WHITE_BISHOP,
  WHITE_PAWN,
  WHITE_QUEEN,
} from "../coreLogic/constants.mjs";
import { MAX_PHASE } from "../coreLogic/engines/BMV7/evaluation/phase.mjs";
import {
  EG_TABLES,
  getPSQTValue,
  MG_TABLES,
} from "../coreLogic/engines/BMV7/evaluation/PieceSquareTables.mjs";

describe("getPSQT Value", () => {
  it("should get the correct middlegame value", () => {
    const phase = MAX_PHASE;

    const pawnValue = getPSQTValue(WHITE_PAWN, 22, phase); // Pawn g3
    const knightValue = getPSQTValue(BLACK_KNIGHT, 42, phase); // Knight c6
    const bishopValue = getPSQTValue(WHITE_BISHOP, 24, phase); // Bishop a4
    const rookValue = getPSQTValue(BLACK_ROOK, 63, phase); // Rook h8
    const queenValue = getPSQTValue(WHITE_QUEEN, 0, phase); // Queen a1
    const kingValue = getPSQTValue(BLACK_KING, 58, phase); // King c8

    expect(pawnValue).toBe(MG_TABLES[0][22]);
    expect(knightValue).toBe(MG_TABLES[1][18]); // Flip ranks for black
    expect(bishopValue).toBe(MG_TABLES[2][24]);
    expect(rookValue).toBe(MG_TABLES[3][7]);
    expect(queenValue).toBe(MG_TABLES[4][0]);
    expect(kingValue).toBe(MG_TABLES[5][2]);
  });

  it("should get the correct endgame value", () => {
    const phase = 0;

    const pawnValue = getPSQTValue(WHITE_PAWN, 22, phase); // Pawn g3
    const knightValue = getPSQTValue(BLACK_KNIGHT, 42, phase); // Knight c6
    const bishopValue = getPSQTValue(WHITE_BISHOP, 24, phase); // Bishop a4
    const rookValue = getPSQTValue(BLACK_ROOK, 63, phase); // Rook h8
    const queenValue = getPSQTValue(WHITE_QUEEN, 0, phase); // Queen a1
    const kingValue = getPSQTValue(BLACK_KING, 58, phase); // King c8

    expect(pawnValue).toBe(EG_TABLES[0][22]);
    expect(knightValue).toBe(EG_TABLES[1][18]); // Flip ranks for black
    expect(bishopValue).toBe(EG_TABLES[2][24]);
    expect(rookValue).toBe(EG_TABLES[3][7]);
    expect(queenValue).toBe(EG_TABLES[4][0]);
    expect(kingValue).toBe(EG_TABLES[5][2]);
  });
});
