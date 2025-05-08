import { clearTT } from "../bitboardUtils/TranspositionTable/transpositionTable";
import { BMV3 } from "./BMV3/BondMonkeyV3";

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
  
  const move = BMV3(
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
