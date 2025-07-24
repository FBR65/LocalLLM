# LocalLLM Production Starter
# ===========================

Write-Host "🚀 LocalLLM wird gestartet..." -ForegroundColor Cyan

# Arbeitsverzeichnis ermitteln
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptPath

# Ollama Service überprüfen
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (!$ollamaProcess) {
    Write-Host "🔄 Ollama wird gestartet..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "✅ Ollama Service gestartet" -ForegroundColor Green
} else {
    Write-Host "✅ Ollama Service läuft bereits" -ForegroundColor Green
}

# Verfügbare Modelle anzeigen
Write-Host "`n📋 Verfügbare Modelle:" -ForegroundColor Cyan
try {
    $models = ollama list 2>$null
    if ($models) {
        Write-Host $models -ForegroundColor White
    } else {
        Write-Host "⚠️  Keine Modelle installiert. Verwenden Sie: ollama pull <model-name>" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Konnte Modelle nicht auflisten" -ForegroundColor Yellow
}

# Production Build erstellen (falls noch nicht vorhanden)
if (!(Test-Path "dist")) {
    Write-Host "`n🔨 Production Build wird erstellt..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build fehlgeschlagen" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build erfolgreich erstellt" -ForegroundColor Green
}

# LocalLLM Electron App starten
Write-Host "`n🖥️  Electron App wird gestartet..." -ForegroundColor Green
Write-Host "🤖 Ollama API läuft auf http://localhost:11434" -ForegroundColor Cyan
Write-Host "`n⏹️  Zum Beenden: App-Fenster schließen`n" -ForegroundColor Yellow

# Prüfen ob electron:start verfügbar ist
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.scripts."electron:start") {
    npm run electron:start
} else {
    Write-Host "⚠️  electron:start Script nicht gefunden. Verwende Preview..." -ForegroundColor Yellow
    npm run preview
}
