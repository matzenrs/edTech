import './style.css';
import { ROLLS, outcomeFor, traitsFromTotals } from './rolls.js';
import { rollDieDetailed } from './random.js';
import { createDie } from './dice.js';
import { createStage } from './stage.js';
import { buildCharacter } from './character.js';
import { LESSONS, ROLL_LESSONS } from './lessons.js';
import { fetchName } from './nameApi.js';
import { loadGallery, saveToGallery, removeFromGallery } from './gallery.js';
import { shareUrl, decodePerson, encodePerson } from './share.js';
import { huntTwins as huntOnMainThread, exactTwinChance } from './workers/twinHunt.js';

const $ = (sel) => document.querySelector(sel);
const fmt = (n) => Number(n).toLocaleString('en-US');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const TWIN_COUNT = 5_000_000;

// ---------- State: everything the app needs to remember ----------
const state = {
  records: [], // one per roll: { roll, dice, raws, total, outcome }
  name: null,
  nameResult: null,
  busy: false,
};
const totals = () => state.records.map((r) => r.total);

// ---------- Behind-the-scenes log ----------
const logList = $('#log-list');
function log(icon, text) {
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  li.innerHTML = `<time>${time}</time><span>${icon}</span><span>${esc(text)}</span>`;
  logList.prepend(li);
  while (logList.children.length > 60) logList.lastChild.remove();
}

// ---------- 3D stage ----------
const stage = createStage($('#stage'));
function rebuild({ pop = true } = {}) {
  const person = buildCharacter(traitsFromTotals(totals()));
  stage.setCharacter(person, { pop });
  let meshes = 0;
  person.traverse((o) => o.isMesh && !o.userData.isOutline && meshes++);
  return meshes;
}
rebuild({ pop: false });

// ---------- Lessons ----------
const lessonEl = $('#lesson');
let cleanupLesson = null;
let currentLesson = null;
const lessonCtx = {
  stage,
  log,
  lastRoll: null,
  twinCount: TWIN_COUNT,
  huntTwins,
  galleryCount: 0,
  galleryBytes: 0,
};

function showLesson(id, extra = {}) {
  Object.assign(lessonCtx, extra);
  cleanupLesson?.();
  cleanupLesson = null;
  currentLesson = id;
  const lesson = LESSONS[id];
  lessonEl.innerHTML = `
    <header><span class="lesson-emoji">${lesson.emoji}</span>
      <div><small>🔍 Under the Hood</small><h2>${lesson.title}</h2></div></header>
    <div class="lesson-body">${lesson.body(lessonCtx)}</div>`;
  cleanupLesson = lesson.mount?.(lessonEl, lessonCtx) || null;
  lessonEl.classList.remove('flash');
  void lessonEl.offsetWidth; // restart the CSS animation
  lessonEl.classList.add('flash');
}

// ---------- Progress bubbles ----------
const progressEl = $('#progress');
ROLLS.forEach((roll, i) => {
  const b = document.createElement('button');
  b.className = 'bubble';
  b.innerHTML = `<span>${roll.emoji}</span><small>${i + 1}</small>`;
  b.title = `Roll ${i + 1}: ${roll.title}`;
  b.onclick = () => {
    const rec = state.records[i];
    if (rec) showLesson(ROLL_LESSONS[i], { lastRoll: rec, nat: rec.outcome.value });
  };
  progressEl.appendChild(b);
});

function updateProgress() {
  [...progressEl.children].forEach((b, i) => {
    b.classList.toggle('done', i < state.records.length);
    b.classList.toggle('current', i === state.records.length);
    b.disabled = i >= state.records.length;
  });
}

// ---------- Rolling ----------
const dice = [createDie(), createDie()];
const diceEl = $('#dice');
const rollBtn = $('#roll-btn');
const autoBtn = $('#auto-btn');
const resultEl = $('#result');

function prepareNextRoll() {
  const i = state.records.length;
  updateProgress();
  if (i >= ROLLS.length) return;
  const roll = ROLLS[i];
  $('#roll-title').innerHTML = `Roll ${i + 1} of ${ROLLS.length}: <b>${roll.emoji} ${roll.title}</b>`;
  $('#roll-hint').textContent =
    roll.dice === 2 ? 'This one uses TWO dice. Add them up!' : `Roll one die. Each number gives a different ${roll.title.toLowerCase()}.`;
  diceEl.replaceChildren(...dice.slice(0, roll.dice).map((d) => d.el));
  rollBtn.textContent = `🎲 Roll for ${roll.title}!`;
}

async function doRoll({ fast = false } = {}) {
  const i = state.records.length;
  if (i >= ROLLS.length) return;
  const roll = ROLLS[i];
  const results = Array.from({ length: roll.dice }, () => rollDieDetailed(6));
  const faces = results.map((r) => r.face);
  const total = faces.reduce((a, b) => a + b, 0);

  await Promise.all(faces.map((f, k) => dice[k].roll(f, fast ? 380 : 900)));

  const outcome = outcomeFor(roll, total);
  const record = { roll, dice: faces, raws: results.map((r) => r.raw), total, outcome };
  state.records.push(record);

  log('🎲', `crypto.getRandomValues → ${results.map((r) => fmt(r.raw)).join(' & ')} → rolled ${faces.join(' + ')}${roll.dice > 1 ? ` = ${total}` : ''}`);
  resultEl.innerHTML = `You rolled <b>${roll.dice > 1 ? `${faces.join(' + ')} = ${total}` : total}</b> → ${roll.emoji} <b>${esc(outcome.label)}</b>!`;

  if (roll.key === 'name') {
    showLesson('api', { lastRoll: record, nat: outcome.value, nameResult: null });
    await getName(outcome.value);
  } else {
    const meshes = rebuild();
    log('🧱', `Rebuilt the 3D person: ${meshes} shapes, ${roll.title.toLowerCase()} = "${outcome.label}"`);
    showLesson(ROLL_LESSONS[i], { lastRoll: record });
  }
  prepareNextRoll();
  if (state.records.length === ROLLS.length) finish();
}

async function getName(nat) {
  const seed = `rab${encodePerson(totals())}`;
  log('📡', `GET randomuser.me/api/?nat=${nat}&seed=${seed} …`);
  const result = await fetchName(nat, seed);
  if (result.source === 'api') log('✅', `${result.status} OK from randomuser.me in ${result.ms} ms (${fmt(result.bytes)} bytes of JSON)`);
  else log('⚠️', `Name API ${result.error} → using the built-in backup names`);
  state.nameResult = result;
  state.name = `${result.first} ${result.last}`;
  if (currentLesson === 'api') showLesson('api', { nameResult: result });
}

async function runRolls(fast) {
  if (state.busy) return;
  state.busy = true;
  rollBtn.disabled = autoBtn.disabled = true;
  try {
    do await doRoll({ fast });
    while (fast && state.records.length < ROLLS.length);
  } finally {
    state.busy = false;
    rollBtn.disabled = autoBtn.disabled = false;
  }
}
rollBtn.onclick = () => runRolls(false);
autoBtn.onclick = () => runRolls(true);

// ---------- Finale ----------
function finish({ fromLink = false } = {}) {
  $('#roll-card').hidden = true;
  const finale = $('#finale');
  finale.hidden = false;
  $('#meet-name').textContent = state.name || 'Mystery Buddy';
  $('#traits').innerHTML = state.records
    .filter((r) => r.roll.key !== 'name')
    .map((r) => `<li><span>${r.roll.emoji}</span><small>${r.roll.title}</small><b>${esc(r.outcome.label)}</b></li>`)
    .join('');
  if (!fromLink) confetti();
}

function resetPerson() {
  state.records = [];
  state.name = state.nameResult = null;
  $('#finale').hidden = true;
  $('#roll-card').hidden = false;
  resultEl.textContent = '';
  history.replaceState(null, '', window.location.pathname);
  rebuild();
  prepareNextRoll();
  dice.forEach((d) => d.show(1));
  showLesson('random', { lastRoll: null });
  log('🔄', 'Started a new person: state.records = []');
}

$('#new-btn').onclick = resetPerson;

$('#save-btn').onclick = () => {
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: state.name,
    code: encodePerson(totals()),
    img: stage.snapshot(),
    savedAt: Date.now(),
  };
  const { ok, list, bytes } = saveToGallery(entry);
  if (ok) log('💾', `localStorage.setItem("roll-a-buddy:gallery") → ${fmt(bytes)} bytes saved`);
  else log('⚠️', 'localStorage is blocked here (maybe a private window?), so we could not save');
  renderGallery(list);
  showLesson('storage', { galleryCount: list.length, galleryBytes: bytes });
  toast(ok ? `💾 Saved ${state.name} to your gallery!` : '😕 Your browser blocked saving');
};

$('#share-btn').onclick = async () => {
  const url = shareUrl(totals(), state.name);
  history.replaceState(null, '', url);
  try {
    await navigator.clipboard.writeText(url);
    log('📋', 'navigator.clipboard.writeText(link) → copied!');
    toast('🔗 Link copied! Paste it to a friend.');
  } catch {
    log('📋', 'Clipboard was blocked, so the link is in the address bar instead');
    toast('🔗 The link is in your address bar. Copy it from there!');
  }
  showLesson('share', { lastShareUrl: url });
};

$('#twin-btn').onclick = () => showLesson('worker');

// The Twin Hunter, run either by a Web Worker helper or by the main thread.
let worker = null;
function huntTwins(useWorker, onProgress) {
  const t = totals();
  const exactChance = exactTwinChance(t);
  if (!useWorker) {
    log('🥶', `Main thread is counting ${fmt(TWIN_COUNT)} people… nothing else can happen until it's done!`);
    return new Promise((resolve) =>
      // Wait two frames so the "counting…" message can appear before the freeze.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const start = performance.now();
          const matches = huntOnMainThread(t, TWIN_COUNT);
          const ms = Math.round(performance.now() - start);
          log('🥶', `Main thread finished in ${fmt(ms)} ms, and the animation was frozen the whole time`);
          resolve({ matches, ms, exactChance });
        }),
      ),
    );
  }
  worker ??= new Worker(new URL('./workers/twinWorker.js', import.meta.url), { type: 'module' });
  log('👷', `new Worker("twinWorker.js").postMessage({ count: ${fmt(TWIN_COUNT)} })`);
  return new Promise((resolve) => {
    worker.onmessage = (e) => {
      if (e.data.type === 'progress') onProgress(e.data.fraction);
      else {
        log('👷', `Worker says "done!" after ${fmt(e.data.ms)} ms. The page stayed smooth the whole time`);
        resolve({ matches: e.data.matches, ms: e.data.ms, exactChance });
      }
    };
    worker.postMessage({ totals: t, count: TWIN_COUNT });
  });
}

// ---------- Load a whole person at once (from a link or the gallery) ----------
async function loadPerson(code, name) {
  const t = decodePerson(code);
  if (!t) return false;
  state.records = t.map((total, i) => ({ roll: ROLLS[i], dice: [], raws: [], total, outcome: outcomeFor(ROLLS[i], total) }));
  state.name = name || null;
  rebuild();
  updateProgress();
  if (!state.name) await getName(state.records[ROLLS.length - 1].outcome.value);
  finish({ fromLink: true });
  return true;
}

// ---------- Gallery ----------
function renderGallery(list = loadGallery()) {
  const el = $('#gallery-list');
  $('#gallery-empty').hidden = list.length > 0;
  el.innerHTML = list
    .map(
      (p) => `<li>
        <button class="card" data-load="${p.id}" title="Bring ${esc(p.name)} back">
          <img src="${p.img}" alt="${esc(p.name)}" /><span>${esc(p.name)}</span>
        </button>
        <button class="remove" data-remove="${p.id}" aria-label="Remove ${esc(p.name)}">✕</button>
      </li>`,
    )
    .join('');
}
$('#gallery-list').addEventListener('click', async (e) => {
  const list = loadGallery();
  const removeId = e.target.closest('[data-remove]')?.dataset.remove;
  if (removeId) {
    renderGallery(removeFromGallery(removeId));
    log('🗑️', 'localStorage.setItem: removed one person from the gallery');
    return;
  }
  const loadId = e.target.closest('[data-load]')?.dataset.load;
  const entry = list.find((p) => p.id === loadId);
  if (entry && !state.busy) {
    log('📂', `localStorage.getItem → brought back ${entry.name} (code ${entry.code})`);
    await loadPerson(entry.code, entry.name);
    showLesson('storage', { galleryCount: list.length, galleryBytes: JSON.stringify(list).length * 2 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// ---------- Little extras ----------
let toastTimer;
function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function confetti() {
  const colors = ['#ff7eb6', '#7b5cff', '#ffd23f', '#2ec4f1', '#9be15d', '#ff9f68'];
  const box = document.createElement('div');
  box.className = 'confetti';
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    p.style.animationDuration = `${1.8 + Math.random() * 1.4}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3800);
}

// The hosting lesson lives at the bottom of the page all the time.
$('#hosting').innerHTML = `<h2>${LESSONS.hosting.emoji} ${LESSONS.hosting.title}</h2>${LESSONS.hosting.body()}`;

// ---------- Start! ----------
log('📄', `Page loaded: HTML, CSS, and JavaScript ready in ${fmt(Math.round(performance.now()))} ms`);
log('🖥️', 'WebGL is on: your GPU is drawing the 3D stage');
renderGallery();
prepareNextRoll();
dice.forEach((d) => d.show(1));

const params = new URLSearchParams(window.location.search);
if (params.get('p')) {
  loadPerson(params.get('p'), params.get('n')).then((ok) => {
    if (ok) {
      log('🔗', `Rebuilt a shared person from the link: ?p=${params.get('p')}`);
      showLesson('share', { lastShareUrl: window.location.href });
      toast('👋 Someone shared a buddy with you!');
    } else {
      showLesson('welcome');
    }
  });
} else {
  showLesson('welcome');
}
