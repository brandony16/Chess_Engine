export const ENGINE_STATS = {
  // Transposition Table Stats
  ttHits: 0,
  ttExactHits: 0,
  ttCutoffHits: 0,
  ttMoveUsed: 0,

  // Killer Moves
  killerHits: 0,
  killerUpdates: 0,

  // History
  historyHits: 0,
  maxHistoryVal: 0,
  historyUpdates: 0,

  // Misc
  nodes: 0,
  betaCuts: 0,

  // ----- Quiesce Stats ------
  quiesceBetaCuts: 0,
  quiesceNodes: 0,

  // TT
  quiesceTtHits: 0,
  quiesceTtExactHits: 0,
  quiesceTtCutoffHits: 0,
  quiesceTtMoveUsed: 0,
};
