' Startet stop.ps1 ohne sichtbares Fenster. Ziel der Startmenue-Verknuepfung
' "D2 Stream-Overlay beenden"; der Deinstaller ruft dasselbe auf, damit die
' laufende node.exe den Programmordner nicht blockiert.
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
script = fso.GetParentFolderName(WScript.ScriptFullName) & "\stop.ps1"
' 0 = verstecktes Fenster, True = warten, bis das Beenden durch ist
shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & script & """", 0, True
