const Sidebar = ({ currPlayer, resetGame }) => {
  return (
    <div className="sidebar">
      <div className="turnText">{currPlayer === 'w' ? "White's Turn" : "Black's Turn"}</div>
      <button className="newGame" onClick={() => resetGame()}>New Game</button>
    </div>
  )
}

export default Sidebar