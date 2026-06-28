import { moreThanOne } from "../../game/bb.ts";
import {
  BLACK_KING,
  BLACK_PAWN,
  NO_PIECE,
  PIECE_N,
  WHITE,
  WHITE_KING,
  WHITE_PAWN,
} from "../../game/chessConstants.ts";
import {
  moveCaptured,
  movePiece,
  movePromotion,
  moveTo,
  type Move,
} from "../../game/moveMaking/move.ts";
import { MAX_MOVES, type Position } from "../../game/Position.ts";
import {
  ABORT_SCORE,
  INFINITY,
  MAX_SEARCH_PLY,
  type Engine,
} from "../Engine.ts";
import EvaluationV1 from "../evaluation/evalModules/v5.ts";
import {
  MATE_SCORE,
  MATE_THRESHOLD,
  type EvaluationModule,
} from "../evaluation/Evaluation.ts";
import {
  scoreMoveForOrderingBasic,
  scoreMoveWithHeuristics,
} from "../moveScoring/basicScoring.ts";
import type { SearchContext } from "../searchContext.ts";
import { see } from "../see.ts";
import { TranspositionTable } from "../transpositionTable/table.ts";
import {
  LOOKUP_FAILED,
  TT_EXACT,
  TT_LOWERBOUND,
  TT_UPPERBOUND,
} from "../transpositionTable/ttTypes.ts";

/**
 * Evolution of minimaxV12 that adds static exchange evaluation
 */
export class MinimaxV13 implements Engine {
  private evaluation: EvaluationModule;

  depth: number;

  depthReached: number;

  private scoreBuffer = new Int32Array(MAX_SEARCH_PLY * MAX_MOVES);
  tt: TranspositionTable;

  // [ply][slot]. store 2 killer moves per ply
  private killerMoves: Uint32Array[];

  // indexed by [piece][square]
  private historyTable: Uint32Array[];

  private lmrTable: Uint32Array[];

  nmpCuttoffs: number = 0;
  pvsTries: number = 0;
  pvsResearches: number = 0;
  lmrAttempts: number = 0;
  lmrResearches: number = 0;
  seeCutoffs: number = 0;

  constructor(depth: number) {
    this.depth = depth;
    this.depthReached = 0;
    this.evaluation = new EvaluationV1();

    this.tt = new TranspositionTable();

    this.killerMoves = Array.from(
      { length: MAX_SEARCH_PLY },
      () => new Uint32Array(2),
    );
    this.historyTable = Array.from(
      { length: PIECE_N },
      () => new Uint32Array(64),
    );

    this.lmrTable = Array.from({ length: 64 }, () => new Uint32Array(64));
    for (let d = 1; d < 64; d++) {
      for (let m = 1; m < 64; m++) {
        // Basic logarithmic scaling
        let reduction = 1 + (Math.log(d) * Math.log(m)) / 2.25;
        this.lmrTable[d][m] = Math.floor(reduction);
      }
    }
  }

  newGame(): void {
    this.tt.clear();

    // clear history between games
    for (let i = 0; i < this.historyTable.length; i++) {
      this.historyTable[i].fill(0);
    }
  }

  search(
    pos: Position,
    evaluate: EvaluationModule,
    ctx: SearchContext,
    log: boolean = false,
  ): Move {
    ctx.startSearch(pos.ply);

    pos.searchPly = 0;
    this.nmpCuttoffs = 0;
    this.evaluation = evaluate;
    this.evaluation.initializeEval(pos);

    // clear killer moves before each search
    for (let i = 0; i < this.killerMoves.length; i++) {
      this.killerMoves[i].fill(0);
    }

    // age table to prevent exploding scores and not have the engine hold on to old useless ideas
    for (let p = 0; p < this.historyTable.length; p++) {
      for (let s = 0; s < 64; s++) {
        this.historyTable[p][s] >>= 1; // divide by 2
      }
    }

    let bestMove = 0;
    this.depthReached = 0;
    for (let depth = 1; depth <= this.depth; depth++) {
      this.depthReached++;
      const result = this.#searchRoot(pos, depth, ctx, bestMove);

      if (result) {
        // extend time when principal move changes to allow for deeper search in this pos
        if (depth > 1 && result !== bestMove) {
          ctx.extendTime();
        }
        bestMove = result;
      }
      if (ctx.aborted) {
        break;
      }
      if (ctx.shouldStopDeepening()) {
        break;
      }
    }
    if (log) {
      console.log(
        `Depth Searched: ${this.depthReached}\nNodes searched: ${ctx.nodesSearched}\n` +
          `Quiesce Nodes: ${ctx.quiescenceNodes}\n` +
          `Transpositions: ${this.tt.hits}\nNMP Cutoffs: ${this.nmpCuttoffs}\n` +
          `PVS Tries: ${this.pvsTries}\nPVS Researches: ${this.pvsResearches}\n` +
          `SEE Cutoffs: ${this.seeCutoffs}`,
      );
    }

    ctx.endSearch();

    return bestMove;
  }

  #searchRoot(
    pos: Position,
    depth: number,
    ctx: SearchContext,
    prevBest: Move,
  ): Move {
    if (ctx.tick()) {
      return prevBest;
    }

    const start = pos.searchPly * MAX_MOVES;
    const moveNum = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    // Get TT move for ordering — don't use score at root
    const ttIdx = this.tt.probe(pos.zobristLo, pos.zobristHi);
    const ttMove = ttIdx !== -1 ? this.tt.getMove(ttIdx) : 0;

    let bestMove = 0;
    let bestScore = -INFINITY;

    const moveBuf = pos.moveBuffer;
    const scoreBuf = this.scoreBuffer;
    const firstToSearch = prevBest !== 0 ? prevBest : ttMove; // search previous best first, then ttMove
    for (let i = 0; i < moveNum; i++) {
      scoreBuf[start + i] = scoreMoveWithHeuristics(
        moveBuf[start + i],
        pos.searchPly,
        this.killerMoves,
        this.historyTable,
        firstToSearch,
      );
    }

    let legalCount = 0;
    for (let i = 0; i < moveNum; i++) {
      this.#pickBestMove(moveBuf, start, i, moveNum);

      const move = moveBuf[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      this.evaluation.makeMoveUpdateEval(move, pos);
      pos.makeMove(move);

      // Principal Variation Search
      let score: number = 0;

      if (legalCount === 1) {
        // Search first move with full window
        score = -this.#negamax(pos, depth - 1, -INFINITY, -bestScore, ctx);
      } else {
        this.pvsTries++;

        // For other moves, assume its worse than alpha, so test that with a zero window search
        // This tight window causes massive pruning, and if the move is worse (score < alpha) we can just move on
        score = -this.#negamax(pos, depth - 1, -bestScore - 1, -bestScore, ctx);

        // If the zero window search proved us wrong (score > alpha) and it wasnt a beta cutoff,
        // we must research with the full window to get the exact score
        if (score > bestScore) {
          this.pvsResearches++;
          score = -this.#negamax(pos, depth - 1, -INFINITY, -score, ctx);
        }
      }

      pos.unmakeMove();
      this.evaluation.restoreEval(pos.searchPly);

      if (ctx.aborted) return bestMove;

      if (score > bestScore) {
        bestMove = move;
        bestScore = score;
      }
    }

    // Store root result in TT
    this.tt.store(
      pos.zobristLo,
      pos.zobristHi,
      depth,
      bestScore,
      TT_EXACT,
      bestMove,
      pos.searchPly,
    );

    return bestMove;
  }

  #negamax(
    pos: Position,
    depth: number,
    alpha: number,
    beta: number,
    ctx: SearchContext,
    isNullSearch: boolean = false,
  ): number {
    if (ctx.tick()) {
      return ABORT_SCORE;
    }

    // Draw check
    if (pos.halfmoveClock >= 100) {
      return 0;
    }
    const currHi = pos.zobristHi,
      currLo = pos.zobristLo;
    const currPly = pos.ply;
    const minPly = currPly - pos.halfmoveClock;
    for (let i = currPly - 2; i >= minPly; i -= 2) {
      const lo = pos.zobristHistoryLo[i];
      const hi = pos.zobristHistoryHi[i];

      // dont repeat positions or its a draw
      // without this, the engine will repeat in a winning position because it doesnt know repeating is a draw
      if (lo === currLo && hi === currHi) {
        return 0;
      }
    }

    const ttEval = this.tt.lookupEvaluation(
      pos.zobristLo,
      pos.zobristHi,
      depth,
      pos.searchPly,
      alpha,
      beta,
    );
    if (ttEval !== LOOKUP_FAILED) {
      this.tt.cutoffs++;
      return ttEval;
    }

    if (depth === 0) {
      const score = this.#quiescence(pos, alpha, beta, ctx);

      const flag =
        score >= beta
          ? TT_LOWERBOUND
          : score > alpha
            ? TT_EXACT
            : TT_UPPERBOUND;

      this.tt.store(
        pos.zobristLo,
        pos.zobristHi,
        depth,
        score,
        flag,
        0,
        pos.searchPly,
      );

      return score;
    }

    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    // ---- NULL MOVE PRUNING -----
    const inCheck = checkers[0] !== 0 || checkers[1] !== 0;

    // Only do NMP if:
    // 1. We are not already doing a NMP search
    // 2. We are not in check (doing nothing leads to king capture)
    // 3. Depth is high enough to benefit from NMP
    // 4. We have non-pawn material (guards against zugzwang in endgames not being calculated correctly)
    // 5. This is not a root search (with beta === infinity)
    if (!isNullSearch && !inCheck && depth >= 3 && beta !== INFINITY) {
      if (this.#hasNonPawnMaterial(pos)) {
        // reduction factor
        const R = 2;

        this.evaluation.makeNullMove(pos.searchPly);
        pos.makeNullMove();

        // we only care if score >= beta, so pass -beta and -beta + 1 as our bounds for speed
        const nullScore = -this.#negamax(
          pos,
          depth - 1 - R,
          -beta,
          -beta + 1,
          ctx,
          true,
        );

        pos.unmakeNullMove();
        this.evaluation.restoreEval(pos.searchPly);

        if (ctx.aborted) return ABORT_SCORE;

        if (nullScore >= beta) {
          // dont return false mates as it would only be
          // mate if we were allowed to make 2 straight moves
          if (nullScore > MATE_THRESHOLD) {
            return beta;
          }
          return nullScore;
        }
      }
    }

    let legalCount = 0;

    let bestMove = 0;
    let bestScore = -INFINITY;
    let ttFlag = TT_UPPERBOUND;

    // if a tt move exists, its probably good has a high chance of causing a cutoff
    // therefore, search this move before generating moves to save time
    const ttMove = this.tt.lookupMove(pos.zobristLo, pos.zobristHi);
    if (ttMove !== 0) {
      if (pos.isLegal(ttMove, checkers, pinned, doubleCheck)) {
        legalCount++;

        this.evaluation.makeMoveUpdateEval(ttMove, pos);
        pos.makeMove(ttMove);

        const score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);

        pos.unmakeMove();
        this.evaluation.restoreEval(pos.searchPly);

        if (ctx.aborted) return ABORT_SCORE;

        if (score >= beta) {
          // Store this move in tt table as it caused a cutoff
          this.tt.store(
            pos.zobristLo,
            pos.zobristHi,
            depth,
            score,
            TT_LOWERBOUND,
            ttMove,
            pos.searchPly,
          );

          // if a quiet move, update killer moves and history heuristic
          this.#updateOrderingHeuristics(ttMove, pos.searchPly, depth);

          return score;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMove = ttMove;

          if (score > alpha) {
            alpha = score;
            // move better than previous alpha means score will be exact
            ttFlag = TT_EXACT;
          }
        }
      }
    }

    const start = pos.searchPly * MAX_MOVES;
    const moves = pos.generatePseudoLegalMoves();

    const moveBuf = pos.moveBuffer;
    const scoreBuf = this.scoreBuffer;
    for (let i = 0; i < moves; i++) {
      scoreBuf[start + i] = scoreMoveWithHeuristics(
        moveBuf[start + i],
        pos.searchPly,
        this.killerMoves,
        this.historyTable,
      );
    }

    for (let i = 0; i < moves; i++) {
      // Move best (highest scoring) move to the front of moveBuffer
      this.#pickBestMove(moveBuf, start, i, moves);

      const move = moveBuf[start + i];

      // already searched the tt move
      if (move === ttMove) continue;

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      this.evaluation.makeMoveUpdateEval(move, pos);
      pos.makeMove(move);

      // Principal Variation Search
      let score: number = 0;

      if (legalCount === 1) {
        // Search first move with full window
        score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);
      } else {
        // Flags to control the search cascade
        let needsFullWindow = false;
        let needsFullDepthZeroWindow = true;

        const isQuiet =
          moveCaptured(move) === NO_PIECE && movePromotion(move) === NO_PIECE;

        // 2. LATE MOVE REDUCTION (LMR)
        if (!inCheck && depth >= 3 && isQuiet) {
          let R = this.lmrTable[Math.min(depth, 63)][Math.min(legalCount, 63)];
          R = Math.max(1, Math.min(R, depth - 2));

          this.lmrAttempts++;
          // Zero-window search at reduced depth
          score = -this.#negamax(pos, depth - 1 - R, -alpha - 1, -alpha, ctx);

          if (score <= alpha) {
            // SUCCESS: The reduced search proved the move is worse than alpha. Prune!
            needsFullDepthZeroWindow = false;
          } else {
            // FAIL HIGH: The move is surprisingly good.
            // Skip the full-depth zero-window and go directly to the full-window research.
            this.lmrResearches++;
            needsFullDepthZeroWindow = false;
            needsFullWindow = true;
          }
        }

        // 3. FULL-DEPTH ZERO-WINDOW (PVS)
        // Runs for tactical moves, or moves where LMR wasn't allowed
        if (needsFullDepthZeroWindow) {
          this.pvsTries++;
          score = -this.#negamax(pos, depth - 1, -alpha - 1, -alpha, ctx);

          if (score > alpha && score < beta) {
            // The zero-window failed high, meaning it's better than alpha.
            needsFullWindow = true;
          }
        }

        // 4. FULL-DEPTH FULL-WINDOW
        // Runs if LMR or PVS zero-window failed high
        if (needsFullWindow) {
          this.pvsResearches++;
          score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);
        }
      }

      pos.unmakeMove();
      this.evaluation.restoreEval(pos.searchPly);

      if (ctx.aborted) return ABORT_SCORE;

      if (score >= beta) {
        // Store this move in tt table as it caused a cutoff
        this.tt.store(
          pos.zobristLo,
          pos.zobristHi,
          depth,
          score,
          TT_LOWERBOUND,
          move,
          pos.searchPly,
        );

        // if a quiet move, update killer moves and history heuristic
        this.#updateOrderingHeuristics(move, pos.searchPly, depth);

        return score;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;

        if (score > alpha) {
          alpha = score;
          // move better than previous alpha means score will be exact
          ttFlag = TT_EXACT;
        }
      }
    }

    if (legalCount === 0) {
      if (inCheck) {
        // Return mate score relative to distance from root. Prefer
        // closer mates by making deeper mates score slightly less.
        return -MATE_SCORE + pos.searchPly;
      }
      return 0; // stalemate
    }

    this.tt.store(
      pos.zobristLo,
      pos.zobristHi,
      depth,
      bestScore,
      ttFlag,
      bestMove,
      pos.searchPly,
    );

    return bestScore;
  }

  #quiescence(
    pos: Position,
    alpha: number,
    beta: number,
    ctx: SearchContext,
  ): number {
    if (ctx.tick(true)) return ABORT_SCORE;

    // Draw check
    if (pos.halfmoveClock >= 100) {
      return 0;
    }
    const currHi = pos.zobristHi,
      currLo = pos.zobristLo;
    const currPly = pos.ply;
    const minPly = currPly - pos.halfmoveClock;
    for (let i = currPly - 2; i >= minPly; i -= 2) {
      const lo = pos.zobristHistoryLo[i];
      const hi = pos.zobristHistoryHi[i];

      // dont repeat positions or its a draw
      // without this, the engine will repeat in a winning position because it doesnt know repeating is a draw
      if (lo === currLo && hi === currHi) {
        return 0;
      }
    }

    // prevent infinite recursion in the case of checks
    if (pos.searchPly >= MAX_SEARCH_PLY - 1) {
      return this.evaluation.getEval(pos);
    }

    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    const inCheck = checkers[0] !== 0 || checkers[1] !== 0;

    let standPat = -INFINITY;
    if (!inCheck) {
      standPat = this.evaluation.getEval(pos);

      // if doing nothing beats beta, opp wont allow this pos
      if (standPat >= beta) return standPat;
      if (standPat > alpha) alpha = standPat;
    }

    const start = pos.searchPly * MAX_MOVES;
    let moves = 0;

    if (inCheck) {
      // If in check, need to generate quiet moves to evade, or we will hallucinate mate
      moves = pos.generatePseudoLegalMoves();
    } else {
      // Generate only tactical moves (captures and promotions)
      moves = pos.generateTacticalMoves();
    }
    const moveBuf = pos.moveBuffer;
    const scoreBuf = this.scoreBuffer;
    for (let i = 0; i < moves; i++) {
      scoreBuf[start + i] = scoreMoveForOrderingBasic(moveBuf[start + i]);
    }

    let legalCount = 0;
    let bestScore = standPat;
    for (let i = 0; i < moves; i++) {
      // Move best (highest scoring) move to the front of moveBuffer
      this.#pickBestMove(moveBuf, start, i, moves);

      const move = moveBuf[start + i];

      // DELTA PRUNING
      // dont do it in late endgame or if in check
      if (!inCheck && this.evaluation.getPhase() > 6) {
        const captured = moveCaptured(move);
        const promo = movePromotion(move);

        // Dont prune promotions
        if (promo === NO_PIECE) {
          const DELTA_MARGIN = 200; // ~2 pawns of margin to account for positional gains

          const capturedValue = this.evaluation.pieceWeights[captured];
          // If current score + the piece we are taking + a margin can't beat alpha, prune it
          if (standPat + capturedValue + DELTA_MARGIN <= alpha) {
            continue;
          }
        }
      }

      // SEE pruning: simulate the potential capture sequence that would occur by making this move
      // If it loses material (see < 0), then we dont need to search this as its a losing capture
      if (!inCheck && see(move, pos, this.evaluation.pieceWeights) < -50) {
        this.seeCutoffs++;
        continue;
      }

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      this.evaluation.makeMoveUpdateEval(move, pos);
      pos.makeMove(move);

      const score = -this.#quiescence(pos, -beta, -alpha, ctx);

      pos.unmakeMove();
      this.evaluation.restoreEval(pos.searchPly);

      if (ctx.aborted) return ABORT_SCORE;

      // found a better move than out previous best - raise the lower bound
      if (score > bestScore) {
        bestScore = score;

        if (score > alpha) {
          alpha = score;
        }
      }

      if (score >= beta) {
        return bestScore;
      }
    }

    if (legalCount === 0) {
      if (inCheck) {
        return -MATE_SCORE + pos.searchPly;
      }
      // cant return 0 for stalemate as it could just be that we are not in check and have no captures
    }

    return bestScore;
  }

  #updateOrderingHeuristics(move: Move, ply: number, depth: number) {
    const captured = moveCaptured(move);
    const promo = movePromotion(move);
    if (captured === NO_PIECE && promo === NO_PIECE) {
      if (this.killerMoves[ply][0] !== move) {
        this.killerMoves[ply][1] = this.killerMoves[ply][0];
        this.killerMoves[ply][0] = move;
      }

      const piece = movePiece(move);
      const toSq = moveTo(move);

      const bonus = depth * depth;
      this.historyTable[piece][toSq] += bonus;

      // Keeps history strictly below killer moves
      const MAX_HISTORY = 20_000;
      if (this.historyTable[piece][toSq] > MAX_HISTORY) {
        this.historyTable[piece][toSq] = MAX_HISTORY;
      }
    }
  }

  // Do 1 step of selection sort to search for the move to search
  #pickBestMove(
    moveBuffer: Uint32Array,
    start: number,
    current: number,
    end: number,
  ): void {
    let bestIdx = current;
    const buf = this.scoreBuffer;
    let bestScore = buf[start + current];

    for (let i = current + 1; i < end; i++) {
      if (buf[start + i] > bestScore) {
        bestScore = buf[start + i];
        bestIdx = i;
      }
    }

    if (bestIdx !== current) {
      // Swap moves
      const tmpMove = moveBuffer[start + current];
      moveBuffer[start + current] = moveBuffer[start + bestIdx];
      moveBuffer[start + bestIdx] = tmpMove;
      // Swap scores
      const tmpScore = buf[start + current];
      buf[start + current] = buf[start + bestIdx];
      buf[start + bestIdx] = tmpScore;
    }
  }

  #hasNonPawnMaterial(pos: Position): boolean {
    const side = pos.sideToMove;

    const pawnMaterialLo = pos.bbsLo[side === WHITE ? WHITE_PAWN : BLACK_PAWN];
    const pawnMaterialHi = pos.bbsHi[side === WHITE ? WHITE_PAWN : BLACK_PAWN];
    const kingLo = pos.bbsLo[side === WHITE ? WHITE_KING : BLACK_KING];
    const kingHi = pos.bbsHi[side === WHITE ? WHITE_KING : BLACK_KING];

    const nonPawnOccLo = pos.playerOccLo[side] & ~(pawnMaterialLo | kingLo);
    const nonPawnOccHi = pos.playerOccHi[side] & ~(pawnMaterialHi | kingHi);

    if (nonPawnOccLo !== 0 || nonPawnOccHi !== 0) {
      return true;
    }

    return false;
  }
}
