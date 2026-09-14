// Terror-Zone-Abruf von d2emu.com. Holt die aktuelle und nächste Online-Terror-
// Zone, übersetzt die Zonen-IDs in lesbare Namen und meldet jede Änderung über
// einen Callback. Der Abruf ist auf die Viertel-/Halbstunden-Grenzen (:00/:30)
// ausgerichtet, weil d2emu die Daten in diesem Takt aktualisiert.
//
// Online ist die Terror-Zone für Ladder (Season) und Non-Ladder identisch — es
// gibt also nur EINEN Feed. Die Season/Non-Season-Auswahl im Steuerpanel wechselt
// daher nur die Beschriftung im Overlay, nicht die Datenquelle.
//
// Zugang: d2emu verlangt Username + Token (kostenlos über deren Discord, siehe
// https://www.d2emu.com/terms). Beides wird über Umgebungsvariablen gesetzt:
//   D2EMU_USERNAME, D2EMU_TOKEN
// Fehlen sie, bleibt das Feature inaktiv (terrorZone = null) — der Server läuft
// normal weiter.

const API_URL = 'https://www.d2emu.com/api/v1/tz';

// Hinweis: Die Zonen-ID→Name-Zuordnung liegt jetzt (mehrsprachig) in der DB
// (Tabelle zones/zone_i18n, geseedet aus server/catalog-seed.js). Der Server
// broadcastet nur die Zonen-IDs; die Namensauflösung passiert im Frontend nach
// der gewählten Datensprache.

const USERNAME = process.env.D2EMU_USERNAME || '';
const TOKEN = process.env.D2EMU_TOKEN || '';

// Verzögerung nach der :00/:30-Grenze, bevor abgerufen wird. d2emu liefert die
// neue Zone (und die Vorhersage der nächsten) erst ein paar Minuten später.
const POLL_OFFSET_MS = 90_000;

let onUpdate = null; // Callback(tz) bei jeder Aktualisierung
let latest = null; // { currentIds: number[], nextIds: number[], updatedAt: number }
let timer = null;

// Normalisiert eine ID-Liste der d2emu-Antwort zu number[] (unbekannte Werte raus).
function toIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => Number(id)).filter((n) => Number.isFinite(n));
}

// Liefert die zuletzt abgerufene Terror-Zone (oder null, solange nichts vorliegt).
export function getTerrorZone() {
  return latest;
}

async function fetchTz() {
  if (!USERNAME || !TOKEN) return;
  try {
    const res = await fetch(API_URL, {
      headers: { 'x-emu-username': USERNAME, 'x-emu-token': TOKEN },
    });
    if (!res.ok) {
      console.error(`[tz] HTTP ${res.status} von d2emu`);
      return;
    }
    const data = await res.json();
    if (!data || data.status === 'ERROR') {
      console.error('[tz] d2emu-Fehler:', data?.message || 'unbekannt');
      return;
    }
    latest = {
      currentIds: toIds(data.current),
      nextIds: toIds(data.next),
      updatedAt: Date.now(),
    };
    if (onUpdate) onUpdate(latest);
  } catch (err) {
    console.error('[tz] Abruf fehlgeschlagen:', err.message);
  }
}

// Millisekunden bis zur nächsten :00/:30-Grenze plus Offset.
function msToNextSlot() {
  const now = new Date();
  const next = new Date(now);
  if (now.getMinutes() < 30) {
    next.setMinutes(30, 0, 0);
  } else {
    next.setHours(now.getHours() + 1, 0, 0, 0);
  }
  return Math.max(0, next.getTime() - now.getTime()) + POLL_OFFSET_MS;
}

function scheduleNext() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    await fetchTz();
    scheduleNext();
  }, msToNextSlot());
}

// Startet den Abruf: einmal sofort, danach jeweils kurz nach :00 und :30.
export function startTerrorZone(cb) {
  onUpdate = cb;
  if (!USERNAME || !TOKEN) {
    console.warn(
      '[tz] D2EMU_USERNAME/D2EMU_TOKEN nicht gesetzt — Terror-Zone-Anzeige deaktiviert.'
    );
    return;
  }
  fetchTz();
  scheduleNext();
}
