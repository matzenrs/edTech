// Saves people in localStorage: a small storage closet your browser keeps for each website.
const KEY = 'roll-a-buddy:gallery';
const MAX = 12;

export function loadGallery() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return []; // storage blocked (private window) or the data got scrambled
  }
}

/** Returns { ok, list, bytes } — bytes is how much room the gallery takes up. */
export function saveToGallery(entry) {
  const list = [entry, ...loadGallery()].slice(0, MAX);
  const text = JSON.stringify(list);
  try {
    localStorage.setItem(KEY, text);
    return { ok: true, list, bytes: text.length * 2 }; // browsers store each character in 2 bytes
  } catch {
    return { ok: false, list: loadGallery(), bytes: 0 };
  }
}

export function removeFromGallery(id) {
  const list = loadGallery().filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* nothing we can do */
  }
  return list;
}
