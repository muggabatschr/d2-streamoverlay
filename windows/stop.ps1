# Beendet das Overlay. Ziel der Startmenue-Verknuepfung "D2 Stream-Overlay beenden"
# und wird auch vom Deinstaller aufgerufen.
#
# Zwei Stufen, damit nichts verloren geht und nichts Fremdes getroffen wird:
#   1. Hoeflich ueber /api/shutdown - der Server faehrt selbst herunter und
#      schliesst die Datenbank sauber.
#   2. Falls er nicht reagiert (haengt, Port belegt, andere PORT-Variable): nur
#      die node.exe beenden, die AUS DIESEM Installationsordner laeuft. Ein
#      anderweitig installiertes Node bleibt unangetastet.

$base = Split-Path -Parent $PSScriptRoot
$port = if ($env:PORT) { $env:PORT } else { 3777 }

try {
    Invoke-RestMethod -Method Post -Uri "http://localhost:$port/api/shutdown" -TimeoutSec 3 | Out-Null
    Start-Sleep -Milliseconds 800
} catch {
    # Server nicht erreichbar - dann eben hart, siehe unten.
}

# Was jetzt noch aus dem Installationsordner laeuft, wird beendet.
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
        $_.ExecutablePath -and
        $_.ExecutablePath.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase)
    } |
    ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
