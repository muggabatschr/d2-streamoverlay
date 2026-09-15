// HTTP-Server (Express, liefert public/ statisch) + WebSocket-Server am selben Port.
// Bei Verbindung erhält ein Client sofort den aktuellen State; jede Aktion wird
// angewandt und der vollständige State an alle Clients gebroadcastet.

import http from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import {
  loadState,
  getState,
  applyAction,
  setTerrorZone,
  setTerrorZoneStatus,
  setChangeNotifier,
} from './state.js';
import { startTerrorZone, setCredentials, getCredentialInfo } from './terrorzone.js';
import {
  closeDb,
  getItemsAllLangs,
  getTargetsAllLangs,
  getZonesAllLangs,
  getItemFinds,
  getTzCredentials,
  saveTzCredentials,
  clearTzCredentials,
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

// --- d2emu-Zugangsdaten ---------------------------------------------------
// Das Steuerpanel hinterlegt hier Username + Token für den Terror-Zone-Abruf.
// Der Token verlässt den Server NIE wieder: GET liefert nur Username, Quelle und
// die Information, dass ein Token gesetzt ist. Deshalb eigene Endpoints statt
// einer Aktion über den WebSocket — der broadcastet an alle Clients.
//
// Hinweis: ungeschützt wie der Rest der Schnittstelle — gedacht für localhost.

app.get('/api/tz-credentials', (_req, res) => res.json(getCredentialInfo()));

// Speichern + sofort gegen d2emu prüfen, damit das Panel gleich sagen kann, ob
// die Daten akzeptiert wurden (statt bis zum nächsten :00/:30 im Dunkeln zu sein).
app.post('/api/tz-credentials', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!username || !token) {
    return res.status(400).json({ ok: false, error: 'missing' });
  }
  saveTzCredentials({ username, token });
  const status = await setCredentials({ username, token });
  broadcastState();
  res.json({ ok: status.ok === true, info: getCredentialInfo() });
});

// Löschen — danach greift wieder der Env-Fallback (oder das Feature ist aus).
app.delete('/api/tz-credentials', async (_req, res) => {
  clearTzCredentials();
  await setCredentials(null);
  broadcastState();
  res.json({ ok: true, info: getCredentialInfo() });
});

// Server beenden. Nötig für die Windows-Variante: dort startet das Overlay über
// eine Verknüpfung ohne Fenster, es gibt also nichts zum Schließen — im
// Task-Manager steht nur ein node-Prozess. Das Steuerpanel bekommt dafür einen
// Knopf, und windows/stop.ps1 ruft denselben Endpoint auf (und beendet den
// Prozess erst hart, wenn das nicht greift).
//
// Hinweis: ungeschützt wie der Rest der Schnittstelle — gedacht für localhost.
// Wer den Server erreicht, kann ohnehin schon alle Funde löschen.
app.post('/api/shutdown', (_req, res) => {
  res.json({ ok: true });
  console.log('\n  Beenden angefordert — Server wird gestoppt.');
  // Erst die Antwort rausschreiben lassen, dann geordnet herunterfahren.
  setTimeout(() => {
    // Offene WebSockets halten den Server sonst am Leben und server.close()
    // würde nie zurückkehren.
    for (const client of wss.clients) {
      try {
        client.close();
      } catch {
        /* egal, wir gehen ohnehin */
      }
    }
    server.close(() => shutdown());
    // Reißleine, falls doch eine Verbindung hängen bleibt.
    setTimeout(shutdown, 1500).unref();
  }, 100);
});

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
// alle Clients broadcasten. Zugangsdaten zuerst aus der DB (im Steuerpanel
// hinterlegt), sonst aus D2EMU_USERNAME/D2EMU_TOKEN; ohne beides bleibt es aus.
startTerrorZone({
  credentials: getTzCredentials(),
  onUpdate: (tz) => {
    setTerrorZone(tz);
    broadcastState();
  },
  onStatus: (tzStatus) => {
    setTerrorZoneStatus(tzStatus);
    broadcastState();
  },
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
