// Terror-Zone-Abruf von d2emu.com. Holt die aktuelle und nächste Online-Terror-
// Zone, übersetzt die Zonen-IDs in lesbare Namen und meldet jede Änderung über
// einen Callback. Der Abruf ist auf die Viertel-/Halbstunden-Grenzen (:00/:30)
// ausgerichtet, weil d2emu die Daten in diesem Takt aktualisiert.
//
// Online ist die Terror-Zone für Ladder (Season) und Non-Ladder identisch — es
// gibt also nur EINEN Feed. Die Season/Non-Season-Auswahl im Steuerpanel wechselt
// daher nur die Beschriftung im Overlay, nicht die Datenquelle.
//
// Zugang: d2emu verlangt Username + Token (kostenlos über deren Discord anzufragen,
// siehe https://www.d2emu.com/terms). Zwei Quellen, in dieser Reihenfolge:
//   1. Im Steuerpanel hinterlegt (in der DB, Tabelle secrets) — hat Vorrang.
//   2. Umgebungsvariablen D2EMU_USERNAME / D2EMU_TOKEN — Fallback.
// Fehlt beides, bleibt das Feature inaktiv (terrorZone = null) — der Server läuft
// normal weiter.

const API_URL = 'https://www.d2emu.com/api/v1/tz';

// Hinweis: Die Zonen-ID→Name-Zuordnung liegt jetzt (mehrsprachig) in der DB
// (Tabelle zones/zone_i18n, geseedet aus server/catalog-seed.js). Der Server
// broadcastet nur die Zonen-IDs; die Namensauflösung passiert im Frontend nach
// der gewählten Datensprache.

const ENV_USERNAME = process.env.D2EMU_USERNAME || '';
const ENV_TOKEN = process.env.D2EMU_TOKEN || '';

// Verzögerung nach der :00/:30-Grenze, bevor abgerufen wird. d2emu liefert die
// neue Zone (und die Vorhersage der nächsten) erst ein paar Minuten später.
const POLL_OFFSET_MS = 90_000;

let onUpdate = null; // Callback(tz) bei jeder Aktualisierung
let onStatus = null; // Callback(status) bei jeder Statusänderung
let latest = null; // { currentIds: number[], nextIds: number[], updatedAt: number }
let timer = null;

// Aktuell verwendete Zugangsdaten. `source` sagt, woher sie stammen — das
// Steuerpanel zeigt es an, damit nachvollziehbar bleibt, warum ein Wert gilt.
let username = '';
let token = '';
let source = 'none'; // 'panel' | 'env' | 'none'

// Letzter Abrufzustand. Wandert (OHNE Zugangsdaten!) in den State und damit ins
// Steuerpanel. `error` ist ein Kürzel, das im Frontend übersetzt wird:
//   'auth'    — Username/Token von d2emu abgelehnt (401/403)
//   'http'    — anderer HTTP-Fehler
//   'api'     — d2emu meldet inhaltlich einen Fehler
//   'network' — Server gar nicht erreicht
let status = { configured: false, source: 'none', ok: null, error: null, checkedAt: null };

// Normalisiert eine ID-Liste der d2emu-Antwort zu number[] (unbekannte Werte raus).
function toIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => Number(id)).filter((n) => Number.isFinite(n));
}

// Liefert die zuletzt abgerufene Terror-Zone (oder null, solange nichts vorliegt).
export function getTerrorZone() {
  return latest;
}

// Liefert den Abrufzustand — ohne Zugangsdaten, für den broadcasteten State.
export function getTerrorZoneStatus() {
  return { ...status };
}

// Liefert Quelle und Username für das Steuerpanel. Der Token wird bewusst NICHT
// zurückgegeben, nur die Information, DASS einer hinterlegt ist.
export function getCredentialInfo() {
  return { source, username, hasToken: !!token, status: getTerrorZoneStatus() };
}

function setStatus(patch) {
  status = { ...status, ...patch };
  if (onStatus) onStatus(getTerrorZoneStatus());
}

async function fetchTz() {
  if (!username || !token) return false;
  try {
    const res = await fetch(API_URL, {
      headers: { 'x-emu-username': username, 'x-emu-token': token },
    });
    if (res.status === 401 || res.status === 403) {
      console.error(`[tz] d2emu lehnt die Zugangsdaten ab (HTTP ${res.status}).`);
      setStatus({ ok: false, error: 'auth', checkedAt: Date.now() });
      return false;
    }
    if (!res.ok) {
      console.error(`[tz] HTTP ${res.status} von d2emu`);
      setStatus({ ok: false, error: 'http', checkedAt: Date.now() });
      return false;
    }
    const data = await res.json();
    if (!data || data.status === 'ERROR') {
      const message = data?.message || 'unbekannt';
      console.error('[tz] d2emu-Fehler:', message);
      // Abgelehnte Zugangsdaten kommen NICHT als 401/403, sondern als HTTP 200 mit
      // { status: 'ERROR', message: 'Invalid token, ...' }. Ohne diese Erkennung
      // bekäme der Nutzer „Serverfehler, später erneut versuchen" zu lesen und
      // würde seinen Tippfehler nie finden.
      const isAuth = /invalid\s+(token|user)|unauthor|forbidden/i.test(message);
      setStatus({ ok: false, error: isAuth ? 'auth' : 'api', checkedAt: Date.now() });
      return false;
    }
    latest = {
      currentIds: toIds(data.current),
      nextIds: toIds(data.next),
      updatedAt: Date.now(),
    };
    setStatus({ ok: true, error: null, checkedAt: Date.now() });
    if (onUpdate) onUpdate(latest);
    return true;
  } catch (err) {
    console.error('[tz] Abruf fehlgeschlagen:', err.message);
    setStatus({ ok: false, error: 'network', checkedAt: Date.now() });
    return false;
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

function stopPolling() {
  if (timer) clearTimeout(timer);
  timer = null;
}

// Setzt die Zugangsdaten zur Laufzeit und ruft sofort ab — das Steuerpanel braucht
// die Rückmeldung, ob d2emu sie akzeptiert. `creds` null/leer = zurück auf den
// Env-Fallback (und, wenn auch der fehlt, Feature aus).
//
// Gibt den Abrufzustand nach dem Prüfabruf zurück.
export async function setCredentials(creds) {
  if (creds && creds.username && creds.token) {
    username = String(creds.username).trim();
    token = String(creds.token).trim();
    source = 'panel';
  } else if (ENV_USERNAME && ENV_TOKEN) {
    username = ENV_USERNAME;
    token = ENV_TOKEN;
    source = 'env';
  } else {
    username = '';
    token = '';
    source = 'none';
  }

  stopPolling();
  latest = null; // alte Zone gehört zu den alten Zugangsdaten
  setStatus({
    configured: !!(username && token),
    source,
    ok: null,
    error: null,
    checkedAt: null,
  });

  if (!username || !token) {
    if (onUpdate) onUpdate(null); // Anzeige leeren
    return getTerrorZoneStatus();
  }

  await fetchTz();
  scheduleNext();
  return getTerrorZoneStatus();
}

// Startet den Abruf: einmal sofort, danach jeweils kurz nach :00 und :30.
// `creds` sind die in der DB hinterlegten Zugangsdaten (oder null → Env-Fallback).
export function startTerrorZone({ onUpdate: updateCb, onStatus: statusCb, credentials } = {}) {
  onUpdate = updateCb || null;
  onStatus = statusCb || null;

  // Der erste setCredentials-Aufruf erledigt Quelle, Status und Erstabruf.
  const promise = setCredentials(credentials);

  if (!credentials && !(ENV_USERNAME && ENV_TOKEN)) {
    console.warn(
      '[tz] Keine d2emu-Zugangsdaten — Terror-Zone-Anzeige inaktiv.\n' +
        '      Im Steuerpanel unter „Terror Zone" hinterlegen oder D2EMU_USERNAME/D2EMU_TOKEN setzen.'
    );
  }
  return promise;
}
