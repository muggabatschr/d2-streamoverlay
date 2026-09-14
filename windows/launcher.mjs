// Startprogramm der Windows-Variante. Läuft mit der mitgelieferten node.exe und
// erledigt genau drei Dinge, die der Server selbst nicht tun soll:
//
//   1. Datenverzeichnis auf %APPDATA%\D2-Overlay legen — der Installationsordner
//      unter "Programme" ist für normale Nutzer schreibgeschützt, die SQLite-DB
//      darf also nicht dorthin. server/db.js und server/state.js werten
//      D2_DATA_DIR bereits aus, am Server ändert sich dadurch nichts.
//   2. Den Server starten (import von ../server/index.js).
//   3. Warten, bis er antwortet, und dann das Steuerpanel im Standardbrowser
//      öffnen — damit nach dem Doppelklick ohne Zutun etwas Sichtbares passiert.
//
// Läuft auch auf macOS/Linux, damit sich der Ablauf ohne Windows testen lässt.

import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const PORT = Number(process.env.PORT) || 3777;
const URL_CONTROL = `http://localhost:${PORT}/control.html`;

// --- 1. Schreibbares Datenverzeichnis -------------------------------------
if (!process.env.D2_DATA_DIR) {
  // APPDATA gibt es nur auf Windows; sonst bleibt es beim Default des Servers.
  const base = process.env.APPDATA || process.env.XDG_DATA_HOME || process.env.HOME;
  if (base) {
    const dir = join(base, 'D2-Overlay');
    mkdirSync(dir, { recursive: true });
    process.env.D2_DATA_DIR = dir;
  }
}
console.log(`  Daten: ${process.env.D2_DATA_DIR ?? '(Standard: server/data)'}`);

// --- 2. Server starten ----------------------------------------------------
await import('../server/index.js');

// --- 3. Browser öffnen, sobald der Server antwortet -----------------------
// Der Import oben kehrt zurück, bevor listen() fertig ist. Statt blind zu warten
// wird gepollt — das öffnet den Browser so früh wie möglich und vermeidet die
// Fehlerseite, die ein zu früher Aufruf zeigen würde.
async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(URL_CONTROL, { method: 'HEAD' });
      if (res.ok || res.status === 404) return true;
    } catch {
      /* noch nicht oben */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

function openBrowser(url) {
  const [cmd, args] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '""', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  } catch (err) {
    console.error(`  Browser konnte nicht geöffnet werden: ${err.message}`);
    console.error(`  Bitte von Hand aufrufen: ${url}`);
  }
}

if (await waitForServer()) {
  openBrowser(URL_CONTROL);
} else {
  console.error(`  Server antwortet nicht. Bitte von Hand aufrufen: ${URL_CONTROL}`);
}
