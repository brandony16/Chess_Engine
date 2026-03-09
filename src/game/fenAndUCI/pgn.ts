type PGNTags = {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result: "1-0" | "0-1" | "1/2-1/2" | "*";
};

export const buildPGN = (moves: string[], tags: PGNTags): string => {
  const tagLines = Object.entries(tags)
    .map(([k, v]) => `[${k} "${v}"]`)
    .join("\n");

  const moveText: string[] = [];

  for (let i = 0; i < moves.length; i++) {
    const san = moves[i];

    if (i % 2 === 0) {
      const moveNumber = Math.floor(i / 2) + 1;
      moveText.push(`${moveNumber}. ${san}`);
    } else {
      moveText.push(san);
    }
  }

  return `${tagLines}\n\n${moveText.join(" ")} ${tags.Result}`;
};
