import { useEffect } from "react";
import { game, openingBook, useGameStore } from "../../gameStore.ts";
import { uciToMove } from "../../../game/fenAndUCI/uciHelpers.ts";
import type { EngineCommand } from "../workers/engineWorker.ts";
import { WHITE } from "../../../game/chessConstants.ts";

/**
 * Custom hook that handles the engine moving after the player does.
 */
export default function useMoveTrigger(
  postToEngine: (msg: EngineCommand) => void,
) {
  const fen = useGameStore((state) => state.fen);
  const userSide = useGameStore((state) => state.userSide);
  const playMove = useGameStore((state) => state.playMove);
  const whiteTimeMs = useGameStore((state) => state.whiteTimeMs);
  const blackTimeMs = useGameStore((state) => state.blackTimeMs);
  const clockSettings = useGameStore((state) => state.clockSettings);
  const isGameOver = useGameStore((state) => state.isGameOver);

  /**
   * Plays the engine move after the player makes its turn.
   */
  useEffect(() => {
    if (game.sideToMove !== userSide && !isGameOver && userSide !== null) {
      const position = game.getPositionCpy();

      const moveHistory = game.moveHistory;

      // potentially still in opening book
      if (moveHistory.length < 8) {
        const bookMove = openingBook.getBookMove(moveHistory);
        if (bookMove) {
          const move = uciToMove(bookMove, game.getPositionCpy());
          const time = userSide === WHITE ? blackTimeMs : whiteTimeMs;

          // wait so UI has time to update and engine doesnt just play instantly
          setTimeout(() => {
            playMove(move, time - 500 + clockSettings.increment); // play book move
          }, 500);
          return;
        }
      }

      postToEngine({
        type: "search",
        pos: position,
      });
    }
  }, [fen, userSide, postToEngine, playMove]);
}
