import MoveList from "./MoveList.tsx";
import MoveArrows from "./MoveArrows.tsx";
import { useGameStore } from "../../../gameStore.ts";
import Resign from "./Resign.tsx";
import flipBoardImg from "../../../../assets/flip.svg";

export default function Playing() {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const flipBoard = useGameStore((s) => s.flipBoard);

  return (
    <div className="playingMenu">
      <MoveList />
      <MoveArrows />
      <div className="playingBtnWrap">
        {!isGameOver && <Resign />}
        <button
          title="Flip board orientation"
          className="flipBoard playingIconBtn"
          onClick={flipBoard}
        >
          <img className="playingIcon" src={flipBoardImg} alt="flip board" />
        </button>
      </div>
    </div>
  );
}
