# יוצר בשולחן העבודה קיצור "kaminer.ai" שמפעיל את scripts/start-app.ps1.
# הרצה חוזרת מעדכנת את הקיצור (למשל אחרי העברת תיקיית הפרויקט).

$root = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "kaminer.ai.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $PSHOME "powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $root 'scripts\start-app.ps1')`""
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = Join-Path $root "src\app\favicon.ico"
$shortcut.Description = "kaminer.ai - ניהול משימות"
$shortcut.Save()

Write-Host "נוצר קיצור: $shortcutPath"
