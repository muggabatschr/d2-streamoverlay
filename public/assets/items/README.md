# Item-Icons

Hier kommen die Item-Grafiken hinein. Die Dateinamen müssen den `icon`-Feldern im
Katalog-Seed `server/catalog-seed.js` entsprechen (z. B. `shako.png`,
`rune-ber.png`). Die vollständigen Namensregeln stehen im Haupt-README unter
*Item-Icons → Wie müssen die Dateien heißen?*; `npm run icons:check` listet,
was noch fehlt.

**Warum leer?** Die Item-Grafiken von Diablo II: Resurrected sind Blizzards
geistiges Eigentum und werden hier nicht mitgeliefert. Lege passende Icons (z. B.
aus Community-Quellen) als PNG/WebP in diesem Ordner ab.

**Worauf achten?** Weil das Overlay mit 28 px Kantenlänge zeichnet, zählt nicht
die Auflösung, sondern die **echte Item-Farbe** und die **Unterscheidbarkeit**.
Quellen, die statt des Uniques das Basis-Item zeigen, liefern zwar große, aber
falsch gefärbte und untereinander gleiche Bilder — Details im Haupt-README unter
*Item-Icons → Welche Quelle liefert brauchbare Icons?*.

Fehlt ein Icon, zeigt das Overlay automatisch einen **Platzhalter in der jeweiligen
D2-Qualitätsfarbe** (Initialen bzw. Runen-Kürzel) — es funktioniert also sofort,
auch ganz ohne Bilder.
