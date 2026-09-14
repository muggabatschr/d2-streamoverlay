// Overlay-Logik (für OBS). Rein passiv: empfängt State vom Server und rendert
// Akt/Ziel, Run-Counter und gefundene Items. Keine Bedienelemente.
//
// Mehrsprachigkeit: statische Texte über i18n.js (UI-Sprache), Spieldaten (Item-/
// Boss-/Zonennamen) aus /api/* nach dataLang lokalisiert.

import { createClient, buildItemIcon, formatDuration } from './shared/ws-client.js';
import { t, applyTranslations, setUiLang } from './shared/i18n.js';

const el = {
  target: document.getElementById('target'),
  counter: document.getElementById('counter'),
  statsBox: document.getElementById('stats-box'),
  todayCount: document.getElementById('today-count'),
  todayTime: document.getElementById('today-time'),
  totalCount: document.getElementById('total-count'),
  totalTime: document.getElementById('total-time'),
  historyBox: document.getElementById('history-box'),
  history: document.getElementById('history'),
  itemsBox: document.getElementById('items-box'),
  items: document.getElementById('items'),
  tzBox: document.getElementById('tz-box'),
  tzTitle: document.getElementById('tz-title'),
  tzCurrent: document.getElementById('tz-current'),
  tzNext: document.getElementById('tz-next'),
  contest: document.getElementById('contest'),
  contestLabel: document.getElementById('contest-label'),
  contestTime: document.getElementById('contest-time'),
  contestNote: document.getElementById('contest-note'),
};

let targets = [];
let items = [];
let zones = {};
let dataLang = 'de';
let lastCount = null;
let lastState = null; // für den Sekunden-Tick der Live-Zeiten

// Funde-Laufband: wie viele jüngste Funde durchlaufen + Tempo (Sekunden pro Item,
// damit die Lesegeschwindigkeit unabhängig von der Anzahl konstant bleibt).
const MAX_TICKER_ITEMS = 30;
const TICKER_SECONDS_PER_ITEM = 3;
const MAX_VISIBLE_HISTORY = 6;

// Wettbewerb-Timer: ab wann die Restzeit farblich warnt (5 Min) bzw. die letzte
// Minute zusätzlich pulsiert.
const CONTEST_WARN_MS = 5 * 60 * 1000;
const CONTEST_FINAL_MS = 60 * 1000;

async function loadData() {
  try {
    const [tg, it, z] = await Promise.all([
      fetch('api/targets').then((r) => r.json()),
      fetch('api/items').then((r) => r.json()),
      fetch('api/zones').then((r) => r.json()),
    ]);
    targets = tg;
    items = it;
    zones = z;
  } catch {
    targets = [];
    items = [];
    zones = {};
  }
}

function targetById(id) {
  return targets.find((t) => t.id === id) || null;
}
function itemById(id) {
  return items.find((i) => i.id === id) || null;
}
function dataName(rec) {
  if (!rec) return '';
  if (rec.names) return rec.names[dataLang] ?? rec.names.de ?? rec.names.en ?? rec.id;
  return rec.name ?? '';
}
function zoneName(id) {
  const z = zones[id];
  return (z && (z[dataLang] ?? z.de ?? z.en)) || `Zone ${id}`;
}
function iconView(rec) {
  return { icon: rec.icon, quality: rec.quality, name: dataName(rec), rune: rec.rune };
}

// Live-Farm-Zeit eines Ziels: akkumulierte farmMs plus laufende Zeit, falls es
// gerade das aktive (und nicht pausierte) Ziel ist.
function liveFarmMs(state, id) {
  if (!state || !id) return 0;
  const run = state.runs?.[id];
  let ms = run?.farmMs ?? 0;
  if (id === state.activeTargetId && state.activeSince != null && !state.paused) {
    ms += Date.now() - state.activeSince;
  }
  return ms;
}

// Lokaler Tagesschlüssel YYYY-MM-DD — identisch zur Server-Logik.
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function aggregateTotals(state) {
  const runs = state.runs || {};
  const today = todayKey();
  let todayCount = 0;
  let todayMs = 0;
  let totalCount = 0;
  let totalMs = 0;
  for (const r of Object.values(runs)) {
    totalCount += r.count ?? 0;
    totalMs += r.farmMs ?? 0;
    const d = r.days?.[today];
    if (d) {
      todayCount += d.count ?? 0;
      todayMs += d.farmMs ?? 0;
    }
  }
  if (state.activeTargetId && state.activeSince != null && !state.paused) {
    const live = Date.now() - state.activeSince;
    todayMs += live;
    totalMs += live;
  }
  return { todayCount, todayMs, totalCount, totalMs };
}

function renderSummary(state) {
  const { todayCount, todayMs, totalCount, totalMs } = aggregateTotals(state);
  el.todayCount.textContent = String(todayCount);
  el.todayTime.textContent = formatDuration(todayMs);
  el.totalCount.textContent = String(totalCount);
  el.totalTime.textContent = formatDuration(totalMs);
}

// Verlauf: bereits angefahrene Ziele, neueste zuerst, mit Counter und Farm-Zeit.
function renderHistory(state) {
  const runs = state.runs || {};
  const entries = Object.entries(runs)
    .map(([id, r]) => ({ id, ...r }))
    .filter((e) => targetById(e.id))
    .sort((a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0))
    .slice(0, MAX_VISIBLE_HISTORY);

  el.history.innerHTML = '';
  for (const e of entries) {
    const tgt = targetById(e.id);
    const li = document.createElement('li');
    li.className = 'history-row';
    if (e.id === state.activeTargetId) li.classList.add('active');

    const name = document.createElement('span');
    name.className = 'hname';
    name.textContent = dataName(tgt);

    const count = document.createElement('span');
    count.className = 'hcount';
    count.textContent = t('count.times', { count: e.count ?? 0 });

    const time = document.createElement('span');
    time.className = 'htime';
    time.dataset.timeFor = e.id;
    time.textContent = formatDuration(liveFarmMs(state, e.id));

    li.append(name, count, time);
    el.history.appendChild(li);
  }
}

// Restzeit des Wettbewerb-Timers. Läuft er, wird aus dem absoluten Endzeitpunkt
// gerechnet — damit stimmt die Anzeige auch zwischen zwei State-Updates (der
// Server broadcastet den Countdown bewusst nicht im Sekundentakt).
function contestRemainingMs(c) {
  if (!c) return 0;
  if (c.running && c.endsAt != null) return Math.max(0, c.endsAt - Date.now());
  return Math.max(0, c.remainingMs ?? 0);
}

// Wettbewerb-Timer als erstes Panel der Overlay-Spalte. Ausgeschaltet verschwindet
// das Panel komplett, die übrigen Boxen rücken dann einfach nach oben.
function renderContest(state) {
  const c = state.contest;
  const visible = !!c?.show;
  el.contest.classList.toggle('hidden', !visible);
  if (!visible) return;

  const ms = contestRemainingMs(c);
  const expired = !c.running && ms <= 0;
  el.contestLabel.textContent = c.label || '';
  el.contestTime.textContent = formatDuration(ms);
  el.contestNote.classList.toggle('hidden', !expired);
  el.contest.classList.toggle('paused', !c.running && !expired);
  el.contest.classList.toggle('warn', c.running && ms <= CONTEST_WARN_MS && ms > CONTEST_FINAL_MS);
  el.contest.classList.toggle('final', c.running && ms <= CONTEST_FINAL_MS);
  el.contest.classList.toggle('expired', expired);
}

// Terror-Zone: aktuelle/nächste Zone mit gewähltem Label. Bei Modus 'off' (oder
// fehlenden Daten) bleibt das Panel ausgeblendet.
function renderTz(state) {
  const mode = state.settings?.tzMode || 'off';
  const tz = state.terrorZone;
  if (mode === 'off' || !tz) {
    el.tzBox.classList.add('hidden');
    return;
  }
  el.tzBox.classList.remove('hidden');
  el.tzTitle.textContent = mode === 'season' ? t('tz.titleSeason') : t('tz.titleNonSeason');
  el.tzCurrent.textContent = tz.currentIds?.length ? tz.currentIds.map(zoneName).join(' · ') : '—';
  el.tzNext.textContent = tz.nextIds?.length ? tz.nextIds.map(zoneName).join(' · ') : '—';
}

function render(state) {
  lastState = state;
  // Sprachen aus dem State übernehmen.
  dataLang = state.settings?.dataLang || 'de';
  setUiLang(state.settings?.uiLang || 'de');
  applyTranslations();

  // Header
  const target = state.activeTargetId ? targetById(state.activeTargetId) : null;
  el.target.textContent = target ? dataName(target) : t('overlay.noTarget');

  // Terror-Zone
  renderTz(state);

  // Wettbewerb-Timer (eigene Ebene über allem)
  renderContest(state);

  // Counter (mit Pop-Animation bei Änderung)
  const count = state.activeTargetId ? state.runs?.[state.activeTargetId]?.count ?? 0 : 0;
  el.counter.textContent = String(count);
  if (lastCount !== null && count !== lastCount) {
    el.counter.classList.remove('pop');
    void el.counter.offsetWidth; // reflow erzwingen
    el.counter.classList.add('pop');
  }
  lastCount = count;

  renderSummary(state);
  renderHistory(state);

  // Sichtbarkeit über Settings (Runs/Heute/Gesamt teilen sich den Counter-Toggle)
  el.statsBox.classList.toggle('hidden', state.settings?.showCounter === false);
  el.historyBox.classList.toggle('hidden', state.settings?.showHistory === false);

  // Funde-Laufband
  renderTicker(state);
}

// Baut eine Fund-Kachel (Icon + Name [+ Anzahl]) für das Laufband.
function buildTickerItem(item) {
  const cat = item.itemId ? itemById(item.itemId) : null;
  const view = cat
    ? iconView(cat)
    : { icon: item.icon, quality: item.quality, name: item.name, rune: item.rune };
  const el = document.createElement('span');
  el.className = 'ticker-item';
  el.appendChild(buildItemIcon(view));
  const name = document.createElement('span');
  name.className = `item-name q-${item.quality || 'unique'}`;
  name.textContent = cat ? dataName(cat) : item.name;
  el.appendChild(name);
  // Zusatz (Skiller-Affix / Facet-Wert), falls beim Loggen erfasst.
  if (item.variant) {
    const variant = document.createElement('span');
    variant.className = 'ticker-variant';
    variant.textContent = item.variant;
    el.appendChild(variant);
  }
  const qty = item.qty ?? 1;
  if (qty > 1) {
    const badge = document.createElement('span');
    badge.className = 'qty-badge';
    badge.textContent = t('count.times', { count: qty });
    el.appendChild(badge);
  }
  return el;
}

// Rendert das Laufband: jüngste Funde als eine durchlaufende Zeile. Für die
// nahtlose Endlosschleife wird die Item-Gruppe doppelt gerendert und die Spur per
// CSS um -50% verschoben (animationsfähig, da beide Gruppen identisch breit sind).
// Bei Modus "Funde aus" oder ohne Funde bleibt das Laufband ausgeblendet.
function renderTicker(state) {
  const items = (state.foundItems || []).slice(0, MAX_TICKER_ITEMS);
  const hidden = state.settings?.showItems === false || items.length === 0;
  el.itemsBox.classList.toggle('hidden', hidden);
  el.items.innerHTML = '';
  if (hidden) return;

  const makeGroup = () => {
    const g = document.createElement('div');
    g.className = 'ticker-group';
    for (const item of items) g.appendChild(buildTickerItem(item));
    return g;
  };
  // Zwei identische Gruppen -> -50%-Schleife ohne sichtbaren Sprung.
  el.items.append(makeGroup(), makeGroup());
  // Tempo proportional zur Anzahl (konstante Lesegeschwindigkeit).
  el.items.style.animationDuration = `${items.length * TICKER_SECONDS_PER_ITEM}s`;
}

// Sekündliches Aktualisieren der Live-Farmzeiten, ohne auf das nächste State-Update zu warten.
function tickTimes() {
  if (!lastState) return;
  renderSummary(lastState);
  renderContest(lastState);
  for (const span of el.history.querySelectorAll('[data-time-for]')) {
    span.textContent = formatDuration(liveFarmMs(lastState, span.dataset.timeFor));
  }
}
setInterval(tickTimes, 1000);

applyTranslations(); // statische Defaults (Deutsch) sofort anwenden
await loadData();
createClient({ onState: render });
