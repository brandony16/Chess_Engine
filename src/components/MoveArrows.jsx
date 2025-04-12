import PropTypes from "prop-types";

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

MoveArrows.propTypes = {
  changeBoardView: PropTypes.func.isRequired,
};

export default MoveArrows;
