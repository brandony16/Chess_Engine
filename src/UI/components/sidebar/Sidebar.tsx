import { useGameStore } from "../../gameStore.ts";
import HistoryMenu from "./history/HistoryMenu.jsx";
import MoveArrows from "./playing/MoveArrows.tsx";
import MoveList from "./playing/MoveList.tsx";
import Resign from "./playing/Resign.tsx";
import NewGameMenu from "./setup/NewGameMenu.tsx";
import SidebarActions from "./SidebarActions.jsx";
import "./playing/Playing.css";

import React from "react";
import BattleMenu from "./battle/BattleMenu.tsx";

const Sidebar = () => {
  const mode = useGameStore((s) => s.sidebarMode);
  const isGameOver = useGameStore((s) => s.isGameOver);

  return (
    <aside className="sidebar">
      {mode === "setup" && <NewGameMenu />}
      {mode === "playing" && (
        <>
          <MoveList />
          <MoveArrows />
          {!isGameOver && <Resign />}
        </>
      )}
      {mode === "history" && <HistoryMenu />}
      {mode === "battle" && <BattleMenu />}
      {(mode !== "playing" || isGameOver) && <SidebarActions />}
    </aside>
  );
};

const MemoizedSidebar = React.memo(Sidebar);
MemoizedSidebar.displayName = "Sidebar";

export default MemoizedSidebar;
