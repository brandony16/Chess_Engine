import { clearTT } from "../bitboardUtils/TranspositionTable/transpositionTable";
import { BMV5 } from "./BMV5/BondMonkeyV5";

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

  const move = BMV5(
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
