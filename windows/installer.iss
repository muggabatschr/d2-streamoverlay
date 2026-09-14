; Inno-Setup-Skript für das Windows-Setup des D2 Stream-Overlays.
;
; Baut aus dem Bundle-Ordner (Default build\win, vorher per
; `node scripts/bundle-win.mjs` erzeugt) ein Setup mit Startmenü-Einträgen und
; Deinstaller. Kompilieren:
;
;   iscc windows\installer.iss
;   iscc /DMyAppVersion=1.2.0 /DBundleDir=..\build\win windows\installer.iss
;
; Läuft nur unter Windows — der Inno-Setup-Compiler ist Windows-only. Im Projekt
; erledigt das der Workflow .github/workflows/windows-installer.yml.

#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif
#ifndef BundleDir
  #define BundleDir "..\build\win"
#endif

#define MyAppName "D2 Stream-Overlay"
#define MyAppPublisher "muggabatschr"
#define MyAppURL "https://github.com/muggabatschr/d2-streamoverlay"

[Setup]
AppId={{8E4C6F2A-1D7B-4A93-9C31-5F0E2B7A4D18}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
DefaultDirName={autopf}\D2-Overlay
DefaultGroupName={#MyAppName}
; Kein Admin nötig, wenn nach {localappdata} installiert wird — lowest hält die
; UAC-Abfrage klein. {autopf} weicht dann automatisch auf den Nutzerpfad aus.
PrivilegesRequiredOverridesAllowed=dialog
PrivilegesRequired=lowest
OutputDir=..\build
OutputBaseFilename=Setup-D2-Overlay-{#MyAppVersion}
SetupIconFile=app.ico
UninstallDisplayIcon={app}\windows\app.ico
; node.exe ist ~89 MB und komprimiert sehr gut — LZMA2/max lohnt hier.
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
DisableProgramGroupPage=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
InfoAfterFile=LIESMICH.txt

[Languages]
Name: "german"; MessagesFile: "compiler:Languages\German.isl"

[Tasks]
Name: "desktopicon"; Description: "Verknüpfung auf dem Desktop anlegen"; GroupDescription: "Zusätzliche Verknüpfungen:"

[Files]
; Der komplette Bundle-Ordner: node.exe, server\, public\, node_modules\, windows\.
Source: "{#BundleDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Start: über wscript, damit kein Konsolenfenster aufblitzt.
Name: "{group}\{#MyAppName}"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\windows\start.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\windows\app.ico"
Name: "{group}\{#MyAppName} beenden"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\windows\stop.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\windows\app.ico"
Name: "{group}\Anleitung"; Filename: "{app}\windows\LIESMICH.txt"
Name: "{group}\Steuerpanel öffnen"; Filename: "http://localhost:3777/control.html"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\windows\start.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\windows\app.ico"; Tasks: desktopicon

[Run]
Filename: "{sys}\wscript.exe"; Parameters: """{app}\windows\start.vbs"""; WorkingDir: "{app}"; Description: "{#MyAppName} jetzt starten"; Flags: postinstall nowait skipifsilent

[UninstallRun]
; Laufenden Server beenden, sonst bleibt node.exe gesperrt und {app} nicht löschbar.
Filename: "{sys}\wscript.exe"; Parameters: """{app}\windows\stop.vbs"""; Flags: runhidden; RunOnceId: "StopServer"

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

; Nutzerdaten liegen bewusst in %APPDATA%\D2-Overlay und werden NICHT gelöscht —
; Runs, Funde und Einstellungen überleben Deinstallation und Update.
