// This file runs inside a Web Worker: a helper with its own thread,
// so heavy work here never freezes the page or the 3D animation.
import { huntTwins } from './twinHunt.js';

self.onmessage = (event) => {
  const { totals, count } = event.data;
  const start = performance.now();
  const matches = huntTwins(totals, count, (fraction) => self.postMessage({ type: 'progress', fraction }));
  self.postMessage({ type: 'done', matches, ms: Math.round(performance.now() - start) });
};
