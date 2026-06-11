export const ContextType = {
  NONE: 0,
  NODE_LIMIT: 1,
  FIXED_TIME: 2,
  TIME_CONTROL: 3,
} as const;

export type ContextType = (typeof ContextType)[keyof typeof ContextType];

export type ClockType =
  | { type: typeof ContextType.NONE }
  | { type: typeof ContextType.NODE_LIMIT; maxNodeCt: number }
  | { type: typeof ContextType.FIXED_TIME; maxTimeMs: number }
  | {
      type: typeof ContextType.TIME_CONTROL;
      timePerPlayer: number;
      increment: number;
    };

export class SearchContext {
  nodesSearched = 0;
  quiescenceNodes = 0;
  aborted = false;

  private startTime = 0;
  private readonly nodeLimit = Infinity;
  private readonly timeLimit = Infinity;

  private searchType: ContextType;

  readonly initialTime: number = 0;
  private readonly increment: number = 0;

  timeRemaining: number = 0;

  private hardLimit = Infinity;
  private softLimit = Infinity;

  constructor(clockType: ClockType = NO_CONTROL) {
    this.searchType = clockType.type;

    switch (clockType.type) {
      case ContextType.NODE_LIMIT:
        this.nodeLimit = clockType.maxNodeCt;
        break;
      case ContextType.FIXED_TIME:
        this.timeLimit = clockType.maxTimeMs;
        break;
      case ContextType.TIME_CONTROL:
        this.initialTime = clockType.timePerPlayer;
        this.timeRemaining = clockType.timePerPlayer;
        this.increment = clockType.increment;
        break;
    }
  }

  // Call this ONLY when starting a brand new game/match
  resetGameClock(): void {
    this.timeRemaining = this.initialTime;
  }

  lostOnTime(): boolean {
    if (this.searchType !== ContextType.TIME_CONTROL) return false;

    return this.timeRemaining <= 0;
  }

  // Sets the soft and hard limits for the search
  // Should be called at the start of each search for an engine
  startSearch(): void {
    this.nodesSearched = 0;
    this.quiescenceNodes = 0;
    this.aborted = false;
    this.startTime = Date.now();

    if (this.searchType !== ContextType.TIME_CONTROL) return;

    const timeLeft = this.timeRemaining;
    this.softLimit = timeLeft / 20 + this.increment / 2;

    // Dont burn more than 20% of remaining time, minus a buffer for lag
    this.hardLimit = Math.max(1, timeLeft / 5 - 25);

    // Panic mode
    if (timeLeft < 100) {
      this.softLimit = timeLeft / 2;
      this.hardLimit = Math.max(1, timeLeft - 10);
    }

    if (this.softLimit > this.hardLimit) {
      this.softLimit = this.hardLimit;
    }
  }

  // Call this right before the search function returns the best move
  endSearch(): void {
    if (this.searchType === ContextType.TIME_CONTROL) {
      const timeSpent = Date.now() - this.startTime;
      // Deduct the time we spent thinking, add the increment, and prevent negative time
      this.timeRemaining = Math.max(
        0,
        this.timeRemaining - timeSpent + this.increment,
      );
    }
  }

  tick(isQuiesce: boolean = false): boolean {
    // If we've already aborted, just return true
    if (this.aborted) return true;

    this.nodesSearched++;

    if (isQuiesce) {
      this.quiescenceNodes++;
    }

    switch (this.searchType) {
      case ContextType.NODE_LIMIT: {
        // Check node limit
        if (this.nodesSearched >= this.nodeLimit) {
          this.aborted = true;
          return true;
        }
        break;
      }
      case ContextType.FIXED_TIME: {
        if ((this.nodesSearched & 1023) === 0) {
          if (Date.now() - this.startTime >= this.timeLimit) {
            this.aborted = true;
            return true;
          }
        }
        break;
      }
      case ContextType.TIME_CONTROL: {
        if ((this.nodesSearched & 1023) === 0) {
          if (Date.now() - this.startTime >= this.hardLimit) {
            this.aborted = true;
            return true;
          }
        }
        break;
      }
    }

    return false;
  }

  shouldStopDeepening(): boolean {
    if (this.aborted) return true;
    if (this.searchType !== ContextType.TIME_CONTROL) return false;

    // Stop if we have exceeded our ideal budget for this move
    return Date.now() - this.startTime > this.softLimit;
  }

  // Call this at the root if the Principal Variation changes
  extendTime(): void {
    if (this.searchType !== ContextType.TIME_CONTROL || this.aborted) return;

    // Give the engine 50% more time to resolve a tricky position
    this.softLimit = Math.min(this.softLimit * 1.5, this.hardLimit);
  }
}

export const NO_CONTROL: ClockType = { type: ContextType.NONE };
export const DEF_NODE_LIMIT: ClockType = {
  type: ContextType.NODE_LIMIT,
  maxNodeCt: 25000,
};
export const DEF_FIXED_TIME: ClockType = {
  type: ContextType.FIXED_TIME,
  maxTimeMs: 100,
};
export const DEF_TIME_CONTROL: ClockType = {
  type: ContextType.TIME_CONTROL,
  timePerPlayer: 8000, // 8s
  increment: 80, // 0.08s increment
};

export const HIGH_NODE_LIMIT: ClockType = {
  type: ContextType.NODE_LIMIT,
  maxNodeCt: 500_000,
};
