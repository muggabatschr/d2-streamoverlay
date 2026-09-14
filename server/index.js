// HTTP-Server (Express, liefert public/ statisch) + WebSocket-Server am selben Port.
// Bei Verbindung erhält ein Client sofort den aktuellen State; jede Aktion wird
// angewandt und der vollständige State an alle Clients gebroadcastet.

import http from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { loadState, getState, applyAction, setTerrorZone, setChangeNotifier } from './state.js';
import { startTerrorZone } from './terrorzone.js';
import {
  closeDb,
  getItemsAllLangs,
  getTargetsAllLangs,
  getZonesAllLangs,
  getItemFinds,
} from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT) || 3777;

await loadState();

const app = express();
app.use(express.static(PUBLIC_DIR));
app.use(express.json()); // für POST /api/action mit JSON-Body

// Stammdaten als JSON, jeweils in ALLEN Sprachen — das Frontend cached sie einmal
// und schaltet die Sprache rein client-seitig um (kein Reload/Netz beim Wechsel).
app.get('/api/items', (_req, res) => res.json(getItemsAllLangs()));
app.get('/api/targets', (_req, res) => res.json(getTargetsAllLangs()));
app.get('/api/zones', (_req, res) => res.json(getZonesAllLangs()));

// Fund-Logbuch (historisch, neueste zuerst) — zum Einsehen "wann was gefunden wurde".
app.get('/api/finds', (_req, res) => res.json(getItemFinds()));

// Komfort: / leitet aufs Steuerpanel.
app.get('/', (_req, res) => res.redirect('/control.html'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcastState() {
  const msg = JSON.stringify({ type: 'state', state: getState() });
  for (const client of wss.clients) {
    if (client.readyState === 1 /* OPEN */) client.send(msg);
  }
}

// Der Wettbewerb-Timer läuft von selbst ab (ohne Client-Aktion) — der State
// meldet das hierher zurück, damit alle Clients den Endzustand mitbekommen.
setChangeNotifier(broadcastState);

// Aktion per HTTP auslösen — ermöglicht globale OS-Hotkeys (z. B. während D2R im
// Vollbild läuft), die per curl/PowerShell denselben Reducer ansteuern wie der
// WS-Handler. Die Aktion kommt als JSON-Body ODER als Query (?type=INCREMENT);
// letzteres spart simplen Hotkey-Tools das JSON-Quoting. GET und POST erlaubt.
// Hinweis: ungeschützt wie der WS-Endpoint — gedacht für localhost.
function handleHttpAction(req, res) {
  const src = req.body && Object.keys(req.body).length ? req.body : req.query;
  if (typeof src.type !== 'string') return res.status(400).json({ ok: false, error: 'type fehlt' });
  const action = { type: src.type };
  if (src.targetId != null) action.targetId = String(src.targetId);
  if (src.value != null) action.value = Number(src.value);
  if (src.label != null) action.label = String(src.label);
  const changed = applyAction(action);
  if (changed) broadcastState();
  res.json({ ok: changed, type: action.type });
}
app.get('/api/action', handleHttpAction);
app.post('/api/action', handleHttpAction);

wss.on('connection', (ws) => {
  // Initialen State sofort senden.
  ws.send(JSON.stringify({ type: 'state', state: getState() }));

  ws.on('message', (raw) => {
    let action;
    try {
      action = JSON.parse(raw.toString());
    } catch {
      return; // ungültige Nachricht ignorieren
    }
    if (applyAction(action)) broadcastState();
  });
});

// Terror-Zone-Abruf starten: jede Aktualisierung in den State schreiben und an
// alle Clients broadcasten (läuft nur mit gesetztem D2EMU_USERNAME/D2EMU_TOKEN).
startTerrorZone((tz) => {
  setTerrorZone(tz);
  broadcastState();
});

server.listen(PORT, () => {
  console.log(`\n  D2R Stream-Overlay läuft.`);
  console.log(`  Steuerpanel : http://localhost:${PORT}/control.html`);
  console.log(`  Overlay (OBS): http://localhost:${PORT}/overlay.html\n`);
});

// Sauberes Beenden: DB schließen (WAL-Checkpoint). Nicht für die Datensicherheit
// nötig — jede Aktion ist bereits committet — sondern nur für einen sauberen Stand.
function shutdown() {
  closeDb();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
