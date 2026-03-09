import wK from "../../../../assets/pieces/wK.svg";
import bK from "../../../../assets/pieces/bK.svg";
import random from "../../../../assets/random.svg";
import React from "react";
import { BLACK, WHITE, type Player } from "../../../../game/chessConstants.ts";

type SideSelectorProps = {
  initialValue: Player | null;
  onChange: (newVal: Player | null) => void;
};

const SideSelector = ({ initialValue, onChange }: SideSelectorProps) => (
  <fieldset className="side-selector">
    <legend className="sideLegend">Choose your side</legend>

    <label className={`option ${initialValue === WHITE ? "selected" : ""}`}>
      <input
        type="radio"
        name="side"
        value="W"
        checked={initialValue === WHITE}
        onChange={() => onChange(WHITE)}
      />
      <img src={wK} alt="white" className="newGameIcon" />
    </label>

    <label className={`option ${initialValue === null ? "selected" : ""}`}>
      <input
        type="radio"
        name="side"
        value="R"
        checked={initialValue === null}
        onChange={() => onChange(null)}
      />
      <img src={random} alt="random" className="newGameIcon" />
    </label>

    <label className={`option ${initialValue === BLACK ? "selected" : ""}`}>
      <input
        type="radio"
        name="side"
        value="B"
        checked={initialValue === BLACK}
        onChange={() => onChange(BLACK)}
      />
      <img src={bK} alt="black" className="newGameIcon" />
    </label>
  </fieldset>
);

const MemoizedSideSelector = React.memo(SideSelector);
MemoizedSideSelector.displayName = "SideSelector";

export default MemoizedSideSelector;
