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

export const ModalTypes = {
  BATTLE: "battle",
  HISTORY: "history",
} as const;
