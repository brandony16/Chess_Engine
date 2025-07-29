import { useEffect } from "react";
import { useGameStore } from "../gameStore.mjs";

/**
 * Custom hook that handles the engine moving after the player does.
 * @param {Function} - the function to post message to engine
  *
 }} postToEngine 
 */
export default function useMoveTrigger(postToEngine) {
  const { currPlayer, userSide, isGameOver } = useGameStore.getState();

  /**
   * Plays the engine move after the player makes its turn.
   */
  useEffect(() => {
    if (currPlayer !== userSide && !isGameOver && userSide !== null) {
      const state = useGameStore.getState();

      postToEngine({
        bitboards: state.bitboards,
        player: state.currPlayer,
        castlingRights: state.castlingRights,
        enPassantSquare: state.enPassantSquare,
        prevPositions: state.pastPositions,
        engine: state.selectedEngine,
        maxDepth: state.engineDepth,
        timeLimit: state.engineTimeLimitMs,
      });
    }
  }, [currPlayer, userSide, isGameOver, postToEngine]);
}
