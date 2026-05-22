// All bitboards represented as two 32-bit numbers (lo = bits 0-31, hi = bits 32-63)
// Squares 0-31 in lo, squares 32-63 in hi

import type { Square } from "./chessConstants.ts";

export type Bitboard = [number, number];

// Basic Bitwise Ops

export function bbAnd(
  alo: number,
  ahi: number,
  blo: number,
  bhi: number,
): [number, number] {
  return [alo & blo, ahi & bhi];
}

export function bbOr(
  alo: number,
  ahi: number,
  blo: number,
  bhi: number,
): [number, number] {
  return [alo | blo, ahi | bhi];
}

export function bbXor(
  alo: number,
  ahi: number,
  blo: number,
  bhi: number,
): [number, number] {
  return [alo ^ blo, ahi ^ bhi];
}

export function bbNot(lo: number, hi: number): [number, number] {
  return [~lo, ~hi];
}

export function bbAndNot(
  alo: number,
  ahi: number,
  blo: number,
  bhi: number,
): [number, number] {
  // a & ~b — very common operation, worth having directly
  return [alo & ~blo, ahi & ~bhi];
}

// Shifts

export function bbShiftLeft(
  lo: number,
  hi: number,
  n: number,
): [number, number] {
  if (n === 0) return [lo, hi];
  if (n >= 64) return [0, 0];
  if (n >= 32) return [0, lo << (n - 32)];
  return [lo << n, (hi << n) | (lo >>> (32 - n))];
}

export function bbShiftRight(
  lo: number,
  hi: number,
  n: number,
): [number, number] {
  if (n === 0) return [lo, hi];
  if (n >= 64) return [0, 0];
  if (n >= 32) return [hi >>> (n - 32), 0];
  return [(lo >>> n) | (hi << (32 - n)), hi >>> n];
}

// Single Square Ops

export function setBit(lo: number, hi: number, sq: number): [number, number] {
  if (sq < 32) return [lo | (1 << sq), hi];
  return [lo, hi | (1 << (sq - 32))];
}

export function clearBit(lo: number, hi: number, sq: number): [number, number] {
  if (sq < 32) return [lo & ~(1 << sq), hi];
  return [lo, hi & ~(1 << (sq - 32))];
}

export function testBit(lo: number, hi: number, sq: number): boolean {
  if (sq < 32) return (lo & (1 << sq)) !== 0;
  return (hi & (1 << (sq - 32))) !== 0;
}

export function squareBB(sq: number): [number, number] {
  // Returns a BB with only sq set
  if (sq < 32) return [1 << sq, 0];
  return [0, 1 << (sq - 32)];
}

export const SQUARE_BB_LO = new Uint32Array(64);
export const SQUARE_BB_HI = new Uint32Array(64);

for (let sq = 0; sq < 64; sq++) {
  if (sq < 32) {
    SQUARE_BB_LO[sq] = 1 << sq;
    SQUARE_BB_HI[sq] = 0;
  } else {
    SQUARE_BB_LO[sq] = 0;
    SQUARE_BB_HI[sq] = 1 << (sq - 32);
  }
}

// LSB / MSB

export function lsb(lo: number, hi: number): Square {
  // Index of least significant bit
  if (lo !== 0) return (31 - Math.clz32(lo & -lo)) as Square;
  if (hi !== 0) return (31 - Math.clz32(hi & -hi) + 32) as Square;
  return -1; // empty BB
}

export function msb(lo: number, hi: number): Square {
  // Index of most significant bit
  if (hi !== 0) return (63 - Math.clz32(hi)) as Square;
  if (lo !== 0) return (31 - Math.clz32(lo)) as Square;
  return -1; // empty BB
}

export function popLsb(
  arr: Int32Array | number[],
  loIdx: number,
  hiIdx: number,
): number {
  // Pops LSB from a BB stored in an array, returns the square index
  const lo = arr[loIdx],
    hi = arr[hiIdx];
  if (lo !== 0) {
    const sq = 31 - Math.clz32(lo & -lo);
    arr[loIdx] = lo & (lo - 1);
    return sq;
  }
  if (hi !== 0) {
    const sq = 31 - Math.clz32(hi & -hi) + 32;
    arr[hiIdx] = hi & (hi - 1);
    return sq;
  }
  return -1; // empty BB
}

// Queries

export function bbIsEmpty(lo: number, hi: number): boolean {
  return lo === 0 && hi === 0;
}

export function bbNotEmpty(lo: number, hi: number): boolean {
  return lo !== 0 || hi !== 0;
}

export function moreThanOne(lo: number, hi: number): boolean {
  // True if more than one bit is set
  const newLo = lo & (lo - 1);
  if (newLo !== 0 || hi !== 0) {
    // Check if after clearing one bit, anything remains
    return (
      newLo !== 0 ||
      (lo === 0 && (hi & (hi - 1)) !== 0) ||
      (lo !== 0 && hi !== 0)
    );
  }
  return false;
}

export function exactlyOne(lo: number, hi: number): boolean {
  return bbNotEmpty(lo, hi) && !moreThanOne(lo, hi);
}

// Popcount

export function popcount(lo: number, hi: number): number {
  return popcnt32(lo) + popcnt32(hi);
}

export function popcnt32(x: number): number {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

// Conversion

export function bbFromBigInt(b: bigint): [number, number] {
  const lo = Number(b & 0xffffffffn);
  const hi = Number((b >> 32n) & 0xffffffffn);
  return [lo, hi];
}

export function bbToBigInt(lo: number, hi: number): bigint {
  return BigInt(lo >>> 0) | (BigInt(hi >>> 0) << 32n);
}

// Debug

export function bbPrint(lo: number, hi: number): void {
  // Prints an 8x8 board representation, useful for debugging
  let out = "";
  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const sq = rank * 8 + file;
      out += testBit(lo, hi, sq) ? "1 " : ". ";
    }
    out += `  ${rank + 1}\n`;
  }
  out += "a b c d e f g h";
  console.log(out);
}
