// Packs a person into a link. Each dice total becomes one character:
// 1–9 stay digits, and 10, 11, 12 (only possible for height) become a, b, c.
import { ROLLS } from './rolls.js';

export function encodePerson(totals) {
  return totals.map((t) => t.toString(16)).join('');
}

export function decodePerson(code) {
  if (typeof code !== 'string' || code.length !== ROLLS.length) return null;
  const totals = [...code].map((c) => parseInt(c, 16));
  const valid = totals.every((t, i) => (ROLLS[i].dice === 2 ? t >= 2 && t <= 12 : t >= 1 && t <= 6));
  return valid ? totals : null;
}

export function shareUrl(totals, name) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('p', encodePerson(totals));
  if (name) url.searchParams.set('n', name);
  return url.toString();
}
