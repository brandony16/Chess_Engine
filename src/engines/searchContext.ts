export class SearchContext {
  nodesSearched = 0;
  nodeLimit = Infinity;
  aborted = false;

  reset(nodeLimit: number): void {
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