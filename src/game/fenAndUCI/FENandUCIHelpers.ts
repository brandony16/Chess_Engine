/**
 * Gets a sequence of 8 opening moves (ply) for engines to play from.
 * Used so engines don't play the same game every time.
 * @returns {Array<String>} - 8 opening moves
 */
export async function getOpeningMoves() {
  const res = await fetch(`${import.meta.env.BASE_URL}openings.json`);
  if (!res.ok) throw new Error("Error fetching opening moves");

  const openings = await res.json();
  const randIndex = Math.floor(Math.random() * openings.length);

  return openings[randIndex];
}
