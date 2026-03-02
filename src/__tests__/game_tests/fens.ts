import { isPieceChar, PIECE_INDEXES } from "../../game/chessConstants.ts";

// Fens mostly got from chess programming wiki. Created some specific ones like the ep positions
export const START_POS =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const KIWIPETE_POS =
  "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
export const PINNED_POS = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1";
export const KNIGHT_FORK_POS =
  "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8";
export const EN_PASSANT_WHITE = "k7/8/8/3pP3/8/8/8/4K3 w - d6 0 1";
export const EN_PASSANT_BLACK =
  "rnbqkbnr/pppp1ppp/8/8/3Pp3/1PN5/P1P1PPPP/R1BQKBNR b KQkq d3 0 1";
export const ALT_PERFT =
  "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10";
export const OPEN_MIDGAME =
  "2kr3r/pbp1qppp/1pn1pn2/8/1b2PP2/1PN2N2/PBP1Q1PP/2KR1B1R w - - 0 1";
export const ACTIVE_KING_ENDGAME = "8/8/p6p/1ppK2p1/2P2kP1/PP6/8/8 w - - 0 1";
export const PROMOTION_ENDGAME = "3n4/2P5/1K6/8/8/5k2/6p1/5N2 w - - 0 1";

export const validateBitboards = (
  bitboards: BigUint64Array,
  fen: string,
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

    if (!isPieceChar(ch)) {
      throw new Error(`Invalid piece character ${ch}`);
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
