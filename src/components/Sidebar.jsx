const Sidebar = ({ currPlayer, resetGame, gameStatus, gameOver }) => {
  console.log(gameOver)
  return (
    <div className="sidebar">
      <div className="turnText">{currPlayer === 'w' ? "White's Turn" : "Black's Turn"}</div>
      <button className="newGame" onClick={() => resetGame()}>New Game</button>
      <div className="turnText">{gameOver ? gameStatus : ''}</div>
    </div>
  )
}

export default Sidebar