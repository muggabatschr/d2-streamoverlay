// SQLite-Persistenz (better-sqlite3, synchron). Kapselt das gesamte SQL und ist
// die einzige Stelle mit Datenbankzugriff. Der Server hält weiterhin EINEN
// In-Memory-State (siehe state.js); db.js spiegelt ihn nach jeder Aktion in eine
// relationale Datenbank.
//
// Warum write-through statt debounced Datei-Speichern: better-sqlite3 schreibt
// synchron, jede Transaktion ist nach dem Commit sofort dauerhaft (WAL-Modus).
// Damit geht auch die letzte Aktion vor einem harten Beenden (Strg+C) nicht mehr
// verloren — anders als beim früheren 300-ms-Debounce.

import Database from 'better-sqlite3';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as CATALOG from './catalog-seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Datenverzeichnis überschreibbar (z. B. für Tests gegen eine temporäre DB),
// damit produktive Daten nie angefasst werden: D2_DATA_DIR=/pfad node server/index.js
const DATA_DIR = process.env.D2_DATA_DIR || join(__dirname, 'data');
const DB_FILE = join(DATA_DIR, 'state.db');

const SCHEMA_VERSION = 6;
// Version des Katalog-Seeds (Items/Targets/Zonen + Übersetzungen). Beim Erhöhen
// wird der Katalog beim nächsten Start neu aus den Seed-Dateien eingespielt.
const CATALOG_SEED_VERSION = 5;
// Unterstützte Sprachen — Reihenfolge egal, dient nur der Vollständigkeitsprüfung.
const LANGS = ['en', 'de', 'fr', 'es', 'zh'];

let db = null;
// Vorbereitete Statements (einmalig in openDb gesetzt).
let stmt = null;

// Öffnet/erzeugt die Datenbank, setzt PRAGMAs und legt das Schema an. Idempotent.
export function openDb() {
  mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_FILE);
  // WAL + synchronous NORMAL: committete Transaktionen überleben Prozess-Crash/
  // Strg+C. (FULL wäre noch strenger gegen OS-/Stromausfall, hier nicht nötig.)
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS runs (
      target_id      TEXT PRIMARY KEY,
      count          INTEGER NOT NULL DEFAULT 0,
      farm_ms        INTEGER NOT NULL DEFAULT 0,
      last_active_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS run_days (
      target_id TEXT NOT NULL,
      day       TEXT NOT NULL,
      count     INTEGER NOT NULL DEFAULT 0,
      farm_ms   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (target_id, day),
      FOREIGN KEY (target_id) REFERENCES runs(target_id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS found_items (
      position INTEGER PRIMARY KEY,
      uid      TEXT NOT NULL,
      item_id  TEXT,
      name     TEXT NOT NULL,
      quality  TEXT NOT NULL,
      icon     TEXT,
      qty      INTEGER NOT NULL DEFAULT 1,
      ts       INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Fund-Logbuch: jeder Fund mit Zeitstempel (append-only, historisch). Anders als
    -- found_items (aktueller Bestand, gestapelt) bleibt hier JEDER einzelne Fund
    -- erhalten — Grundlage für "wann wurde was gefunden".
    CREATE TABLE IF NOT EXISTS item_finds (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT,
      name    TEXT NOT NULL,
      quality TEXT,
      icon    TEXT,
      ts      INTEGER NOT NULL,
      season  INTEGER,
      offline INTEGER NOT NULL DEFAULT 0,
      variant TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_item_finds_ts ON item_finds (ts);`);

  // Migration: season-/offline-/variant-Spalten für bereits bestehende item_finds-
  // Tabellen nachrüsten (CREATE TABLE IF NOT EXISTS ändert vorhandene nicht). Idempotent.
  for (const col of ['season INTEGER', 'offline INTEGER NOT NULL DEFAULT 0', 'variant TEXT']) {
    try {
      db.exec(`ALTER TABLE item_finds ADD COLUMN ${col}`);
    } catch {
      /* Spalte existiert bereits */
    }
  }
  db.exec(`

    -- Katalog (Stammdaten, einmalig geseedet, zur Laufzeit read-only).
    -- Namen/Slot-Typen liegen übersetzt in den *_i18n-Tabellen (eine Zeile je Sprache).
    CREATE TABLE IF NOT EXISTS items (
      id      TEXT PRIMARY KEY,
      quality TEXT NOT NULL,          -- unique|set|rune|runeword (stabiler Key, nie übersetzt)
      type    TEXT,                   -- verbatim: 'Rune' / Runen-Sequenz (rune/runeword); NULL bei unique/set
      icon    TEXT,                   -- Dateiname, sprachunabhängig
      rune    TEXT,                   -- Runen-Kürzel (nur rune-Qualität)
      sort    INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS item_i18n (
      item_id TEXT NOT NULL,
      lang    TEXT NOT NULL,
      name    TEXT NOT NULL,
      type    TEXT,                   -- übersetztes Slot-Label (nur unique/set), sonst NULL
      PRIMARY KEY (item_id, lang),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS targets (
      id   TEXT PRIMARY KEY,
      act  INTEGER NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS target_i18n (
      target_id TEXT NOT NULL,
      lang      TEXT NOT NULL,
      name      TEXT NOT NULL,
      PRIMARY KEY (target_id, lang),
      FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY
    );
    CREATE TABLE IF NOT EXISTS zone_i18n (
      zone_id INTEGER NOT NULL,
      lang    TEXT NOT NULL,
      name    TEXT NOT NULL,
      PRIMARY KEY (zone_id, lang),
      FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
    );
  `);

  stmt = {
    getMeta: db.prepare('SELECT value FROM meta WHERE key = ?'),
    setMeta: db.prepare(
      'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ),
    setSetting: db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ),
    allSettings: db.prepare('SELECT key, value FROM settings'),
    delRunDays: db.prepare('DELETE FROM run_days'),
    delRuns: db.prepare('DELETE FROM runs'),
    insRun: db.prepare(
      'INSERT INTO runs (target_id, count, farm_ms, last_active_at) VALUES (?, ?, ?, ?)'
    ),
    insRunDay: db.prepare(
      'INSERT INTO run_days (target_id, day, count, farm_ms) VALUES (?, ?, ?, ?)'
    ),
    allRuns: db.prepare('SELECT target_id, count, farm_ms, last_active_at FROM runs'),
    daysFor: db.prepare('SELECT day, count, farm_ms FROM run_days WHERE target_id = ?'),
    delItems: db.prepare('DELETE FROM found_items'),
    insItem: db.prepare(
      'INSERT INTO found_items (position, uid, item_id, name, quality, icon, qty, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    allItems: db.prepare(
      'SELECT uid, item_id, name, quality, icon, qty, ts FROM found_items ORDER BY position ASC'
    ),
    countRuns: db.prepare('SELECT COUNT(*) AS n FROM runs'),
    countItems: db.prepare('SELECT COUNT(*) AS n FROM found_items'),

    // Fund-Logbuch
    insFind: db.prepare(
      'INSERT INTO item_finds (item_id, name, quality, icon, ts, season, offline, variant) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    allFinds: db.prepare(
      'SELECT id, item_id, name, quality, icon, ts, season, offline, variant FROM item_finds ORDER BY ts DESC, id DESC'
    ),
    countFinds: db.prepare('SELECT COUNT(*) AS n FROM item_finds'),
    clearFinds: db.prepare('DELETE FROM item_finds'),
    delFind: db.prepare('DELETE FROM item_finds WHERE id = ?'),
    countMeta: db.prepare(
      "SELECT COUNT(*) AS n FROM meta WHERE key NOT IN ('schema_version', 'imported_json', 'seed_version')"
    ),

    // Katalog: Schreiben (Seeding) ...
    delItemsCat: db.prepare('DELETE FROM items'),
    delTargetsCat: db.prepare('DELETE FROM targets'),
    delZonesCat: db.prepare('DELETE FROM zones'),
    insItemCat: db.prepare(
      'INSERT INTO items (id, quality, type, icon, rune, sort) VALUES (?, ?, ?, ?, ?, ?)'
    ),
    insItemI18n: db.prepare('INSERT INTO item_i18n (item_id, lang, name, type) VALUES (?, ?, ?, ?)'),
    insTargetCat: db.prepare('INSERT INTO targets (id, act, sort) VALUES (?, ?, ?)'),
    insTargetI18n: db.prepare('INSERT INTO target_i18n (target_id, lang, name) VALUES (?, ?, ?)'),
    insZoneCat: db.prepare('INSERT INTO zones (id) VALUES (?)'),
    insZoneI18n: db.prepare('INSERT INTO zone_i18n (zone_id, lang, name) VALUES (?, ?, ?)'),
    // ... und Lesen (alle Sprachen).
    allItemsCat: db.prepare('SELECT id, quality, type, icon, rune FROM items ORDER BY sort'),
    allItemI18n: db.prepare('SELECT item_id, lang, name, type FROM item_i18n'),
    allTargetsCat: db.prepare('SELECT id, act FROM targets ORDER BY sort'),
    allTargetI18n: db.prepare('SELECT target_id, lang, name FROM target_i18n'),
    allZonesCat: db.prepare('SELECT id FROM zones'),
    allZoneI18n: db.prepare('SELECT zone_id, lang, name FROM zone_i18n'),
  };

  setMetaValue('schema_version', SCHEMA_VERSION);

  // Die eigentliche Schreib-Transaktion (synchron, atomar).
  persistTxn = db.transaction((persisted) => {
    setMetaValue('activeTargetId', persisted.activeTargetId ?? null);
    // activeSince wird gespeichert, beim Laden aber stets überschrieben
    // (state.js setzt den Timer-Anker beim Start neu) — siehe loadState.
    setMetaValue('activeSince', persisted.activeSince ?? null);
    setMetaValue('paused', !!persisted.paused);
    // Wettbewerb-Timer als ein Meta-Eintrag (kleines, geschlossenes Objekt — eine
    // eigene Tabelle bringt hier nichts). endsAt ist absolut, der Countdown läuft
    // daher über einen Neustart hinweg korrekt weiter.
    setMetaValue('contest', persisted.contest ?? null);

    const settings = persisted.settings || {};
    for (const [k, v] of Object.entries(settings)) {
      stmt.setSetting.run(k, JSON.stringify(v));
    }

    stmt.delRunDays.run();
    stmt.delRuns.run();
    for (const [targetId, run] of Object.entries(persisted.runs || {})) {
      stmt.insRun.run(targetId, run.count ?? 0, run.farmMs ?? 0, run.lastActiveAt ?? null);
      for (const [day, d] of Object.entries(run.days || {})) {
        stmt.insRunDay.run(targetId, day, d.count ?? 0, d.farmMs ?? 0);
      }
    }

    stmt.delItems.run();
    (persisted.foundItems || []).forEach((it, i) => {
      stmt.insItem.run(
        i,
        it.uid,
        it.itemId ?? null,
        it.name,
        it.quality ?? 'unique',
        it.icon ?? null,
        it.qty ?? 1,
        it.ts ?? 0
      );
    });
  });

  // Katalog-Seeding (Stammdaten neu einspielen). Wendet die type-Regel an:
  // type als String -> verbatim auf items.type (rune/runeword, nicht übersetzt);
  // type als Objekt -> je Sprache nach item_i18n.type (unique/set Slot-Label).
  seedTxn = db.transaction((seed) => {
    stmt.delItemsCat.run();
    stmt.delTargetsCat.run();
    stmt.delZonesCat.run();

    (seed.items || []).forEach((it, i) => {
      const verbatimType = typeof it.type === 'string' ? it.type : null;
      stmt.insItemCat.run(it.id, it.quality, verbatimType, it.icon ?? null, it.rune ?? null, i);
      const typeObj = it.type && typeof it.type === 'object' ? it.type : null;
      for (const lang of LANGS) {
        const name = it.name?.[lang] ?? it.name?.en ?? it.id;
        const typeLabel = typeObj ? typeObj[lang] ?? typeObj.en ?? null : null;
        stmt.insItemI18n.run(it.id, lang, name, typeLabel);
      }
    });

    (seed.targets || []).forEach((t, i) => {
      stmt.insTargetCat.run(t.id, t.act, i);
      for (const lang of LANGS) {
        stmt.insTargetI18n.run(t.id, lang, t.name?.[lang] ?? t.name?.en ?? t.id);
      }
    });

    (seed.zones || []).forEach((z) => {
      stmt.insZoneCat.run(z.id);
      for (const lang of LANGS) {
        stmt.insZoneI18n.run(z.id, lang, z.name?.[lang] ?? z.name?.en ?? `Zone ${z.id}`);
      }
    });

    setMetaValue('seed_version', CATALOG_SEED_VERSION);
  });

  setMetaValue('schema_version', SCHEMA_VERSION);
  seedCatalogIfNeeded();

  return db;
}

let persistTxn = null;
let seedTxn = null;

// Spielt den Katalog aus dem Code-Modul catalog-seed.js ein, falls noch nicht oder
// in veralteter Version vorhanden. Idempotent über das Meta-Flag seed_version.
function seedCatalogIfNeeded() {
  if (getMetaValue('seed_version') === CATALOG_SEED_VERSION) return;
  try {
    const seed = { items: CATALOG.items, targets: CATALOG.targets, zones: CATALOG.zones };
    seedTxn(seed);
    console.log(
      `[db] Katalog geseedet: ${seed.items.length} Items, ${seed.targets.length} Targets, ${seed.zones.length} Zonen.`
    );
  } catch (err) {
    console.error('[db] Katalog-Seeding übersprungen:', err.message);
  }
}

export function isCatalogSeeded() {
  return getMetaValue('seed_version') === CATALOG_SEED_VERSION;
}

// --- Fund-Logbuch ----------------------------------------------------------
// Hängt einen Fund ans Logbuch an (append-only). entry: { itemId, name, quality, icon, ts }.
export function appendItemFind(entry) {
  stmt.insFind.run(
    entry.itemId ?? null,
    entry.name,
    entry.quality ?? null,
    entry.icon ?? null,
    entry.ts,
    entry.season ?? null,
    entry.offline ? 1 : 0,
    entry.variant ?? null
  );
}

// Liefert das gesamte Logbuch, neueste zuerst.
export function getItemFinds() {
  return stmt.allFinds.all().map((r) => ({
    id: r.id,
    itemId: r.item_id ?? null,
    name: r.name,
    quality: r.quality ?? null,
    icon: r.icon ?? null,
    ts: r.ts,
    season: r.season ?? null,
    offline: !!r.offline,
    variant: r.variant ?? null,
  }));
}

export function countItemFinds() {
  return stmt.countFinds.get().n;
}

export function clearItemFinds() {
  stmt.clearFinds.run();
}

// Löscht einen einzelnen Logbuch-Eintrag per id. Gibt die Anzahl gelöschter Zeilen
// zurück (0 = nicht gefunden).
export function removeItemFind(id) {
  return stmt.delFind.run(id).changes;
}

// Liefert alle Items mit Namen/Slot-Typen in ALLEN Sprachen — das Frontend cached
// das und schaltet rein client-seitig um. Form:
// [{ id, quality, icon, rune, type, names:{lang:..}, types:{lang:..}|null }]
export function getItemsAllLangs() {
  const byId = new Map();
  for (const r of stmt.allItemsCat.all()) {
    byId.set(r.id, {
      id: r.id,
      quality: r.quality,
      icon: r.icon ?? null,
      rune: r.rune ?? null,
      type: r.type ?? null, // verbatim (rune/runeword); bei unique/set NULL -> types nutzen
      names: {},
      types: null,
    });
  }
  for (const row of stmt.allItemI18n.all()) {
    const it = byId.get(row.item_id);
    if (!it) continue;
    it.names[row.lang] = row.name;
    if (row.type != null) {
      if (!it.types) it.types = {};
      it.types[row.lang] = row.type;
    }
  }
  return [...byId.values()];
}

// [{ id, act, names:{lang:..} }]
export function getTargetsAllLangs() {
  const byId = new Map();
  for (const r of stmt.allTargetsCat.all()) {
    byId.set(r.id, { id: r.id, act: r.act, names: {} });
  }
  for (const row of stmt.allTargetI18n.all()) {
    const t = byId.get(row.target_id);
    if (t) t.names[row.lang] = row.name;
  }
  return [...byId.values()];
}

// { [zoneId]: { lang: name } }
export function getZonesAllLangs() {
  const out = {};
  for (const r of stmt.allZonesCat.all()) out[r.id] = {};
  for (const row of stmt.allZoneI18n.all()) {
    if (out[row.zone_id]) out[row.zone_id][row.lang] = row.name;
  }
  return out;
}

function getMetaValue(key) {
  const row = stmt.getMeta.get(key);
  if (!row || row.value == null) return undefined;
  try {
    return JSON.parse(row.value);
  } catch {
    return undefined;
  }
}

function setMetaValue(key, value) {
  stmt.setMeta.run(key, JSON.stringify(value));
}

// True, wenn noch keine Nutzdaten vorliegen (frische DB) — Grundlage für den
// einmaligen Import einer alten state.json.
export function isEmpty() {
  return (
    stmt.countRuns.get().n === 0 &&
    stmt.countItems.get().n === 0 &&
    stmt.countMeta.get().n === 0
  );
}

export function hasImportedFlag() {
  return getMetaValue('imported_json') !== undefined;
}

export function setImportedFlag(value) {
  setMetaValue('imported_json', value);
}

// Schreibt den vollständigen State in einer Transaktion (write-through).
export function persistState(persisted) {
  persistTxn(persisted);
}

// Rekonstruiert den persistierten State aus den Tabellen. Gibt null zurück,
// wenn die DB leer ist (dann greifen Defaults in state.js).
export function loadFromDb() {
  if (isEmpty()) return null;

  const runs = {};
  for (const r of stmt.allRuns.all()) {
    const days = {};
    for (const d of stmt.daysFor.all(r.target_id)) {
      days[d.day] = { count: d.count, farmMs: d.farm_ms };
    }
    runs[r.target_id] = {
      count: r.count,
      farmMs: r.farm_ms,
      lastActiveAt: r.last_active_at ?? null,
      days,
    };
  }

  const foundItems = stmt.allItems.all().map((it) => ({
    uid: it.uid,
    itemId: it.item_id ?? null,
    name: it.name,
    quality: it.quality,
    icon: it.icon ?? null,
    qty: it.qty,
    ts: it.ts,
  }));

  const settings = {};
  for (const s of stmt.allSettings.all()) {
    try {
      settings[s.key] = JSON.parse(s.value);
    } catch {
      /* ungültige Werte ignorieren — withDefaults ergänzt sie */
    }
  }

  return {
    activeTargetId: getMetaValue('activeTargetId') ?? null,
    activeSince: getMetaValue('activeSince') ?? null,
    paused: getMetaValue('paused') ?? false,
    contest: getMetaValue('contest') ?? null,
    runs,
    foundItems,
    settings,
  };
}

// Benennt eine Altdatei (state.json) nach erfolgreichem Import um. Existiert das
// Ziel bereits, wird ein Zeitstempel angehängt, damit kein Backup verloren geht.
export function renameLegacyFile(path) {
  let dest = path + '.bak';
  if (existsSync(dest)) {
    dest = `${path}.${Date.now()}.bak`;
  }
  renameSync(path, dest);
  return dest;
}

// Schließt die DB sauber (optionaler WAL-Checkpoint beim Shutdown).
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
