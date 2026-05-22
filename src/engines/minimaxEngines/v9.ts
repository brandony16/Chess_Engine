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
import {
  DEFAULT_EVAL_WEIGHTS,
  MATE_SCORE,
  type Evaluation,
  type EvalWeights,
} from "../evaluation/Evaluation.ts";
import { evaluateV1 } from "../evaluation/evaluationV1.ts";
import {
  scoreMoveForOrderingBasic,
  scoreMoveForOrderingKiller,
} from "../moveScoring/basicScoring.ts";
import type { SearchContext } from "../searchContext.ts";
import { TranspositionTable } from "../transpositionTable/table.ts";
import {
  TT_EXACT,
  TT_LOWERBOUND,
  TT_UPPERBOUND,
} from "../transpositionTable/ttTypes.ts";

/**
 * Evolution of minimaxV8 that implements Principal Variation Search and Late Move Reductions
 */
export class MinimaxV9 implements Engine {
  private readonly weights: EvalWeights;
  private evaluate: Evaluation;

  depth: number;

  private readonly MAX_QUIESCE_DEPTH = 8;
  private scoreBuffer = new Int32Array(
    (MAX_SEARCH_PLY + this.MAX_QUIESCE_DEPTH) * MAX_MOVES,
  );
  tt: TranspositionTable;

  // [ply][slot]. store 2 killer moves per ply
  private killerMoves: Uint32Array[];

  // indexed by [piece][square]
  private historyTable: Int32Array[];

  nmpCuttoffs: number = 0;

  constructor(depth: number) {
    this.weights = DEFAULT_EVAL_WEIGHTS;
    this.depth = depth;
    this.evaluate = evaluateV1;

    this.tt = new TranspositionTable();

    this.killerMoves = Array.from(
      { length: MAX_SEARCH_PLY },
      () => new Uint32Array(2),
    );
    this.historyTable = Array.from(
      { length: PIECE_N },
      () => new Int32Array(64),
    );
  }

  newGame(): void {
    this.tt.clear();

    // clear history between games
    for (let i = 0; i < this.historyTable.length; i++) {
      this.historyTable[i].fill(0);
    }
  }

  search(pos: Position, evaluate: Evaluation, ctx: SearchContext): Move {
    pos.searchPly = 0;
    this.nmpCuttoffs = 0;
    this.evaluate = evaluate;

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
    let maxD = 0;
    for (let depth = 1; depth <= this.depth; depth++) {
      maxD++;
      const result = this.#searchRoot(pos, depth, ctx, bestMove);

      if (result) {
        bestMove = result;
      }

      if (ctx.aborted) {
        break;
      }
    }
    // console.log(
    //   `Depth Searched: ${maxD}\nNodes searched: ${ctx.nodesSearched}\nTranspositions: ${this.tt.hits}\nNMP Cutoffs: ${this.nmpCuttoffs}`,
    // );

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
    let alpha = -INFINITY;
    const beta = INFINITY;

    const moveBuf = pos.moveBuffer;
    const scoreBuf = this.scoreBuffer;
    const firstToSearch = prevBest !== 0 ? prevBest : ttMove; // search previous best first, then ttMove
    for (let i = 0; i < moveNum; i++) {
      scoreBuf[start + i] = scoreMoveForOrderingKiller(
        moveBuf[start + i],
        firstToSearch,
        pos.searchPly,
        this.killerMoves,
        this.historyTable,
      );
    }

    let legalCount = 0;
    for (let i = 0; i < moveNum; i++) {
      this.#pickBestMove(moveBuf, start, i, moveNum);

      const move = moveBuf[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      pos.makeMove(move);

      let score: number = 0;
      let lmrFailedLow = false;
      if (legalCount === 1) {
        bestMove = move; // Failsafe: always have at least 1 legal move selected
        score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);
      } else {
        // --- LATE MOVE REDUCTIONS (LMR) ---
        const givesCheck = pos.isInCheck();
        const isQuiet =
          moveCaptured(move) === NO_PIECE && movePromotion(move) === NO_PIECE;
        let doFullDepthSearch = true;

        // Check LMR Conditions
        // 1. Depth is at least 3
        // 2. We are late in the move order (e.g., move 4 or later)
        // 3. The move is quiet (no captures/promos)
        // 4. We are not currently in check
        if (
          depth >= 3 &&
          legalCount >= 4 &&
          isQuiet &&
          checkers[0] === 0 &&
          checkers[1] === 0 &&
          !givesCheck
        ) {
          // Calculate how much to reduce.
          // Start with a reduction of 1. If we are late in the list, reduce by 2.
          let R = 1;
          if (legalCount >= 7) R = 2;

          // Do a zero-window search at a lower depth
          score = -this.#negamax(pos, depth - 1 - R, -alpha - 1, -alpha, ctx);

          // If the score is <= alpha, the move was bad and we can prune it
          if (score <= alpha) {
            doFullDepthSearch = false;
            lmrFailedLow = true;
          }
        }

        if (doFullDepthSearch) {
          // PVS Zero-Window Search (at a full depth)
          score = -this.#negamax(pos, depth - 1, -alpha - 1, -alpha, ctx);

          // PVS Re-Search if necessary
          if (score > alpha && score < beta) {
            score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);
          }
        }
      }

      pos.unmakeMove();

      if (ctx.aborted) return bestMove;

      if (!lmrFailedLow) {
        if (score > alpha) {
          alpha = score;
          bestMove = move;
        }
      }
    }

    // Store root result in TT
    this.tt.store(
      pos.zobristLo,
      pos.zobristHi,
      depth,
      alpha,
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

    // ----- REPETITION CHECK -----
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

    // ----- TT PROBE -----
    const originalAlpha = alpha;
    const ttIdx = this.tt.probe(pos.zobristLo, pos.zobristHi);
    let ttMove = 0;
    if (ttIdx !== -1 && this.tt.getDepth(ttIdx) >= depth) {
      const ttScore = this.tt.getScore(ttIdx, pos.searchPly);
      const ttFlag = this.tt.getFlag(ttIdx);

      if (ttFlag === TT_EXACT) {
        this.tt.cutoffs++;
        return ttScore;
      }
      // Cutoff if the lower bound is already too good for the opponent
      if (ttFlag === TT_LOWERBOUND && ttScore >= beta) {
        this.tt.cutoffs++;
        return ttScore;
      }
      // Cutoff if the upper bound is already worse than our guaranteed alpha
      if (ttFlag === TT_UPPERBOUND && ttScore <= alpha) {
        this.tt.cutoffs++;
        return ttScore;
      }
    }
    if (ttIdx !== -1) ttMove = this.tt.getMove(ttIdx);

    // ---- NULL MOVE PRUNING -----
    const inCheck = pos.isInCheck(pos.sideToMove);

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

        if (ctx.aborted) return ABORT_SCORE;

        if (nullScore >= beta) {
          this.nmpCuttoffs++;
          return beta;
        }
      }
    }

    // ----- END OF SEARCH (DEPTH IS 0) -----
    if (depth === 0) {
      const score = this.#quiescence(
        pos,
        this.MAX_QUIESCE_DEPTH,
        alpha,
        beta,
        ctx,
      );

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

    const start = pos.searchPly * MAX_MOVES;
    const moves = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    const moveBuf = pos.moveBuffer;
    const scoreBuf = this.scoreBuffer;
    for (let i = 0; i < moves; i++) {
      scoreBuf[start + i] = scoreMoveForOrderingKiller(
        moveBuf[start + i],
        ttMove,
        pos.searchPly,
        this.killerMoves,
        this.historyTable,
      );
    }

    let legalCount = 0;
    let bestMove = 0;
    let bestScore = -INFINITY;

    for (let i = 0; i < moves; i++) {
      // Move best (highest scoring) move to the front of moveBuffer
      this.#pickBestMove(moveBuf, start, i, moves);

      const move = moveBuf[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      pos.makeMove(move);

      // did this move give a check to the king

      // Principal Variation Search
      let score: number = 0;
      let lmrFailedLow = false;

      if (legalCount === 1) {
        // Search first move with full window
        score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);
      } else {
        // --- LATE MOVE REDUCTIONS (LMR) ---
        const givesCheck = pos.isInCheck();
        const isQuiet =
          moveCaptured(move) === NO_PIECE && movePromotion(move) === NO_PIECE;
        let doFullDepthSearch = true;

        // Check LMR Conditions
        // 1. Depth is at least 3
        // 2. We are late in the move order (e.g., move 4 or later)
        // 3. The move is quiet (no captures/promos)
        // 4. We are not currently in check
        // 5. The move we made does not give check (dont want to miss a mate because we search shallower)
        if (
          depth >= 3 &&
          legalCount >= 4 &&
          isQuiet &&
          checkers[0] === 0 &&
          checkers[1] === 0 &&
          !givesCheck
        ) {
          // Calculate how much to reduce.
          // Start with a reduction of 1. If we are late in the list, reduce by 2.
          let R = 1;
          if (legalCount >= 7) R = 2;

          // Do a zero-window search at a lower depth
          score = -this.#negamax(pos, depth - 1 - R, -alpha - 1, -alpha, ctx);

          // If the score is <= alpha, the move was bad and we can prune it
          if (score <= alpha) {
            doFullDepthSearch = false;
            lmrFailedLow = true; // Flag this score as shallow/unreliable
          }
        }

        if (doFullDepthSearch) {
          // For other moves, assume its worse than alpha, so test that with a zero window search
          // This tight window causes massive pruning, and if the move is worse (score < alpha) we can just move on
          score = -this.#negamax(pos, depth - 1, -alpha - 1, -alpha, ctx);

          // If the zero window search proved us wrong (score > alpha) and it wasnt a beta cutoff,
          // we must research with the full window to get the exact score
          if (score > alpha && score < beta) {
            score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);
          }
        }
      }

      pos.unmakeMove();

      if (ctx.aborted) return ABORT_SCORE;

      // only update best score with results from a full bounds search
      if (!lmrFailedLow) {
        if (score > bestScore) {
          bestScore = score;
        }
        if (score > alpha) {
          alpha = score;
          bestMove = move;
        }

        if (score >= beta) {
          // if a quiet move, update killer moves and history heuristic
          const captured = moveCaptured(move);
          const promo = movePromotion(move);
          if (captured === NO_PIECE && promo === NO_PIECE) {
            const ply = pos.searchPly;
            if (this.killerMoves[ply][0] !== move) {
              this.killerMoves[ply][1] = this.killerMoves[ply][0];
              this.killerMoves[ply][0] = move;
            }

            const piece = movePiece(move);
            const toSq = moveTo(move);

            // Add depth^2 to heavily reward moves that cause cutoffs near the root
            this.historyTable[piece][toSq] += depth * depth;
          }

          break;
        }
      }
    }

    if (legalCount === 0) {
      if (pos.isInCheck(pos.sideToMove)) {
        // Return mate score relative to distance from root. Prefer
        // closer mates by making deeper mates score slightly less.
        return -MATE_SCORE + pos.searchPly;
      }
      return 0; // stalemate
    }

    // Determine flag based on how alpha changed relative to original
    // No lowerbound as beta cutoffs are returned immediately
    const flag =
      bestScore >= beta
        ? TT_LOWERBOUND
        : bestScore > originalAlpha
          ? TT_EXACT
          : TT_UPPERBOUND;

    this.tt.store(
      pos.zobristLo,
      pos.zobristHi,
      depth,
      bestScore,
      flag,
      bestMove,
      pos.searchPly,
    );

    return bestScore;
  }

  #quiescence(
    pos: Position,
    depth: number,
    alpha: number,
    beta: number,
    ctx: SearchContext,
  ): number {
    if (ctx.tick(true)) return ABORT_SCORE;

    if (depth === 0) {
      return this.evaluate(pos, this.weights);
    }

    let bestScore = -INFINITY;

    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    const inCheck = checkers[0] !== 0 || checkers[1] !== 0;

    if (!inCheck) {
      const standPat = this.evaluate(pos, this.weights);
      bestScore = standPat; // Initialize bestScore

      // if doing nothing beats beta, opp wont allow this pos
      if (standPat >= beta) return bestScore;
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
    for (let i = 0; i < moves; i++) {
      // Move best (highest scoring) move to the front of moveBuffer
      this.#pickBestMove(moveBuf, start, i, moves);

      const move = moveBuf[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      pos.makeMove(move);

      const score = -this.#quiescence(pos, depth - 1, -beta, -alpha, ctx);

      pos.unmakeMove();

      if (ctx.aborted) return ABORT_SCORE;

      if (score > bestScore) {
        bestScore = score;
      }
      if (score > alpha) {
        alpha = score;
      }
      if (alpha >= beta) {
        return bestScore; // Fail-soft return
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
