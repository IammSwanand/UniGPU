; UniGPU Agent — Inno Setup Installer Script
; ============================================
; Compile with Inno Setup Compiler (https://jrsoftware.org/isinfo.php)
;
; Before compiling:
;   1. Run `python build.py` to produce the dist/UniGPU Agent/ folder
;   2. Ensure assets/icon.ico exists
;   3. Open this file in Inno Setup Compiler and click Build
;
; Output: Output/UniGPU-Agent-Setup.exe

#define MyAppName "UniGPU Agent"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "UniGPU Team"
#define MyAppURL "https://github.com/IammSwanand/UniGPU"
#define MyAppExeName "UniGPU Agent.exe"

[Setup]
AppId={{B8D7E3F2-4A5C-4D2E-9F3A-1B2C3D4E5F60}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=Output
OutputBaseFilename=UniGPU-Agent-Setup
SetupIconFile=assets\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startupicon"; Description: "Start with Windows"; GroupDescription: "Startup:"

[Files]
; Copy the entire PyInstaller dist folder
Source: "dist\UniGPU Agent\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: startupicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"
