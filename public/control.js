// Steuerpanel-Logik: Ziel wählen, Counter bedienen, Items erfassen/entfernen,
// Anzeige-Toggles, Sprachen. Sendet Aktionen an den Server und rendert den
// zurückgespielten State (Single Source of Truth ist der Server).
//
// Mehrsprachigkeit: statische UI-Texte über i18n.js (UI-Sprache), Spieldaten
// (Item-/Boss-/Zonennamen) aus /api/* in allen Sprachen, Auswahl per dataLang.

import { createClient, buildItemIcon, formatDuration } from './shared/ws-client.js';
import { t, applyTranslations, setUiLang, getUiLang } from './shared/i18n.js';

// Locale je UI-Sprache für die Datums-/Zeitformatierung im Fund-Logbuch.
const LOCALES = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', es: 'es-ES', zh: 'zh-CN' };

// Gängige Skiller-Zweitaffixe als Vorgaben (Freitext bleibt zusätzlich möglich).
const AFFIXES = {
  de: ['Leben', 'Mana', 'Alle Widerstände', 'FHR', 'Verteidigung', 'Feuerwiderstand', 'Kältewiderstand', 'Blitzwiderstand', 'Giftwiderstand'],
  en: ['Life', 'Mana', 'All Resist', 'FHR', 'Defense', 'Fire Res', 'Cold Res', 'Lightning Res', 'Poison Res'],
  fr: ['Vie', 'Mana', 'Toutes résistances', 'FHR', 'Défense', 'Rés. feu', 'Rés. froid', 'Rés. foudre', 'Rés. poison'],
  es: ['Vida', 'Maná', 'Toda resistencia', 'FHR', 'Defensa', 'Res. fuego', 'Res. frío', 'Res. rayo', 'Res. veneno'],
  zh: ['生命', '魔法', '全抗性', '快速打击恢复', '防御', '火抗', '冰抗', '电抗', '毒抗'],
};

const el = {
  status: document.getElementById('status'),
  acts: document.getElementById('acts'),
  activeTarget: document.getElementById('active-target'),
  counterDisplay: document.getElementById('counter-display'),
  counterTime: document.getElementById('counter-time'),
  inc: document.getElementById('inc'),
  dec: document.getElementById('dec'),
  pause: document.getElementById('pause'),
  reset: document.getElementById('reset'),
  historyList: document.getElementById('history-list'),
  clearRuns: document.getElementById('clear-runs'),
  toggleCounter: document.getElementById('toggle-counter'),
  toggleItems: document.getElementById('toggle-items'),
  toggleHistory: document.getElementById('toggle-history'),
  itemSearch: document.getElementById('item-search'),
  filters: document.getElementById('filters'),
  itemPicker: document.getElementById('item-picker'),
  foundList: document.getElementById('found-list'),
  clearItems: document.getElementById('clear-items'),
  tzModes: document.getElementById('tz-modes'),
  tzNow: document.getElementById('tz-now'),
  tzNext: document.getElementById('tz-next'),
  dataLang: document.getElementById('data-lang'),
  uiLang: document.getElementById('ui-lang'),
  findsLog: document.getElementById('finds-log'),
  clearFinds: document.getElementById('clear-finds'),
  season: document.getElementById('season'),
  offline: document.getElementById('offline'),
  variantPrompt: document.getElementById('variant-prompt'),
};

let targets = [];
let items = [];
let zones = {}; // { [zoneId]: { lang: name } }
let state = null;
let activeFilter = 'all';
let dataLang = 'de';
let finds = []; // gecachtes Fund-Logbuch (vom /api/finds)
let lastFindsCount = null; // erkennt, wann neu geladen werden muss

// --- Daten laden ----------------------------------------------------------
// Stammdaten kommen aus der DB (alle Sprachen auf einmal) und werden gecached;
// die Sprachumschaltung passiert danach rein client-seitig.
async function loadData() {
  const [t, i, z] = await Promise.all([
    fetch('api/targets').then((r) => r.json()),
    fetch('api/items').then((r) => r.json()),
    fetch('api/zones').then((r) => r.json()),
  ]);
  targets = t;
  items = i;
  zones = z;
}

function targetById(id) {
  return targets.find((t) => t.id === id) || null;
}
function itemById(id) {
  return items.find((i) => i.id === id) || null;
}

// Lokalisierter Name/Slot-Typ/Zonenname nach dataLang (mit de→en-Fallback).
function dataName(rec) {
  if (!rec) return '';
  if (rec.names) return rec.names[dataLang] ?? rec.names.de ?? rec.names.en ?? rec.id;
  return rec.name ?? '';
}
function itemType(rec) {
  if (!rec) return '';
  if (rec.types) return rec.types[dataLang] ?? rec.types.de ?? rec.types.en ?? '';
  return rec.type ?? ''; // verbatim (rune/runeword)
}
function zoneName(id) {
  const z = zones[id];
  return (z && (z[dataLang] ?? z.de ?? z.en)) || `Zone ${id}`;
}
// Anzeige-Objekt für buildItemIcon (braucht icon/quality/name/rune).
function iconView(rec) {
  return { icon: rec.icon, quality: rec.quality, name: dataName(rec), rune: rec.rune };
}

// Live-Farm-Zeit eines Ziels: akkumulierte farmMs plus die laufende Zeit, falls
// es gerade das aktive (und nicht pausierte) Ziel ist.
function liveFarmMs(id) {
  if (!state || !id) return 0;
  const run = state.runs?.[id];
  let ms = run?.farmMs ?? 0;
  if (id === state.activeTargetId && state.activeSince != null && !state.paused) {
    ms += Date.now() - state.activeSince;
  }
  return ms;
}

// --- WebSocket ------------------------------------------------------------
// Wird erst nach dem Laden der Stammdaten (loadData) verbunden, damit die erste
// State-Nachricht nicht auf leere targets/items trifft.
let client = null;

function connect() {
  client = createClient({
    onState: (s) => {
      state = s;
      // Sprachen aus dem State übernehmen (gelten für alle Clients gleich).
      dataLang = s.settings?.dataLang || 'de';
      setUiLang(s.settings?.uiLang || 'de');
      applyTranslations();
      renderTargets();
      renderCounter();
      renderHistory();
      renderSettings();
      renderFound();
      renderTz();
      renderPicker();
      // Fund-Logbuch nur neu laden, wenn sich die Anzahl geändert hat; sonst nur
      // neu rendern (z. B. bei Sprachwechsel — relokalisiert Namen/Datumsformat).
      if (s.findsCount !== lastFindsCount) {
        lastFindsCount = s.findsCount;
        loadFinds().then(renderFinds);
      } else {
        renderFinds();
      }
    },
    onStatus: (status) => {
      el.status.dataset.state = status;
      el.status.textContent = t(
        status === 'connected'
          ? 'status.connected'
          : status === 'connecting'
            ? 'status.connecting'
            : 'status.disconnected'
      );
    },
  });
}

function send(action) {
  if (client) client.send(action);
}

// --- Ziel-Auswahl (gruppiert nach Akt) ------------------------------------
function renderTargets() {
  if (!targets.length) return;

  // Struktur nur einmal aufbauen; Namen/Akt-Labels werden bei jedem Render
  // aktualisiert (sonst würden sie bei Sprachwechsel einfrieren).
  if (!el.acts.dataset.built) {
    const byAct = new Map();
    for (const t of targets) {
      if (!byAct.has(t.act)) byAct.set(t.act, []);
      byAct.get(t.act).push(t);
    }
    for (const [act, list] of [...byAct.entries()].sort((a, b) => a[0] - b[0])) {
      const group = document.createElement('div');
      group.className = 'act-group';
      const label = document.createElement('div');
      label.className = 'act-label';
      label.dataset.actLabel = act; // wird unten lokalisiert
      group.appendChild(label);
      const wrap = document.createElement('div');
      wrap.className = 'target-buttons';
      for (const tgt of list) {
        const btn = document.createElement('button');
        btn.className = 'target-btn';
        btn.dataset.id = tgt.id;
        const name = document.createElement('span');
        name.dataset.nameFor = tgt.id; // wird unten lokalisiert
        const badge = document.createElement('span');
        badge.className = 'count-badge';
        badge.dataset.badge = tgt.id;
        badge.textContent = '0';
        btn.append(name, badge);
        btn.addEventListener('click', () => send({ type: 'SET_ACTIVE_TARGET', targetId: tgt.id }));
        wrap.appendChild(btn);
      }
      group.appendChild(wrap);
      el.acts.appendChild(group);
    }
    el.acts.dataset.built = '1';
  }

  // Akt-Labels (UI-Sprache) + Zielnamen (Datensprache) lokalisieren.
  for (const label of el.acts.querySelectorAll('[data-act-label]')) {
    label.textContent = t('act', { act: label.dataset.actLabel });
  }
  for (const span of el.acts.querySelectorAll('[data-name-for]')) {
    span.textContent = dataName(targetById(span.dataset.nameFor));
  }
  for (const btn of el.acts.querySelectorAll('.target-btn')) {
    btn.classList.toggle('active', btn.dataset.id === state.activeTargetId);
  }
  for (const badge of el.acts.querySelectorAll('.count-badge')) {
    badge.textContent = String(state.runs?.[badge.dataset.badge]?.count ?? 0);
  }
}

// --- Counter --------------------------------------------------------------
function renderCounter() {
  const target = state.activeTargetId ? targetById(state.activeTargetId) : null;
  el.activeTarget.textContent = target
    ? t('actName', { act: target.act, name: dataName(target) })
    : t('target.none');
  const count = state.activeTargetId ? state.runs?.[state.activeTargetId]?.count ?? 0 : 0;
  el.counterDisplay.textContent = String(count);
  el.counterTime.textContent = formatDuration(liveFarmMs(state.activeTargetId));

  const paused = !!state.paused;
  el.pause.textContent = paused ? t('btn.resume') : t('btn.pause');
  el.pause.classList.toggle('active', paused);
  el.pause.disabled = !state.activeTargetId;
  el.counterTime.classList.toggle('paused', paused);
}

el.inc.addEventListener('click', () => send({ type: 'INCREMENT' }));
el.dec.addEventListener('click', () => send({ type: 'DECREMENT' }));
el.pause.addEventListener('click', () => send({ type: 'SET_PAUSED', value: !state?.paused }));
el.reset.addEventListener('click', () => {
  if (confirm(t('confirm.resetTarget'))) send({ type: 'RESET_TARGET' });
});

// --- Verlauf --------------------------------------------------------------
function renderHistory() {
  const runs = state.runs || {};
  const entries = Object.entries(runs)
    .map(([id, r]) => ({ id, ...r }))
    .filter((e) => targetById(e.id))
    .sort((a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0));

  el.historyList.innerHTML = '';

  if (!entries.length) {
    const li = document.createElement('li');
    li.className = 'history-empty';
    li.textContent = t('history.empty');
    el.historyList.appendChild(li);
    return;
  }

  for (const e of entries) {
    const tgt = targetById(e.id);
    const li = document.createElement('li');
    li.className = 'history-item';
    if (e.id === state.activeTargetId) li.classList.add('active');

    const select = document.createElement('button');
    select.className = 'history-select';
    select.title = t('title.continueRun');
    select.addEventListener('click', () => send({ type: 'SET_ACTIVE_TARGET', targetId: e.id }));

    const name = document.createElement('span');
    name.className = 'hname';
    name.textContent = t('actName', { act: tgt.act, name: dataName(tgt) });

    const meta = document.createElement('span');
    meta.className = 'hmeta';
    const count = document.createElement('span');
    count.className = 'hcount';
    count.textContent = t('count.times', { count: e.count ?? 0 });
    const time = document.createElement('span');
    time.className = 'htime';
    time.dataset.timeFor = e.id;
    time.textContent = formatDuration(liveFarmMs(e.id));
    meta.append(count, time);

    select.append(name, meta);

    const remove = document.createElement('button');
    remove.className = 'remove-btn';
    remove.title = t('title.removeFromHistory');
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      if (confirm(t('confirm.removeRun', { name: dataName(tgt) })))
        send({ type: 'REMOVE_RUN', targetId: e.id });
    });

    li.append(select, remove);
    el.historyList.appendChild(li);
  }
}

// Sekündliches Aktualisieren der Live-Zeiten, ohne den State neu zu rendern.
function tickTimes() {
  if (!state) return;
  el.counterTime.textContent = formatDuration(liveFarmMs(state.activeTargetId));
  for (const span of el.historyList.querySelectorAll('[data-time-for]')) {
    span.textContent = formatDuration(liveFarmMs(span.dataset.timeFor));
  }
}
setInterval(tickTimes, 1000);

el.clearRuns.addEventListener('click', () => {
  if (confirm(t('confirm.clearRuns'))) send({ type: 'CLEAR_RUNS' });
});

// Tastatur-Shortcuts (nicht beim Tippen im Suchfeld)
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === '+' || e.key === '=') send({ type: 'INCREMENT' });
  else if (e.key === '-' || e.key === '_') send({ type: 'DECREMENT' });
});

// --- Settings + Sprachen --------------------------------------------------
function renderSettings() {
  el.toggleCounter.checked = state.settings?.showCounter !== false;
  el.toggleItems.checked = state.settings?.showItems !== false;
  el.toggleHistory.checked = state.settings?.showHistory !== false;
  el.dataLang.value = state.settings?.dataLang || 'de';
  el.uiLang.value = state.settings?.uiLang || 'de';
  // Season-Feld nur setzen, wenn es nicht gerade fokussiert/bearbeitet wird.
  if (document.activeElement !== el.season) el.season.value = state.settings?.season ?? 14;
  // Offline-Modus: Checkbox spiegeln und Season-Feld entsprechend (de)aktivieren.
  const offline = state.settings?.offline === true;
  el.offline.checked = offline;
  el.season.disabled = offline;
  el.season.classList.toggle('disabled', offline);
}
el.toggleCounter.addEventListener('change', (e) =>
  send({ type: 'TOGGLE_SETTING', key: 'showCounter', value: e.target.checked })
);
el.toggleItems.addEventListener('change', (e) =>
  send({ type: 'TOGGLE_SETTING', key: 'showItems', value: e.target.checked })
);
el.toggleHistory.addEventListener('change', (e) =>
  send({ type: 'TOGGLE_SETTING', key: 'showHistory', value: e.target.checked })
);
el.dataLang.addEventListener('change', (e) =>
  send({ type: 'SET_LANG', scope: 'data', value: e.target.value })
);
el.uiLang.addEventListener('change', (e) =>
  send({ type: 'SET_LANG', scope: 'ui', value: e.target.value })
);
el.season.addEventListener('change', (e) => {
  const v = Math.floor(Number(e.target.value));
  if (Number.isInteger(v) && v >= 1 && v <= 999) send({ type: 'SET_SEASON', value: v });
});
el.offline.addEventListener('change', (e) =>
  send({ type: 'TOGGLE_SETTING', key: 'offline', value: e.target.checked })
);

// --- Terror Zone ----------------------------------------------------------
function renderTz() {
  const mode = state.settings?.tzMode || 'off';
  for (const chip of el.tzModes.querySelectorAll('.chip')) {
    chip.classList.toggle('active', chip.dataset.mode === mode);
  }
  const tz = state.terrorZone;
  el.tzNow.textContent = tz?.currentIds?.length ? tz.currentIds.map(zoneName).join(' · ') : '—';
  el.tzNext.textContent = tz?.nextIds?.length ? tz.nextIds.map(zoneName).join(' · ') : '—';
}

for (const chip of el.tzModes.querySelectorAll('.chip')) {
  chip.addEventListener('click', () => send({ type: 'SET_TZ_MODE', value: chip.dataset.mode }));
}

// --- Item-Picker ----------------------------------------------------------
function renderPicker() {
  const q = el.itemSearch.value.trim().toLowerCase();
  el.itemPicker.innerHTML = '';
  const filtered = items.filter((it) => {
    if (activeFilter !== 'all' && it.quality !== activeFilter) return false;
    if (q && !dataName(it).toLowerCase().includes(q)) return false;
    return true;
  });
  for (const it of filtered.slice(0, 200)) {
    const row = document.createElement('div');
    row.className = 'picker-item';
    row.appendChild(buildItemIcon(iconView(it)));
    const name = document.createElement('span');
    name.className = `pname q-${it.quality}`;
    name.textContent = dataName(it);
    const type = document.createElement('span');
    type.className = 'ptype';
    type.textContent = itemType(it);
    row.append(name, type);
    row.addEventListener('click', () => {
      // Skiller (magic) und Rainbow Facets fragen erst nach einem Zusatz
      // (Affix bzw. Werte); alle anderen Items werden direkt erfasst.
      if (needsVariant(it)) openVariantPrompt(it);
      else addItem(it, null);
    });
    el.itemPicker.appendChild(row);
  }
}

// Items, bei denen ein Zusatz erfasst werden kann.
function needsVariant(it) {
  return it.quality === 'magic' || it.id.startsWith('facet-');
}

function addItem(it, variant) {
  send({
    type: 'ADD_ITEM',
    // itemId mitsenden, damit der Fund später live re-lokalisiert werden kann;
    // name ist nur der Snapshot/Fallback in der erfassten Sprache.
    item: { itemId: it.id, name: dataName(it), quality: it.quality, icon: it.icon, variant },
  });
}

// Kleiner Dialog zum Erfassen des Zusatzes: Skiller -> Affix-Dropdown + Wert-Feld
// (werden zu z. B. „20 Leben" kombiniert), Facet -> Wert-Feld. Alles optional
// („Hinzufügen" auch ohne Eingabe möglich).
function openVariantPrompt(it) {
  const isFacet = it.id.startsWith('facet-');
  el.variantPrompt.innerHTML = '';
  el.variantPrompt.classList.remove('hidden');

  const title = document.createElement('div');
  title.className = 'vp-title';
  title.textContent = dataName(it);
  el.variantPrompt.appendChild(title);

  let select = null;
  if (!isFacet) {
    const row = document.createElement('label');
    row.className = 'vp-row';
    const span = document.createElement('span');
    span.textContent = t('variant.affix');
    select = document.createElement('select');
    select.className = 'lang-select';
    const none = document.createElement('option');
    none.value = '';
    none.textContent = '—';
    select.appendChild(none);
    for (const a of AFFIXES[getUiLang()] || AFFIXES.en) {
      const o = document.createElement('option');
      o.value = a;
      o.textContent = a;
      select.appendChild(o);
    }
    row.append(span, select);
    el.variantPrompt.appendChild(row);
  }

  const row2 = document.createElement('label');
  row2.className = 'vp-row';
  const span2 = document.createElement('span');
  span2.textContent = t('variant.value');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'vp-input';
  input.placeholder = isFacet ? 'z. B. 5/5' : 'z. B. 20';
  row2.append(span2, input);
  el.variantPrompt.appendChild(row2);

  const actions = document.createElement('div');
  actions.className = 'vp-actions';
  const add = document.createElement('button');
  add.className = 'btn primary small';
  add.textContent = t('btn.add');
  const cancel = document.createElement('button');
  cancel.className = 'btn ghost small';
  cancel.textContent = t('btn.cancel');
  actions.append(add, cancel);
  el.variantPrompt.appendChild(actions);

  const close = () => {
    el.variantPrompt.classList.add('hidden');
    el.variantPrompt.innerHTML = '';
  };
  add.addEventListener('click', () => {
    // Affix (Dropdown) und Wert (Freitext) werden kombiniert, z. B. "20 Leben".
    // Beim Skiller steht der Wert vorn (wie im Spiel: "+20 Leben"); fehlt eines,
    // bleibt nur das andere. Beides leer -> kein Zusatz.
    const value = input.value.trim();
    const affix = (select && select.value) || '';
    const variant = [value, affix].filter(Boolean).join(' ') || null;
    addItem(it, variant);
    close();
  });
  cancel.addEventListener('click', close);
  input.focus();
}

el.itemSearch.addEventListener('input', renderPicker);
for (const chip of el.filters.querySelectorAll('.chip')) {
  chip.addEventListener('click', () => {
    activeFilter = chip.dataset.q;
    for (const c of el.filters.querySelectorAll('.chip')) c.classList.toggle('active', c === chip);
    renderPicker();
  });
}

// --- Gefundene Items ------------------------------------------------------
function renderFound() {
  el.foundList.innerHTML = '';
  for (const item of state.foundItems || []) {
    // Bekannte Items live nach Datensprache auflösen; Snapshot als Fallback.
    const cat = item.itemId ? itemById(item.itemId) : null;
    const displayName = cat ? dataName(cat) : item.name;
    const view = cat
      ? iconView(cat)
      : { icon: item.icon, quality: item.quality, name: item.name, rune: item.rune };

    const li = document.createElement('li');
    li.appendChild(buildItemIcon(view));
    const qty = item.qty ?? 1;
    if (qty > 1) {
      const badge = document.createElement('span');
      badge.className = 'qty-badge';
      badge.textContent = t('count.times', { count: qty });
      li.appendChild(badge);
    }
    const name = document.createElement('span');
    name.className = `fname q-${item.quality || 'unique'}`;
    name.textContent = displayName;
    li.append(name);
    // Zusatz (Skiller-Affix / Facet-Wert), falls erfasst.
    if (item.variant) {
      const variant = document.createElement('span');
      variant.className = 'finds-variant';
      variant.textContent = item.variant;
      li.appendChild(variant);
    }
    const remove = document.createElement('button');
    remove.className = 'remove-btn';
    remove.title = qty > 1 ? t('title.removeOne') : t('title.remove');
    remove.textContent = '×';
    remove.addEventListener('click', () => send({ type: 'REMOVE_ITEM', uid: item.uid }));
    li.append(remove);
    el.foundList.appendChild(li);
  }
}

el.clearItems.addEventListener('click', () => {
  if (confirm(t('confirm.clearItems'))) send({ type: 'CLEAR_ITEMS' });
});

// --- Fund-Logbuch (wann wurde was gefunden) -------------------------------
async function loadFinds() {
  try {
    finds = await fetch('api/finds').then((r) => r.json());
  } catch {
    finds = [];
  }
}

// Rendert das Logbuch nach Kalendertag gruppiert (neueste zuerst), mit Uhrzeit je
// Eintrag. Namen werden — wie im Bestand — live über die itemId nach Datensprache
// aufgelöst (Snapshot als Fallback); Datum/Zeit folgen der UI-Sprache.
function renderFinds() {
  el.findsLog.innerHTML = '';
  if (!finds.length) {
    const empty = document.createElement('div');
    empty.className = 'finds-empty';
    empty.textContent = t('finds.empty');
    el.findsLog.appendChild(empty);
    return;
  }
  const locale = LOCALES[getUiLang()] || 'de-DE';
  const groups = new Map(); // dayKey -> { date, items }
  for (const f of finds) {
    const d = new Date(f.ts);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!groups.has(dayKey)) groups.set(dayKey, { date: d, items: [] });
    groups.get(dayKey).items.push(f);
  }
  for (const { date, items } of groups.values()) {
    const head = document.createElement('div');
    head.className = 'finds-day';
    head.textContent = date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    el.findsLog.appendChild(head);

    const ul = document.createElement('ul');
    ul.className = 'finds-list';
    for (const f of items) {
      const cat = f.itemId ? itemById(f.itemId) : null;
      const view = cat ? iconView(cat) : { icon: f.icon, quality: f.quality, name: f.name };
      const li = document.createElement('li');
      const time = document.createElement('span');
      time.className = 'finds-time';
      time.textContent = new Date(f.ts).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
      const name = document.createElement('span');
      name.className = `finds-name q-${f.quality || 'unique'}`;
      name.textContent = cat ? dataName(cat) : f.name;
      li.append(time, buildItemIcon(view), name);
      if (f.variant) {
        const v = document.createElement('span');
        v.className = 'finds-variant';
        v.textContent = f.variant;
        li.appendChild(v);
      }
      if (f.offline) {
        const badge = document.createElement('span');
        badge.className = 'finds-season finds-offline';
        badge.textContent = t('offline.label');
        li.appendChild(badge);
      } else if (f.season != null) {
        const season = document.createElement('span');
        season.className = 'finds-season';
        season.textContent = `S${f.season}`;
        season.title = `${t('season.label')} ${f.season}`;
        li.appendChild(season);
      }
      const remove = document.createElement('button');
      remove.className = 'remove-btn';
      remove.title = t('title.remove');
      remove.textContent = '×';
      remove.addEventListener('click', () => send({ type: 'REMOVE_FIND', id: f.id }));
      li.appendChild(remove);
      ul.appendChild(li);
    }
    el.findsLog.appendChild(ul);
  }
}

el.clearFinds.addEventListener('click', () => {
  if (confirm(t('confirm.clearFinds'))) send({ type: 'CLEAR_FINDS' });
});

// --- Init -----------------------------------------------------------------
applyTranslations(); // statische Defaults (Deutsch) sofort anwenden
await loadData();
renderPicker();
connect();
