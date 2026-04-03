export class SearchContext {
  nodesSearched = 0;
  nodeLimit = Infinity;
  aborted = false;

  constructor(nodeLimit: number = Infinity) {
    this.nodeLimit = nodeLimit;
  }

  reset(nodeLimit: number = this.nodeLimit): void {
    this.nodesSearched = 0;
    this.nodeLimit = nodeLimit;
    this.aborted = false;
  }

  tick(): boolean {
    this.nodesSearched++;
    if (this.nodesSearched >= this.nodeLimit) {
      this.aborted = true;
    }

    return this.aborted;
  }
}
