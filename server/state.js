// State-Verwaltung: Laden/Speichern der Laufzeit-Daten + Reducer für WS-Aktionen.
// Der Server hält genau einen State im Speicher, persistiert ihn write-through in
// eine SQLite-DB (siehe db.js) und broadcastet ihn nach jeder Aktion an alle Clients.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  openDb,
  loadFromDb,
  persistState,
  isEmpty,
  hasImportedFlag,
  setImportedFlag,
  renameLegacyFile,
  appendItemFind,
  countItemFinds,
  clearItemFinds,
  removeItemFind,
} from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Datenverzeichnis überschreibbar (siehe db.js) — D2_DATA_DIR für Tests.
const DATA_DIR = process.env.D2_DATA_DIR || join(__dirname, 'data');
// Altdatei aus der JSON-Ära — wird beim ersten Start einmalig importiert.
const STATE_FILE = join(DATA_DIR, 'state.json');

const MAX_FOUND_ITEMS = 200; // harte Obergrenze, damit die Datei nicht unbegrenzt wächst

function defaultState() {
  return {
    activeTargetId: null,
    activeSince: null, // ms-Zeitstempel, seit wann der aktive Run-Timer läuft (null = nicht laufend)
    paused: false, // Farm-Timer pausiert?
    runs: {}, // { [targetId]: { count, farmMs, lastActiveAt, days: { 'YYYY-MM-DD': { count, farmMs } } } }
    foundItems: [], // [{ uid, itemId, name, quality, icon, ts }]
    // tzMode: welche Terror-Zone-Beschriftung im Overlay erscheint
    // ('season' | 'nonseason' | 'off'). Die Daten sind identisch, nur das Label
    // unterscheidet sich; 'off' blendet die Terror-Zone aus.
    // dataLang: Sprache der Spieldaten (Zonen/Bosse/Items). uiLang: Sprache der
    // statischen Oberflächentexte. Beide Default 'de'; Auflösung/Fallback im Frontend.
    settings: {
      showItems: true,
      showCounter: true,
      showHistory: true,
      tzMode: 'off',
      dataLang: 'de',
      uiLang: 'de',
      // Aktuelle Ladder-Season (manuell, da nicht abrufbar). Wird bei jedem Fund
      // ins Logbuch mitgeschrieben.
      season: 14,
      // Offline-Modus: Funde werden ohne Season-Nummer als "offline" protokolliert.
      offline: false,
    },
    // Aktuelle/nächste Terror-Zone (vom d2emu-Abruf gesetzt). Transient: wird
    // nicht persistiert und beim Start neu geholt. Enthält Zonen-IDs; die Namen
    // löst das Frontend nach dataLang auf.
    terrorZone: null, // { currentIds: number[], nextIds: number[], updatedAt: number }
    // Anzahl der Einträge im Fund-Logbuch. Transient/abgeleitet (aus der DB), dient
    // dem Frontend als Signal, das Logbuch (/api/finds) neu zu laden.
    findsCount: 0,
  };
}

const TZ_MODES = ['season', 'nonseason', 'off'];
const LANGS = ['en', 'de', 'fr', 'es', 'zh'];

// Tagesschlüssel (lokale Zeit) eines Zeitstempels im Format YYYY-MM-DD. Ein „Tag"
// ist damit der Kalendertag der Server-Zeitzone — passend zum Stream-Tag.
function dayKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Normalisiert die Tages-Map eines Runs: jeder Tageseintrag bekommt count/farmMs
// in der erwarteten Form (Migration alter state.json-Dateien).
function normalizeDays(days) {
  const out = {};
  if (days && typeof days === 'object') {
    for (const [key, d] of Object.entries(days)) {
      if (!d || typeof d !== 'object') continue;
      out[key] = {
        count: typeof d.count === 'number' ? d.count : 0,
        farmMs: typeof d.farmMs === 'number' ? d.farmMs : 0,
      };
    }
  }
  return out;
}

// Normalisiert die runs-Map: stellt sicher, dass jeder Eintrag count/farmMs/
// lastActiveAt/days in der erwarteten Form hat (Migration alter state.json-Dateien).
function normalizeRuns(runs) {
  const out = {};
  if (runs && typeof runs === 'object') {
    for (const [id, r] of Object.entries(runs)) {
      if (!r || typeof r !== 'object') continue;
      out[id] = {
        count: typeof r.count === 'number' ? r.count : 0,
        farmMs: typeof r.farmMs === 'number' ? r.farmMs : 0,
        lastActiveAt: typeof r.lastActiveAt === 'number' ? r.lastActiveAt : null,
        days: normalizeDays(r.days),
      };
    }
  }
  return out;
}

// Normalisiert die Fundliste: stellt sicher, dass jeder Eintrag eine gültige
// Anzahl (qty >= 1) hat — migriert alte Einträge ohne qty.
function normalizeFoundItems(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((it) => it && typeof it.name === 'string')
    .map((it) => ({
      uid: typeof it.uid === 'string' ? it.uid : makeUid(),
      itemId: it.itemId ?? null,
      name: it.name,
      quality: it.quality ?? 'unique',
      icon: it.icon ?? null,
      variant: typeof it.variant === 'string' && it.variant.trim() ? it.variant.trim() : null,
      qty: Number.isFinite(it.qty) && it.qty > 0 ? Math.floor(it.qty) : 1,
      ts: typeof it.ts === 'number' ? it.ts : Date.now(),
    }));
}

// Dedup-Schlüssel eines Fundes: gleiche itemId (bevorzugt) bzw. Name+Qualität
// gelten als dasselbe Item und werden gestapelt. Der Zusatz (Skiller-Affix /
// Facet-Wert) geht in den Schlüssel ein, damit z. B. „5/5" und „4/5" als eigene
// Kacheln erhalten bleiben statt zu einer zu verschmelzen.
function foundKey(it) {
  const base = it.itemId ?? `${it.name}|${it.quality ?? 'unique'}`;
  return it.variant ? `${base}|${it.variant}` : base;
}

// Tiefes Mergen der Defaults, damit neue Felder bei bestehenden state.json-Dateien
// automatisch ergänzt werden.
function withDefaults(loaded) {
  const base = defaultState();
  if (!loaded || typeof loaded !== 'object') return base;
  const settings = { ...base.settings, ...(loaded.settings || {}) };
  // Ungültige/alte tzMode-Werte auf den Default zurücksetzen.
  if (!TZ_MODES.includes(settings.tzMode)) settings.tzMode = base.settings.tzMode;
  if (!LANGS.includes(settings.dataLang)) settings.dataLang = base.settings.dataLang;
  if (!LANGS.includes(settings.uiLang)) settings.uiLang = base.settings.uiLang;
  if (!Number.isInteger(settings.season) || settings.season < 1 || settings.season > 999) {
    settings.season = base.settings.season;
  }
  if (typeof settings.offline !== 'boolean') settings.offline = base.settings.offline;
  return {
    activeTargetId: loaded.activeTargetId ?? base.activeTargetId,
    activeSince: typeof loaded.activeSince === 'number' ? loaded.activeSince : base.activeSince,
    paused: typeof loaded.paused === 'boolean' ? loaded.paused : base.paused,
    runs: normalizeRuns(loaded.runs),
    foundItems: normalizeFoundItems(loaded.foundItems),
    settings,
    // terrorZone wird bewusst NICHT aus der Datei übernommen — ein persistierter
    // Wert wäre nach einem Neustart veraltet; der Abruf liefert ihn neu.
    terrorZone: null,
    // findsCount wird aus der DB neu bestimmt (siehe loadState), nicht persistiert.
    findsCount: 0,
  };
}

let state = defaultState();
let uidCounter = 0;

// Einmaliger Import einer alten state.json in die frische DB. Idempotent: läuft nur,
// solange die DB leer ist, noch nicht importiert wurde und die Datei existiert.
function importLegacyJsonIfNeeded() {
  if (!(isEmpty() && !hasImportedFlag() && existsSync(STATE_FILE))) return;
  try {
    const loaded = withDefaults(JSON.parse(readFileSync(STATE_FILE, 'utf8')));
    const { terrorZone, ...persisted } = loaded;
    persistState(persisted);
    const dest = renameLegacyFile(STATE_FILE);
    setImportedFlag(new Date().toISOString());
    console.log(`[state] state.json in die DB importiert (Backup: ${dest}).`);
  } catch (err) {
    // Kaputte/ungültige Datei NICHT umbenennen — Daten bleiben so wiederherstellbar.
    console.error('[state] Import von state.json übersprungen:', err.message);
  }
}

export async function loadState() {
  try {
    openDb();
    importLegacyJsonIfNeeded();
    state = withDefaults(loadFromDb());
  } catch (err) {
    console.error('[state] Konnte DB nicht laden, starte mit Defaults:', err.message);
    state = defaultState();
  }
  // Anzahl der Logbuch-Einträge aus der DB übernehmen (Signal fürs Frontend).
  try {
    state.findsCount = countItemFinds();
  } catch {
    state.findsCount = 0;
  }
  // Ein persistierter activeSince ist nach einem Neustart veraltet — sonst würde
  // die Server-Downtime als Farm-Zeit mitgezählt. Anker neu setzen statt die
  // Lücke zu akkumulieren (läuft nur weiter, wenn nicht pausiert und Ziel aktiv).
  state.activeSince = state.activeTargetId && !state.paused ? Date.now() : null;
  return state;
}

export function getState() {
  return state;
}

// Setzt die aktuelle/nächste Terror-Zone (vom d2emu-Abruf). Transient — wird nicht
// gespeichert; der Aufrufer broadcastet den State selbst.
export function setTerrorZone(tz) {
  state.terrorZone = tz;
}

// Schreibt den aktuellen State write-through in die DB (synchron, sofort dauerhaft).
// terrorZone ist transient (siehe withDefaults) und wird nicht persistiert.
// Hinweis: activeSince wird zwar gespeichert, beim Laden aber stets überschrieben
// (loadState setzt den Timer-Anker neu) — das ist beabsichtigt.
function save() {
  try {
    // terrorZone + findsCount sind transient (abgeleitet/extern) — nicht persistieren.
    const { terrorZone, findsCount, ...persisted } = state;
    persistState(persisted);
  } catch (err) {
    // Best-effort: ein Schreibfehler darf den Reducer/WS-Handler nicht abstürzen
    // lassen. In-Memory-State + Broadcast laufen weiter.
    console.error('[state] Speichern fehlgeschlagen:', err.message);
  }
}

function ensureRun(targetId) {
  let run = state.runs[targetId];
  if (!run) {
    run = state.runs[targetId] = { count: 0, farmMs: 0, lastActiveAt: null, days: {} };
  } else {
    // Backfill für ältere Einträge ohne die neuen Felder.
    if (typeof run.farmMs !== 'number') run.farmMs = 0;
    if (typeof run.lastActiveAt !== 'number' && run.lastActiveAt !== null) run.lastActiveAt = null;
    if (!run.days || typeof run.days !== 'object') run.days = {};
  }
  return run;
}

// Liefert den Tageseintrag eines Runs für den Zeitstempel ts und legt ihn bei
// Bedarf an. Hier werden count/farmMs pro Kalendertag mitgeschrieben.
function ensureDay(run, ts) {
  const key = dayKey(ts);
  let day = run.days[key];
  if (!day) day = run.days[key] = { count: 0, farmMs: 0 };
  return day;
}

// Schreibt die bisher verstrichene Zeit des aktiven Ziels in dessen farmMs (gesamt
// und im Tagesbucket) gut und zieht den Anker nach. Ohne laufenden Timer
// (activeSince null) passiert nichts.
function accrueActiveTime(now) {
  if (state.activeTargetId && state.activeSince != null) {
    const run = ensureRun(state.activeTargetId);
    const delta = Math.max(0, now - state.activeSince);
    run.farmMs += delta;
    ensureDay(run, now).farmMs += delta;
    state.activeSince = now;
  }
}

function makeUid() {
  // Date.now() reicht hier nicht (Kollisionen bei schnellen Klicks) -> Zähler anhängen.
  uidCounter = (uidCounter + 1) % 1_000_000;
  return `${Date.now().toString(36)}-${uidCounter.toString(36)}`;
}

// Wendet eine Client-Aktion auf den State an. Gibt true zurück, wenn sich etwas
// geändert hat (dann wird gespeichert + gebroadcastet).
export function applyAction(action) {
  if (!action || typeof action.type !== 'string') return false;

  switch (action.type) {
    case 'SET_ACTIVE_TARGET': {
      if (typeof action.targetId !== 'string') return false;
      const now = Date.now();
      accrueActiveTime(now); // bisher gefarmte Zeit dem vorherigen Ziel gutschreiben
      state.activeTargetId = action.targetId;
      const run = ensureRun(action.targetId);
      run.lastActiveAt = now;
      // Zielauswahl bedeutet "ich farme jetzt das hier" -> Timer (neu) starten.
      state.paused = false;
      state.activeSince = now;
      break;
    }
    case 'INCREMENT': {
      const id = action.targetId || state.activeTargetId;
      if (!id) return false;
      const run = ensureRun(id);
      run.count += 1;
      ensureDay(run, Date.now()).count += 1;
      break;
    }
    case 'DECREMENT': {
      const id = action.targetId || state.activeTargetId;
      if (!id) return false;
      const run = ensureRun(id);
      if (run.count <= 0) return false;
      run.count -= 1;
      const day = ensureDay(run, Date.now());
      day.count = Math.max(0, day.count - 1);
      break;
    }
    case 'SET_COUNT': {
      const id = action.targetId || state.activeTargetId;
      if (!id || typeof action.value !== 'number') return false;
      const run = ensureRun(id);
      const next = Math.max(0, Math.floor(action.value));
      const delta = next - run.count;
      run.count = next;
      // Die Differenz dem heutigen Tag gutschreiben/abziehen, damit „heute" und
      // „gesamt" konsistent bleiben.
      if (delta !== 0) {
        const day = ensureDay(run, Date.now());
        day.count = Math.max(0, day.count + delta);
      }
      break;
    }
    case 'RESET_TARGET': {
      const id = action.targetId || state.activeTargetId;
      if (!id) return false;
      const run = ensureRun(id);
      run.count = 0;
      run.farmMs = 0;
      run.days = {};
      // Läuft der Timer für genau dieses Ziel, Anker neu setzen, damit die
      // Live-Zeit ebenfalls bei 0 startet.
      if (id === state.activeTargetId && state.activeSince != null) {
        state.activeSince = Date.now();
      }
      break;
    }
    case 'SET_PAUSED': {
      const now = Date.now();
      const value = typeof action.value === 'boolean' ? action.value : !state.paused;
      if (value === state.paused) return false;
      if (value) {
        // Pausieren: laufende Zeit verbuchen, dann Timer anhalten.
        accrueActiveTime(now);
        state.activeSince = null;
      } else {
        // Fortsetzen: Timer wieder anwerfen (nur sinnvoll mit aktivem Ziel).
        state.activeSince = state.activeTargetId ? now : null;
      }
      state.paused = value;
      break;
    }
    case 'REMOVE_RUN': {
      if (typeof action.targetId !== 'string') return false;
      if (!state.runs[action.targetId]) return false;
      delete state.runs[action.targetId];
      if (state.activeTargetId === action.targetId) {
        state.activeTargetId = null;
        state.activeSince = null;
      }
      break;
    }
    case 'CLEAR_RUNS': {
      if (Object.keys(state.runs).length === 0) return false;
      state.runs = {};
      state.activeTargetId = null;
      state.activeSince = null;
      break;
    }
    case 'ADD_ITEM': {
      const it = action.item;
      if (!it || typeof it.name !== 'string') return false;
      // Optionaler Zusatz (Skiller-Affix / Facet-Wert) — einmal normalisieren und
      // sowohl für die Stapel-Logik als auch fürs Logbuch verwenden.
      const variant = typeof it.variant === 'string' && it.variant.trim() ? it.variant.trim() : null;
      const key = foundKey({ ...it, variant });
      const existing = state.foundItems.find((f) => foundKey(f) === key);
      if (existing) {
        // Bereits gefunden -> nur Anzahl erhöhen und nach vorne holen
        // (zuletzt gefunden zuerst).
        existing.qty += 1;
        existing.ts = Date.now();
        state.foundItems = state.foundItems.filter((f) => f !== existing);
        state.foundItems.unshift(existing);
      } else {
        state.foundItems.unshift({
          uid: makeUid(),
          itemId: it.itemId ?? null,
          name: it.name,
          quality: it.quality ?? 'unique',
          icon: it.icon ?? null,
          variant,
          qty: 1,
          ts: Date.now(),
        });
        if (state.foundItems.length > MAX_FOUND_ITEMS) {
          state.foundItems.length = MAX_FOUND_ITEMS;
        }
      }
      // Jeden Fund zusätzlich ins (append-only) Logbuch schreiben — auch beim
      // Stapeln, damit "wann wurde was gefunden" vollständig erhalten bleibt.
      try {
        const offline = !!state.settings.offline;
        appendItemFind({
          itemId: it.itemId ?? null,
          name: it.name,
          quality: it.quality ?? 'unique',
          icon: it.icon ?? null,
          ts: Date.now(),
          // Im Offline-Modus keine Season-Nummer, stattdessen als offline markiert.
          season: offline ? null : state.settings.season ?? null,
          offline,
          // Optionaler Zusatz (Skiller-Affix / Facet-Wert), beim Loggen erfasst.
          variant,
        });
        state.findsCount = (state.findsCount ?? 0) + 1;
      } catch (err) {
        console.error('[state] Logbuch-Eintrag fehlgeschlagen:', err.message);
      }
      break;
    }
    case 'REMOVE_ITEM': {
      if (typeof action.uid !== 'string') return false;
      const entry = state.foundItems.find((i) => i.uid === action.uid);
      if (!entry) return false;
      if (entry.qty > 1) {
        // Gestapeltes Item: nur eine Kopie abziehen.
        entry.qty -= 1;
      } else {
        state.foundItems = state.foundItems.filter((i) => i.uid !== action.uid);
      }
      break;
    }
    case 'CLEAR_ITEMS': {
      if (state.foundItems.length === 0) return false;
      state.foundItems = [];
      break;
    }
    case 'REMOVE_FIND': {
      // Einzelnen Eintrag aus dem globalen Fund-Logbuch entfernen (z. B. Fehlklick).
      if (typeof action.id !== 'number') return false;
      let removed = 0;
      try {
        removed = removeItemFind(action.id);
      } catch (err) {
        console.error('[state] Logbuch-Eintrag entfernen fehlgeschlagen:', err.message);
        return false;
      }
      if (!removed) return false;
      state.findsCount = Math.max(0, (state.findsCount ?? 0) - 1);
      break;
    }
    case 'CLEAR_FINDS': {
      // Leert das historische Fund-Logbuch (unabhängig vom aktuellen Bestand).
      if ((state.findsCount ?? 0) === 0) return false;
      try {
        clearItemFinds();
        state.findsCount = 0;
      } catch (err) {
        console.error('[state] Logbuch leeren fehlgeschlagen:', err.message);
        return false;
      }
      break;
    }
    case 'TOGGLE_SETTING': {
      const key = action.key;
      if (key !== 'showItems' && key !== 'showCounter' && key !== 'showHistory' && key !== 'offline')
        return false;
      state.settings[key] =
        typeof action.value === 'boolean' ? action.value : !state.settings[key];
      break;
    }
    case 'SET_TZ_MODE': {
      if (!TZ_MODES.includes(action.value)) return false;
      if (state.settings.tzMode === action.value) return false;
      state.settings.tzMode = action.value;
      break;
    }
    case 'SET_LANG': {
      const key =
        action.scope === 'data' ? 'dataLang' : action.scope === 'ui' ? 'uiLang' : null;
      if (!key || !LANGS.includes(action.value)) return false;
      if (state.settings[key] === action.value) return false;
      state.settings[key] = action.value;
      break;
    }
    case 'SET_SEASON': {
      const v = Math.floor(Number(action.value));
      if (!Number.isInteger(v) || v < 1 || v > 999) return false;
      if (state.settings.season === v) return false;
      state.settings.season = v;
      break;
    }
    default:
      return false;
  }

  save();
  return true;
}
