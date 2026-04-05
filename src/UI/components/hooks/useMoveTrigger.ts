import { useEffect } from "react";
import { useGameStore } from "../../gameStore.ts";
import type { EnginePost } from "../workers/engineWorkerTypes.ts";
import { SearchContext } from "../../../engines/searchContext.ts";

/**
 * Custom hook that handles the engine moving after the player does.
 */
export default function useMoveTrigger(
  postToEngine: (msg: EnginePost) => void,
) {
  const game = useGameStore((state) => state.game);
  const sideToMove = useGameStore((state) => state.game.sideToMove);
  const userSide = useGameStore((state) => state.userSide);

  /**
   * Plays the engine move after the player makes its turn.
   */
  useEffect(() => {
    if (sideToMove !== userSide && !game.isOver() && userSide !== null) {
      const state = useGameStore.getState();
      const position = game.getPositionCpy();

      const ctx = new SearchContext();

      postToEngine({
        pos: position,
        engine: state.selectedEngine,
        ctx: ctx,
      });
    }
  }, [sideToMove, userSide, postToEngine]);
}
