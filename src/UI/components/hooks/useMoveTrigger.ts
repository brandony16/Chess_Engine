import { useEffect } from "react";
import { useGameStore } from "../../gameStore.ts";
import { SearchContext } from "../../../engines/searchContext.ts";
import { uciToMove } from "../../../game/fenAndUCI/uciHelpers.ts";
import type { EngineCommand } from "../workers/engineWorker.ts";

/**
 * Custom hook that handles the engine moving after the player does.
 */
export default function useMoveTrigger(
  postToEngine: (msg: EngineCommand) => void,
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

      postToEngine({
        type: "search",
        pos: position,
      });
    }
  }, [sideToMove, userSide, postToEngine]);
}
