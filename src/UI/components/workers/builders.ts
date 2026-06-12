import { Position } from "../../../game/Position.ts";

export const rebuildPosition = (pos: Position) => {
  const newPos = new Position();

  newPos.bbsLo = pos.bbsLo;
  newPos.bbsHi = pos.bbsHi;
  newPos.kingSq = pos.kingSq;

  newPos.endState = pos.endState;
  newPos.result = pos.result;

  newPos.occupiedLo = pos.occupiedLo;
  newPos.occupiedHi = pos.occupiedHi;
  newPos.playerOccLo = pos.playerOccLo;
  newPos.playerOccHi = pos.playerOccHi;

  newPos.pieceAt = pos.pieceAt;

  newPos.sideToMove = pos.sideToMove;
  newPos.castlingRights = pos.castlingRights;
  newPos.enPassantSquare = pos.enPassantSquare;
  newPos.fullmoveNumber = pos.fullmoveNumber;
  newPos.halfmoveClock = pos.halfmoveClock;
  newPos.moveBuffer = pos.moveBuffer;
  newPos.moveStack = pos.moveStack;
  newPos.undoCastling = pos.undoCastling;
  newPos.undoEp = pos.undoEp;
  newPos.undoHalfmove = pos.undoHalfmove;
  newPos.ply = pos.ply;
  newPos.searchPly = pos.searchPly;

  newPos.zobristLo = pos.zobristLo;
  newPos.zobristHi = pos.zobristHi;
  newPos.zobristHistoryLo = pos.zobristHistoryLo;
  newPos.zobristHistoryHi = pos.zobristHistoryHi;

  return newPos;
};
