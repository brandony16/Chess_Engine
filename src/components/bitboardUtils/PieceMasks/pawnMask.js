function computeWhitePawnMask(square) {
  const pawn = 1n << BigInt(square);
  let attacks = 0n;

  if (square % 8 !== 0) {
    // not on file A
    attacks |= pawn << 7n;
  }
  if (square % 8 !== 7) {
    // not on file H
    attacks |= pawn << 9n;
  }
  return attacks;
}

// Compute black pawn attack mask for a given square.
function computeBlackPawnMask(square) {
  const pawn = 1n << BigInt(square);
  let attacks = 0n;

  if (square % 8 !== 0) {
    // not on file A
    attacks |= pawn >> 9n;
  }
  if (square % 8 !== 7) {
    // not on file H
    attacks |= pawn >> 7n;
  }
  return attacks;
}

const initializeWPawnAttackMasks = () => {
  const whitePawnMasks = new Array(64);
  for (let sq = 0; sq < 64; sq++) {
    whitePawnMasks[sq] = computeWhitePawnMask(sq);
  }

  return whitePawnMasks;
};

export const whitePawnMasks = initializeWPawnAttackMasks();

const initializeBPawnAttackMasks = () => {
  const blackPawnMasks = new Array(64);
  for (let sq = 0; sq < 64; sq++) {
    blackPawnMasks[sq] = computeBlackPawnMask(sq);
  }

  return blackPawnMasks;
};

export const blackPawnMasks = initializeBPawnAttackMasks();
