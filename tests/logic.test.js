import { describe, it, expect } from 'vitest';
import { rollDie, rollDieDetailed, sumOdds } from '../src/random.js';
import { ROLLS, outcomeFor, traitsFromTotals } from '../src/rolls.js';
import { encodePerson, decodePerson } from '../src/share.js';
import { exactTwinChance, huntTwins } from '../src/workers/twinHunt.js';

describe('dice', () => {
  it('only ever rolls 1–6, and every face shows up', () => {
    const seen = new Set();
    for (let i = 0; i < 5000; i++) {
      const n = rollDie(6);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
      seen.add(n);
    }
    expect(seen.size).toBe(6);
  });

  it('the face comes from the raw number the lesson shows', () => {
    const { face, raw } = rollDieDetailed(6);
    expect(face).toBe((raw % 6) + 1);
  });

  it('knows 7 is the most likely total for two dice', () => {
    const odds = sumOdds(2, 6);
    expect(odds).toHaveLength(11);
    expect(odds.find((o) => o.total === 7).ways).toBe(6);
    expect(odds.reduce((a, o) => a + o.chance, 0)).toBeCloseTo(1);
  });
});

describe('rolls', () => {
  it('has no more than 10 rolls', () => {
    expect(ROLLS.length).toBeLessThanOrEqual(10);
  });

  it('every possible dice total maps to a trait', () => {
    for (const roll of ROLLS) {
      const [lo, hi] = roll.dice === 2 ? [2, 12] : [1, 6];
      for (let t = lo; t <= hi; t++) expect(outcomeFor(roll, t), `${roll.key} ${t}`).toBeTruthy();
    }
  });

  it('builds a trait object', () => {
    const traits = traitsFromTotals([1, 2, 3, 4, 5, 7, 6, 4, 6, 1]);
    expect(traits.hairStyle).toBe('spiky');
    expect(traits.height).toBe(1);
    expect(traits.outfit.cape).toBeTruthy();
    expect(traits.accessory).toBe('crown');
  });
});

describe('share links', () => {
  it('round-trips through a 10-character code', () => {
    const totals = [6, 1, 3, 2, 5, 12, 4, 4, 2, 6];
    const code = encodePerson(totals);
    expect(code).toBe('61325c4426');
    expect(decodePerson(code)).toEqual(totals);
  });

  it('rejects broken codes', () => {
    expect(decodePerson('123')).toBeNull();
    expect(decodePerson('7111111111')).toBeNull(); // no 7 on a single die
    expect(decodePerson('11111d1111')).toBeNull(); // 13 is too tall for 2d6
    expect(decodePerson(null)).toBeNull();
  });
});

describe('twin hunter', () => {
  it('computes the exact chance of a perfect twin', () => {
    // 9 single dice (1/6 each) × "Right in the Middle" height (16 of 36 combos)
    expect(exactTwinChance([1, 1, 1, 1, 1, 7, 1, 1, 1, 1])).toBeCloseTo((1 / 6) ** 9 * (16 / 36), 15);
  });

  it('counts every invented person exactly once', () => {
    const matches = huntTwins([1, 2, 3, 4, 5, 7, 6, 4, 6, 1], 20_000);
    expect(matches).toHaveLength(11);
    expect(matches.reduce((a, b) => a + b, 0)).toBe(20_000);
    // On average a random person shares ~1.8 traits, so 0–3 matches should dominate
    expect(matches[0] + matches[1] + matches[2] + matches[3]).toBeGreaterThan(15_000);
  });
});
