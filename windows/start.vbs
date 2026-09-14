' Startet das Overlay ohne sichtbares Konsolenfenster. Ziel der Startmenü- und
' Desktop-Verknüpfung, die der Installer anlegt.
'
' Der Server läuft weiter, solange dieser Prozess lebt — beendet wird er über das
' Taskleistensymbol des Browsers hinaus NICHT automatisch; dafür gibt es den
' Startmenü-Eintrag "D2 Stream-Overlay beenden" (stop.vbs).
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
shell.CurrentDirectory = base
' 0 = verstecktes Fenster, False = nicht auf das Ende warten
shell.Run """" & base & "\node.exe"" ""windows\launcher.mjs""", 0, False
