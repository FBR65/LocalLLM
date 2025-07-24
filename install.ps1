# LocalLLM Auto-Installer für Windows
# =====================================

param(
    [switch]$NoModels,      # Keine Modelle herunterladen
    [switch]$DevMode,       # Development-Modus
    [string]$InstallPath = "$env:USERPROFILE\LocalLLM"
)

Write-Host "🚀 LocalLLM Installation startet..." -ForegroundColor Cyan
Write-Host "📍 Installationsort: $InstallPath" -ForegroundColor Yellow

# 1. Überprüfung und Installation von Node.js
Write-Host "`n📦 Node.js wird überprüft..." -ForegroundColor Green
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Node.js nicht gefunden. Installation startet..." -ForegroundColor Yellow
    try {
        winget install OpenJS.NodeJS
        Write-Host "✅ Node.js erfolgreich installiert" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js Installation fehlgeschlagen. Bitte manuell von https://nodejs.org installieren" -ForegroundColor Red
        exit 1
    }
} else {
    $nodeVersion = node --version
    Write-Host "✅ Node.js bereits installiert: $nodeVersion" -ForegroundColor Green
}

# 2. Git überprüfen
Write-Host "`n📦 Git wird überprüft..." -ForegroundColor Green
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Git nicht gefunden. Installation startet..." -ForegroundColor Yellow
    try {
        winget install Git.Git
        Write-Host "✅ Git erfolgreich installiert" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Git Installation fehlgeschlagen. Bitte manuell installieren" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Git bereits installiert" -ForegroundColor Green
}

# 3. Repository klonen
Write-Host "`n📂 Repository wird geklont..." -ForegroundColor Green
if (Test-Path $InstallPath) {
    Write-Host "⚠️  Ordner existiert bereits. Wird aktualisiert..." -ForegroundColor Yellow
    Set-Location $InstallPath
    git pull origin master
} else {
    git clone https://github.com/FBR65/LocalLLM.git $InstallPath
    Set-Location $InstallPath
}
Write-Host "✅ Repository erfolgreich geklont/aktualisiert" -ForegroundColor Green

# 4. Dependencies installieren
Write-Host "`n⚙️  Node.js Dependencies werden installiert..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies erfolgreich installiert" -ForegroundColor Green
} else {
    Write-Host "❌ Dependencies Installation fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# 4.1. PST-Dependencies installieren
Write-Host "`n📧 PST-Verarbeitungs-Abhängigkeiten werden installiert..." -ForegroundColor Green
Write-Host "   (Für E-Mail-Archive und .pst-Dateien)" -ForegroundColor Cyan

$pstPackages = @(
    "pst-parser",
    "pst-extractor", 
    "email-addresses",
    "date-fns",
    "lodash"
)

foreach ($package in $pstPackages) {
    Write-Host "📦 Installiere $package..." -ForegroundColor Yellow
    npm install $package
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $package erfolgreich installiert" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $package konnte nicht installiert werden - PST-Funktionen möglicherweise eingeschränkt" -ForegroundColor Yellow
    }
}

Write-Host "✅ PST-Dependencies Installation abgeschlossen" -ForegroundColor Green

# 5. Ollama überprüfen und installieren
Write-Host "`n🤖 Ollama wird überprüft..." -ForegroundColor Green
if (!(Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Ollama nicht gefunden. Installation startet..." -ForegroundColor Yellow
    try {
        winget install Ollama.Ollama
        Write-Host "✅ Ollama erfolgreich installiert" -ForegroundColor Green
        
        # Kurz warten damit Ollama verfügbar ist
        Start-Sleep -Seconds 3
    }
    catch {
        Write-Host "❌ Ollama Installation fehlgeschlagen. Bitte manuell von https://ollama.ai installieren" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Ollama bereits installiert" -ForegroundColor Green
}

# 6. Ollama Service starten
Write-Host "`n🔄 Ollama Service wird gestartet..." -ForegroundColor Green
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (!$ollamaProcess) {
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 5
    Write-Host "✅ Ollama Service gestartet" -ForegroundColor Green
} else {
    Write-Host "✅ Ollama Service läuft bereits" -ForegroundColor Green
}

# 7. Modelle herunterladen (falls gewünscht)
if (!$NoModels) {
    Write-Host "`n📥 Standard-Modelle werden heruntergeladen..." -ForegroundColor Green
    Write-Host "⏳ Dies kann einige Minuten dauern..." -ForegroundColor Yellow
    
    $models = @(
        "gemma3:latest",
        "phi4-mini:latest", 
        "qwen2.5:latest"
    )
    
    foreach ($model in $models) {
        Write-Host "📦 Lade $model..." -ForegroundColor Cyan
        ollama pull $model
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $model erfolgreich heruntergeladen" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $model konnte nicht heruntergeladen werden" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "`n⏭️  Model-Download übersprungen (--NoModels Parameter)" -ForegroundColor Yellow
}

# 8. Startscripts erstellen
Write-Host "`n📝 Startscripts werden erstellt..." -ForegroundColor Green

# Start-Script für Development
$startDevScript = @"
# LocalLLM Development Starter
Write-Host "🚀 LocalLLM wird gestartet..." -ForegroundColor Cyan

# Ollama Service überprüfen
`$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (!`$ollamaProcess) {
    Write-Host "🔄 Ollama wird gestartet..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# LocalLLM Development Server starten
Set-Location "$InstallPath"
Write-Host "🌐 Development Server wird gestartet..." -ForegroundColor Green
npm run dev
"@

$startDevScript | Out-File -FilePath "$InstallPath\start-dev.ps1" -Encoding UTF8

# Start-Script für Production
$startProdScript = @"
# LocalLLM Production Starter
Write-Host "🚀 LocalLLM wird gestartet..." -ForegroundColor Cyan

# Ollama Service überprüfen
`$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (!`$ollamaProcess) {
    Write-Host "🔄 Ollama wird gestartet..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# LocalLLM Electron App starten
Set-Location "$InstallPath"
Write-Host "🖥️  Electron App wird gestartet..." -ForegroundColor Green
npm run electron:start
"@

$startProdScript | Out-File -FilePath "$InstallPath\start.ps1" -Encoding UTF8

Write-Host "✅ Startscripts erstellt:" -ForegroundColor Green
Write-Host "   📁 start-dev.ps1  (Development)" -ForegroundColor Cyan
Write-Host "   📁 start.ps1      (Production)" -ForegroundColor Cyan

# 9. Desktop-Verknüpfung erstellen
Write-Host "`n🔗 Desktop-Verknüpfung wird erstellt..." -ForegroundColor Green
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\Desktop\LocalLLM.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$InstallPath\start.ps1`""
$Shortcut.WorkingDirectory = $InstallPath
$Shortcut.IconLocation = "$InstallPath\frontend\static\favicon.ico"
$Shortcut.Description = "LocalLLM Desktop - Lokale KI-Anwendung"
$Shortcut.Save()

# 10. Installation abgeschlossen
Write-Host "`n🎉 Installation erfolgreich abgeschlossen!" -ForegroundColor Green
Write-Host "📍 Installationsort: $InstallPath" -ForegroundColor Cyan
Write-Host "`n🚀 Nächste Schritte:" -ForegroundColor Yellow
Write-Host "   1. Development: .\start-dev.ps1" -ForegroundColor White
Write-Host "   2. Production:  .\start.ps1" -ForegroundColor White
Write-Host "   3. Desktop:     LocalLLM Verknüpfung doppelklicken" -ForegroundColor White

if ($DevMode) {
    Write-Host "`n🔧 Development-Modus aktiviert - App wird gestartet..." -ForegroundColor Cyan
    & "$InstallPath\start-dev.ps1"
}
