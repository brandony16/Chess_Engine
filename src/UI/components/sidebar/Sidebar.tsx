import { useGameStore } from "../../gameStore.ts";
import HistoryMenu from "./history/HistoryMenu.jsx";
import NewGameMenu from "./setup/NewGameMenu.tsx";
import SidebarActions from "./SidebarActions.jsx";
import "./playing/Playing.css";

import React from "react";
import BattleMenu from "./battle/BattleMenu.tsx";
import Playing from "./playing/Playing.tsx";

const Sidebar = () => {
  const mode = useGameStore((s) => s.sidebarMode);
  const isGameOver = useGameStore((s) => s.isGameOver);

  return (
    <aside className="sidebar">
      {mode === "setup" && <NewGameMenu />}
      {mode === "playing" && <Playing />}
      {mode === "history" && <HistoryMenu />}
      {mode === "battle" && <BattleMenu />}
      {(mode !== "playing" || isGameOver) && <SidebarActions />}
    </aside>
  );
};

const MemoizedSidebar = React.memo(Sidebar);
MemoizedSidebar.displayName = "Sidebar";

export default MemoizedSidebar;
