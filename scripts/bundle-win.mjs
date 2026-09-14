// Stellt den Windows-Bundle-Ordner zusammen: alles, was der Rechner des Nutzers
// braucht, ohne dass dort Node installiert ist.
//
//   node scripts/bundle-win.mjs [zielordner]     (Default: build/win)
//
// Der Ordner enthält danach node.exe, den Server, das Frontend, node_modules und
// die Starter aus windows/. Aus ihm baut windows/installer.iss das Setup.
//
// Läuft auf jedem Betriebssystem: seit der Umstellung auf `node:sqlite` (siehe
// server/db.js) hat das Projekt KEIN nativ kompiliertes Modul mehr. Es gibt also
// nichts plattformabhängig zu bauen — der Bundle ist reines Kopieren plus der
// Download einer passenden node.exe. Nur das Kompilieren des Setups selbst
// (Inno Setup) braucht noch Windows; dafür gibt es den CI-Workflow.
//
// Icons: public/assets/items/ ist bewusst nicht eingecheckt (Blizzards Grafiken
// gehören nicht in ein öffentliches Repo). Sind lokal Icons vorhanden, werden sie
// übernommen; fehlen sie, lädt das Skript sie aus icons.urls.json nach. So kommt
// die CI ohne eingecheckte Grafiken zum vollständigen Bundle.

import { cp, mkdir, rm, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Node-Version für die mitgelieferte node.exe. Muss `node:sqlite` ohne Flag
// können (ab 22.13 / 23.4). Bewusst fest gepinnt, damit derselbe Commit immer
// dasselbe Bundle ergibt.
const NODE_VERSION = 'v24.21.0';
const NODE_ZIP = `node-${NODE_VERSION}-win-x64.zip`;
const NODE_URL = `https://nodejs.org/dist/${NODE_VERSION}/${NODE_ZIP}`;

// Was in den Bundle wandert. Alles andere (Skripte, Doku, .git, server/data) bleibt draußen.
const COPY = ['server', 'public', 'node_modules', 'windows', 'package.json', 'LICENSE'];

const OUT = resolve(ROOT, process.argv[2] || join('build', 'win'));
const CACHE = join(ROOT, 'build', '.cache');

const log = (msg) => console.log(`  ${msg}`);

// Lädt die node.exe der gepinnten Version und legt sie in den Bundle. Das ZIP wird
// unter build/.cache behalten, damit wiederholte Läufe nicht erneut 37 MB ziehen.
async function fetchNodeExe(dest) {
  await mkdir(CACHE, { recursive: true });
  const zip = join(CACHE, NODE_ZIP);
  if (!existsSync(zip)) {
    log(`lade ${NODE_ZIP} …`);
    const res = await fetch(NODE_URL);
    if (!res.ok) throw new Error(`Download fehlgeschlagen: HTTP ${res.status} — ${NODE_URL}`);
    await writeFile(zip, Buffer.from(await res.arrayBuffer()));
  } else {
    log(`node.exe aus dem Cache (${NODE_ZIP})`);
  }
  // bsdtar entpackt ZIPs und liegt sowohl auf macOS/Linux als auch auf Windows 10+ bei.
  const tmp = join(CACHE, 'node-unzip');
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  await run('tar', ['-xf', zip, '-C', tmp]);
  const src = join(tmp, `node-${NODE_VERSION}-win-x64`, 'node.exe');
  if (!existsSync(src)) throw new Error(`node.exe nicht im Archiv gefunden: ${src}`);
  await cp(src, join(dest, 'node.exe'));
  await rm(tmp, { recursive: true, force: true });
}

// Zählt die vorhandenen Item-Icons; fehlen sie, werden sie aus icons.urls.json
// nachgeladen (derselbe Weg wie `npm run icons:import`).
async function ensureIcons() {
  const dir = join(ROOT, 'public', 'assets', 'items');
  const count = async () =>
    (await readdir(dir).catch(() => [])).filter((f) => /\.(png|webp|gif|jpe?g|svg)$/i.test(f)).length;

  const have = await count();
  if (have > 5) {
    log(`Item-Icons: ${have} lokal vorhanden, werden übernommen`);
    return;
  }
  const manifest = join(ROOT, 'icons.urls.json');
  if (!existsSync(manifest)) {
    log('WARNUNG: keine Icons und keine icons.urls.json — das Overlay zeigt nur Platzhalter');
    return;
  }
  log('Item-Icons fehlen — lade sie aus icons.urls.json …');
  await run(process.execPath, [join(ROOT, 'scripts', 'import-icons.mjs'), manifest], {
    cwd: ROOT,
    maxBuffer: 10 * 1024 * 1024,
  });
  log(`Item-Icons: ${await count()} geladen`);
}

// Gesamtgröße eines Ordners (nur zur Ausgabe).
async function dirSize(dir) {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    total += e.isDirectory() ? await dirSize(p) : (await stat(p)).size;
  }
  return total;
}

console.log('\n  Windows-Bundle zusammenstellen\n');

await ensureIcons();

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const entry of COPY) {
  const src = join(ROOT, entry);
  if (!existsSync(src)) {
    log(`übersprungen (fehlt): ${entry}`);
    continue;
  }
  await cp(src, join(OUT, entry), {
    recursive: true,
    // Laufzeitdaten und Editor-Müll gehören nicht ins Setup.
    filter: (p) => !/[\\/](data|\.DS_Store|\.git)$/.test(p),
  });
  log(`kopiert: ${entry}`);
}

await fetchNodeExe(OUT);

const version = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8')).version;
console.log(`\n  Fertig: ${OUT}`);
console.log(`  Version ${version}, Node ${NODE_VERSION}, ${(await dirSize(OUT) / 1048576).toFixed(0)} MB entpackt`);
console.log('  Setup daraus bauen:  iscc windows\\installer.iss   (nur unter Windows)\n');
