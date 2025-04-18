import { LRUMap } from "../LRUMap";
import { computeHash } from "../zobristHashing";

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

export const generateTTKey = (
  bitboards,
  player,
  enPassantSquare,
  castlingRights
) => {
  return computeHash(bitboards, player, enPassantSquare, castlingRights);
};
