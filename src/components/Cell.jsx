import Piece from "./Piece";

const Cell = ({ piece, row, col }) => {
    return (
        <div className={`cell ${((row + col) % 2 === 0) ? 'light' : 'dark'}`}>
            {piece !== '-' && <Piece type={piece} />}
        </div>
    );
}

export default Cell