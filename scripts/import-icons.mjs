// Hilfsskript zum Einsortieren der Item-Icons.
//
// Die Original-Grafiken aus Diablo II: Resurrected sind Blizzards Eigentum und
// werden NICHT mitgeliefert. Dieses Skript hilft nur dabei, von dir selbst
// bereitgestellte Bilder (z. B. aus deiner eigenen Installation extrahiert oder
// aus einer Quelle, die du nutzen darfst) automatisch passend zu den in
// server/catalog-seed.js erwarteten Dateinamen nach public/assets/items/ zu
// bringen — per Kopie aus einem Ordner oder per Download aus einer URL-Liste.
//
// Verwendung:
//   node scripts/import-icons.mjs                    # nur prüfen: welche Icons fehlen?
//   node scripts/import-icons.mjs <quell-ordner>     # passende Bilder aus Ordner kopieren
//   node scripts/import-icons.mjs <urls.json>        # Bilder aus URL-Liste herunterladen
//   node scripts/import-icons.mjs --template [datei] # URL-Vorlage erzeugen (Default: icons.urls.json)
//
// Der Abgleich ist tolerant: Groß-/Kleinschreibung, Bindestriche/Unterstriche und
// die Dateiendung (png/webp/gif/jpg) werden ignoriert. Geschrieben wird immer auf
// den exakten Zielnamen aus dem Katalog-Seed, damit das Overlay die Datei findet.

import { readFile, writeFile, readdir, copyFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { items as CATALOG_ITEMS } from '../server/catalog-seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TARGET_DIR = join(ROOT, 'public', 'assets', 'items');

const IMG_EXT = new Set(['.png', '.webp', '.gif', '.jpg', '.jpeg']);
const DOWNLOAD_CONCURRENCY = 5; // gleichzeitige Downloads (höflich gegenüber den Quellen)

// Normalisiert einen Dateinamen (ohne Endung) auf einen Vergleichsschlüssel.
function key(name) {
  return basename(name, extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function loadExpectedIcons() {
  // Liste der Zielnamen aus dem Katalog-Seed, z. B. ["shako.png", "rune-ber.png"]
  return CATALOG_ITEMS.filter((it) => it.icon).map((it) => it.icon);
}

async function listImages(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isFile() && IMG_EXT.has(extname(entry.name).toLowerCase())) {
      out.push(entry.name);
    }
  }
  return out;
}

function report(present, missing) {
  console.log(`\n  Erwartete Icons:   ${present.length + missing.length}`);
  console.log(`  Vorhanden:         ${present.length}`);
  console.log(`  Fehlt noch:        ${missing.length}`);
  if (missing.length) {
    console.log('\n  Fehlende Dateien (in public/assets/items/ ablegen):');
    for (const m of missing) console.log(`    - ${m}`);
  } else {
    console.log('\n  Alle Icons sind vorhanden. 🎉');
  }
  console.log('');
}

// --- Modus: Prüfen ---------------------------------------------------------
async function runCheck(expected) {
  const have = new Set(await listImages(TARGET_DIR));
  const present = expected.filter((e) => have.has(e));
  const missing = expected.filter((e) => !have.has(e));
  report(present, missing);
  console.log('  Tipp: <quell-ordner> kopiert lokale Bilder, <urls.json> lädt sie herunter.');
  console.log('        node scripts/import-icons.mjs --template  erzeugt eine URL-Vorlage.\n');
}

// --- Modus: Aus Ordner kopieren --------------------------------------------
async function runCopy(expected, sourceDir) {
  const sourceFiles = await listImages(sourceDir);
  const byKey = new Map();
  for (const f of sourceFiles) {
    const k = key(f);
    if (!byKey.has(k)) byKey.set(k, f);
  }

  const copied = [];
  const stillMissing = [];
  for (const targetName of expected) {
    const match = byKey.get(key(targetName));
    if (match) {
      await copyFile(join(sourceDir, match), join(TARGET_DIR, targetName));
      copied.push(`${match}  ->  ${targetName}`);
    } else {
      stillMissing.push(targetName);
    }
  }

  console.log(`\n  Quelle: ${sourceDir} (${sourceFiles.length} Bilder)`);
  console.log(`  Kopiert: ${copied.length}`);
  for (const c of copied) console.log(`    ${c}`);
  if (stillMissing.length) {
    console.log(`\n  Kein passendes Bild gefunden für ${stillMissing.length}:`);
    for (const m of stillMissing) console.log(`    - ${m}`);
  }
  console.log('');
}

// --- Modus: URL-Vorlage erzeugen -------------------------------------------
async function runTemplate(expected, file) {
  const out = file || join(ROOT, 'icons.urls.json');
  if (existsSync(out)) {
    console.error(`  Datei existiert bereits, wird nicht überschrieben: ${out}`);
    process.exit(1);
  }
  // Objekt: Zielname -> leere URL. Reihenfolge wie in items.json.
  const template = {};
  for (const name of expected) template[name] = '';
  await writeFile(out, JSON.stringify(template, null, 2) + '\n', 'utf8');
  console.log(`\n  Vorlage geschrieben: ${out}`);
  console.log(`  ${expected.length} Einträge. Trage die Bild-URLs ein (leere bleiben übersprungen) und dann:`);
  console.log(`    node scripts/import-icons.mjs ${basename(out)}\n`);
}

// --- Modus: Aus URL-Liste herunterladen ------------------------------------
// Manifest-Format: { "<zielname-oder-key>": "https://..." }. Schlüssel werden
// tolerant (key()) auf die erwarteten Icon-Namen abgebildet.
async function runDownload(expected, manifestFile) {
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    console.error('  Manifest muss ein JSON-Objekt { "name": "url" } sein.');
    process.exit(1);
  }

  // Manifest-Schlüssel -> URL, indiziert über den Vergleichsschlüssel.
  const urlByKey = new Map();
  for (const [name, url] of Object.entries(manifest)) {
    if (typeof url === 'string' && url.trim()) urlByKey.set(key(name), url.trim());
  }

  // Nur erwartete Icons herunterladen, für die eine URL vorliegt.
  const jobs = [];
  const noUrl = [];
  for (const targetName of expected) {
    const url = urlByKey.get(key(targetName));
    if (url) jobs.push({ targetName, url });
    else noUrl.push(targetName);
  }

  if (!jobs.length) {
    console.log('\n  Keine (passende) URL im Manifest gefunden — nichts zu tun.\n');
    return;
  }

  console.log(`\n  Manifest: ${manifestFile}`);
  console.log(`  Lade ${jobs.length} Icon(s) herunter (max. ${DOWNLOAD_CONCURRENCY} parallel)…\n`);

  const ok = [];
  const failed = [];
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const { targetName, url } = jobs[next++];
      try {
        const res = await fetch(url, {
          // Browser-ähnlicher User-Agent: manche CDNs (z. B. Cloudflare) blocken
          // sonst untypische Clients mit 403.
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
              '(KHTML, like Gecko) Chrome/120.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/png,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          redirect: 'follow',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const type = res.headers.get('content-type') || '';
        if (type && !type.startsWith('image/')) {
          throw new Error(`kein Bild (Content-Type: ${type})`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(join(TARGET_DIR, targetName), buf);
        ok.push(targetName);
        console.log(`    ✓ ${targetName}`);
      } catch (err) {
        failed.push({ targetName, msg: err.message });
        console.log(`    ✗ ${targetName}  (${err.message})`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, jobs.length) }, worker));

  console.log(`\n  Geladen: ${ok.length}   Fehlgeschlagen: ${failed.length}`);
  if (noUrl.length) console.log(`  Ohne URL im Manifest (übersprungen): ${noUrl.length}`);
  console.log('');
}

async function main() {
  const arg = process.argv[2];
  const expected = await loadExpectedIcons();
  await mkdir(TARGET_DIR, { recursive: true });

  if (!arg) return runCheck(expected);

  if (arg === '--template') return runTemplate(expected, process.argv[3]);

  if (!existsSync(arg)) {
    console.error(`  Pfad nicht gefunden: ${arg}`);
    process.exit(1);
  }

  const info = await stat(arg);
  if (info.isDirectory()) return runCopy(expected, arg);
  if (info.isFile() && extname(arg).toLowerCase() === '.json') return runDownload(expected, arg);

  console.error(`  Unbekanntes Argument: ${arg}`);
  console.error('  Erwartet: <quell-ordner>, <urls.json> oder --template');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
