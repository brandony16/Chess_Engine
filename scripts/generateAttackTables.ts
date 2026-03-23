import fs from "fs";
import {
  bishopMagics,
  bishopShifts,
  rookMagics,
  rookShifts,
} from "../src/game/moveGen/magicNumbers/magicNumbers";
import { generateBlockerSubsets } from "../src/game/moveGen/magicNumbers/magicGen";
import {
  bishopMasksHi,
  bishopMasksLo,
  rookMasksHi,
  rookMasksLo,
} from "../src/game/moveGen/magicNumbers/slidingMasks";
import { bbToBigInt } from "../src/game/bb";

/*
  This script generates the magic bitboard attack tables for rooks and bishops and saves them to attackTables.mjs.
*/
/**
 * Gets all squares a rook on `sq` can attack given `blockers` (brute force ray scan)
 */
export const getRookAttacksForSquare = (blockers: bigint, sq: number) => {
  let attacks = 0n;
  const rank = sq >> 3;
  const file = sq & 7;

  // North
  for (let r = rank + 1; r < 8; r++) {
    const s = r * 8 + file;
    attacks |= 1n << BigInt(s);
    if (blockers & (1n << BigInt(s))) break;
  }
  // South
  for (let r = rank - 1; r >= 0; r--) {
    const s = r * 8 + file;
    attacks |= 1n << BigInt(s);
    if (blockers & (1n << BigInt(s))) break;
  }
  // East
  for (let f = file + 1; f < 8; f++) {
    const s = rank * 8 + f;
    attacks |= 1n << BigInt(s);
    if (blockers & (1n << BigInt(s))) break;
  }
  // West
  for (let f = file - 1; f >= 0; f--) {
    const s = rank * 8 + f;
    attacks |= 1n << BigInt(s);
    if (blockers & (1n << BigInt(s))) break;
  }

  return attacks;
};

/**
 * Gets all squares a bishop on `sq` can attack given `blockers` (brute force ray scan)
 */
export const getBishopAttacksForSquare = (blockers: bigint, sq: number) => {
  let attacks = 0n;
  const rank = sq >> 3;
  const file = sq & 7;

  // North-East
  for (let r = rank + 1, f = file + 1; r < 8 && f < 8; r++, f++) {
    const s = r * 8 + f;
    attacks |= 1n << BigInt(s);
    if (blockers & (1n << BigInt(s))) break;
  }
  // North-West
  for (let r = rank + 1, f = file - 1; r < 8 && f >= 0; r++, f--) {
    const s = r * 8 + f;
    attacks |= 1n << BigInt(s);
    if (blockers & (1n << BigInt(s))) break;
  }
  // South-East
  for (let r = rank - 1, f = file + 1; r >= 0 && f < 8; r--, f++) {
    const s = r * 8 + f;
    attacks |= 1n << BigInt(s);
    if (blockers & (1n << BigInt(s))) break;
  }
  // South-West
  for (let r = rank - 1, f = file - 1; r >= 0 && f >= 0; r--, f--) {
    const s = r * 8 + f;
    attacks |= 1n << BigInt(s);
    if (blockers & (1n << BigInt(s))) break;
  }

  return attacks;
};

const MASK_32 = 0xffffffffn;

// Attack tables: 64 squares × (1<<maxBits) entries
const rookAttackTableLo = Array(64);
const rookAttackTableHi = Array(64);
const bishopAttackTableLo = Array(64);
const bishopAttackTableHi = Array(64);

for (let sq = 0; sq < 64; sq++) {
  const rMask = bbToBigInt(rookMasksLo[sq], rookMasksHi[sq]);
  const bMask = bbToBigInt(bishopMasksLo[sq], bishopMasksHi[sq]);

  const rSize = 1 << (64 - rookShifts[sq]);
  const bSize = 1 << (64 - bishopShifts[sq]);

  rookAttackTableLo[sq] = new Int32Array(rSize);
  rookAttackTableHi[sq] = new Int32Array(rSize);
  bishopAttackTableLo[sq] = new Int32Array(bSize);
  bishopAttackTableHi[sq] = new Int32Array(bSize);

  for (const blockers of generateBlockerSubsets(rMask)) {
    const occMasked = blockers & rMask;
    const product = BigInt.asUintN(64, occMasked * BigInt(rookMagics[sq]));
    const idx = Number(product >> BigInt(rookShifts[sq]));
    const attacks = getRookAttacksForSquare(blockers, sq);

    rookAttackTableLo[sq][idx] = Number(attacks & MASK_32) | 0;
    rookAttackTableHi[sq][idx] = Number((attacks >> 32n) & MASK_32) | 0;
  }

  for (const blockers of generateBlockerSubsets(bMask)) {
    const idx = Number(
      BigInt.asUintN(64, (blockers & bMask) * BigInt(bishopMagics[sq])) >>
        BigInt(bishopShifts[sq]),
    );
    const attacks = getBishopAttacksForSquare(blockers, sq);

    bishopAttackTableLo[sq][idx] = Number(attacks & MASK_32) | 0;
    bishopAttackTableHi[sq][idx] = Number((attacks >> 32n) & MASK_32) | 0;
  }
}

function serializeInt32Array(arr: Int32Array) {
  return `new Int32Array([${Array.from(arr).join(",")}])`;
}

function serializeTable(
  loTable: Array<Int32Array>,
  hiTable: Array<Int32Array>,
) {
  const lo = "[" + loTable.map(serializeInt32Array).join(",") + "]";
  const hi = "[" + hiTable.map(serializeInt32Array).join(",") + "]";
  return { lo, hi };
}

const rook = serializeTable(rookAttackTableLo, rookAttackTableHi);
const bishop = serializeTable(bishopAttackTableLo, bishopAttackTableHi);

const output = `
export const rookAttackTableLo: Int32Array[] = ${rook.lo};
export const rookAttackTableHi: Int32Array[] = ${rook.hi};
export const bishopAttackTableLo: Int32Array[] = ${bishop.lo};
export const bishopAttackTableHi: Int32Array[] = ${bishop.hi};
`;

fs.writeFileSync(
  new URL("../src/game/attackTables.ts", import.meta.url),
  output,
);

console.log("Attack tables generated successfully.");
