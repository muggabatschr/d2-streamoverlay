# Windows-Variante (Self-Contained Installer) für d2-streamoverlay

> **Status: umgesetzt und auf echtem Windows bestätigt** (Setup 1.1.0, 14.09.2026).
> Dieses Dokument hält den ursprünglich abgestimmten Ansatz fest. Beim Bauen haben
> sich zwei Dinge geändert — siehe „Abweichungen von diesem Plan" am Ende. Die Bedienungsanleitung steht im README unter
> *[Windows-Version fürs Verschenken](../README.md#windows-version-fürs-verschenken)*.

## Kontext

Das Projekt ist heute ein **Node.js-Server** (Express + `ws` + natives `better-sqlite3`,
ESM), der `public/` statisch ausliefert und seinen Zustand in einer SQLite-DB hält.
Start nur per `npm install && npm start` — setzt also eine **manuelle Node-Installation**
voraus. Ziel: eine Windows-Variante, die Endnutzer **ohne Node-Vorinstallation** per
Doppelklick installieren und starten können.

Gewählte Richtung (mit Nutzer abgestimmt):
- **Auslieferung:** Windows-**Installer (.exe Setup)** via Inno Setup → Startmenü-Eintrag,
  Deinstaller, Installation nach `C:\Program Files\D2-Overlay`.
- **Build:** **GitHub Actions auf `windows-latest`** (echtes Windows → korrektes natives
  `better-sqlite3`-Prebuild + passende node.exe-ABI).
- **Start-UX:** Launcher startet den Server **und öffnet automatisch** `control.html` im
  Standardbrowser.

### Was das bedeutet (Kernpunkte)
1. **Node wird mitgeliefert.** Wir bundeln eine portable `node.exe` (nodejs.org win-x64) +
   `node_modules` + Code. Das ist nötig, weil das Projekt ESM nutzt und mit `better-sqlite3`
   ein nativ kompiliertes Modul enthält — die robusteste Variante ist „Runtime mitliefern"
   statt „Single-.exe per pkg/SEA" (pkg/SEA + ESM + Native-Modul ist fragil).
2. **ABI-Kopplung.** Die `node.exe`-Version MUSS zur Node-Version passen, mit der
   `better-sqlite3` gebaut/geladen wurde (gleiche ABI). Beides wird in CI auf dieselbe
   Major-Version gepinnt.
3. **Schreibbares Datenverzeichnis.** `Program Files` ist für Nutzer schreibgeschützt. Die
   SQLite-DB darf nicht dorthin. Lösung **ohne Code-Änderung**: Launcher setzt
   `D2_DATA_DIR=%APPDATA%\D2-Overlay` — `server/db.js:20` und `server/state.js:24` werten
   diese Variable bereits aus.
4. **Vorbedingung GitHub:** Das Verzeichnis ist aktuell **kein Git-Repo** und hat kein
   GitHub-Remote. Für den CI-Weg muss es zunächst zu einem GitHub-Repository werden
   (`git init` + Push). Ohne das kann GitHub Actions nicht bauen.
5. **Unsignierter Installer:** Ohne Code-Signing-Zertifikat zeigt Windows beim ersten Start
   eine **SmartScreen-Warnung** („Unbekannter Herausgeber"). Funktioniert trotzdem;
   Signierung ist optional/kostenpflichtig und nicht Teil dieses Plans.
6. **Firewall/Port:** Erststart kann eine Windows-Firewall-Abfrage auslösen (Server bindet
   Port 3777). `PORT` bleibt per Env überschreibbar.

## Umfang / Neue Dateien

Es werden **keine bestehenden Server-/Frontend-Dateien geändert** (D2_DATA_DIR genügt).
Alles Neue liegt isoliert unter `windows/` plus ein CI-Workflow.

### 1. Launcher — `windows/launcher.mjs` (neu)
Kleiner ESM-Launcher, der mit der gebundelten `node.exe` läuft:
- Setzt `process.env.D2_DATA_DIR = join(process.env.APPDATA, 'D2-Overlay')` (mit `mkdirSync`
  recursive), falls nicht bereits gesetzt.
- Importiert/startet den bestehenden Server: `await import('../server/index.js')`.
- Pollt `http://localhost:<PORT>/` (Default 3777), bis er antwortet, und öffnet dann den
  Standardbrowser auf `/control.html` via `child_process` (`cmd /c start "" <url>`).
- Bei Beenden des Fensters endet der Prozess (Server stoppt) — `server/index.js` hat bereits
  SIGINT/SIGTERM-Shutdown (`server/index.js:81`).

### 2. Stiller Start — `windows/start.vbs` (neu)
Startet `node.exe windows\launcher.mjs` **ohne flackerndes Konsolenfenster** (WScript.Shell,
window-style hidden). Ziel der Startmenü-Verknüpfung. (Alternative `Start.bat` als Fallback
mit sichtbarer Konsole wird ebenfalls beigelegt, falls Logs gewünscht.)

### 3. App-Icon — `windows/app.ico` (neu)
`.ico` für Installer + Verknüpfung. Wird im CI aus einem vorhandenen PNG erzeugt (z. B. ein
Item-Icon aus `public/assets/items/`) oder als simples Platzhalter-Icon generiert.

### 4. Inno-Setup-Skript — `windows/installer.iss` (neu)
- `AppName=D2 Stream-Overlay`, `DefaultDirName={autopf}\D2-Overlay`, Version aus
  `package.json`.
- `[Files]`: kopiert den kompletten **Staging-Ordner** (node.exe, `server/`, `public/`,
  `node_modules/`, `windows/`) nach `{app}` rekursiv.
- `[Icons]`: Startmenü- (und optional Desktop-)Verknüpfung → `wscript.exe "{app}\windows\start.vbs"`,
  Icon `app.ico`.
- `[UninstallDelete]`: entfernt `{app}`. **Nutzerdaten in `%APPDATA%\D2-Overlay` bleiben
  erhalten** (kein Datenverlust bei Update/Deinstallation).
- Output: `Setup-D2-Overlay-<version>.exe`.

### 5. CI-Workflow — `.github/workflows/windows-installer.yml` (neu)
Läuft auf `windows-latest`, getriggert bei Push eines Tags `v*` (und manuell via
`workflow_dispatch`):
1. `actions/checkout`.
2. `actions/setup-node` mit **gepinnter Major-Version** (z. B. Node 22 LTS).
3. `npm ci --omit=dev` → installiert nur Runtime-Deps; `better-sqlite3` zieht das
   win32-x64-Prebuild für genau diese Node-ABI.
4. **Portable node.exe** derselben Version holen: `node-v22.x.x-win-x64.zip` von nodejs.org
   herunterladen, `node.exe` extrahieren.
5. Staging-Ordner zusammenstellen: `node.exe`, `server/`, `public/`, `node_modules/`,
   `windows/` (ohne Dev-/Test-Artefakte, ohne `server/data/`).
6. Icon erzeugen (Schritt 3 oben), falls nicht eingecheckt.
7. **Inno Setup** installieren (`choco install innosetup`) und `iscc windows/installer.iss`
   kompilieren.
8. `actions/upload-artifact` mit `Setup-D2-Overlay-*.exe` (und bei Tag-Build optional
   `softprops/action-gh-release` → an GitHub-Release anhängen).

### 6. Doku — `README.md` (ergänzen)
Neuer Abschnitt „Windows-Installer": woher das Setup kommt (Releases/Artifacts), wie man es
startet, wo die Daten liegen (`%APPDATA%\D2-Overlay`), Hinweis auf SmartScreen, optionale
D2EMU-Terror-Zone-Env-Variablen. — *Erledigt; die Env-Variablen sind inzwischen nur noch
der Zweitweg, siehe Abweichung 5.*

## Bewusst NICHT enthalten
- Kein Umbau auf CommonJS, kein pkg/nexe/SEA-Single-Exe.
- Kein Code-Signing.
- Keine Änderung an Server-/DB-/Frontend-Logik (nur additive `windows/`-Dateien + CI + README).

## Reihenfolge der Umsetzung
1. `windows/launcher.mjs`, `windows/start.vbs`, `Start.bat`-Fallback.
2. `windows/installer.iss` + Icon-Erzeugung.
3. `.github/workflows/windows-installer.yml`.
4. README-Abschnitt.
5. Repo zu GitHub bringen (`git init`, Remote, Push) — Voraussetzung für CI.

## Verifikation — am 14.09.2026 durchlaufen

- **Lokaler Smoke-Test (macOS):** Bundle über `npm run bundle:win`, Launcher daraus
  gestartet — Server läuft, Datenverzeichnis landet außerhalb des Programmordners,
  Overlay und Steuerpanel werden ausgeliefert.
- **Voller Build:** GitHub-Actions-Lauf auf `windows-latest`, Artefakt
  `Setup-D2-Overlay-1.1.0.exe` (25 MB). Bestätigt nebenbei, dass `npm ci` ohne
  Build-Tools durchläuft und die 130 Item-Icons zur Bauzeit aus `icons.urls.json`
  geladen werden.
- **Windows-Endtest: bestanden.** Installation, Startmenü-Eintrag, automatischer
  Browser-Start, Item-Icons, Beenden über beide Wege und Datenerhalt über einen
  Neustart hinweg — alles wie vorgesehen.

### Was der Endtest zutage gefördert hat
Zwei Fehler, die erst auf echtem Windows bzw. beim Bedienen auffielen und in
1.1.0 behoben sind:

1. `stop.vbs` benutzte `taskkill /FI "PATH eq …"` — **taskkill hat keinen
   PATH-Filter**, der Aufruf brach mit „ungültiger Filter" ab und beendete nichts.
   Ersetzt durch `stop.ps1` (erst `/api/shutdown`, dann gezielt die `node.exe` aus
   dem Installationsordner).
2. Ein Startmenü-Eintrag allein reicht nicht: Das Programm läuft ohne Fenster, im
   Task-Manager steht nur `node.exe`. Das Steuerpanel hat deshalb einen Knopf
   **Programm beenden** bekommen — der Weg, den man beim Bedienen auch findet.

## Offene Risiken (erledigt)
Beide Risiken betrafen ausschließlich das native Modul und sind mit dem Wechsel auf
`node:sqlite` gegenstandslos geworden — es gibt keine ABI-Kopplung und kein Prebuild mehr.

- ~~**ABI-Mismatch** node.exe ↔ better-sqlite3~~
- ~~**better-sqlite3 Prebuild fehlt** für gewählte Node-Major~~


## Abweichungen von diesem Plan (bei der Umsetzung entschieden)

1. **Kein `better-sqlite3` mehr.** Statt die ABI-Kopplung zwischen mitgelieferter
   `node.exe` und nativem Modul sorgfältig zu pflegen (Risiko 1 und 2 unten), wurde
   der Treiber auf das in Node eingebaute **`node:sqlite`** umgestellt — betroffen war
   nur `server/db.js` (Öffnen, drei PRAGMAs, zwei Transaktionen). Damit entfallen
   beide Risiken ersatzlos: das Projekt hat kein nativ kompiliertes Modul mehr,
   `node_modules` schrumpfte von 18 MB auf 4 MB, und der Bundle-Schritt läuft auf
   jedem Betriebssystem. Windows braucht es nur noch für den Inno-Setup-Compiler.

2. **Item-Icons kommen zur Bauzeit aus `icons.urls.json`.** Der Plan ließ offen, wie
   die Grafiken in den Bundle kommen — `public/assets/items/` ist nicht eingecheckt.
   Lösung: `scripts/bundle-win.mjs` nimmt lokal vorhandene Icons, lädt sie sonst aus
   der (jetzt eingecheckten) URL-Liste nach. Im öffentlichen Repo liegen damit nur
   Links, keine Grafiken. Das fertige Setup geht als **Build-Artefakt** heraus, nicht
   als öffentliches Release.

3. **Staging als eigenes Skript statt YAML-Schritten.** `scripts/bundle-win.mjs` baut
   den Bundle-Ordner; die CI ruft nur dieses Skript auf. Dadurch ist derselbe Bundle
   lokal reproduzierbar (`npm run bundle:win`), ohne die CI anzuwerfen.

4. **Zusätzlich zum Plan:** `windows/stop.vbs` samt Startmenü-Eintrag zum Beenden (der
   Server läuft sonst unsichtbar weiter) und `windows/LIESMICH.txt` mit der
   OBS-Einrichtung — ohne die steht ein unbedarfter Nutzer vor laufendem Server und
   leerem OBS. Der Deinstaller ruft `stop.vbs` vorab auf, sonst blockiert die laufende
   `node.exe` das Löschen des Programmordners.

5. **Der d2emu-Zugang wird im Steuerpanel eingetragen, nicht über Env-Variablen.** Der
   Plan sah `D2EMU_USERNAME`/`D2EMU_TOKEN` vor. Für die Windows-Variante ist das
   unbrauchbar: der Beschenkte müsste die `Start.bat` im schreibgeschützten
   Programmordner bearbeiten oder Systemvariablen anlegen — beides nichts, was man
   jemandem zumuten kann, der das Setup doppelklickt. Der Zugang liegt deshalb jetzt
   im Panel (Karte „Terror Zone" → „Zugang (d2emu)") und wird in der Datenbank unter
   `%APPDATA%\D2-Overlay` gespeichert, überlebt also auch eine Neuinstallation. Die
   Env-Variablen funktionieren weiter als Zweitweg für Server-Setups; ein im Panel
   hinterlegter Zugang hat Vorrang. **An den `windows/`-Dateien war dafür nichts zu
   ändern** — `launcher.mjs` und `Start.bat` bleiben unberührt, ergänzt wurde nur die
   `LIESMICH.txt` um Schritt 4 (Zugang anfragen und eintragen).
