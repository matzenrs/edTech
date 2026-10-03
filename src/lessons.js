// "Under the Hood" lessons. Each explains what the app REALLY just did,
// written for a smart, curious 5th grader. A lesson can include a live
// widget (mount) that shows real numbers from this very page.
import { sumOdds } from './random.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (n) => Number(n).toLocaleString('en-US');

function codeBlock(code) {
  return `<details class="peek"><summary>👩‍💻 Peek at the real code</summary><pre><code>${esc(code.trim())}</code></pre></details>`;
}
function funFact(text) {
  return `<div class="fact"><span>🤯</span><p>${text}</p></div>`;
}
function seenIt(text) {
  return `<div class="seen"><span>🌍</span><p><b>Where you've seen this:</b> ${text}</p></div>`;
}

export const LESSONS = {
  welcome: {
    emoji: '👋',
    title: "What's a website, anyway?",
    body: () => `
      <p>You're about to roll <b>10 dice</b> to build a brand-new person. But this is also a <b>secret tour</b>:
      every time something happens, this box shows you what the computer is <i>actually</i> doing behind the scenes.</p>
      <p>Every website is made from three languages working together:</p>
      <ul class="trio">
        <li><b>HTML</b> 🦴 is the <i>skeleton</i>: the buttons, headings, and boxes.</li>
        <li><b>CSS</b> 👗 is the <i>clothes</i>: colors, fonts, and that bouncy dice animation.</li>
        <li><b>JavaScript</b> 🧠 is the <i>brain</i>: it rolls the dice, builds the 3D person, and talks to other computers.</li>
      </ul>
      ${seenIt('every website ever, from YouTube to your school portal, uses these same three languages.')}
      <p class="nudge">👉 Press <b>Roll!</b> to start.</p>`,
  },

  random: {
    emoji: '🎲',
    title: 'Where do random numbers come from?',
    body: (ctx) => {
      const r = ctx.lastRoll;
      const raw = r?.raws?.[0];
      return `
      <p>Computers are amazing at following instructions <i>exactly</i>, and that makes being random surprisingly hard!</p>
      <p>When you clicked <b>Roll</b>, our code asked your browser for a random number using a tool called
      <code>crypto.getRandomValues</code>. Your computer collects tiny unpredictable "noise", like the exact
      timing of electrical signals inside its chips, and stirs it into a number nobody could guess.</p>
      ${raw != null ? `<div class="mathbox">
        <div>Your secret giant number was <b>${fmt(raw)}</b></div>
        <div>${fmt(raw)} ÷ 6 leaves a remainder of <b>${raw % 6}</b></div>
        <div>${raw % 6} + 1 = <b class="big">${r.dice[0]}</b> 🎲</div>
      </div>` : ''}
      <p>We divide by 6 and keep the <b>remainder</b> (the leftover), which is always 0–5. Then we add 1 to get 1–6. Just like a real die!</p>
      ${funFact('The giant number can be anything from 0 to 4,294,967,295. That\'s about 4 billion choices!')}
      ${seenIt('the same tool helps banks and messaging apps make secret codes (passwords and encryption keys) that hackers can\'t guess.')}
      ${codeBlock(`
function rollDie(sides = 6) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);   // ask for a giant random number
  return (buf[0] % sides) + 1;   // squish it down to 1–6
}
// (The real version in random.js also throws away a few
//  "unfair" giant numbers so every face is equally likely.)`)}`;
    },
  },

  lookup: {
    emoji: '📋',
    title: 'Turning a number into a hairstyle',
    body: (ctx) => {
      const roll = ctx.lastRoll?.roll;
      const total = ctx.lastRoll?.total ?? 1;
      const items = roll?.outcomes ?? [];
      return `
      <p>The die gave us a <i>number</i>. But how does a number become a ponytail? 🤔</p>
      <p>We keep a <b>list</b> of six hairstyles. Programmers call a list an <b>array</b>. Your number picks a spot in the list.</p>
      <div class="array">${items.map((o, i) => `
        <div class="cell ${i === total - 1 ? 'hit' : ''}"><small>spot ${i}</small>${esc(o.label)}</div>`).join('')}
      </div>
      <p>Wait, why does the list start at <b>spot 0</b>? Most programming languages count from zero! So rolling a
      <b>${total}</b> picks spot <b>${total - 1}</b>. That's why the code says <code>total - 1</code>.</p>
      ${funFact('Programmers argue about this so much there are jokes about it: "There are only two hard things in coding: naming things, and off-by-one errors."')}
      ${seenIt('your music app\'s playlist is an array. "Next song" means "go to spot + 1".')}
      ${codeBlock(`
const hairStyles = ['Bald & Shiny', 'Spiky', 'Curly Puff',
                    'Ponytail', 'Bob Cut', 'Mohawk'];
const style = hairStyles[total - 1];  // a roll of 1 → spot 0`)}`;
    },
  },

  color: {
    emoji: '🌈',
    title: 'How does a computer make a color?',
    body: (ctx) => {
      const hex = typeof ctx.lastRoll?.outcome?.value === 'string' ? ctx.lastRoll.outcome.value : '#c48552';
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      const bar = (name, v, c) => `<div class="rgb"><span>${name}</span><div class="track"><div style="width:${(v / 255) * 100}%;background:${c}"></div></div><b>${v}</b></div>`;
      return `
      <p>Every color on your screen is made by mixing just <b>three lights</b>: <span style="color:#e63946">Red</span>,
      <span style="color:#2a9d4a">Green</span>, and <span style="color:#3a86ff">Blue</span>. Each one goes from 0 (off) to 255 (full blast).</p>
      <div class="swatchrow"><div class="swatch" style="background:${hex}"></div><div>
        <div>Your skin tone's color code is <code>${hex.toUpperCase()}</code></div>
        ${bar('Red', r, '#e63946')}${bar('Green', g, '#2a9d4a')}${bar('Blue', b, '#3a86ff')}
      </div></div>
      <p>That code is in <b>hexadecimal</b>, a way of counting that uses 16 digits (0–9, then A–F). The first two
      characters <code>${hex.slice(1, 3).toUpperCase()}</code> mean red = ${r}, the next two mean green = ${g}, the last two mean blue = ${b}.</p>
      ${funFact('Look at a screen with a magnifying glass (or a drop of water!) and you\'ll see tiny red, green, and blue dots called sub-pixels. Your eyes blend them into every color.')}
      ${seenIt('256 × 256 × 256 = 16,777,216 colors. That\'s every color your screen can show, using just three numbers.')}
      ${codeBlock(`
const skin = new THREE.MeshToonMaterial({ color: '${hex}' });`)}`;
    },
  },

  triangles: {
    emoji: '🔺',
    title: '3D shapes are secretly made of triangles!',
    body: () => `
      <p>Those round eyes? Not really round! Every 3D shape is built from tiny, flat <b>triangles</b>, so many
      that your eyes are fooled into seeing smooth curves. A bundle of triangles is called a <b>mesh</b>.</p>
      <div class="live">
        <div class="stat"><span>Triangles drawn right now</span><b data-live="tris">…</b></div>
        <button class="btn small" data-act="xray">🦴 Turn on X-ray vision</button>
      </div>
      <p>Who draws all those triangles? A chip in your computer called the <b>GPU</b> (Graphics Processing Unit).
      Your regular processor is like one super-smart chef. A GPU is like <i>thousands</i> of helpers who each color
      a few triangles at the same time.</p>
      ${funFact('A modern video game character can be made of more than 100,000 triangles. Your person uses fewer, so even an old phone can spin them smoothly.')}
      ${seenIt('Pixar movies, Minecraft, and Fortnite all draw with triangles. Your GPU is doing it right now!')}
      ${codeBlock(`
// A sphere is a ball of triangles.
// 32 slices around × 24 slices top-to-bottom = lots of triangles!
const eye = new THREE.SphereGeometry(0.14, 32, 24);`)}`,
    mount(el, ctx) {
      const tris = el.querySelector('[data-live="tris"]');
      const btn = el.querySelector('[data-act="xray"]');
      const sync = () => (btn.textContent = ctx.stage.xray ? '🎨 Turn X-ray off' : '🦴 Turn on X-ray vision');
      btn.onclick = () => {
        ctx.stage.setXray(!ctx.stage.xray);
        ctx.log('🦴', `X-ray mode ${ctx.stage.xray ? 'ON' : 'OFF'}: material.wireframe = ${ctx.stage.xray}`);
        sync();
      };
      sync();
      return ctx.stage.onStats((s) => (tris.textContent = fmt(s.triangles)));
    },
  },

  loop: {
    emoji: '🎞️',
    title: 'A flip book drawn 60 times a second',
    body: () => `
      <p>Your person isn't a picture. It's being <b>redrawn over and over</b>, about 60 times every second, like a super-fast flip book!
      Each drawing is called a <b>frame</b>. Before every frame, the code nudges things a tiny bit, and that's how they breathe, blink, and bounce.</p>
      <div class="live">
        <div class="stat"><span>Frames per second (FPS)</span><b data-live="fps">…</b></div>
        <div class="stat"><span>Frames drawn since you arrived</span><b data-live="frames">…</b></div>
      </div>
      <p>The code uses <code>requestAnimationFrame</code>, which means: <i>"Hey browser, call me again right before you paint the screen."</i>
      That way the drawing is perfectly in step with your screen.</p>
      ${funFact('Movies in theaters usually play at 24 frames per second. Games aim for 60 or more, because smoother motion feels better when you\'re in control.')}
      ${seenIt('if a game ever felt "laggy", its FPS dropped. The computer couldn\'t draw frames fast enough.')}
      ${codeBlock(`
function frame() {
  requestAnimationFrame(frame);   // "call me again next frame!"
  wiggleThingsALittle();
  renderer.render(scene, camera); // draw the picture
}`)}`,
    mount(el, ctx) {
      const fps = el.querySelector('[data-live="fps"]');
      const frames = el.querySelector('[data-live="frames"]');
      return ctx.stage.onStats((s) => {
        fps.textContent = s.fps;
        frames.textContent = fmt(s.frames);
      });
    },
  },

  odds: {
    emoji: '📊',
    title: 'Why two dice make "medium" the most common',
    body: (ctx) => {
      const total = ctx.lastRoll?.total;
      const odds = sumOdds(2, 6);
      const max = Math.max(...odds.map((o) => o.ways));
      return `
      <p>Height used <b>two dice</b> and added them up. Here's the surprising part: some totals are <b>way</b> more likely than others!</p>
      <div class="chart" role="img" aria-label="Bar chart of ways to roll each total with two dice">
        ${odds.map((o) => `<div class="col ${o.total === total ? 'hit' : ''}">
          <small>${o.ways}</small><div class="bar" style="height:${(o.ways / max) * 100}%"></div><span>${o.total}</span></div>`).join('')}
      </div>
      <p class="caption">Number of ways to roll each total${total ? `. You rolled <b>${total}</b>!` : ''}</p>
      <p>There's only <b>one</b> way to roll a 2 (⚀+⚀), but <b>six</b> ways to roll a 7 (1+6, 2+5, 3+4, 4+3, 5+2, 6+1).
      Two dice can land 36 different ways, so a 7 has a 6-in-36 chance, but a 2 has only 1-in-36.</p>
      <p>That's why most people come out "Right in the Middle" and Super Tall people are rare, just like real life! Scientists call this hill shape a <b>bell curve</b>.</p>
      ${funFact('Add up more dice and the hill gets even more bell-shaped. Test scores, people\'s heights, and even the weight of apples make bell curves too.')}
      ${seenIt('board games like Catan put the "7" spot in the middle for exactly this reason.')}`;
    },
  },

  toon: {
    emoji: '🖍️',
    title: 'Why does it look like a cartoon?',
    body: () => `
      <p>Realistic 3D (like in movies) blends light smoothly from bright to dark. We use a <b>toon shader</b> instead:
      it snaps the light into just <b>3 steps</b> (bright, medium, and shadow), like colors in a comic book.</p>
      <div class="steps"><div style="background:#5a5a5a"></div><div style="background:#aaaaaa"></div><div style="background:#ffffff"></div></div>
      <p>And the black outlines? That's a sneaky trick! Behind every shape we put a slightly <b>bigger black copy</b>
      that's turned <b>inside-out</b>. You only see its edge peeking around the shape, like an outline drawn with a marker.</p>
      <div class="live"><button class="btn small" data-act="outline">✏️ Hide the outlines</button></div>
      ${funFact('A "shader" is a tiny program that runs on the GPU for every single pixel. On your screen that might be millions of times per frame!')}
      ${seenIt('games like Zelda: Breath of the Wild and Fortnite use toon shaders to look like moving paintings.')}
      ${codeBlock(`
// The outline trick: a bigger, inside-out, black copy.
const shell = new THREE.Mesh(shape, blackInsideOut);
shell.scale.setScalar(1.05);  // 5% bigger
mesh.add(shell);`)}`,
    mount(el, ctx) {
      const btn = el.querySelector('[data-act="outline"]');
      const sync = () => (btn.textContent = ctx.stage.outlines ? '✏️ Hide the outlines' : '✏️ Bring outlines back');
      btn.onclick = () => {
        ctx.stage.setOutlines(!ctx.stage.outlines);
        ctx.log('✏️', `Outline shells ${ctx.stage.outlines ? 'shown' : 'hidden'}`);
        sync();
      };
      sync();
    },
  },

  sceneGraph: {
    emoji: '🌳',
    title: 'Parents and children (in code!)',
    body: () => `
      <p>Why doesn't the hat fall off? In 3D, objects can be <b>children</b> of other objects. The accessory is a
      child of the <b>Head</b>, and when a parent moves, all its children ride along!</p>
      <div class="live"><button class="btn small" data-act="nod">🙆 Make them nod</button></div>
      <p>Here's the real family tree of your person right now (programmers call it a <b>scene graph</b>):</p>
      <pre class="tree" data-live="tree"></pre>
      ${funFact('Your arm works the same way: move your shoulder and your elbow, hand, and fingers all come along. Animators build "skeletons" for characters exactly like this.')}
      ${seenIt('the web page itself is a tree too! It\'s called the DOM: the page holds sections, which hold buttons, which hold text.')}
      ${codeBlock(`
head.add(hat);      // hat becomes the head's child
head.rotation.x = 0.3; // nod! the hat moves too`)}`,
    mount(el, ctx) {
      el.querySelector('[data-act="nod"]').onclick = () => {
        ctx.stage.nod();
        ctx.log('🙆', 'head.rotation.x wiggled: every child of Head moved with it');
      };
      const tree = el.querySelector('[data-live="tree"]');
      const lines = [];
      const walk = (obj, depth) => {
        const kids = obj.children.filter((c) => c.isGroup || c.name);
        if (obj.isGroup) lines.push(`${'   '.repeat(depth)}${depth ? '└─ ' : ''}${obj.name || 'Group'}`);
        // Only show the groups, so the tree stays readable
        kids.filter((c) => c.isGroup).forEach((c) => walk(c, depth + 1));
      };
      if (ctx.stage.character) walk(ctx.stage.character, 0);
      tree.textContent = lines.join('\n');
    },
  },

  sine: {
    emoji: '〰️',
    title: 'How does the pet bounce? Math!',
    body: () => `
      <p>Your pet's bounce comes from a math function called <b>sine</b> (say "sign"). Sine makes a smooth wave that goes
      up to 1, down to −1, and back again, forever.</p>
      <canvas class="wave" width="420" height="120" aria-label="A sine wave with a dot riding along it"></canvas>
      <p>Every frame, the code asks: <i>"What's the sine of the time right now?"</i> and moves the pet up or down by that much.
      Speed up time and the wiggle gets faster. Multiply the answer and the bounce gets bigger!</p>
      ${funFact('Sine waves are everywhere: ocean waves, sound waves, swings, and the electricity in your walls all wiggle in sine waves.')}
      ${seenIt('the little "breathing" bounce your person does is a sine wave too!')}
      ${codeBlock(`
// time keeps growing, but sin(time) always stays between -1 and 1
pet.position.y = Math.sin(time * 3) * 0.06;`)}`,
    mount(el) {
      const canvas = el.querySelector('canvas');
      const g = canvas.getContext('2d');
      let raf;
      const draw = (ms) => {
        const t = ms / 1000;
        const { width: w, height: h } = canvas;
        g.clearRect(0, 0, w, h);
        g.strokeStyle = '#c8c2e8';
        g.beginPath();
        g.moveTo(0, h / 2);
        g.lineTo(w, h / 2);
        g.stroke();
        g.strokeStyle = '#7b5cff';
        g.lineWidth = 3;
        g.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = h / 2 - Math.sin((x / w) * Math.PI * 4 - t * 3) * (h * 0.35);
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
        const dotY = h / 2 - Math.sin(-t * 3) * (h * 0.35);
        g.fillStyle = '#ff7eb6';
        g.beginPath();
        g.arc(10, dotY, 9, 0, Math.PI * 2);
        g.fill();
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(raf);
    },
  },

  api: {
    emoji: '📡',
    title: 'Asking another computer for a name (an API call)',
    body: (ctx) => {
      const n = ctx.nameResult;
      if (!n) return '<p>Asking the internet… 📡</p>';
      const host = new URL(n.url).host;
      const story =
        n.source === 'api'
          ? `<div class="mathbox ok">
              <div>📤 <b>Request:</b> <code>GET ${esc(n.url)}</code></div>
              <div>📥 <b>Answer:</b> status <b>${n.status} OK</b> in <b>${n.ms} milliseconds</b> (${fmt(n.bytes)} bytes)</div>
            </div>
            <p>Here's the <b>exact message</b> the server sent back. It's written in <b>JSON</b>, a format computers use to pass notes:</p>
            <pre class="json"><code>${esc(JSON.stringify(n.json, null, 2))}</code></pre>`
          : `<div class="mathbox warn">
              <div>📤 We asked <code>${esc(host)}</code>, but it ${esc(n.error || "didn't answer")}.</div>
              <div>🛟 So we used our <b>backup plan</b>: a name list built right into this app!</div>
            </div>
            <p>Good apps always have a <b>fallback</b>, because the internet isn't perfect. Wi-Fi drops, servers get busy, or a school network blocks a site.</p>`;
      return `
      <p>We don't have a list of names inside this app. Instead, your browser sent a message across the internet to a
      computer called <b>${esc(host)}</b> and asked for one. A service that lets programs ask other programs for stuff is called an <b>API</b>.</p>
      ${story}
      <p>Notice the <code>seed=</code> part of the address? We made it from <b>your dice rolls</b>. The same seed always gets the same answer, so if someone rolls exactly what you rolled, they'll get the same name!</p>
      ${funFact('Your message probably traveled through a dozen computers called "routers" to get there and back, in less time than it takes to blink.')}
      ${seenIt('the weather app on a phone doesn\'t know the weather. It makes an API call to a weather service, just like this!')}
      ${codeBlock(`
const response = await fetch(
  'https://randomuser.me/api/?nat=${ctx.nat || 'us'}&seed=...');
const data = await response.json();   // read the JSON note
const name = data.results[0].name;    // { first, last }`)}`;
    },
  },

  worker: {
    emoji: '👷',
    title: 'Hiring a helper: Web Workers',
    body: (ctx) => `
      <p>Is anyone else in the world <i>exactly</i> like your person? Let's find out by inventing
      <b>${fmt(ctx.twinCount)}</b> random people and checking each one!</p>
      <p>But that's a LOT of work. JavaScript on a web page normally has just one <b>main thread</b>. Think of it like a single
      chef who cooks, takes orders, <i>and</i> draws your 3D person 60 times a second. If the chef stops to count millions of people,
      everything else freezes!</p>
      <p>So we hire a helper called a <b>Web Worker</b>. It runs on a different part of your computer's processor (a different
      <b>core</b>), so the chef keeps the animation smooth while the helper counts.</p>
      <p>Your computer has about <b>${navigator.hardwareConcurrency || 'several'}</b> cores ready to help.</p>
      <div class="live col">
        <div class="btnrow">
          <button class="btn small" data-act="worker">👷 Hunt with a helper (Web Worker)</button>
          <button class="btn small ghost" data-act="main">🥶 Try it WITHOUT a helper</button>
        </div>
        <div class="meter"><div data-live="bar"></div></div>
        <div data-live="result" class="result"></div>
      </div>
      <p class="caption">Try both buttons and watch your 3D person. Without the helper, they freeze while the chef is busy counting!</p>
      ${seenIt('when a website does something big (like editing a photo or a video call blurring your background) workers keep the page from getting stuck.')}
      ${codeBlock(`
const helper = new Worker('twinWorker.js');
helper.postMessage({ totals, count: ${ctx.twinCount} });  // "please count these!"
helper.onmessage = (e) => showResults(e.data);       // "done, here you go!"`)}`,
    mount(el, ctx) {
      const bar = el.querySelector('[data-live="bar"]');
      const result = el.querySelector('[data-live="result"]');
      const buttons = el.querySelectorAll('button');
      const run = async (useWorker) => {
        buttons.forEach((b) => (b.disabled = true));
        bar.style.width = '0%';
        result.innerHTML = useWorker ? 'Helper is counting… (your person keeps moving!)' : 'The chef is counting… 🥶';
        const out = await ctx.huntTwins(useWorker, (f) => (bar.style.width = `${Math.round(f * 100)}%`));
        bar.style.width = '100%';
        buttons.forEach((b) => (b.disabled = false));
        const near = out.matches.slice(8).reduce((a, b) => a + b, 0);
        const oneIn = Math.round(1 / out.exactChance);
        result.innerHTML = `
          <div>⏱️ Finished in <b>${fmt(out.ms)} ms</b> ${useWorker ? 'by the helper, and the page never froze' : 'on the main thread (did you see the freeze?)'}.</div>
          <div>👯 Perfect twins found: <b>${fmt(out.matches[10])}</b> out of ${fmt(ctx.twinCount)}</div>
          <div>🤏 Almost-twins (8 or 9 of 10 traits the same): <b>${fmt(near)}</b></div>
          <div>🦄 The exact chance of a perfect twin is <b>1 in ${fmt(oneIn)}</b>. Your person is one of a kind!</div>`;
      };
      buttons[0].onclick = () => run(true);
      buttons[1].onclick = () => run(false);
    },
  },

  storage: {
    emoji: '💾',
    title: "Your browser's storage closet",
    body: (ctx) => `
      <p>When you clicked <b>Save</b>, we didn't send your person anywhere. They're stored <b>inside your own browser</b>,
      in a little closet called <b>localStorage</b>. Every website gets its own closet, and other websites can't peek in.</p>
      <div class="mathbox">
        <div>🧳 Your gallery holds <b>${ctx.galleryCount}</b> ${ctx.galleryCount === 1 ? 'person' : 'people'}</div>
        <div>📦 It's using <b>${fmt(ctx.galleryBytes)}</b> bytes out of roughly <b>5,000,000</b> bytes of room</div>
      </div>
      <p>The closet can only hold <b>text</b>, so we turn your person into text first with <code>JSON.stringify</code>.
      Even the little picture on the gallery card is stored as text (a very, very long string of letters!).</p>
      ${funFact('Close this tab, turn off your computer, come back tomorrow, and your gallery will still be here. But it only lives on THIS browser on THIS device.')}
      ${seenIt('websites remember your "dark mode" choice or what\'s in a shopping cart using storage just like this.')}
      ${codeBlock(`
localStorage.setItem('roll-a-buddy:gallery', JSON.stringify(people));
const saved = JSON.parse(localStorage.getItem('roll-a-buddy:gallery'));`)}`,
  },

  share: {
    emoji: '🔗',
    title: 'A link that remembers your person',
    body: (ctx) => {
      const url = ctx.lastShareUrl ? new URL(ctx.lastShareUrl) : null;
      return `
      <p>How can a link "contain" a whole person? We packed all <b>10 dice rolls</b> into the link itself! Anyone who opens it rebuilds
      the same person from the same numbers. No server needed!</p>
      ${url ? `<div class="urlparts">
        <span class="u1" title="protocol">${esc(url.protocol)}//</span><span class="u2" title="domain">${esc(url.host)}</span><span class="u3" title="path">${esc(url.pathname)}</span><span class="u4" title="query">${esc(url.search)}</span>
      </div>
      <ul class="legend">
        <li><span class="u1">${esc(url.protocol)}//</span> the <b>protocol</b>: the language of the web. When it says <code>https</code>, the "s" means <b>secure</b> (scrambled so snoops can't read it).</li>
        <li><span class="u2">${esc(url.host)}</span> the <b>domain</b>: which computer to visit.</li>
        <li><span class="u3">${esc(url.pathname)}</span> the <b>path</b>: which page on that computer.</li>
        <li><span class="u4">?p=…</span> the <b>query</b>: extra info for the page. <code>p=${esc(url.searchParams.get('p'))}</code> is your 10 dice rolls!</li>
      </ul>` : ''}
      <p>Each roll became one character. A roll of 10, 11, or 12 (only possible for height) becomes <code>a</code>, <code>b</code>, or <code>c</code> so every roll fits in one spot.</p>
      ${seenIt('when you search YouTube, look at the address bar: <code>?search_query=cats</code>. That\'s a query, too!')}
      ${codeBlock(`
url.searchParams.set('p', totals.join(''));
await navigator.clipboard.writeText(url);  // copy to your clipboard`)}`;
    },
  },

  hosting: {
    emoji: '🚀',
    title: 'How did this website get to you?',
    body: () => `
      <ol class="journey">
        <li><b>✍️ Written:</b> A person (with an AI helper!) wrote the code in files on a computer.</li>
        <li><b>🗂️ Saved in GitHub:</b> The files live on <b>GitHub</b>, a website that keeps every version of code, like an undo history for the whole project.</li>
        <li><b>🤖 Built by a robot:</b> Every time the code changes, a <b>GitHub Action</b> (a robot that follows a checklist) runs a tool called <b>Vite</b>. Vite squishes all our code into a few small, fast files. This is called a <b>build</b>.</li>
        <li><b>🌐 Hosted:</b> The built files go to <b>GitHub Pages</b>, computers that are always on and hand out web pages to anyone who asks. These are called <b>servers</b>.</li>
        <li><b>📬 Delivered:</b> When you typed the address, your browser asked the server for the files, and they traveled to you over the internet, scrambled with <b>HTTPS</b> so nobody could change them on the way.</li>
        <li><b>🧠 Run:</b> Your browser read the HTML, put on the CSS, and started the JavaScript. Everything since then (dice, 3D, saving) happened <b>on your device</b>!</li>
      </ol>
      ${funFact('This site has no database and no server code at all. It\'s called a "static site". That makes it free to host and super fast.')}`,
  },
};

/** Which lesson goes with each roll (same order as ROLLS). */
export const ROLL_LESSONS = ['random', 'lookup', 'color', 'triangles', 'loop', 'odds', 'toon', 'sceneGraph', 'sine', 'api'];
