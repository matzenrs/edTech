// Dice math lives here. It's kept separate from the 3D and the page so it's
// easy to test and easy to read.

/**
 * Roll one die with `sides` sides, using the browser's crypto random source.
 * crypto.getRandomValues is the same tool websites use to make secret keys,
 * so it's much harder to predict than Math.random().
 */
export function rollDie(sides = 6) {
  return rollDieDetailed(sides).face;
}

/** Same as rollDie, but also returns the giant raw number it started from. */
export function rollDieDetailed(sides = 6) {
  const buf = new Uint32Array(1);
  // Throw away numbers that would make some faces slightly more likely
  // ("modulo bias"). 2^32 doesn't divide evenly by 6, so we skip the leftovers.
  const limit = Math.floor(0x100000000 / sides) * sides;
  let n;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return { face: (n % sides) + 1, raw: n };
}

/** Roll `count` dice and return each one (e.g. [3, 5] for 2d6). */
export function rollDice(count = 1, sides = 6) {
  return Array.from({ length: count }, () => rollDie(sides));
}

/**
 * Odds of every possible total when rolling `count` dice with `sides` sides.
 * Returns [{ total, ways, chance }], e.g. for 2d6, a 7 has 6 ways and 6/36 chance.
 */
export function sumOdds(count = 2, sides = 6) {
  let ways = new Map([[0, 1]]);
  for (let i = 0; i < count; i++) {
    const next = new Map();
    for (const [total, w] of ways) {
      for (let face = 1; face <= sides; face++) {
        next.set(total + face, (next.get(total + face) || 0) + w);
      }
    }
    ways = next;
  }
  const all = sides ** count;
  return [...ways.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([total, w]) => ({ total, ways: w, chance: w / all }));
}
