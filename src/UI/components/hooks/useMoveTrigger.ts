import { useEffect } from "react";
import { useGameStore } from "../../gameStore.ts";
import type {
  EnginePost,
  EngineResponse,
} from "../workers/engineWorkerTypes.ts";

/**
 * Custom hook that handles the engine moving after the player does.
 */
export default function useMoveTrigger(
  postToEngine: (msg: EnginePost) => void,
) {
  const game = useGameStore((state) => state.game);
  const userSide = useGameStore((state) => state.userSide);

  /**
   * Plays the engine move after the player makes its turn.
   */
  useEffect(() => {
    if (game.sideToMove !== userSide && !game.isOver() && userSide !== null) {
      const state = useGameStore.getState();

      postToEngine({
        game: state.game,
        engine: state.selectedEngine,
        timeLimit: state.maxSearchTimeMs,
        depth: state.searchDepth,
      });
    }
  }, [game, userSide, postToEngine]);
}
