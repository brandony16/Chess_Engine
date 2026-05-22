import type { EngineName } from "../../engines/bondmonkeyVersions/engineList.ts";
import { DRAW, WHITE_WIN, type Result } from "../chessConstants.ts";
import type { Move } from "../moveMaking/move.ts";
import { moveToUCI } from "./uciHelpers.ts";

type PGNTags = {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result: "1-0" | "0-1" | "1/2-1/2" | "*";
};

export const buildPGN = (moves: string[], tags: PGNTags): string => {
  const tagLines = Object.entries(tags)
    .map(([k, v]) => `[${k} "${v}"]`)
    .join("\n");

  const moveText: string[] = [];

  for (let i = 0; i < moves.length; i++) {
    const san = moves[i];

    if (i % 2 === 0) {
      const moveNumber = Math.floor(i / 2) + 1;
      moveText.push(`${moveNumber}. ${san}`);
    } else {
      moveText.push(san);
    }
  }

  return `${tagLines}\n\n${moveText.join(" ")} ${tags.Result}`;
};

export const buildPGNFromEngineGame = (
  openingMoves: string[],
  moves: Move[],
  metadata: { white: EngineName; black: EngineName; result: Result },
): string => {
  const uciMoveList = [...openingMoves];

  for (const move of moves) {
    uciMoveList.push(moveToUCI(move));
  }

  const result = metadata.result;
  const resultStr =
    result === DRAW ? "1/2-1/2" : result === WHITE_WIN ? "1-0" : "0-1";

  return buildPGN(uciMoveList, {
    White: metadata.white,
    Black: metadata.black,
    Result: resultStr,
  });
};
