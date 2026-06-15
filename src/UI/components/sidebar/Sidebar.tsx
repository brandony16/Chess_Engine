import MoveArrows from "./MoveArrows.tsx";
import MoveList from "./MoveList.jsx";
import SidebarActions from "./SidebarActions.jsx";

import React from "react";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <MoveList />
      <MoveArrows />
      <SidebarActions />
    </aside>
  );
};

const MemoizedSidebar = React.memo(Sidebar);
MemoizedSidebar.displayName = "Sidebar";

export default MemoizedSidebar;
