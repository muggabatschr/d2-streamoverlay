# D2R Stream-Overlay

Ein Overlay für **Diablo II: Resurrected**, das du als Browserquelle in
**Streamlabs OBS / OBS** einbindest. Es zeigt:

- das aktuell gefarmte **Akt-/Boss-Ziel** (z. B. Mephisto, Baal, Die Gräfin),
- einen **Run-Counter pro Ziel** ("wie oft habe ich diesen Run schon gemacht"),
- eine **Tages-/Gesamtsumme**: Runs (und Farm-Zeit) **heute** sowie über **alle
  Ziele aggregiert** insgesamt,
- die **gefundenen Items** als vertikales **Laufband** unter dem Verlauf
  (Icons + klassische D2-Qualitätsfarben),
- die aktuelle und nächste **Terror Zone** (optional, via d2emu.com),
- einen **Wettbewerb-Timer**: ein frei einstellbarer Countdown als oberstes Panel
  im Overlay (für „wer findet in X Zeit am meisten").

Oberfläche und Spieldaten sind **mehrsprachig** (Deutsch, Englisch, Französisch,
Spanisch, Chinesisch) — siehe [Sprachen](#sprachen).

Bedient wird alles über ein separates **Steuerpanel** (zweiter Monitor oder Handy).
Das Overlay aktualisiert sich live, der Zustand wird gespeichert und übersteht
einen Neustart (siehe [Datenspeicherung](#datenspeicherung)).

## Warum ein lokaler Server?

Eine OBS-Browserquelle läuft in einem eigenen Prozess und teilt sich keinen
Speicher mit deinem normalen Browser. Deshalb läuft ein kleiner lokaler
Node-Server, der Overlay und Steuerpanel ausliefert und beide per **WebSocket in
Echtzeit synchronisiert**.

## Installation

Voraussetzung: **Node.js ≥ 22.13** (für den eingebauten SQLite-Treiber `node:sqlite`).

```bash
npm install
npm start
```

Danach läuft der Server auf `http://localhost:3777`:

- **Steuerpanel:** http://localhost:3777/control.html
- **Overlay (für OBS):** http://localhost:3777/overlay.html

Im Steuerpanel führt oben rechts der Knopf **Overlay öffnen** in einem neuen Tab
direkt aufs Overlay — praktisch zum Kontrollieren, wie es im Stream aussieht. Es
ist dieselbe URL, die du in OBS als Browserquelle einträgst.

Der Port lässt sich per Umgebungsvariable ändern: `PORT=4000 npm start`.

## Windows-Version fürs Verschenken

Für jemanden, der weder Node installieren kann noch soll, gibt es ein **Windows-Setup**:
Doppelklick auf `Setup-D2-Overlay-<version>.exe`, dann Startmenü → *D2 Stream-Overlay*.
Der Browser öffnet sich von selbst mit dem Steuerpanel. Node ist mit im Paket, es muss
nichts weiter installiert werden.

Was der Beschenkte danach noch einmalig tut: die Browserquelle in OBS anlegen. Dafür
liegt eine Anleitung bei (Startmenü → *Anleitung*, bzw. `windows\LIESMICH.txt`).

| | |
| --- | --- |
| Installiert nach | `C:\Program Files\D2-Overlay` (ohne Adminrechte: Nutzerordner) |
| Daten | `%APPDATA%\D2-Overlay` — bleiben bei Update und Deinstallation erhalten |
| Beenden | Knopf *Programm beenden* oben rechts im Steuerpanel, oder Startmenü → *D2 Stream-Overlay beenden* |
| Bei Problemen | `windows\Start.bat` startet mit sichtbarer Konsole und zeigt Fehler |

Beim ersten Start meldet sich Windows zweimal: **SmartScreen** („Unbekannter Herausgeber",
weil das Setup nicht signiert ist → *Weitere Informationen* → *Trotzdem ausführen*) und
eventuell die **Firewall** für Port 3777 (nur lokal, freigeben).

### Setup bauen

```bash
node scripts/bundle-win.mjs      # Bundle nach build/win (node.exe wird geladen)
iscc windows\installer.iss       # daraus das Setup — nur unter Windows
```

Der Bundle-Schritt läuft auf **jedem** Betriebssystem, weil das Projekt seit dem Wechsel
auf `node:sqlite` kein nativ kompiliertes Modul mehr enthält. Nur der Inno-Setup-Compiler
ist Windows-only — deshalb gibt es den Workflow **Actions → Windows-Installer → Run
workflow**, der das Setup baut und als Artefakt anhängt.

> **Warum Artefakt und kein Release?** Das Setup enthält die Item-Grafiken, und die
> gehören Blizzard. Als Build-Artefakt kommt nur an die Datei, wer Zugriff aufs Repo hat.
> Im Repo selbst liegen weiterhin **nur die Links** (`icons.urls.json`) — der Bundle-Schritt
> lädt die Bilder zur Bauzeit nach, lokal nimmt er stattdessen deine vorhandenen aus
> `public/assets/items/`.

## In Streamlabs OBS / OBS einbinden

1. Server starten (`npm start`).
2. In OBS eine **Quelle → Browser** hinzufügen.
3. URL: `http://localhost:3777/overlay.html`
4. Breite/Höhe nach Geschmack (z. B. 360 × 720).
5. Fertig — das Overlay ist eine kompakte, transparente **Spalte** und lässt sich in
   OBS frei positionieren (z. B. oben links), sodass die Bildmitte und Diablos untere
   UI frei bleiben.

Das **Steuerpanel** öffnest du in einem normalen Browser (gerne auf einem zweiten
Monitor oder per Handy im selben Netzwerk über die IP deines PCs).

## Bedienung

- **Run-Ziel** wählen: Klick auf einen Boss/Farm-Spot. Jedes Ziel hat seinen
  eigenen Counter (als kleine Zahl am Button sichtbar).
- **Counter:** `+` / `−` bzw. die Tasten <kbd>+</kbd> / <kbd>−</kbd>, plus
  „Zurücksetzen" (setzt Counter **und** Farm-Zeit des Ziels zurück). Die Tasten
  wirken nur bei fokussiertem Panel — für **globale Hotkeys**, die auch während
  D2R im Vollbild zählen (Windows/macOS), siehe [docs/global-hotkeys.md](docs/global-hotkeys.md).
- **Farm-Zeit:** Pro Ziel wird mitgezählt, wie lange du dort farmst. Der Timer
  startet automatisch bei der Zielauswahl und stoppt/akkumuliert beim Wechsel auf
  ein anderes Ziel. Mit **„Pause"/„Fortsetzen"** verhinderst du, dass Leerlauf-
  oder Offline-Zeit mitgezählt wird.
- **Verlauf:** Alle bereits angefahrenen Ziele erscheinen (neueste zuerst) mit
  Run-Anzahl und gesamter Farm-Zeit. Ein Klick auf einen Eintrag macht das Ziel
  wieder aktiv, sodass du dort weitermachst; über „×" entfernst du einen Eintrag.
- **Tages-/Gesamtsumme:** Runs werden zusätzlich pro Kalendertag gespeichert. Das
  Overlay zeigt deshalb zwei Werte über alle Ziele zusammengefasst — „Heute"
  (Runs und Farm-Zeit des aktuellen Tages) und „Gesamt" (alles aggregiert). Beide
  werden mit dem Counter-Toggle gemeinsam ein-/ausgeblendet.
- **Funde:** Item im Suchfeld finden (Filter Unique/Set/Runen/**Skiller**) und
  anklicken — es erscheint sofort im Overlay. Über „×" einzeln entfernen oder „Alle löschen".
- **Skiller & Rainbow Facets:** Skill-Grand-Charms (21, alle Klassen/Skill-Bäume) und
  Rainbow Facets (8 = Element × Level-Up/Tod) sind enthalten. Beim Anklicken öffnet sich
  ein kleiner Dialog für einen **Zusatz** — beim Skiller ein **Affix** (Leben, Mana,
  Widerstand, … oder Freitext), beim Facet die **Werte** (z. B. `5/5`). Der Zusatz wird
  am Fund gespeichert und überall angezeigt: im Overlay-Laufband, in der Funde-Liste des
  Control-Panels und im Logbuch. Funde mit unterschiedlichem Zusatz (z. B. `5/5` vs. `4/5`)
  bleiben als eigene Kacheln erhalten, gleiche werden gestapelt. Die Facet-Icons sind die echten
  Juwel-Grafiken aus dem Spiel, je Element eingefärbt (Feuer = rot, Kälte = blau,
  Blitz = orange, Gift = grün).
- **Colossal-Ancients-Juwelen (Reign of the Warlock):** 6 neue Unique-Juwelen aus der
  Pinnacle-Begegnung — `Defender's Fire`, `Protector's Frost`, `Guardian's Thunder`,
  `Defender's Bile`, `Protector's Stone` und `Guardian's Light`. Icons sind die echten
  Spiel-Grafiken (3 Motive nach Präfix Defender/Protector/Guardian, je 2 Juwelen teilen
  sich ein Bild — wie in der Quelle diablo2.io).
- **Fund-Verlauf:** Ein dauerhaftes Logbuch hält fest, **wann (Tag/Uhrzeit) welches
  Item gefunden wurde** — jeder Fund einzeln, auch beim Stapeln. Im Steuerpanel nach
  Tagen gruppiert einsehbar; programmatisch unter `GET /api/finds`. Einzelne Einträge
  lassen sich per „×" entfernen (z. B. nach einem Fehlklick), „Alle löschen" leert das
  ganze Logbuch.
- **Fund-Archiv:** Eine eigene Seite (`/finds.html`, auch per Link „Fund-Archiv" im
  Steuerpanel) zeigt alle Funde **gefiltert nach Season bzw. Offline** — mit
  Gesamtzahl, Item-Aufstellung (was wie oft) und der nach Tagen gruppierten Liste.
- **Season:** Im Feld „Season" (bei „Funde erfassen") trägst du die aktuelle
  Ladder-Season ein (Standard 14). Sie wird **bei jedem Fund mitgespeichert** und im
  Logbuch als Badge (z. B. `S14`) angezeigt. Hinweis: Die Season lässt sich nicht
  automatisch abrufen (Blizzard bietet keine API) — daher manuell pflegen.
- **Offline:** Die Checkbox „Offline" neben dem Season-Feld deaktiviert die
  Season-Eingabe und markiert neue Funde als **offline** (statt mit Season-Nummer).
  So lässt sich auch Offline-/Singleplayer-Beute tracken; im Logbuch erscheint dann
  ein `Offline`-Badge.
- **Wettbewerb-Timer:** Ein Countdown für Wettbewerbe („wer findet in 2 Stunden am
  meisten"). Die **Dauer ist frei einstellbar** — entweder über die Schnellwahl
  (30 Min / 1 Std / 2 Std / 3 Std) oder über die Felder **Std/Min** plus
  „Übernehmen" (auch <kbd>Enter</kbd>); erlaubt ist alles von **1 Minute bis 24
  Stunden**, Vorgabe sind 2 Stunden. Der optionale **Titel** erscheint als
  Überschrift im Overlay (z. B. „Wer findet am meisten?"). Mit
  **Start/Pause/Fortsetzen** steuerst du den Lauf, „Zurücksetzen" stellt die volle
  Dauer wieder her. Die Dauer lässt sich nur im gestoppten Zustand ändern.
  Eingeblendet wird er über **„Timer im Overlay zeigen"** — dann erscheint er als
  **oberstes Panel** der Overlay-Spalte, in gleicher Breite und im gleichen Rahmen
  wie die übrigen Boxen (überlappt also nichts). Die letzten 5 Minuten färben
  sich gelb, die letzte Minute rot und pulsiert; bei 0 erscheint „Zeit
  abgelaufen!". Der Countdown hängt an einem **absoluten Endzeitpunkt** — ein
  Server-Neustart unterbricht ihn also nicht, und alle Clients zeigen dieselbe
  Restzeit.
- **Anzeige:** Counter bzw. Funde im Overlay ein-/ausblenden.
- **Sprache:** Zwei getrennte Umschalter (siehe [Sprachen](#sprachen)) —
  **Datensprache** (Item-/Boss-/Zonennamen) und **UI-Sprache** (Oberflächentexte).
- **Terror Zone:** Wähle im Steuerpanel zwischen **Season**, **Non-Season** und
  **Aus**. Das Overlay zeigt dann die aktuelle und nächste Terror Zone (siehe
  Abschnitt [Terror Zone](#terror-zone)).

## Item-Icons

Die Item-Grafiken von D2R sind Blizzards geistiges Eigentum und **nicht
enthalten**. Lege eigene Icons in `public/assets/items/` ab (Dateinamen wie im
Katalog-Seed `server/catalog-seed.js`). Sobald eine Datei vorhanden ist, zeigt das Overlay
automatisch das echte Bild; fehlt sie, erscheint ein Platzhalter in der passenden
D2-Qualitätsfarbe — es funktioniert also auch ganz ohne Bilder sofort.

### Wie müssen die Dateien heißen?

Das Overlay lädt ein Icon stur unter `public/assets/items/<icon>`, wobei `<icon>`
**exakt** der Wert des `icon`-Feldes des Items in `server/catalog-seed.js` ist.
Der Dateiname muss also zeichengenau passen — inklusive Endung.

Die Namen im Katalog folgen durchgehend diesem Muster:

| Regel | Beispiel |
| --- | --- |
| Kleinbuchstaben, ASCII, keine Umlaute | `shako.png` |
| Leerzeichen werden zu Bindestrichen | `vampire-gaze.png` |
| Apostrophe entfallen ersatzlos | `Death's Web` → `deaths-web.png` |
| Gebräuchliche Kurzform, wo es eine gibt | `Stone of Jordan` → `soj.png` |
| Runen mit Präfix `rune-` | `rune-ber.png`, `rune-jah.png` |
| Set-Items mit Set-Kurzform als Präfix | `tals-amu.png`, `aldurs-advance.png` |
| Facetten/Juwelen mit Typ-Präfix | `facet-cold.png`, `jewel-defenders.png` |

Erlaubt ist jedes Bildformat, das der Browser darstellt (PNG, WebP, GIF, JPG,
SVG) — die Endung muss aber mit dem Katalog übereinstimmen. Fast alle Einträge
erwarten `.png`; einzige Ausnahme ist der mitgelieferte `grand-charm.svg`.

**Die verbindliche Liste bekommst du dir erzeugt, statt sie abzutippen:**

```bash
npm run icons:check                         # listet alle noch fehlenden Dateinamen
node scripts/import-icons.mjs --template    # schreibt ALLE erwarteten Namen nach icons.urls.json
```

> Du musst nicht alle Icons liefern. Für jedes fehlende Bild zeichnet das Overlay
> einen Platzhalter in der jeweiligen D2-Qualitätsfarbe (Initialen bzw.
> Runen-Kürzel), das Overlay funktioniert also auch ganz ohne Bilder.

### Welche Quelle liefert brauchbare Icons?

Für den Überblick, was ein Icon taugt, zählen drei Dinge — Auflösung, **echte
Item-Farbe** und **Unterscheidbarkeit** (zwei verschiedene Funde dürfen im Overlay
nicht gleich aussehen):

| Quelle | Auflösung | Eigenart |
| --- | --- | --- |
| `diablo2.io` | ~110–230 px | **Echte Unique-/Set-Grafik** je Item, also die Farbe aus dem Spiel (Shako grün, Leviathan grün, Dracul's Grasp rot). Empfohlen. |
| `diablo2.wiki.fextralife.com` | ~200–350 px | Höher aufgelöst, zeigt aber das **Basis-Item** statt des Uniques — falsche Farbe und mehrere Uniques teilen sich ein Bild. |
| altes Diablo-Wiki (`static.wikia.nocookie.net`) | ~25–60 px | Original-Sprites aus D2 Classic. Zu klein fürs Overlay; nach dem Freistellen (siehe unten) oft unbrauchbar. |

Da das Overlay die Icons mit **28 px Kantenlänge** zeichnet, bringt Auflösung
jenseits von ~110 px nichts mehr — Farbe und Unterscheidbarkeit schlagen sie.

Dass sich einzelne Items trotzdem ein Bild teilen (Amulette, Ringe, Sorc-Orbs,
manche Stiefel/Gürtel), liegt am Spiel selbst: D2 hat für diese Slots nur eine
Handvoll Inventar-Grafiken, die alle Uniques mitbenutzen. Das lässt sich mit
keiner Quelle auflösen.

### Icons komfortabel einsortieren

Damit du Bilder nicht einzeln umbenennen musst, gibt es ein Hilfsskript:

```bash
# Zeigt, welche Icons noch fehlen:
npm run icons:check

# a) Importiert passende Bilder aus einem eigenen Ordner nach public/assets/items/:
node scripts/import-icons.mjs /pfad/zu/deinen/bildern

# b) Lädt Bilder aus einer URL-Liste herunter:
node scripts/import-icons.mjs --template          # erzeugt icons.urls.json (alle Icons, leere URLs)
#   -> URLs eintragen, dann:
node scripts/import-icons.mjs icons.urls.json
```

Der Abgleich ist tolerant gegenüber Groß-/Kleinschreibung, Bindestrichen/
Unterstrichen und der Dateiendung (`png`/`webp`/`gif`/`jpg`) und schreibt jedes
Bild auf den exakten Zielnamen aus dem Katalog-Seed (`server/catalog-seed.js`).

**URL-Liste (`icons.urls.json`):** Ein einfaches Objekt `{ "shako.png": "https://…" }`.
`--template` legt es mit allen erwarteten Icons und leeren URLs an — du trägst nur
die Adressen ein (leer gelassene Einträge werden übersprungen). Der Download prüft
den `Content-Type` (nur Bilder) und lädt höflich mit begrenzter Parallelität.

> Hinweis: Du gibst selbst die Quelle an — einen Ordner mit Bildern, die du
> verwenden darfst (z. B. aus deiner eigenen D2R-Installation extrahiert), oder
> URLs von Quellen, deren Nutzungsbedingungen das erlauben. Die Grafiken bleiben
> Blizzards Eigentum und werden nicht mitgeliefert.

### Icons freistellen (Hintergrund transparent)

Viele Quell-Bilder liegen auf einem soliden (oft schwarzen) Hintergrund oder
haben viel transparenten Rand (dann wirkt das Item im Overlay zu klein). Ein
kleines Python-Skript erledigt beides: es entfernt den Hintergrund (Flood-Fill
vom Bildrand, sodass dunkle Teile **innerhalb** des Items erhalten bleiben) und
**beschneidet** das Bild anschließend auf den sichtbaren Inhalt:

```bash
pip3 install Pillow                         # einmalig (Voraussetzung)
python3 scripts/cutout-icons.py             # stellt alle Icons in public/assets/items/ frei
python3 scripts/cutout-icons.py shako.png   # oder einzelne Dateien
THRESH=80 python3 scripts/cutout-icons.py    # Farbtoleranz erhöhen (Default 60)
```

Das Skript ist idempotent (bereits transparente Bilder werden übersprungen) und
läuft typischerweise **nach** dem Download:

```bash
node scripts/import-icons.mjs icons.urls.json   # lädt Bilder (mit Hintergrund)
python3 scripts/cutout-icons.py                 # stellt sie frei
```

> Wichtig: `icons.urls.json` verweist auf die Original-URLs **mit** Hintergrund.
> Ein erneuter Download überschreibt die freigestellten Dateien — danach also
> wieder `cutout-icons.py` ausführen.

## Terror Zone

Das Overlay kann die aktuelle und nächste **Terror Zone** anzeigen. Die Daten
kommen von **[d2emu.com](https://www.d2emu.com/)** und werden automatisch jeweils
kurz nach **:00** und **:30** aktualisiert (in diesem Takt rotieren die Trackerdaten).

**Season vs. Non-Season:** Online ist die Terror Zone für Ladder (Season) und
Non-Ladder **identisch** — es gibt nur einen Feed. Der Umschalter im Steuerpanel
(`Season` / `Non-Season` / `Aus`) wechselt deshalb nur die **Beschriftung** im
Overlay bzw. blendet die Anzeige aus. Standard ist `Aus`.

### Zugang (Token)

Die d2emu-API verlangt einen **Username + Token**. Kosten werden nirgends genannt;
du fragst den Zugang über den d2emu-Discord an und gibst dabei an, wofür du ihn
nutzt (siehe deren [Terms](https://www.d2emu.com/terms)).

**Im Steuerpanel hinterlegen (empfohlen):** Unter *Terror Zone → Zugang (d2emu)*
Username und Token eintragen und auf **Speichern & prüfen** klicken. Der Server
ruft d2emu sofort testweise ab und meldet direkt zurück, ob die Daten akzeptiert
wurden — ein Tippfehler fällt also sofort auf und nicht erst eine halbe Stunde
später. Der Kurzstatus neben der Überschrift zeigt jederzeit, ob der Abruf läuft.

Gespeichert wird in der SQLite-Datenbank, in einer **eigenen Tabelle `secrets`** —
bewusst getrennt von den übrigen Einstellungen: der State wird per WebSocket an
alle Clients gebroadcastet, auch an das Overlay in OBS. Dorthin gelangt der Token
nicht. Auch `GET /api/tz-credentials` gibt ihn nie zurück, sondern nur den
Username und die Information, *dass* ein Token hinterlegt ist.

**Alternativ per Umgebungsvariable** (z. B. für Server-Setups):

```bash
D2EMU_USERNAME="dein-name" D2EMU_TOKEN="dein-token" npm start
```

Reihenfolge: Ein **im Panel hinterlegter Zugang hat Vorrang**; die Umgebungs-
variablen greifen nur, solange dort nichts gespeichert ist. Klickst du im Panel
auf *Entfernen*, fällt der Server wieder auf die Variablen zurück (falls gesetzt).
Ohne beides bleibt die Terror-Zone-Anzeige einfach deaktiviert — der Rest des
Overlays funktioniert normal weiter.

Sollte d2emu andere Header-Namen vergeben, passt du sie in `server/terrorzone.js`
an (im `fetch`-Aufruf).

> Hinweis: Die Zonen-IDs werden über die Datenbank (Tabellen `zones`/`zone_i18n`,
> geseedet aus `server/catalog-seed.js`) auf lesbare Namen abgebildet — der Server
> broadcastet nur die IDs, übersetzt wird im Frontend nach Datensprache. Taucht
> eine unbekannte ID auf, erscheint sie als „Zone &lt;id&gt;", bis das Mapping
> ergänzt wird.

## Datenspeicherung

Runs, Counter, Farm-Zeiten, gefundene Items und das **Fund-Logbuch** (jeder Fund
mit Zeitstempel) werden in einer lokalen **SQLite-Datenbank** (`server/data/state.db`)
gespeichert und überleben jeden Neustart. Geschrieben wird **write-through bei jeder Aktion** (kein Debounce, im
WAL-Modus) — selbst die letzte Aktion direkt vor einem harten Beenden (Strg+C)
geht damit nicht verloren.

- Die Dateien `state.db-wal` / `state.db-shm` gehören zur Datenbank (WAL-Journal)
  und sollten beim Sichern/Kopieren mitgenommen werden.
- Eine ältere `server/data/state.json` (aus der vorherigen Version) wird beim ersten
  Start **automatisch einmalig importiert** und anschließend zu
  `state.json.bak` umbenannt.
- Absichtlich nicht gespeichert wird nur der laufende Farm-Timer-Anker (damit
  Server-Downtime nicht als Farm-Zeit zählt) sowie die Terror-Zone (wird beim Start
  neu abgerufen).
- Der **Wettbewerb-Timer** wird dagegen mit seinem absoluten Endzeitpunkt gesichert
  und läuft nach einem Neustart einfach weiter — die Wettbewerbszeit lief für die
  Zuschauer ja ebenfalls weiter. War er währenddessen abgelaufen, steht er beim
  Start auf „Zeit abgelaufen".

> Der SQLite-Treiber kommt aus Node selbst (`node:sqlite`, ab Node 22.13 ohne
> Flag). Das Projekt hat damit **kein nativ kompiliertes Modul** mehr — `npm
> install` braucht keine Build-Tools, und das Windows-Bundle lässt sich auf jedem
> Betriebssystem zusammenstellen (siehe [Windows-Version](#windows-version-fürs-verschenken)).

## Schriftart

Für den klassischen Diablo-Look (gemeißelte Versalien-Serife) liegt die Schrift
**Cinzel** lokal bei (`public/assets/fonts/Cinzel.ttf`) und wird per `@font-face`
geladen — Overlay und Steuerpanel nutzen sie ohne externen Abruf, also auch in der
OBS-Browserquelle. Cinzel steht unter der **SIL Open Font License** (Lizenztext:
`public/assets/fonts/OFL.txt`) und darf frei mitgeliefert werden.

> Hinweis: Die originale Diablo-Logoschrift („Exocet") ist nicht frei lizenziert
> und daher nicht enthalten. Cinzel ist die optisch sehr nahe, legale Alternative.

## Daten anpassen

Run-Ziele, Items/Runen/Runenwörter und Terror-Zonen liegen **vollständig in der
SQLite-DB** und werden zur Laufzeit von dort gelesen (über `/api/items`,
`/api/targets`, `/api/zones`). Befüllt wird die DB beim ersten Start aus dem
Katalog-**Seed-Modul** `server/catalog-seed.js` — der einzigen Quelle. (Eine leere
DB muss einmalig aus einer Quelle befüllt werden; danach ist die DB maßgeblich.)

Jeder Eintrag in `catalog-seed.js` trägt seine Namen je Sprache, z. B.:

```js
{ id: 'u-shako', quality: 'unique', icon: 'shako.png',
  name: { en: 'Harlequin Crest (Shako)', de: 'Harlekin-Helm (Shako)', fr: '…', es: '…', zh: '…' },
  type: { en: 'Helm', de: 'Helm', fr: 'Heaume', es: 'Yelmo', zh: '头盔' } }
{ id: 'r-ber', quality: 'rune', rune: 'Ber', name: { … }, type: 'Rune' }
{ id: 'rw-enigma', quality: 'runeword', name: { … }, type: 'Jah Ith Ber' }
```

- `quality`, `icon`, `rune` und die **Rune-Sequenz** eines Runenworts (`type` als
  String) sind sprachunabhängig/stabil und werden nicht übersetzt.
- Bei `unique`/`set` ist `type` ein Objekt (übersetztes Slot-Label).
- **Nach dem Bearbeiten** von `catalog-seed.js` die Konstante `CATALOG_SEED_VERSION`
  in `server/db.js` erhöhen — dann wird der Katalog beim nächsten Start neu
  eingespielt (überschreibt die Katalog-Tabellen; deine Runs/Funde bleiben unberührt).

## Sprachen

Oberfläche und Spieldaten sind in **5 Sprachen** verfügbar: Deutsch, Englisch,
Französisch, Spanisch, vereinfachtes Chinesisch. Im Steuerpanel gibt es **zwei
getrennte Umschalter** (beide werden gespeichert und gelten live für Overlay +
Steuerpanel, Standard **Deutsch**):

- **Datensprache** — Namen von Zonen, Bossen und Items (aus der DB).
- **UI-Sprache** — alle statischen Oberflächentexte.

Die statischen Texte liegen im Frontend-Modul `public/shared/i18n.js`
(`t(key, params)` mit Fallback-Kette gewählte Sprache → Deutsch → Englisch). Die
Spieldaten-Übersetzungen stehen im Katalog-Seed `server/catalog-seed.js` (siehe oben).

> Hinweis: Die Übersetzungen sind nach den offiziellen D2R-Begriffen angelegt;
> einzelne Item-Namen (v. a. FR/ZH) können abweichen und lassen sich in
> `server/catalog-seed.js` korrigieren. Fehlt eine Übersetzung, greift der Fallback (nie leer).

## Projektstruktur

```
d2-streamoverlay/
├── server/            # Node-Server (Express + ws), SQLite via node:sqlite (db.js)
│   └── catalog-seed.js # Stammdaten (Items/Targets/Zonen, mehrsprachig) -> SQLite
├── public/            # Overlay, Steuerpanel, geteilter WS-Client (+ i18n.js), Assets
├── windows/           # Windows-Auslieferung: Launcher, Starter, Setup-Skript, Anleitung
├── scripts/           # Hilfsskripte (Icon-Import, Windows-Bundle)
└── README.md
```

## Lizenz

MIT. Diablo II: Resurrected und alle zugehörigen Marken/Grafiken sind Eigentum von
Blizzard Entertainment.
