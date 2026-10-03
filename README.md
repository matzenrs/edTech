# 🎲 Roll-a-Buddy

Roll **10 dice** to build a brand-new **3D cartoon person**, and peek **under the hood** to learn
what the computer is really doing at every step. It's written for smart, curious 5th graders.

## The 10 rolls

| # | Roll | Dice | What you learn under the hood |
|---|------|------|-------------------------------|
| 1 | 🎨 Hair color | 1d6 | Where random numbers come from (`crypto.getRandomValues`), with the real raw number shown |
| 2 | 💇 Hair style | 1d6 | Arrays, and why counting starts at 0 |
| 3 | 🖐️ Skin tone | 1d6 | How screens mix red, green, and blue; hex color codes |
| 4 | 👀 Eye color | 1d6 | 3D shapes are triangles. Live triangle count + **X-ray (wireframe) mode** |
| 5 | 😄 Expression | 1d6 | The render loop: a **live FPS counter** |
| 6 | 📏 Height | **2d6** | Probability and the bell curve (odds chart of your roll) |
| 7 | 👕 Outfit | 1d6 | Toon shading and the inside-out outline trick (toggle outlines) |
| 8 | 🎩 Accessory | 1d6 | Scene graphs: parents and children (make them nod; see the real tree) |
| 9 | 🐾 Sidekick pet | 1d6 | Animating with sine waves |
| 10 | 📛 Name | 1d6 | A **real API call** to randomuser.me (the real JSON response is shown), with an offline fallback |

After the person is finished:

- **👯 Hunt for twins**: a **Web Worker** invents 5,000,000 random people to find your twin. You can also run it
  *without* the worker and watch the animation freeze, which shows why workers exist.
- **💾 Save to gallery**: `localStorage`, showing how many bytes are used.
- **🔗 Share link**: the whole person is packed into the URL (`?p=…`), and the lesson labels each part of the URL.
- **🚀 How did this website get to you?**: GitHub → Render webhook → build (tests + Vite) → CDN → HTTPS → your browser.

A **Behind-the-Scenes Log** prints every real event as it happens: random numbers, rebuilds, network requests, worker messages, and storage writes.

## Run it

```bash
npm install
npm run dev      # open the printed http://localhost:5173 link
npm test         # dice, odds, share links, and twin-hunter math
npm run build    # makes the static site in dist/
```

## How it's built

Plain JavaScript + [Vite](https://vite.dev) + [Three.js](https://threejs.org). There's no server; everything runs in the browser.

```
src/
  main.js           app controller: rolling, finale, gallery, log
  rolls.js          the 10 rolls and their outcomes
  random.js         fair dice from crypto.getRandomValues, plus odds math
  dice.js           the CSS 3D dice
  stage.js          Three.js scene, camera, lights, render loop, FPS, X-ray
  character.js      builds the cartoon person + pets from basic shapes
  lessons.js        every "Under the Hood" lesson and its live widget
  nameApi.js        randomuser.me call with timeout + fallback names
  gallery.js        localStorage gallery
  share.js          pack/unpack a person in the URL
  workers/
    twinHunt.js     the twin-hunting math (runs in a worker OR the main thread)
    twinWorker.js   the Web Worker wrapper
```

## Deploying to Render

`render.yaml` is a Render Blueprint. In Render, click **New → Blueprint**, pick this repo, and press **Apply**.
Render runs `npm ci && npm test && npm run build` and serves `dist/`. It redeploys on every push to the selected branch.
(Or use **New → Static Site** by hand: build command `npm ci && npm run build`, publish directory `dist`.)
