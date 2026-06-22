import { useGameStore } from "../../gameStore.ts";
import HistoryMenu from "./history/HistoryMenu.jsx";
import MoveArrows from "./playing/MoveArrows.tsx";
import MoveList from "./playing/MoveList.tsx";
import Resign from "./playing/Resign.tsx";
import NewGameMenu from "./setup/NewGameMenu.tsx";
import SidebarActions from "./SidebarActions.jsx";
import "./playing/Playing.css";

import React from "react";

const Sidebar = () => {
  const mode = useGameStore((s) => s.sidebarMode);

  return (
    <aside className="sidebar">
      {mode === "setup" && <NewGameMenu />}
      {mode === "playing" && (
        <>
          <MoveList />
          <MoveArrows />
          <Resign />
        </>
      )}
      {mode === "history" && <HistoryMenu />}
      <SidebarActions />
    </aside>
  );
};

const MemoizedSidebar = React.memo(Sidebar);
MemoizedSidebar.displayName = "Sidebar";

export default MemoizedSidebar;
