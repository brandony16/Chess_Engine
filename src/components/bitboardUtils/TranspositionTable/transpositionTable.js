import { LRUMap } from "../LRUMap";

const TABLE_SIZE = 1 << 20;

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
