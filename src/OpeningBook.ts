export class OpeningBook {
  private book = new Map<string, { move: string; weight: number }[]>();
  private isLoaded = false;

  async initialize() {
    if (this.isLoaded) return;

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}openings.json`);
      const openings: string[][] = await response.json();

      // Temporary map to easily tally up the counts
      // Key: "prefix", Value: Map<"nextMove", count>
      const frequencyMap = new Map<string, Map<string, number>>();

      for (const line of openings) {
        let currentPrefix = "";

        for (const nextMove of line) {
          let movesAtPrefix = frequencyMap.get(currentPrefix);
          if (!movesAtPrefix) {
            movesAtPrefix = new Map<string, number>();
            frequencyMap.set(currentPrefix, movesAtPrefix);
          }

          // Increment the frequency count for this specific response
          const currentCount = movesAtPrefix.get(nextMove) || 0;
          movesAtPrefix.set(nextMove, currentCount + 1);

          // Update the prefix for the next iteration
          currentPrefix =
            currentPrefix === "" ? nextMove : `${currentPrefix} ${nextMove}`;
        }
      }

      // Convert the frequency map into our final format for fast lookups
      for (const [prefix, moveMap] of frequencyMap.entries()) {
        const weightedMoves = Array.from(moveMap.entries()).map(
          ([move, weight]) => ({
            move,
            weight,
          }),
        );
        this.book.set(prefix, weightedMoves);
      }

      this.isLoaded = true;
      console.log(
        `Loaded weighted opening book with ${this.book.size} unique positions.`,
      );
    } catch (error) {
      console.error("Failed to load opening book:", error);
    }
  }

  /**
   * Pass in the current game history as an array of UCI strings
   * Example input: ["d2d4", "d7d5"]
   */
  getBookMove(history: string[]): string | null {
    if (!this.isLoaded) return null;

    const historyKey = history.join(" ");
    const possibleMoves = this.book.get(historyKey);
    3;

    if (!possibleMoves || possibleMoves.length === 0) {
      return null; // Out of book
    }

    // Select a move based on weights
    const totalWeight = possibleMoves.reduce(
      (sum, item) => sum + item.weight,
      0,
    );

    let random = Math.random() * totalWeight;

    // Loop through moves and subtract weights until we hit 0 or below
    for (const item of possibleMoves) {
      random -= item.weight;
      if (random <= 0) {
        return item.move;
      }
    }

    // Fallback (should theoretically never hit)
    return possibleMoves[possibleMoves.length - 1].move;
  }
}
