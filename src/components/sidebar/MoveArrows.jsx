import PropTypes from "prop-types";

import chevronLeft from "../../assets/chevronLeft.svg";
import chevronRight from "../../assets/chevronRight.svg";

const MoveArrows = ({ changeBoardView }) => {
  return (
    <div className="moveArrows">
      <button
        title="Go back one move"
        className="prevMove sidebarIconBtn moveArrow"
        onClick={() => changeBoardView(-1)}
      >
        <img className="sidebarIcon" src={chevronLeft} alt="go back one move" />
      </button>
      <button
        title="Go forward one move"
        className="nextMove sidebarIconBtn moveArrow"
        onClick={() => changeBoardView(1)}
      >
        <img
          className="sidebarIcon"
          src={chevronRight}
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
