#!/usr/bin/env python3
"""Item-Icons freistellen und auf den Inhalt beschneiden.

Viele Item-Grafiken aus den Wiki-Quellen liegen auf einem soliden (meist
schwarzen) oder leicht verlaufenden Hintergrund und/oder haben viel
transparenten Rand. Fuer das transparente OBS-Overlay soll der Hintergrund weg
und das Item den Rahmen fuellen (sonst wirkt es zu klein). Dieses Skript:
  1. macht den HINTERGRUND transparent, ohne dunkle Teile des Items zu entfernen,
  2. beschneidet anschliessend transparente Raender (Trim auf den Alpha-Inhalt).

Vorgehen: Flood-Fill vom Bildrand aus. Es werden nur Pixel transparent
gemacht, die (a) vom Rand aus zusammenhaengen und (b) farblich nah genug am
erkannten Hintergrund liegen. Dunkle Bereiche im Inneren des Items bleiben
erhalten, weil sie nicht mit dem Rand verbunden sind.

Voraussetzung: Pillow  (pip3 install Pillow)

Verwendung:
  python3 scripts/cutout-icons.py                 # alle Icons in public/assets/items/
  python3 scripts/cutout-icons.py a.png b.png     # nur bestimmte Dateien
  THRESH=80 python3 scripts/cutout-icons.py        # Farbtoleranz anpassen (Default 60)

Hinweis: Das Skript arbeitet idempotent — bereits transparente Bilder werden
uebersprungen. Es laeuft typischerweise NACH dem Icon-Download:
  node scripts/import-icons.mjs icons.urls.json
  python3 scripts/cutout-icons.py
"""

import glob
import os
import sys
from collections import Counter, deque

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow fehlt. Bitte installieren: pip3 install Pillow")

# Maximaler Farbabstand (Summe |dR|+|dG|+|dB|), bis zu dem ein Pixel noch als
# Hintergrund gilt. Ueber die Umgebungsvariable THRESH ueberschreibbar.
THRESH = int(os.environ.get("THRESH", "60"))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ITEMS_DIR = os.path.join(ROOT, "public", "assets", "items")


def color_dist(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def cutout(path):
    """Stellt ein Bild frei. Gibt eine kurze Status-Zeichenkette zurueck."""
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()

    # Alle Randkoordinaten.
    edge = (
        [(x, 0) for x in range(w)]
        + [(x, h - 1) for x in range(w)]
        + [(0, y) for y in range(h)]
        + [(w - 1, y) for y in range(h)]
    )

    # Ist der Rand ueberwiegend transparent, ist das Bild bereits freigestellt —
    # dann nur noch auf den Inhalt beschneiden.
    opaque_edge = [px[x, y] for (x, y) in edge if px[x, y][3] > 200]
    if len(opaque_edge) / max(1, len(edge)) < 0.2:
        im, suffix = trim(im)
        if suffix:
            im.save(path)
            return "schon transparent" + suffix
        return "schon transparent"

    # Haeufigste Randfarbe = Hintergrundfarbe.
    bg = Counter((c[0], c[1], c[2]) for c in opaque_edge).most_common(1)[0][0]

    # Flood-Fill vom Rand ueber hintergrundaehnliche, zusammenhaengende Pixel.
    seen = [[False] * h for _ in range(w)]
    stack = deque()
    for (x, y) in edge:
        if not seen[x][y] and px[x, y][3] > 0 and color_dist(px[x, y], bg) <= THRESH:
            seen[x][y] = True
            stack.append((x, y))

    removed = 0
    while stack:
        x, y = stack.pop()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        removed += 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny]:
                if px[nx, ny][3] > 0 and color_dist(px[nx, ny], bg) <= THRESH:
                    seen[nx][ny] = True
                    stack.append((nx, ny))

    trimmed = trim(im)
    im = trimmed[0]
    im.save(path)
    return f"freigestellt (bg={bg}, -{removed}px){trimmed[1]}"


def trim(im):
    """Beschneidet transparente Raender (Bounding-Box ueber den Alpha-Kanal).
    Gibt (Bild, Status-Suffix) zurueck."""
    before = im.size
    bbox = im.getchannel("A").getbbox()  # nur Alpha zaehlt (RGB bleibt unter alpha=0 erhalten)
    if bbox and bbox != (0, 0, before[0], before[1]):
        im = im.crop(bbox)
        return im, f", beschnitten {before[0]}x{before[1]}->{im.size[0]}x{im.size[1]}"
    return im, ""


def main():
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(ITEMS_DIR, "*.png")))
    if not files:
        sys.exit(f"Keine Icons gefunden in {ITEMS_DIR}")

    done = skipped = errors = 0
    for p in files:
        try:
            status = cutout(p)
        except Exception as e:  # einzelne kaputte Datei soll den Lauf nicht stoppen
            status = f"FEHLER: {e}"
            errors += 1
        if status == "schon transparent":
            skipped += 1
        elif status.startswith("freigestellt"):
            done += 1
            print(f"  {os.path.basename(p):28} {status}")
        else:
            print(f"  {os.path.basename(p):28} {status}")

    print(f"\n  freigestellt={done}  schon-transparent={skipped}  fehler={errors}")


if __name__ == "__main__":
    main()
