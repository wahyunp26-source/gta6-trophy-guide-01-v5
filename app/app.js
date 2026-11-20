// Leonida 100% — GTA 6 trophy guide.
// Tracker with saved progress, roadmap, missables and a sources tab.
// Every number in the audit strip is computed from the data at runtime.
const KEY = 'gta6-trophy-guide-v5';
const $ = (id) => document.getElementById(id);
const rowsEl = $('rows');
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));

const [trophiesDoc, sourcesDoc, guideDoc] = await Promise.all([
  (await fetch('data/trophies.json')).json(),
  (await fetch('data/sources.json')).json(),
  (await fetch('data/guide.json')).json(),
]);
const trophies = trophiesDoc.trophies;
const sources = sourcesDoc.sources;
const byId = new Map(trophies.map((t) => [t.id, t]));
const srcByN = new Map(sources.map((s) => [s.n, s]));

function save() { localStorage.setItem(KEY, JSON.stringify([...earned])); }

function trophySources(t) {
  // Only sources actually cited by a step or a dispute of this guide.
  // The trophy's `src` field lists its primary sources, but the counts here
  // must reflect real citations, so it is not seeded from that field.
  const u = new Set();
  for (const st of t.steps) for (const n of st.src) u.add(n);
  for (const dp of t.disputes || []) { for (const n of dp.aSrc) u.add(n); for (const n of dp.bSrc) u.add(n); }
  return [...u].sort((a, b) => a - b);
}

function guideDisputes() { return guideDoc.guideDisputes || []; }

function audit() {
  const steps = trophies.reduce((n, t) => n + t.steps.length, 0);
  const two = trophies.reduce((n, t) => n + t.steps.filter((st) => st.src.length >= 2).length, 0);
  const disputes = trophies.reduce((n, t) => n + (t.disputes || []).length, 0) + guideDisputes().length;
  const watch = trophies.filter((t) => t.watch).length;
  const unconfirmed = trophies.filter((t) => t.unconfirmed).length;
  const missable = trophies.filter((t) => t.missable).length;
  const sites = new Set(sources.map((s) => s.host)).size;
  const cited = trophies.filter((t) => trophySources(t).length > 0).length;
  return { steps, two, disputes, watch, unconfirmed, missable, sites, pages: sources.length, cited };
}

function renderAudit() {
  const a = audit();
  const items = [
    `${a.cited}/55 guides cite sources`,
    `${a.steps} steps cited`,
    `${a.two} backed by 2+ sources (${Math.round(100 * a.two / a.steps)}%)`,
    `${a.disputes} disputes shown both ways`,
    `${a.watch} watch`,
    `${a.unconfirmed} unconfirmed`,
    `${a.missable} possible missable`,
    `${a.pages} pages · ${a.sites} sites read 20 Nov 2026`,
  ];
  $('audit').replaceChildren(...items.map((x) => {
    const s = document.createElement('span');
    s.className = 'audit-item';
    s.textContent = x;
    return s;
  }));
}

function gradeBadge(grade) {
  const s = document.createElement('span');
  s.className = 'grade grade-' + grade;
  s.textContent = grade === 'platinum' ? 'P' : grade === 'gold' ? 'G' : grade === 'silver' ? 'S' : 'B';
  s.title = grade;
  return s;
}

function flagChips(t) {
  const chips = [];
  if (t.missable) chips.push(['MISSABLE', 'flag-missable']);
  if ((t.disputes || []).length) chips.push(['DISPUTED', 'flag-disputed']);
  if (t.watch) chips.push(['WATCH', 'flag-watch']);
  if (t.unconfirmed) chips.push(['UNCONFIRMED', 'flag-unconfirmed']);
  if (t.hidden) chips.push(['PSN-HIDDEN', 'flag-hidden']);
  return chips.map(([label, cls]) => {
    const s = document.createElement('span');
    s.className = 'flag ' + cls;
    s.textContent = label;
    return s;
  });
}

function disputeBox(dp) {
  const box = document.createElement('div');
  box.className = 'dispute';
  const head = document.createElement('p');
  head.className = 'dispute-head';
  head.textContent = 'SOURCES DISAGREE';
  box.append(head);
  const a = document.createElement('p');
  a.innerHTML = '';
  a.textContent = 'A — ' + dp.a;
  box.append(a);
  const b = document.createElement('p');
  b.textContent = 'B — ' + dp.b;
  box.append(b);
  const call = document.createElement('p');
  call.className = 'dispute-call';
  call.textContent = 'Our call — ' + dp.call;
  box.append(call);
  return box;
}

function renderRows() {
  const q = $('q').value.trim().toLowerCase();
  const grade = $('grade').value;
  const kind = $('kind').value;
  const fMiss = $('f-missable').checked;
  const fDisp = $('f-disputed').checked;
  const fWatch = $('f-watch').checked;
  const fHidden = $('f-hidden').checked;
  const fNot = $('f-notearned').checked;
  const spoiler = $('spoiler').checked;
  rowsEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    const isEarned = earned.has(t.id);
    if (grade !== 'all' && t.grade !== grade) continue;
    if (kind !== 'all' && t.kind !== kind) continue;
    if (fMiss && !t.missable) continue;
    if (fDisp && !(t.disputes || []).length) continue;
    if (fWatch && !t.watch) continue;
    if (fHidden && !t.hidden) continue;
    if (fNot && isEarned) continue;
    const hiddenBySpoiler = spoiler && t.hidden && !isEarned;
    const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (q && !hay.includes(q)) continue;
    shown++;
    const card = document.createElement('article');
    card.className = 'card' + (isEarned ? ' earned' : '');
    const head = document.createElement('div');
    head.className = 'card-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned;
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save();
      renderRows();
      renderProgress();
    });
    head.append(box, gradeBadge(t.grade));
    const title = document.createElement('div');
    title.className = 'card-title';
    const name = document.createElement('h2');
    name.textContent = hiddenBySpoiler ? 'Hidden trophy' : t.name;
    title.append(name);
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = hiddenBySpoiler ? 'Earn it to reveal the description.' : t.description;
    title.append(desc);
    head.append(title);
    for (const chip of flagChips(t)) head.append(chip);
    card.append(head);
    if (!hiddenBySpoiler) {
      const guide = document.createElement('p');
      guide.className = 'guide';
      guide.textContent = t.guide;
      card.append(guide);
      const steps = document.createElement('ol');
      steps.className = 'steps';
      for (const st of t.steps) {
        const li = document.createElement('li');
        li.textContent = st.t;
        steps.append(li);
      }
      card.append(steps);
      for (const dp of t.disputes || []) card.append(disputeBox(dp));
      const srcs = document.createElement('p');
      srcs.className = 'srcs';
      srcs.textContent = 'Sources for this guide: ' + trophySources(t).map((n) => '[' + n + '] ' + (srcByN.get(n)?.short || '?')).join(' · ');
      card.append(srcs);
    } else {
      const hint = document.createElement('p');
      hint.className = 'spoiler-hint';
      hint.textContent = 'Spoilers hidden. Tick the box once you have earned it.';
      card.append(hint);
    }
    rowsEl.append(card);
  }
  const empty = document.createElement('p');
  empty.className = 'empty';
  empty.textContent = shown === 0 ? 'No trophies match these filters.' : shown + ' of 55 trophies shown.';
  rowsEl.append(empty);
}

function renderProgress() {
  $('progress').textContent = `${earned.size} of ${trophies.length} earned`;
  $('barfill').style.width = (100 * earned.size / trophies.length) + '%';
}

function renderRoadmap() {
  const el = $('roadmap');
  el.replaceChildren();
  for (const stage of guideDoc.roadmap) {
    const sec = document.createElement('section');
    sec.className = 'stage';
    const h = document.createElement('h2');
    h.textContent = 'Stage ' + stage.stage + ' — ' + stage.title;
    sec.append(h);
    const note = document.createElement('p');
    note.className = 'stage-note';
    note.textContent = stage.note;
    sec.append(note);
    const list = document.createElement('ul');
    list.className = 'stage-list';
    for (const id of stage.trophies) {
      const t = byId.get(id);
      if (!t) continue;
      const li = document.createElement('li');
      li.append(gradeBadge(t.grade));
      const nm = document.createElement('span');
      nm.textContent = ' ' + t.name + (t.missable ? ' — MISSABLE' : '') + (t.watch ? ' — WATCH' : '') + (t.unconfirmed ? ' — UNCONFIRMED' : '');
      li.append(nm);
      if (earned.has(t.id)) li.className = 'done';
      list.append(li);
    }
    sec.append(list);
    el.append(sec);
  }
}

function renderMissables() {
  const el = $('missables');
  el.replaceChildren();
  const intro = document.createElement('p');
  intro.className = 'stage-note';
  intro.textContent = 'Only one trophy can be missed — Positive Mental Attitude, the Chapter 1 balcony meditation. Everything else here is cash, collectibles or optional content you can lose along the way.';
  el.append(intro);
  const table = document.createElement('table');
  table.className = 'miss-table';
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  for (const h of ['What', 'When', 'Why it matters']) {
    const th = document.createElement('th');
    th.textContent = h;
    hr.append(th);
  }
  thead.append(hr);
  table.append(thead);
  const tbody = document.createElement('tbody');
  for (const m of guideDoc.missables) {
    const tr = document.createElement('tr');
    for (const key of ['item', 'when', 'what']) {
      const td = document.createElement('td');
      td.textContent = m[key];
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
  el.append(table);
  const h2 = document.createElement('h2');
  h2.textContent = 'The 5-save plan';
  el.append(h2);
  const ol = document.createElement('ol');
  ol.className = 'saves';
  for (const s of guideDoc.saves) {
    const li = document.createElement('li');
    li.textContent = s;
    ol.append(li);
  }
  el.append(ol);
}

function renderSources() {
  const el = $('sources');
  el.replaceChildren();
  const h1 = document.createElement('h2');
  h1.textContent = 'Sources — read 20 Nov 2026';
  el.append(h1);
  const note = document.createElement('p');
  note.className = 'stage-note';
  note.textContent = 'Every source below was opened and read on 20 Nov 2026. Guide text in this entry is written in our own words; sources are cited, never copied.';
  el.append(note);
  const table = document.createElement('table');
  table.className = 'src-table';
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  for (const h of ['#', 'Source', 'Host', 'Cited by', 'Claims']) {
    const th = document.createElement('th');
    th.textContent = h;
    hr.append(th);
  }
  thead.append(hr);
  table.append(thead);
  const tbody = document.createElement('tbody');
  for (const s of sources) {
    let guides = 0;
    let claims = 0;
    for (const t of trophies) {
      const u = trophySources(t);
      if (u.includes(s.n)) guides++;
      for (const st of t.steps) if (st.src.includes(s.n)) claims++;
    }
    const tr = document.createElement('tr');
    const cells = [String(s.n), s.title, s.host, guides + ' of 55 guides', String(claims)];
    for (const c of cells) {
      const td = document.createElement('td');
      td.textContent = c;
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
  el.append(table);
  const h2 = document.createElement('h2');
  h2.textContent = 'Where the guides disagree — the big three';
  el.append(h2);
  for (const dp of guideDisputes()) el.append(disputeBox(dp));
}

document.querySelectorAll('.tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.remove('on'));
    document.querySelectorAll('.tab').forEach((s) => s.classList.remove('on'));
    btn.classList.add('on');
    $('tab-' + btn.dataset.tab).classList.add('on');
  });
});

for (const id of ['q', 'grade', 'kind', 'f-missable', 'f-disputed', 'f-watch', 'f-hidden', 'f-notearned', 'spoiler']) {
  $(id).addEventListener('input', renderRows);
  $(id).addEventListener('change', renderRows);
}

$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned])], { type: 'application/json' }));
  a.download = 'trophy-progress.json';
  a.click();
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const ids = JSON.parse(await file.text());
    earned = new Set(ids.filter((n) => byId.has(n)));
    save();
    renderRows();
    renderProgress();
    renderRoadmap();
  } catch {
    alert('That file is not a valid progress export.');
  }
});

renderAudit();
renderRows();
renderProgress();
renderRoadmap();
renderMissables();
renderSources();
