import { PIECE_INDEXES } from "../../game/chessConstants.ts";

export const START_POS =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const KIWIPETE_POS =
  "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
export const PINNED_POS = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1";
export const KNIGHT_FORK_POS =
  "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8";

export const validateBitboards = (
  bitboards: BigUint64Array,
  fen: String,
): boolean => {
  const bbString = fen.split(" ")[0];

  const wholeStr = bbString.split("/").reverse().join("");
  let sq = 0;
  for (let i = 0; i < wholeStr.length; i++) {
    const ch = wholeStr.charAt(i);
    if (/\d/.test(ch)) {
      sq += parseInt(ch);
      continue;
    }

    const piece = PIECE_INDEXES[ch];
    const mask = 1n << BigInt(sq);
    if ((bitboards[piece] & mask) === 0n) {
      console.error(`Piece ${piece} at square ${sq} is wrong`);
      return false;
    }
    sq++;
  }

  return true;
};
