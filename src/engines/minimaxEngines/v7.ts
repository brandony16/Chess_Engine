import { moreThanOne } from "../../game/bb.ts";
import { NO_PIECE, PIECE_N } from "../../game/chessConstants.ts";
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
  scoreMoveKiller,
} from "../moveScoring/basicScoring.ts";
import type { SearchContext } from "../searchContext.ts";
import { TranspositionTable } from "../transpositionTable/table.ts";
import {
  LOOKUP_FAILED,
  TT_EXACT,
  TT_LOWERBOUND,
  TT_UPPERBOUND,
} from "../transpositionTable/ttTypes.ts";

/**
 * Evolution of minimaxV6 that improves move ordering by implementing killer moves and history heuristic
 */
export class MinimaxV7 implements Engine {
  private readonly weights: EvalWeights;
  private evaluate: Evaluation;

  depth: number;
  depthReached: number;

  private scoreBuffer = new Int32Array(MAX_SEARCH_PLY * MAX_MOVES);
  tt: TranspositionTable;

  // [ply][slot]. store 2 killer moves per ply
  private killerMoves: Uint32Array[];

  constructor(depth: number) {
    this.weights = DEFAULT_EVAL_WEIGHTS;
    this.depth = depth;
    this.depthReached = 0;
    this.evaluate = evaluateV1;

    this.tt = new TranspositionTable();

    this.killerMoves = Array.from(
      { length: MAX_SEARCH_PLY },
      () => new Uint32Array(2),
    );
  }

  newGame(): void {
    this.tt.clear();
  }

  search(
    pos: Position,
    evaluate: Evaluation,
    ctx: SearchContext,
    log: boolean = false,
  ): Move {
    pos.searchPly = 0;
    this.evaluate = evaluate;

    // clear killer moves before each search
    for (let i = 0; i < this.killerMoves.length; i++) {
      this.killerMoves[i].fill(0);
    }

    let bestMove = 0;
    this.depthReached = 0;
    for (let depth = 1; depth <= this.depth; depth++) {
      this.depthReached++;
      const result = this.#searchRoot(pos, depth, ctx, bestMove);

      if (result) {
        bestMove = result;
      }

      if (ctx.aborted) {
        break;
      }
    }
    if (log) {
      console.log(
        `Depth Searched: ${this.depthReached}\nNodes searched: ${ctx.nodesSearched}\nTranspositions: ${this.tt.hits}`,
      );
    }

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
      scoreBuf[start + i] = scoreMoveKiller(
        moveBuf[start + i],
        pos.searchPly,
        this.killerMoves,
        firstToSearch,
      );
    }

    for (let i = 0; i < moveNum; i++) {
      this.#pickBestMove(moveBuf, start, i, moveNum);

      const move = moveBuf[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1, -INFINITY, -bestScore, ctx);

      pos.unmakeMove();

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
        depth,
        pos.searchPly,
      );

      return score;
    }

    let legalCount = 0;
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    let bestMove = 0;
    let bestScore = -INFINITY;
    let ttFlag = TT_UPPERBOUND;

    // if a tt move exists, its probably good has a high chance of causing a cutoff
    // therefore, search this move before generating moves to save time
    const ttMove = this.tt.lookupMove(pos.zobristLo, pos.zobristHi);
    if (ttMove !== 0) {
      if (pos.isLegal(ttMove, checkers, pinned, doubleCheck)) {
        legalCount++;

        pos.makeMove(ttMove);

        const score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);

        pos.unmakeMove();

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
          this.#updateKillers(ttMove, pos.searchPly);

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
      scoreBuf[start + i] = scoreMoveKiller(
        moveBuf[start + i],
        pos.searchPly,
        this.killerMoves,
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

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);

      pos.unmakeMove();

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
        this.#updateKillers(move, pos.searchPly);

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
      if (pos.isInCheck(pos.sideToMove)) {
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

    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    const inCheck = checkers[0] !== 0 || checkers[1] !== 0;

    let standPat = -INFINITY;
    if (!inCheck) {
      standPat = this.evaluate(pos, this.weights);

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

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      pos.makeMove(move);

      const score = -this.#quiescence(pos, -beta, -alpha, ctx);

      pos.unmakeMove();

      if (ctx.aborted) return ABORT_SCORE;

      // found a better move than out previous best - raise the lower bound
      if (score > bestScore) {
        bestScore = score;

        if (score > alpha) {
          alpha = score;
        }
      }

      if (score >= beta) {
        // Beta cutoff: opponent won't allow this position because we already
        // have a move that's too good. Stop searching immediately.
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

  // Do 1 step of selection sort to search for the move to search
  #pickBestMove(
    moveBuffer: Uint32Array,
    start: number,
    current: number,
    end: number,
  ) {
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

  #updateKillers(move: Move, ply: number) {
    const captured = moveCaptured(move);
    const promo = movePromotion(move);
    if (captured === NO_PIECE && promo === NO_PIECE) {
      if (this.killerMoves[ply][0] !== move) {
        this.killerMoves[ply][1] = this.killerMoves[ply][0];
        this.killerMoves[ply][0] = move;
      }
    }
  }
}
