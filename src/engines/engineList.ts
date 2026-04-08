import { createMaterialEngine } from "./materialEngine.ts";
import { MinimaxV2 } from "./minimaxEngines/abPruning.ts";
import { MinimaxV1 } from "./minimaxEngines/basicMinimax.ts";
import { MinimaxV3 } from "./minimaxEngines/moveOrdering.ts";
import { MinimaxV4 } from "./minimaxEngines/quiescence.ts";
import { MinimaxV5 } from "./minimaxEngines/transposTable.ts";
import { createRandomEngine } from "./randomEngine.ts";

// Base verions of engines
const random = createRandomEngine(Math.random);
const material = createMaterialEngine();
const minimax = new MinimaxV1(1);
const abPruning = new MinimaxV2(1);
const moveOrdering = new MinimaxV3(1);
const quiesce = new MinimaxV4(1);
const transpos = new MinimaxV5(1);

export const engines: string[] = [
  random.name,
  material.name,
  minimax.name,
  abPruning.name,
  moveOrdering.name,
  quiesce.name,
  transpos.name,
] as const;

export const getEngineByName = (name: string, depth: number = 1) => {
  switch (name) {
    case random.name:
      return createRandomEngine(Math.random);
    case material.name:
      return createMaterialEngine();
    case minimax.name:
      return new MinimaxV1(depth);
    case abPruning.name:
      return new MinimaxV2(depth);
    case moveOrdering.name:
      return new MinimaxV3(depth);
    case quiesce.name:
      return new MinimaxV4(depth);
    case transpos.name:
      return new MinimaxV5(depth);
    default:
      throw new Error("Invalid Engine Name");
  }
};

export const getEngineDescription = (name: string) => {
  const engine = getEngineByName(name);
  return engine.description;
};
