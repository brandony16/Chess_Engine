export class SearchContext {
  nodesSearched = 0;
  quiescenceNodes = 0;
  nodeLimit = Infinity;
  timeLimit = Infinity; // in milliseconds
  startTime = 0;
  aborted = false;

  constructor(nodeLimit: number = Infinity, timeLimit: number = Infinity) {
    this.nodeLimit = nodeLimit;
    this.timeLimit = timeLimit;
    this.startTime = Date.now();
  }

  reset(
    nodeLimit: number = this.nodeLimit,
    timeLimit: number = this.timeLimit,
  ): void {
    this.nodesSearched = 0;
    this.nodeLimit = nodeLimit;
    this.timeLimit = timeLimit;
    this.startTime = Date.now();
    this.aborted = false;
  }

  tick(isQuiesce: boolean = false): boolean {
    // If we've already aborted, just return true
    if (this.aborted) return true;

    this.nodesSearched++;

    if (isQuiesce) {
      this.quiescenceNodes++;
    }

    // Check node limit
    if (this.nodesSearched >= this.nodeLimit) {
      this.aborted = true;
      return true;
    }

    // Check time periodically as Date.now() is slow
    if ((this.nodesSearched & 1023) === 0 && this.timeLimit !== Infinity) {
      if (Date.now() - this.startTime >= this.timeLimit) {
        this.aborted = true;
      }
    }

    return this.aborted;
  }
}
