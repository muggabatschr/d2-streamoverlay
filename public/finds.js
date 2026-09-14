// Fund-Archiv: zeigt das Fund-Logbuch (/api/finds), filterbar nach Season bzw.
// Offline. Zusammenfassung (Anzahl), Item-Aufstellung (was wie oft) und die
// chronologische, nach Tagen gruppierte Liste. Sprache + Live-Aktualisierung über
// den WebSocket-State (wie Steuerpanel/Overlay).

import { createClient, buildItemIcon } from './shared/ws-client.js';
import { t, applyTranslations, setUiLang, getUiLang } from './shared/i18n.js';

const LOCALES = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', es: 'es-ES', zh: 'zh-CN' };

const el = {
  status: document.getElementById('status'),
  filterBar: document.getElementById('filter-bar'),
  summary: document.getElementById('finds-summary'),
  breakdown: document.getElementById('finds-breakdown'),
  log: document.getElementById('finds-log'),
};

let items = []; // Katalog (für Lokalisierung der Namen)
let finds = []; // gesamtes Logbuch
let dataLang = 'de';
let filter = 'all'; // 'all' | 'offline' | <seasonNumber>
let lastFindsCount = null;
let client = null;

function send(action) {
  if (client) client.send(action);
}

async function loadItems() {
  try {
    items = await fetch('api/items').then((r) => r.json());
  } catch {
    items = [];
  }
}
async function loadFinds() {
  try {
    finds = await fetch('api/finds').then((r) => r.json());
  } catch {
    finds = [];
  }
}

function itemById(id) {
  return items.find((i) => i.id === id) || null;
}
function dataName(rec) {
  if (!rec) return '';
  if (rec.names) return rec.names[dataLang] ?? rec.names.de ?? rec.names.en ?? rec.id;
  return rec.name ?? '';
}
// Name/Icon eines Logbuch-Eintrags: bekannte Items live nach Datensprache auflösen,
// Snapshot (im Log gespeicherter Name) als Fallback.
function findName(f) {
  const cat = f.itemId ? itemById(f.itemId) : null;
  return cat ? dataName(cat) : f.name;
}
function findView(f) {
  const cat = f.itemId ? itemById(f.itemId) : null;
  return cat
    ? { icon: cat.icon, quality: cat.quality, name: dataName(cat), rune: cat.rune }
    : { icon: f.icon, quality: f.quality, name: f.name };
}

function matchesFilter(f) {
  if (filter === 'all') return true;
  if (filter === 'offline') return !!f.offline;
  return !f.offline && f.season === filter;
}

// Filterleiste aus den vorhandenen Daten aufbauen: Alle | Season N… | Offline.
function renderFilters() {
  const seasons = [...new Set(finds.filter((f) => !f.offline && f.season != null).map((f) => f.season))].sort(
    (a, b) => b - a
  );
  const hasOffline = finds.some((f) => f.offline);
  const chips = [{ key: 'all', label: t('filter.all') }];
  for (const s of seasons) chips.push({ key: s, label: `${t('season.label')} ${s}` });
  if (hasOffline) chips.push({ key: 'offline', label: t('offline.label') });
  // Gewählten Filter beibehalten, falls noch vorhanden — sonst zurück auf "Alle".
  if (!chips.some((c) => c.key === filter)) filter = 'all';

  el.filterBar.innerHTML = '';
  for (const c of chips) {
    const b = document.createElement('button');
    b.className = 'chip' + (c.key === filter ? ' active' : '');
    b.textContent = c.label;
    b.addEventListener('click', () => {
      filter = c.key;
      renderAll();
    });
    el.filterBar.appendChild(b);
  }
}

function renderSummary(list) {
  el.summary.innerHTML = '';
  const span = document.createElement('span');
  const strong = document.createElement('strong');
  strong.textContent = String(list.length);
  span.append(`${t('finds.total')}: `, strong);
  el.summary.appendChild(span);
}

// Aggregiert die Auswahl nach Item (itemId bzw. Name) und zeigt sie nach
// Häufigkeit sortiert.
function renderBreakdown(list) {
  el.breakdown.innerHTML = '';
  if (!list.length) {
    const e = document.createElement('div');
    e.className = 'finds-empty';
    e.textContent = t('finds.empty');
    el.breakdown.appendChild(e);
    return;
  }
  const agg = new Map();
  for (const f of list) {
    const key = f.itemId || f.name;
    if (!agg.has(key)) agg.set(key, { f, count: 0 });
    agg.get(key).count++;
  }
  const rows = [...agg.values()].sort((a, b) => b.count - a.count);
  for (const { f, count } of rows) {
    const row = document.createElement('div');
    row.className = 'breakdown-item';
    row.appendChild(buildItemIcon(findView(f)));
    const name = document.createElement('span');
    name.className = `bname q-${f.quality || 'unique'}`;
    name.textContent = findName(f);
    const c = document.createElement('span');
    c.className = 'bcount';
    c.textContent = t('count.times', { count });
    row.append(name, c);
    el.breakdown.appendChild(row);
  }
}

// Chronologische Liste, nach Kalendertag gruppiert (neueste zuerst).
function renderLog(list) {
  el.log.innerHTML = '';
  if (!list.length) {
    const e = document.createElement('div');
    e.className = 'finds-empty';
    e.textContent = t('finds.empty');
    el.log.appendChild(e);
    return;
  }
  const locale = LOCALES[getUiLang()] || 'de-DE';
  const groups = new Map();
  for (const f of list) {
    const d = new Date(f.ts);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!groups.has(dayKey)) groups.set(dayKey, { date: d, items: [] });
    groups.get(dayKey).items.push(f);
  }
  for (const { date, items: its } of groups.values()) {
    const head = document.createElement('div');
    head.className = 'finds-day';
    head.textContent = date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    el.log.appendChild(head);

    const ul = document.createElement('ul');
    ul.className = 'finds-list';
    for (const f of its) {
      const li = document.createElement('li');
      const time = document.createElement('span');
      time.className = 'finds-time';
      time.textContent = new Date(f.ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      const name = document.createElement('span');
      name.className = `finds-name q-${f.quality || 'unique'}`;
      name.textContent = findName(f);
      li.append(time, buildItemIcon(findView(f)), name);
      if (f.variant) {
        const v = document.createElement('span');
        v.className = 'finds-variant';
        v.textContent = f.variant;
        li.appendChild(v);
      }
      if (f.offline) {
        const b = document.createElement('span');
        b.className = 'finds-season finds-offline';
        b.textContent = t('offline.label');
        li.appendChild(b);
      } else if (f.season != null) {
        const b = document.createElement('span');
        b.className = 'finds-season';
        b.textContent = `S${f.season}`;
        li.appendChild(b);
      }
      const remove = document.createElement('button');
      remove.className = 'remove-btn';
      remove.title = t('title.remove');
      remove.textContent = '×';
      remove.addEventListener('click', () => send({ type: 'REMOVE_FIND', id: f.id }));
      li.appendChild(remove);
      ul.appendChild(li);
    }
    el.log.appendChild(ul);
  }
}

function renderAll() {
  renderFilters();
  const list = finds.filter(matchesFilter);
  renderSummary(list);
  renderBreakdown(list);
  renderLog(list);
}

function connect() {
  client = createClient({
    onState: (s) => {
      dataLang = s.settings?.dataLang || 'de';
      setUiLang(s.settings?.uiLang || 'de');
      applyTranslations();
      // Logbuch nur neu laden, wenn sich die Anzahl geändert hat; sonst nur neu
      // rendern (z. B. bei Sprachwechsel — relokalisiert Namen/Datumsformat).
      if (s.findsCount !== lastFindsCount) {
        lastFindsCount = s.findsCount;
        loadFinds().then(renderAll);
      } else {
        renderAll();
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

// --- Init -----------------------------------------------------------------
applyTranslations();
await loadItems();
await loadFinds();
renderAll();
connect();
