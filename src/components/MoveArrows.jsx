const MoveArrows = ({ changeBoardView }) => {
  return (
    <div className="moveArrows">
      <button className="prevMove" onClick={() => changeBoardView(-1)}>
        {"<"}
      </button>
      <button className="nextMove" onClick={() => changeBoardView(1)}>
        {">"}
      </button>
    </div>
  );
};

export default MoveArrows;
