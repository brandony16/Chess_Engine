import MoveArrows from "./MoveArrows.tsx";
import MoveList from "./MoveList.jsx";
import SidebarActions from "./SidebarActions.jsx";

import { useGameStore } from "../../gameStore.ts";
import React, { useMemo } from "react";
import {
  CHECKMATE,
  DRAW,
  FIFTY_MOVE_RULE,
  IN_PROGRESS,
  INSUFFICIENT_MATERIAL,
  REPETITION,
  STALEMATE,
  WHITE,
} from "../../../game/chessConstants.ts";

const Sidebar = () => {
  // States
  const game = useGameStore((state) => state.game);

  const turnText = useMemo(
    () => (game.sideToMove === WHITE ? "White's Turn" : "Black's Turn"),
    [game],
  );

  const endText = useMemo((): string => {
    const res = game.result();

    if (res.winner === IN_PROGRESS) {
      throw new Error(`End text called when game is not over`);
    }

    if (res.winner === DRAW) {
      switch (res.method) {
        case REPETITION:
          return "Draw by Repetition";
        case STALEMATE:
          return "Draw by Stalemate";
        case INSUFFICIENT_MATERIAL:
          return "Draw by Insufficient Material";
        case FIFTY_MOVE_RULE:
          return "Draw by 50 Move Rule";
        default:
          throw new Error(
            `Method does not match winner. M: ${res.method} W: ${res.winner}`,
          );
      }
    }

    const winnerSide = res.winner === WHITE ? "White" : "Black";

    switch (res.method) {
      case CHECKMATE:
        return `${winnerSide} Wins by Checkmate`;
      default:
        throw new Error(
          `Method does not match winner. M: ${res.method} W: ${res.winner}`,
        );
    }
  }, []);

  return (
    <aside className="sidebar">
      <div className="turnText">{game.isOver() ? endText : turnText}</div>
      <MoveList />
      <MoveArrows />
      <SidebarActions />
    </aside>
  );
};

const MemoizedSidebar = React.memo(Sidebar);
MemoizedSidebar.displayName = "Sidebar";

export default MemoizedSidebar;
