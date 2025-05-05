## UI

- Make pieces draggable
- Organize sidebar by making buttons on the same row and using icons (maybe?)
- Add ability to flip the board view
- (maybe) add ability to change the color of the board. Maybe have different
  themes?
- Make it so clicking on the most recent move allows you to make a move

## Engine
- Improve evaluation function using tables that show where pieces "should" go
- Implement magic bitboards
- Improve move storing
- Add quiscince search - IN PROGRESS
- Optimize filterIllegalMoves
- Make it so engines play a predetermined opening so they don't play the same
  game every time against each other.
- Make move generators use a occupancy mask calculated earlier - maybe
- Add imcremental attack map updates instead of complete recalculation
- Make players be 0 for white and 1 for black to reduce string comps
- Add 50 move rule to engine sim

## General

- Find a way to test my functions robustly
- Optimize functions further
