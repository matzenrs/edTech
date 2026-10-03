// The "Twin Hunter": invent lots of random people and count how many match yours.
// This file is plain math, so it can run in a Web Worker OR on the main thread
// (the app does both, so you can feel the difference!).
import { ROLLS, outcomeFor } from '../rolls.js';

// Fill a big bucket of dice rolls at once — much faster than one at a time.
function makeDiceBucket(size) {
  const bytes = new Uint8Array(size);
  const dice = new Uint8Array(size);
  let filled = 0;
  while (filled < size) {
    crypto.getRandomValues(bytes.subarray(0, Math.min(65536, size)));
    for (let i = 0; i < Math.min(65536, size) && filled < size; i++) {
      if (bytes[i] < 252) dice[filled++] = (bytes[i] % 6) + 1; // 252 = 42 × 6, no unfair leftovers
    }
  }
  return dice;
}

/** Which outcome slot did a roll land on? (For height, 2d6 totals share slots.) */
function slotOf(roll, total) {
  return roll.outcomes.indexOf(outcomeFor(roll, total));
}

/** The exact chance that a random person is your perfect twin. */
export function exactTwinChance(totals) {
  return ROLLS.reduce((p, roll, i) => {
    if (roll.dice === 1) return p / 6;
    return (p * waysFor(outcomeFor(roll, totals[i]))) / 36;
  }, 1);
}
// How many of the 36 two-dice combos land in this outcome's range?
function waysFor(o) {
  let ways = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b >= o.min && a + b <= o.max) ways++;
  return ways;
}

/**
 * Make `count` random people. Report progress with `onProgress(fraction)`.
 * Returns how many matched your person on 0, 1, 2 … 10 traits.
 */
export function huntTwins(totals, count, onProgress) {
  const mine = ROLLS.map((roll, i) => slotOf(roll, totals[i]));
  const heightIndex = ROLLS.findIndex((r) => r.dice === 2);
  const heightSlotByTotal = [];
  for (let t = 2; t <= 12; t++) heightSlotByTotal[t] = slotOf(ROLLS[heightIndex], t);

  const matches = new Array(ROLLS.length + 1).fill(0);
  const batch = 50_000;
  for (let done = 0; done < count; done += batch) {
    const n = Math.min(batch, count - done);
    const dice = makeDiceBucket(n * (ROLLS.length + 1)); // 11 dice per person (height uses 2)
    let k = 0;
    for (let p = 0; p < n; p++) {
      let same = 0;
      for (let i = 0; i < ROLLS.length; i++) {
        let slot;
        if (i === heightIndex) slot = heightSlotByTotal[dice[k++] + dice[k++]];
        else slot = dice[k++] - 1;
        if (slot === mine[i]) same++;
      }
      matches[same]++;
    }
    onProgress?.((done + n) / count);
  }
  return matches;
}
