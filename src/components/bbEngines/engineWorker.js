import { clearTT } from "../bitboardUtils/TranspositionTable/transpositionTable";
import { BMV2 } from "./BondMonkeyV2";

onmessage = (e) => {
  const {
    bitboards,
    player,
    castlingRights,
    enPassantSquare,
    prevPositions,
    maxDepth,
    timeLimit,
  } = e.data;

  clearTT();
  const move = BMV2(
    bitboards,
    player,
    castlingRights,
    enPassantSquare,
    prevPositions,
    maxDepth,
    timeLimit
  );

  postMessage({ move });
};
