import wP_img from "../assets/pieces/wP.svg";
import wN_img from "../assets/pieces/wN.svg";
import wB_img from "../assets/pieces/wB.svg";
import wR_img from "../assets/pieces/wR.svg";
import wQ_img from "../assets/pieces/wQ.svg";
import wK_img from "../assets/pieces/wK.svg";
import bP_img from "../assets/pieces/bP.svg";
import bN_img from "../assets/pieces/bN.svg";
import bB_img from "../assets/pieces/bB.svg";
import bR_img from "../assets/pieces/bR.svg";
import bQ_img from "../assets/pieces/bQ.svg";
import bK_img from "../assets/pieces/bK.svg";
import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../game/chessConstants.ts";

export const EngineTypes = {
  BMV1: "BMV1",
  BMV2: "BMV2",
  BMV3: "BMV3",
  BMV4: "BMV4",
  BMV5: "BMV5",
  BMV6: "BMV6",
  BMV7: "BMV7",
} as const;

export const engineStrings = [
  "BondMonkeyV1",
  "BondMonkeyV2",
  "BondMonkeyV3",
  "BondMonkeyV4",
  "BondMonkeyV5",
  "BondMonkeyV6",
  "BondMonkeyV7",
] as const;

export const EngineObjects = {
  BMV1: { name: "BondMonkey V1", description: "Plays random moves" },
  BMV2: { name: "BondMonkey V2", description: "Basic searching" },
  BMV3: { name: "BondMonkey V3", description: "More efficient searching" },
  BMV4: { name: "BondMonkey V4", description: "Calculates tactics better" },
  BMV5: { name: "BondMonkey V5", description: "Better Evaluation" },
  BMV6: { name: "BondMonkey V6", description: "Values mobility more" },
} as const;

export const nameToType = {
  BondMonkeyV1: EngineTypes.BMV1,
  BondMonkeyV2: EngineTypes.BMV2,
  BondMonkeyV3: EngineTypes.BMV3,
  BondMonkeyV4: EngineTypes.BMV4,
  BondMonkeyV5: EngineTypes.BMV5,
  BondMonkeyV6: EngineTypes.BMV6,
} as const;

export const BattleModalStates = {
  SETTING: "setting",
  LOADING: "loading",
  FINISHED: "finished",
} as const;

export const PIECE_IMAGES = {
  [WHITE_PAWN]: wP_img,
  [WHITE_KNIGHT]: wN_img,
  [WHITE_BISHOP]: wB_img,
  [WHITE_ROOK]: wR_img,
  [WHITE_QUEEN]: wQ_img,
  [WHITE_KING]: wK_img,
  [BLACK_PAWN]: bP_img,
  [BLACK_KNIGHT]: bN_img,
  [BLACK_BISHOP]: bB_img,
  [BLACK_ROOK]: bR_img,
  [BLACK_QUEEN]: bQ_img,
  [BLACK_KING]: bK_img,
} as const;

export const PIECE_NAMES = {
  [WHITE_PAWN]: "white pawn",
  [WHITE_KNIGHT]: "white knight",
  [WHITE_BISHOP]: "white bishop",
  [WHITE_ROOK]: "white rook",
  [WHITE_QUEEN]: "white queen",
  [WHITE_KING]: "white king",
  [BLACK_PAWN]: "black pawn",
  [BLACK_KNIGHT]: "black knight",
  [BLACK_BISHOP]: "black bishop",
  [BLACK_ROOK]: "black rook",
  [BLACK_QUEEN]: "black queen",
  [BLACK_KING]: "black king",
} as const;

export type PieceChar = keyof typeof PIECE_NAMES;
