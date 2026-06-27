import { useEffect, useRef, useState } from "react";
import resign from "../../../../assets/flag.svg";
import { useGameStore } from "../../../gameStore.ts";

export default function Resign() {
  const resignGame = useGameStore((s) => s.resignGame);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // 1. Create a ref to attach to our wrapper div
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirmOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setConfirmOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [confirmOpen]);

  const confirmResignation = () => {
    resignGame();
    setConfirmOpen(false);
  };

  return (
    <div className="resign-wrapper" ref={wrapperRef}>
      <button
        className="playingIconBtn"
        onClick={() => setConfirmOpen((prev) => !prev)}
      >
        <img src={resign} alt="resign" className="playingIcon" />
      </button>

      {confirmOpen && (
        <div className="confirmResignation">
          <div className="resignText">Are you sure you want to resign?</div>
          <button className="resignBtn confirm" onClick={confirmResignation}>
            Resign
          </button>
          <button
            className="resignBtn exit"
            onClick={() => setConfirmOpen(false)}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
