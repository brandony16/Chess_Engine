import type { Game } from "../../../game/Game.ts";
import type Move from "../../../game/moveMaking/move.ts";

export type EnginePost = {
  game: Game;
  engine: string;
  timeLimit: number;
  depth: number;
};

export type EngineResponse = {
  move: Move;
}