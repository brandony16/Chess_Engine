import { clearTT } from "../bitboardUtils/TranspositionTable/transpositionTable";
import { BMV3 } from "./BMV3/BondMonkeyV3";

onmessage = async (e) => {
  const {
    bitboards,
    player,
    castlingRights,
    enPassantSquare,
    prevPositions,
    pastMoves,
    maxDepth,
    timeLimit,
  } = e.data;

  clearTT();
  
  const move = await BMV3(
    bitboards,
    player,
    castlingRights,
    enPassantSquare,
    prevPositions,
    pastMoves,
    maxDepth,
    timeLimit
  );

  postMessage({ move });
};
