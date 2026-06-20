import { useGameStore } from "../../gameStore.ts";
import MoveArrows from "./MoveArrows.tsx";
import MoveList from "./MoveList.jsx";
import NewGameMenu from "./setup/NewGameMenu.tsx";
import SidebarActions from "./SidebarActions.jsx";

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
          <SidebarActions />
        </>
      )}
    </aside>
  );
};

const MemoizedSidebar = React.memo(Sidebar);
MemoizedSidebar.displayName = "Sidebar";

export default MemoizedSidebar;
