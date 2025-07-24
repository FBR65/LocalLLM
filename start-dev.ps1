# LocalLLM Development Starter
# ============================

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

# LocalLLM Development Server starten
Write-Host "`n🌐 Development Server wird gestartet..." -ForegroundColor Green
Write-Host "📝 Hinweis: Vite Dev Server läuft auf http://localhost:5173" -ForegroundColor Cyan
Write-Host "🤖 Ollama API läuft auf http://localhost:11434" -ForegroundColor Cyan
Write-Host "`n⏹️  Zum Beenden: Ctrl+C drücken`n" -ForegroundColor Yellow

npm run dev
