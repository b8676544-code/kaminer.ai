# הפעלת המערכת בלחיצה אחת (הקיצור "kaminer.ai" בשולחן העבודה מריץ את הקובץ הזה).
# מפעיל לפי הצורך: Docker Desktop, ‏Supabase המקומי ושרת הפיתוח, ואז פותח את הדפדפן.
# אם המערכת כבר פועלת, רק פותח את הדפדפן.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$url = "http://localhost:3000"
Set-Location $root

function Test-App {
  try {
    Invoke-WebRequest -Uri "$url/login" -UseBasicParsing -TimeoutSec 15 | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Test-Docker {
  docker info *> $null
  return $LASTEXITCODE -eq 0
}

function Wait-Until([scriptblock]$check, [int]$seconds, [string]$what) {
  $deadline = (Get-Date).AddSeconds($seconds)
  while (-not (& $check)) {
    if ((Get-Date) -gt $deadline) { throw "$what לא עלה אחרי $seconds שניות." }
    Start-Sleep -Seconds 3
  }
}

try {
  if (Test-App) {
    Start-Process $url
    exit 0
  }

  Write-Host "מפעילה את kaminer.ai..." -ForegroundColor Cyan

  # 1. Docker Desktop
  if (-not (Test-Docker)) {
    Write-Host "מפעילה את Docker Desktop (עד כשתי דקות)..."
    $candidates = @(
      (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe"),
      (Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe")
    )
    $exe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $exe) { throw "Docker Desktop לא נמצא במחשב." }
    Start-Process $exe
    Wait-Until { Test-Docker } 240 "Docker"
  }

  # 2. Supabase המקומי. אם הוא כבר רץ, הפקודה פשוט מסיימת.
  #    npm.cmd ו-npx.cmd ולא npm/npx: אלה קבצי ps1 שמדיניות ההרצה של Windows חוסמת.
  #    דרך cmd, כי ב-PowerShell 5 שורת מידע ב-stderr נחשבת שגיאה ועוצרת את הסקריפט
  Write-Host "מפעילה את מסד הנתונים..."
  cmd.exe /c "npx.cmd supabase start >nul 2>&1"
  if ($LASTEXITCODE -ne 0) { throw "Supabase לא עלה. נסי להריץ npm run db:start בטרמינל כדי לראות את השגיאה." }

  # 3. שרת הפיתוח, בחלון ממוזער משלו. סגירת החלון עוצרת את השרת
  Write-Host "מפעילה את השרת..."
  Start-Process powershell.exe -WindowStyle Minimized -WorkingDirectory $root -ArgumentList @(
    "-NoProfile", "-NoExit", "-Command",
    "`$host.UI.RawUI.WindowTitle = 'kaminer.ai - server (closing this window stops the system)'; npm.cmd run dev"
  )
  Wait-Until { Test-App } 120 "השרת"

  Start-Process $url
} catch {
  Write-Host ""
  Write-Host $_.Exception.Message -ForegroundColor Red
  Read-Host "לחצי Enter כדי לסגור"
  exit 1
}
