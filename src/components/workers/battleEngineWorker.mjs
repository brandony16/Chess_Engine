import { useGameStore } from "../gameStore.mjs";
import { makeEngineMove, playRandomOpening } from "./engineFuncs.mjs";

self.onmessage = async (e) => {
  const { engine1, eng1Depth, engine2, eng2Depth, games } = e.data;
  useGameStore.setState({ userSide: null });
  const { breakBattleLoop, resetGame } = useGameStore.getState();

  let wins = 0;
  let draws = 0;
  let losses = 0;

  let gameNum = 1;
  let whiteSide = engine1;
  let blackSide = engine2;
  let whiteDepth = eng1Depth;
  let blackDepth = eng2Depth;
  while (gameNum <= games && !breakBattleLoop) {
    // Set up game and play opening

    resetGame({ isEngineGame: true });
    await playRandomOpening();

    // Sim games
    while (!useGameStore.getState().isGameOver) {
      // Cap at 100ms search time so times don't get insane
      makeEngineMove(whiteSide, whiteDepth, 100);
      if (useGameStore.getState().isGameOver) break;

      makeEngineMove(blackSide, blackDepth, 100);
    }

    const result = useGameStore.getState().result;
    const engineNum = gameNum % 2 === 1 ? 1 : 2;

    const resultChar = result.charAt(0);
    const engineSide = engineNum === 1 ? "W" : "B";
    if (resultChar === engineSide) {
      wins++;
    } else if (resultChar === "D") {
      draws++;
    } else {
      losses++;
    }

    resetGame({ isEngineGame: true });

    // Flip sides
    [whiteSide, blackSide] = [blackSide, whiteSide];
    [whiteDepth, blackDepth] = [blackDepth, whiteDepth];

    // Send Progress Update
    const gameHistory = useGameStore.getState().gameHistory;
    const gameHistoryEntry = gameHistory[gameHistory.length - 1];
    const winRate = ((wins / gameNum) * 100).toFixed(1);
    self.postMessage({
      type: "progress",
      gameNum,
      wins,
      draws,
      losses,
      winRate,
      gameHistoryEntry,
    });

    gameNum++;
  }

  // Final stats
  const winRate = ((wins / games) * 100).toFixed(1);
  self.postMessage({ type: "done", gameNum, wins, draws, losses, winRate });
};
