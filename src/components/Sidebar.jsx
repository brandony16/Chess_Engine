const Sidebar = ({
  currPlayer,
  resetGame,
  isGameOver,
  result,
  pastMoves,
}) => {
  return (
    <div className="sidebar">
      <div className="turnText">
        {currPlayer === "w" ? "White's Turn" : "Black's Turn"}
      </div>
      <button className="newGame" onClick={() => resetGame()}>
        New Game
      </button>
      <div className="turnText">{isGameOver ? result : ""}</div>

      {pastMoves.map((move, index) => (
        <div key={index} className="pastMove">
          {move}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
