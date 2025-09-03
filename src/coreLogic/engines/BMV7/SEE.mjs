import { getAllPieces } from "../../pieceGetters.mjs";
import { attacksTo } from "../../PieceMasks/attacksTo.mjs";
import { weights } from "./evaluation/evaluation.mjs";

export const SEE = (bitboards, target, toSq) => {
  const occupancy = getAllPieces(bitboards);
  const attadef = attacksTo(bitboards, occupancy, toSq); // Attackers and defenders

  const gain = [];
  let d = 0;

  gain[d] = weights[target];

}