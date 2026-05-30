import { PROBE_MISSED } from "../../../transpositionTable/ttTypes.ts";

export default class PawnHashTable {
  private readonly ENTRY_BYTES = 8; // 4 for key, 4 for entry
  readonly size: number;
  readonly keys: Uint32Array;
  private scores: Int32Array;

  constructor(sizeMB = 16) {
    this.size =
      1 << Math.floor(Math.log2((sizeMB * 1024 * 1024) / this.ENTRY_BYTES));

    this.keys = new Uint32Array(this.size);
    this.scores = new Int32Array(this.size);
  }

  index(keys: number): number {
    return (keys >>> 0) & (this.size - 1);
  }

  store(key: number, score: number): void {
    const idx = this.index(key);

    this.keys[idx] = key;
    this.scores[idx] = score;
  }

  probe(key: number): number {
    const idx = this.index(key);
    if (this.keys[idx] === key) {
      return this.scores[idx];
    }

    return PROBE_MISSED;
  }

  clear(): void {
    this.keys.fill(0);
    this.scores.fill(0);
  }
}
