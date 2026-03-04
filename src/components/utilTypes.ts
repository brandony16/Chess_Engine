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
  wP: wP_img,
  wN: wN_img,
  wB: wB_img,
  wR: wR_img,
  wQ: wQ_img,
  wK: wK_img,
  bP: bP_img,
  bN: bN_img,
  bB: bB_img,
  bR: bR_img,
  bQ: bQ_img,
  bK: bK_img,
} as const;

export const PIECE_NAMES = {
  wP: "white pawn",
  wN: "white knight",
  wB: "white bishop",
  wR: "white rook",
  wQ: "white queen",
  wK: "white king",
  bP: "black pawn",
  bN: "black knight",
  bB: "black bishop",
  bR: "black rook",
  bQ: "black queen",
  bK: "black king",
} as const;

export type PieceChar = keyof typeof PIECE_NAMES; 