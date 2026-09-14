# Windows-Variante (Self-Contained Installer) für d2-streamoverlay

> **Status:** geplant, noch nicht umgesetzt. Dieses Dokument hält den abgestimmten
> Ansatz fest, damit die Umsetzung später ohne erneute Klärung fortgesetzt werden kann.

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
D2EMU-Terror-Zone-Env-Variablen.

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

## Verifikation
- **Lokaler Smoke-Test des Launchers (Mac, ohne Installer):**
  `D2_DATA_DIR=$(mktemp -d) node windows/launcher.mjs` → Server startet, Browser-Open-Logik
  wird ausgelöst (auf Mac via Fallback `open`), `control.html` lädt, State landet im Temp-Dir
  statt in `server/data/`.
- **Voller Build:** Tag pushen (`git tag v1.0.0 && git push --tags`) → GitHub-Actions-Run
  prüfen, Artefakt `Setup-D2-Overlay-*.exe` herunterladen.
- **Windows-Endtest:** Setup ausführen → Startmenü-Eintrag klicken → Browser öffnet
  `http://localhost:3777/control.html`, Overlay unter `/overlay.html` erreichbar; nach
  Neustart bleiben Runs/Funde erhalten (DB in `%APPDATA%\D2-Overlay`); Deinstallation
  entfernt das Programm, Daten bleiben.

## Offene Risiken
- **ABI-Mismatch** node.exe ↔ better-sqlite3 → strikt dieselbe Node-Major in CI für `setup-node`
  und das portable Download pinnen.
- **better-sqlite3 Prebuild fehlt** für gewählte Node-Major → ggf. auf jüngere LTS ausweichen
  oder `npm rebuild` auf dem Runner (MSVC ist auf `windows-latest` vorhanden).
