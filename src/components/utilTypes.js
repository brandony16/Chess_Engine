import wP from "../assets/pieces/wP.svg";
import wN from "../assets/pieces/wN.svg";
import wB from "../assets/pieces/wB.svg";
import wR from "../assets/pieces/wR.svg";
import wQ from "../assets/pieces/wQ.svg";
import wK from "../assets/pieces/wK.svg";
import bP from "../assets/pieces/bP.svg";
import bN from "../assets/pieces/bN.svg";
import bB from "../assets/pieces/bB.svg";
import bR from "../assets/pieces/bR.svg";
import bQ from "../assets/pieces/bQ.svg";
import bK from "../assets/pieces/bK.svg";

export const ModalTypes = Object.freeze({
  HISTORY: "history",
  BATTLE: "battle",
  NEW: "new",
  NONE: null,
});

export const EngineTypes = Object.freeze({
  BMV1: "BMV1",
  BMV2: "BMV2",
  BMV3: "BMV3",
  BMV4: "BMV4",
  BMV5: "BMV5",
  BMV6: "BMV6",
  BMV7: "BMV7",
});

export const engineStrings = [
  "BondMonkeyV1",
  "BondMonkeyV2",
  "BondMonkeyV3",
  "BondMonkeyV4",
  "BondMonkeyV5",
  "BondMonkeyV6",
  "BondMonkeyV7",
];

export const EngineObjects = {
  BMV1: { name: "BondMonkey V1", description: "Plays random moves" },
  BMV2: { name: "BondMonkey V2", description: "Basic searching" },
  BMV3: { name: "BondMonkey V3", description: "More efficient searching" },
  BMV4: { name: "BondMonkey V4", description: "Calculates tactics better" },
  BMV5: { name: "BondMonkey V5", description: "Better Evaluation" },
  BMV6: { name: "BondMonkey V6", description: "Values mobility more" },
  BMV7: { name: "BondMonkey V7", description: "Takes into account game phase" },
};

export const nameToType = {
  BondMonkeyV1: EngineTypes.BMV1,
  BondMonkeyV2: EngineTypes.BMV2,
  BondMonkeyV3: EngineTypes.BMV3,
  BondMonkeyV4: EngineTypes.BMV4,
  BondMonkeyV5: EngineTypes.BMV5,
  BondMonkeyV6: EngineTypes.BMV6,
  BondMonkeyV7: EngineTypes.BMV7,
};

export const BattleModalStates = {
  SETTING: "setting",
  LOADING: "loading",
  FINISHED: "finished",
};

export const PIECE_IMAGES = {
  P: wP,
  N: wN,
  B: wB,
  R: wR,
  Q: wQ,
  K: wK,
  p: bP,
  n: bN,
  b: bB,
  r: bR,
  q: bQ,
  k: bK,
};

export const PIECE_NAMES = {
  P: "white pawn",
  N: "white knight",
  B: "white bishop",
  R: "white rook",
  Q: "white queen",
  K: "white king",
  p: "black pawn",
  n: "black knight",
  b: "black bishop",
  r: "black rook",
  q: "black queen",
  k: "black king",
};
