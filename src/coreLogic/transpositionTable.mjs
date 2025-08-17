import { LRUMap } from "./LRUMap.mjs";

const TABLE_SIZE = 1 << 20;

/**
 * Transposition table is used to avoid recalcualting positions that have already been calculated.
 * The same position can occur with different move orders, such as e3 then Nf3 vs Nf3 then e3.
 *
 * An entry looks like:
 * {
 *   rootId: rootId,
 *   depth: maxDepth - currentDepth,
 *   value: storedEval,
 *   flag,
 *   bestMove,
 * }
 * and the key is the hash of the position
 */
const table = new LRUMap(TABLE_SIZE);

export const TT_FLAG = {
  EXACT: 0,
  LOWER_BOUND: 1,
  UPPER_BOUND: 2,
};

export const clearTT = () => {
  table.clear();
};

export const getTT = (key) => {
  return table.get(key);
};

export const setTT = (key, entry) => {
  table.set(key, entry);
};

const quiesceTable = new LRUMap(TABLE_SIZE);

export const clearQTT = () => {
  quiesceTable.clear();
};

export const getQTT = (key) => {
  return quiesceTable.get(key);
};

export const setQTT = (key, entry) => {
  quiesceTable.set(key, entry);
};
