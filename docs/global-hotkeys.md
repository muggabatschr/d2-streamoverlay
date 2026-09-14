# Globale Hotkeys (Runs hochzählen ohne Panel-Fokus)

Die Tastatur-Shortcuts im Steuerpanel (<kbd>+</kbd> / <kbd>−</kbd>) funktionieren
nur, wenn das **Browser-Fenster des Panels im Fokus** ist. Während D2R im Vollbild
läuft, fängt der Browser keine Tasten ab — das ist eine Sicherheits­beschränkung
des Browsers und lässt sich im JavaScript nicht umgehen.

Die Lösung: einen Hotkey auf **Betriebssystem-Ebene** abfangen (wirkt global, egal
welches Fenster gerade aktiv ist) und ihn an den Server schicken. Dafür gibt es den
HTTP-Endpoint `POST /api/action`, der dieselbe Logik auslöst wie das WebSocket-Panel.

## HTTP-Endpoint

```
POST /api/action            Body (JSON):  {"type":"INCREMENT"}
GET  /api/action?type=...    Query:        ?type=INCREMENT
```

Die Aktion kann als JSON-Body **oder** als Query-Parameter kommen (Query erspart
simplen Hotkey-Tools das JSON-Quoting). Unterstützte `type`-Werte u. a.:
`INCREMENT`, `DECREMENT`, `SET_PAUSED` (optional `value`),
`SET_ACTIVE_TARGET` (mit `targetId`), `RESET_TARGET`. Antwort: `{ "ok": true, ... }`.

Beispiel (Run hochzählen, plattformunabhängig):

```bash
curl "http://localhost:3777/api/action?type=INCREMENT"
```

> Der Endpoint ist – wie das WebSocket-Panel – **nicht authentifiziert** und für
> den lokalen Betrieb (`localhost`) gedacht.

Das Hochzählen wirkt auf das **aktive Ziel**. Wähle das Ziel also einmalig im Panel
(oder per `SET_ACTIVE_TARGET`), danach genügt der Hotkey.

---

## Windows — AutoHotkey v2

[AutoHotkey](https://www.autohotkey.com/) installieren, folgende Datei z. B. als
`d2-hotkeys.ahk` speichern und per Doppelklick starten (für Autostart in den
Autostart-Ordner legen). Bindet <kbd>F8</kbd> = +1 und <kbd>Shift+F8</kbd> = −1:

```autohotkey
#Requires AutoHotkey v2.0

Action(type) {
    try {
        req := ComObject("WinHttp.WinHttpRequest.5.1")
        req.Open("GET", "http://localhost:3777/api/action?type=" type, true)
        req.Send()
    }
}

F8::Action("INCREMENT")
+F8::Action("DECREMENT")
```

`true` im `Open(...)` macht den Aufruf asynchron — der Hotkey blockiert das Spiel
also nicht. Port ggf. anpassen, falls du den Server mit `PORT=...` startest.

---

## macOS — Option A: skhd (leichtgewichtig)

[skhd](https://github.com/koekeishiya/skhd) ist ein minimaler Hotkey-Daemon:

```bash
brew install koekeishiya/formulae/skhd
skhd --start-service
```

In `~/.config/skhd/skhdrc` eintragen (<kbd>F8</kbd> = +1, <kbd>Shift+F8</kbd> = −1):

```
f8       : curl -s "http://localhost:3777/api/action?type=INCREMENT"
shift - f8 : curl -s "http://localhost:3777/api/action?type=DECREMENT"
```

Danach `skhd --restart-service`. macOS fragt einmalig nach der Berechtigung
**Bedienungshilfen** (Systemeinstellungen → Datenschutz & Sicherheit) — erteilen.

## macOS — Option B: Hammerspoon (flexibler)

[Hammerspoon](https://www.hammerspoon.org/) installieren, in `~/.hammerspoon/init.lua`:

```lua
local function action(type)
  hs.http.asyncGet("http://localhost:3777/api/action?type=" .. type, nil, function() end)
end

hs.hotkey.bind({}, "F8", function() action("INCREMENT") end)
hs.hotkey.bind({"shift"}, "F8", function() action("DECREMENT") end)
```

Dann „Reload Config" im Hammerspoon-Menü. Auch hier einmalig Bedienungshilfen erlauben.

---

## Hotkey-Wahl

<kbd>F8</kbd> ist nur ein Vorschlag — wähle eine Taste, die D2R nicht selbst belegt.
Funktionstasten (F6–F12) oder Kombinationen mit Modifier sind meist konfliktfrei.
