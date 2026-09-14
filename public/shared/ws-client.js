// Geteilter WebSocket-Client für Overlay und Steuerpanel.
// Verbindet zum selben Host/Port, von dem die Seite geladen wurde, mit
// automatischem Reconnect (Backoff). onState(cb) wird bei jedem State-Update
// aufgerufen, send(action) schickt eine Aktion an den Server.

export function createClient({ onState, onStatus } = {}) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${proto}://${location.host}`;

  let ws = null;
  let reconnectDelay = 500; // ms, wächst bis max
  const MAX_DELAY = 5000;
  let reconnectTimer = null;
  let closedByUser = false;

  function setStatus(status) {
    if (onStatus) onStatus(status);
  }

  function connect() {
    setStatus('connecting');
    ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      reconnectDelay = 500;
      setStatus('connected');
    });

    ws.addEventListener('message', (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.type === 'state' && onState) onState(msg.state);
    });

    ws.addEventListener('close', () => {
      setStatus('disconnected');
      if (!closedByUser) scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      // Fehler führt ohnehin zu close -> dort wird reconnected.
      try {
        ws.close();
      } catch {}
    });
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      reconnectDelay = Math.min(MAX_DELAY, reconnectDelay * 1.6);
      connect();
    }, reconnectDelay);
  }

  function send(action) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(action));
    }
  }

  connect();

  return {
    send,
    close() {
      closedByUser = true;
      if (ws) ws.close();
    },
  };
}

// Formatiert eine Dauer in ms als HH:MM:SS — von Steuerpanel und Overlay genutzt.
export function formatDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// D2-Qualitätsfarben — von beiden Seiten genutzt.
export const QUALITY_COLORS = {
  unique: '#c7b377',
  set: '#00ff00',
  rare: '#ffff64',
  magic: '#6969ff',
  rune: '#ff8000',
  runeword: '#d9b34a',
  crafted: '#ff8000',
  normal: '#ffffff',
};

// Erzeugt ein Item-Icon-Element mit Fallback: fehlt das Bild, wird ein in
// Qualitätsfarbe getöntes Platzhalter-Feld (mit Initialen bzw. Runen-Kürzel)
// angezeigt. Gibt ein <span class="item-icon"> zurück.
export function buildItemIcon(item) {
  const wrap = document.createElement('span');
  wrap.className = `item-icon q-${item.quality || 'unique'}`;

  const fallback = () => {
    wrap.classList.add('item-icon--fallback');
    wrap.textContent = item.rune
      ? item.rune
      : (item.name || '?').replace(/[^A-Za-zÄÖÜäöü0-9]/g, '').slice(0, 2).toUpperCase();
  };

  if (item.icon) {
    const img = document.createElement('img');
    img.alt = item.name || '';
    img.src = `assets/items/${item.icon}`;
    img.addEventListener('error', () => {
      img.remove();
      fallback();
    });
    wrap.appendChild(img);
  } else {
    fallback();
  }
  return wrap;
}
