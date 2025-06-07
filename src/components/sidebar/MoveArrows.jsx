import PropTypes from "prop-types";

const MoveArrows = ({ changeBoardView }) => {
  return (
    <div className="moveArrows">
      <button title="Go back one move" className="prevMove sidebarIconBtn moveArrow" onClick={() => changeBoardView(-1)}>
        <img
          className="sidebarIcon"
          src="./images/chevronLeft.svg"
          alt="go back one move"
        />
      </button>
      <button title="Go forward one move" className="nextMove sidebarIconBtn moveArrow" onClick={() => changeBoardView(1)}>
        <img
          className="sidebarIcon"
          src="./images/chevronRight.svg"
          alt="go forward one move"
        />
      </button>
    </div>
  );
};

MoveArrows.propTypes = {
  changeBoardView: PropTypes.func.isRequired,
};

export default MoveArrows;
