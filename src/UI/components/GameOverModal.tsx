import { useCallback, useState } from "react";
import {
  CHECKMATE,
  DRAW,
  FIFTY_MOVE_RULE,
  IN_PROGRESS,
  INSUFFICIENT_MATERIAL,
  REPETITION,
  STALEMATE,
  WHITE,
  type Player,
} from "../../game/chessConstants.ts";
import { game, useGameStore, type NewGameParams } from "../gameStore.ts";
import "./GameOverModal.css";
import { START_POS } from "../../__tests__/game_tests/fens.ts";

export default function GameOverModal() {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const userSide = useGameStore((s) => s.userSide);
  const userResigned = useGameStore((s) => s.userResigned);
  const isTimeOut = useGameStore((s) => s.isTimeOut);
  const timeOutLoser = useGameStore((s) => s.timeOutLoser);
  const setSidebar = useGameStore((s) => s.setSidebarMode);

  const newGame = useGameStore((s) => s.newGame);

  const handleNewGame = useCallback(() => {
    const side = Math.floor(Math.random() * 2);

    const gameParams: NewGameParams = {
      fen: START_POS,
      userSide: side as Player,
      clockSettings: useGameStore.getState().clockSettings,
      selectedEngine: useGameStore.getState().selectedEngine,
    };
    newGame(gameParams);
  }, []);

  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!isGameOver || !isOpen) return null;

  let title = "Game Over";
  let subtitle = "";

  if (userResigned) {
    const winner = userSide === WHITE ? "Black" : "White";
    title = `${winner} Wins`;
    subtitle = "by resignation";
  } else if (isTimeOut) {
    const winner = timeOutLoser === WHITE ? "Black" : "White";
    title = `${winner} Wins`;
    subtitle = "by timeout";
  } else {
    const res = game.result();

    if (res.winner !== IN_PROGRESS) {
      if (res.winner === DRAW) {
        title = "Draw";
        switch (res.method) {
          case REPETITION:
            subtitle = "by Repetition";
            break;
          case STALEMATE:
            subtitle = "by Stalemate";
            break;
          case INSUFFICIENT_MATERIAL:
            subtitle = "by Insufficient Material";
            break;
          case FIFTY_MOVE_RULE:
            subtitle = "by 50 Move Rule";
            break;
          default:
            throw new Error(
              `Method (${res.method}) does not match winner (${res.winner})`,
            );
        }
      } else {
        const winner = res.winner === WHITE ? "White" : "Black";
        title = `${winner} Wins`;
        switch (res.method) {
          case CHECKMATE:
            subtitle = `by checkmate`;
            break;
          default:
            throw new Error(
              `Method (${res.method}) does not match winner (${res.winner})`,
            );
        }
      }
    }
  }

  return (
    <div className="modal-overlay">
      <div className="game-over-card">
        <h2>{title}</h2>
        <p className="subtitle">{subtitle}</p>

        <div className="modal-actions">
          <button className="primary" onClick={() => handleNewGame()}>
            New Game
          </button>

          <button
            className="secondary"
            onClick={() => {
              setSidebar("playing");
              setIsOpen(false);
            }}
          >
            Review Board
          </button>
        </div>
      </div>
    </div>
  );
}
