// Asks the free randomuser.me API for a name. If the internet doesn't answer
// in time, we fall back to our own built-in name list (apps call this a "fallback").

const FIRST = ['Ziggy', 'Luna', 'Milo', 'Pip', 'Nova', 'Juniper', 'Rex', 'Coco', 'Bo', 'Wren', 'Ollie', 'Sunny'];
const LAST = ['Sparkle', 'Doodle', 'McWaffle', 'Bumbleberry', 'Quickstep', 'Moonbeam', 'Pickles', 'Thunderpaws'];

export const NAME_API = 'https://randomuser.me/api/';

/**
 * @param {string} nat   which countries to borrow names from, e.g. "us,ca"
 * @param {string} seed  the same seed always gives the same name
 * @returns {Promise<{first, last, source, url, status, ms, bytes, json, error}>}
 */
export async function fetchName(nat, seed) {
  const url = `${NAME_API}?nat=${nat}&seed=${seed}&inc=name&noinfo`;
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000); // give up after 5 seconds
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new Error(`answered with error ${response.status}`);
    const json = JSON.parse(text);
    const { first, last } = json.results[0].name;
    return {
      first, last, source: 'api', url, status: response.status,
      ms: Math.round(performance.now() - start), bytes: new Blob([text]).size, json,
    };
  } catch (err) {
    // Backup plan: build a name from our own lists using the seed's digits.
    const digits = seed.replace(/\D/g, '');
    const a = Number(digits.slice(0, 5)) || 0;
    const b = Number(digits.slice(5)) || 0;
    return {
      first: FIRST[a % FIRST.length], last: LAST[b % LAST.length], source: 'fallback', url,
      ms: Math.round(performance.now() - start),
      error: err.name === 'AbortError' ? 'took too long to answer (timed out)' : err.message.startsWith('answered') ? err.message : "couldn't be reached",
    };
  } finally {
    clearTimeout(timer);
  }
}
