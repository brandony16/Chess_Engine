import type { Move } from "../../game/moveMaking/move.ts";
import { INFINITY } from "../Engine.ts";

export const TT_EXACT = 0;
export const TT_LOWERBOUND = 1;
export const TT_UPPERBOUND = 2;
export const LOOKUP_FAILED = INFINITY;
type TTFlag = typeof TT_EXACT | typeof TT_LOWERBOUND | typeof TT_UPPERBOUND;

export interface TTEntry {
  keyLo: number;
  keyHi: number;
  depth: number;
  score: number;
  flag: TTFlag;
  move: Move;
}
