' Beendet alle node.exe-Prozesse aus dem Installationsordner — also genau den
' Overlay-Server, ohne ein anderweitig installiertes Node zu treffen.
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
shell.Run "taskkill /F /FI ""IMAGENAME eq node.exe"" /FI ""PATH eq " & base & """", 0, True
