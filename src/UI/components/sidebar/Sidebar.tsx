import MoveArrows from "./MoveArrows.tsx";
import MoveList from "./MoveList.jsx";
import SidebarActions from "./SidebarActions.jsx";

import { game, useGameStore } from "../../gameStore.ts";
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
  const fen = useGameStore((s) => s.fen);

  const turnText = useMemo(
    () => (game.sideToMove === WHITE ? "White's Turn" : "Black's Turn"),
    [fen], // use fen updating as a signal
  );

  const res = game.result();
  let endText = "";

  if (res.winner !== IN_PROGRESS) {
    if (res.winner === DRAW) {
      switch (res.method) {
        case REPETITION:
          endText = "Draw by Repetition";
          break;
        case STALEMATE:
          endText = "Draw by Stalemate";
          break;
        case INSUFFICIENT_MATERIAL:
          endText = "Draw by Insufficient Material";
          break;
        case FIFTY_MOVE_RULE:
          endText = "Draw by 50 Move Rule";
          break;
        default:
          throw new Error(`Method does not match...`);
      }
    } else {
      const winnerSide = res.winner === WHITE ? "White" : "Black";
      switch (res.method) {
        case CHECKMATE:
          endText = `${winnerSide} Wins by Checkmate`;
          break;
        default:
          throw new Error(`Method does not match...`);
      }
    }
  }

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
