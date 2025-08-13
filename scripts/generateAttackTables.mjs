import fs from "fs";

import {
  getBishopAttacksForSquare,
  getRookAttacksForSquare,
} from "../src/Core Logic/moveGeneration/slidingPieceAttacks.mjs";
import {
  bishopMasks,
  rookMasks,
} from "../src/Core Logic/moveGeneration/magicBitboards/generateMasks.mjs";
import {
  bishopMagics,
  bishopShifts,
  rookMagics,
  rookShifts,
} from "../src/Core Logic/moveGeneration/magicBitboards/magicNumbers.mjs";
import { generateBlockerSubsets } from "../src/Core Logic/bbUtils.mjs";

/*
  This script generates the magic bitboard attack tables for rooks and bishops and saves them to attackTables.mjs.
*/

// Attack tables: 64 squares × (1<<maxBits) entries
const rookAttackTable = Array(64);
const bishopAttackTable = Array(64);

// For every square, fill in the rook and bishop tables at that square.
for (let sq = 0; sq < 64; sq++) {
  const rMask = rookMasks[sq];
  const bMask = bishopMasks[sq];

  const rSize = 1 << (64 - rookShifts[sq]);
  const bSize = 1 << (64 - bishopShifts[sq]);

  rookAttackTable[sq] = new Array(rSize).fill(0n);
  bishopAttackTable[sq] = new Array(bSize).fill(0n);

  for (const blockers of generateBlockerSubsets(rMask)) {
    // step 1: mask out relevant bits
    const occMasked = blockers & rMask;

    // step 2: multiply by magic
    const product = BigInt.asUintN(64, occMasked * BigInt(rookMagics[sq]));

    // step 3: shift down
    const idxBig = product >> BigInt(rookShifts[sq]);
    const idx = Number(idxBig);

    // Compute real rook attacks by scanning rays until blocker
    const attacks = getRookAttacksForSquare(blockers, sq);

    rookAttackTable[sq][idx] = attacks;
  }

  // Fill bishop table

  for (const blockers of generateBlockerSubsets(bMask)) {
    const idx = Number(
      BigInt.asUintN(64, (blockers & bMask) * BigInt(bishopMagics[sq])) >>
        BigInt(bishopShifts[sq])
    );
    const attacks = getBishopAttacksForSquare(blockers, sq);
    bishopAttackTable[sq][idx] = attacks;
  }
}

function bigintToLiteral(b) {
  return b.toString() + "n";
}

function serializeTable(table) {
  return (
    "[" +
    table
      .map((row) => {
        if (row === null) return "null";
        return "[" + row.map((val) => bigintToLiteral(val)).join(",") + "]";
      })
      .join(",") +
    "]"
  );
}

// Save outputs to attackTables.mjs
const output = `
export const rookAttackTable = ${serializeTable(rookAttackTable)};
export const bishopAttackTable = ${serializeTable(bishopAttackTable)};
`;

fs.writeFileSync(
  new URL("../src/Core Logic/attackTables.mjs", import.meta.url),
  output
);

console.log("Attack tables generated successfully.");
