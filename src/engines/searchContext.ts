export enum ContextType {
  NODE_LIMIT,
  FIXED_TIME,
  TIME_CONTROL,
}

export class SearchContext {
  nodesSearched = 0;
  quiescenceNodes = 0;
  aborted = false;

  private startTime = 0;
  private readonly nodeLimit = Infinity;
  private readonly timeLimit = Infinity;

  private searchType: ContextType;

  private readonly initialTime: number = 0;
  private readonly increment: number = 0;

  private timeRemaining: number = 0;

  private hardLimit = Infinity;
  private softLimit = Infinity;

  constructor(type: ContextType, limit: number, increment: number = 0) {
    this.searchType = type;

    switch (type) {
      case ContextType.NODE_LIMIT:
        this.nodeLimit = limit;
        break;
      case ContextType.FIXED_TIME:
        this.timeLimit = limit;
        break;
      case ContextType.TIME_CONTROL:
        this.initialTime = limit;
        this.timeRemaining = limit;
        this.increment = increment;
        break;
    }
  }

  // Call this ONLY when starting a brand new game/match
  resetGameClock(): void {
    this.timeRemaining = this.initialTime;
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
