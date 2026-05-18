import { useEffect } from "react";
import { useGameStore } from "../../gameStore.ts";
import type { EnginePost } from "../workers/engineWorkerTypes.ts";
import { SearchContext } from "../../../engines/searchContext.ts";
import { uciToMove } from "../../../game/fenAndUCI/uciHelpers.ts";

/**
 * Custom hook that handles the engine moving after the player does.
 */
export default function useMoveTrigger(
  postToEngine: (msg: EnginePost) => void,
) {
  const game = useGameStore((state) => state.game);
  const book = useGameStore((state) => state.book);
  const playMove = useGameStore((state) => state.playMove);
  const sideToMove = useGameStore((state) => state.game.sideToMove);
  const userSide = useGameStore((state) => state.userSide);

  /**
   * Plays the engine move after the player makes its turn.
   */
  useEffect(() => {
    if (sideToMove !== userSide && !game.isOver() && userSide !== null) {
      const state = useGameStore.getState();
      const position = game.getPositionCpy();

      const moveHistory = game.moveHistory;

      // potentially still in opening book
      if (moveHistory.length < 8) {
        const bookMove = book.getBookMove(moveHistory);
        if (bookMove) {
          const move = uciToMove(bookMove, game.getPositionCpy());
          playMove(move); // play book move
          return;
        }
      }

      const ctx = new SearchContext(Infinity, state.maxSearchTimeMs);

      postToEngine({
        pos: position,
        engine: state.selectedEngine,
        depth: state.searchDepth,
        ctx: ctx,
      });
    }
  }, [sideToMove, userSide, postToEngine]);
}
