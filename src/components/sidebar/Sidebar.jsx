import MoveArrows from "./MoveArrows";
import MoveList from "./MoveList";
import SidebarActions from "./SidebarActions";

import { useGameStore } from "../gameStore.mjs";
import { WHITE } from "../../coreLogic/constants.mjs";
import React, { useMemo } from "react";

const Sidebar = () => {
  // States
  const currPlayer = useGameStore((state) => state.currPlayer);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const result = useGameStore((state) => state.result);

  const turnText = useMemo(
    () => (currPlayer === WHITE ? "White's Turn" : "Black's Turn"),
    [currPlayer]
  );

  return (
    <aside className="sidebar">
      <div className="turnText">{isGameOver ? result : turnText}</div>
      <MoveList />
      <MoveArrows />
      <SidebarActions />
    </aside>
  );
};

const MemoizedSidebar = React.memo(Sidebar);
MemoizedSidebar.displayName = "Sidebar";

export default MemoizedSidebar;
