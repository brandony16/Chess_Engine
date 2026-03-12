import type { Position } from "../../game/Position.ts";

export type Evaluation = (pos: Position) => number;

export const MATE_SCORE = -100_000;