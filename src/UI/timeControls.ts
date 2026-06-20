export type TimeControl = { timePerPlayer: number; increment: number };

// time in minutes and increment in seconds
function getTimeControl(time: number, increment: number): TimeControl {
  return { timePerPlayer: time * 60 * 1000, increment: increment * 1000 };
}

export function msToMinutes(timeMs: number): number {
  return Math.floor(timeMs / 60 / 1000);
}

// ----- BULLET -----
export const TC_1_0: TimeControl = getTimeControl(1, 0);
export const TC_1_1: TimeControl = getTimeControl(1, 1);
export const TC_2_1: TimeControl = getTimeControl(2, 1);

export const BULLET_TCS = [TC_1_0, TC_1_1, TC_2_1];

// ----- BLITZ -----
export const TC_3_0: TimeControl = getTimeControl(3, 0);
export const TC_3_2: TimeControl = getTimeControl(3, 2);
export const TC_5_0: TimeControl = getTimeControl(5, 0);

export const BLITZ_TCS = [TC_3_0, TC_3_2, TC_5_0];

// ----- RAPID -----
export const TC_10_0: TimeControl = getTimeControl(10, 0);
export const TC_10_5: TimeControl = getTimeControl(10, 5);
export const TC_15_10: TimeControl = getTimeControl(15, 10);

export const RAPID_TCS = [TC_10_0, TC_10_5, TC_15_10];
