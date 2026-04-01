import type { Move } from "../../game/moveMaking/move.ts";
import { MATE_THRESHOLD } from "../evaluation/Evaluation.ts";

export class TranspositionTable {
  private readonly ENTRY_BYTES = 18; // 8 for key, 4 each for depth and move, 1 each for depth and flag

  private size: number;
  private keyLo: Int32Array;
  private keyHi: Int32Array;
  private depth: Int8Array;
  private score: Int32Array;
  private flag: Int8Array;
  private move: Uint32Array;

  // Stats
  hits: number = 0;
  misses: number = 0;
  cutoffs: number = 0;

  constructor(sizeMB = 64) {
    // Make size power of 2 so you can use & instead of %
    this.size =
      1 << Math.floor(Math.log2((sizeMB * 1024 * 1024) / this.ENTRY_BYTES));

    this.keyLo = new Int32Array(this.size);
    this.keyHi = new Int32Array(this.size);
    this.depth = new Int8Array(this.size);
    this.score = new Int32Array(this.size);
    this.flag = new Int8Array(this.size);
    this.move = new Uint32Array(this.size);
  }

  index(keyLo: number): number {
    // bc size is a power of 2, size - 1 is all 1s.
    // & therefore isolates the trailing bits, just like modulo
    return (keyLo >>> 0) & (this.size - 1);
  }

  store(
    keyLo: number,
    keyHi: number,
    depth: number,
    score: number,
    flag: number,
    move: Move,
    ply: number,
  ): void {
    const i = this.index(keyLo);

    if (
      (this.keyLo[i] !== keyLo || this.keyHi[i] !== keyHi) &&
      this.depth[i] > depth
    ) {
      // keep deeper entries
      return;
    }

    // Adjust mate scores before storing
    const adjustedScore =
      score >= MATE_THRESHOLD
        ? score + ply
        : score <= -MATE_THRESHOLD
          ? score - ply
          : score;

    // Always replace
    this.keyLo[i] = keyLo;
    this.keyHi[i] = keyHi;
    this.depth[i] = depth;
    this.score[i] = adjustedScore;
    this.flag[i] = flag;
    this.move[i] = move;
  }

  probe(keyLo: number, keyHi: number): number {
    const idx = this.index(keyLo);
    if (this.keyLo[idx] === keyLo && this.keyHi[idx] === keyHi) {
      this.hits++;
      return idx;
    }

    this.misses++;
    return -1;
  }

  getScore(i: number, ply: number): number {
    const score = this.score[i];

    // Adjust mate scores after retrieving
    return score >= MATE_THRESHOLD
      ? score - ply
      : score <= -MATE_THRESHOLD
        ? score + ply
        : score;
  }

  getDepth(i: number): number {
    return this.depth[i];
  }
  getFlag(i: number): number {
    return this.flag[i];
  }
  getMove(i: number): Move {
    return this.move[i];
  }

  clear(): void {
    this.keyLo.fill(0);
    this.keyHi.fill(0);
    this.depth.fill(0);
  }
}
