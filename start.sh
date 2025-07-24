#!/bin/bash
# LocalLLM Production Starter
# ===========================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🚀 LocalLLM wird gestartet...${NC}"

# Arbeitsverzeichnis ermitteln
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ollama Service überprüfen
if ! pgrep -x "ollama" > /dev/null; then
    echo -e "${YELLOW}🔄 Ollama wird gestartet...${NC}"
    ollama serve &
    sleep 3
    echo -e "${GREEN}✅ Ollama Service gestartet${NC}"
else
    echo -e "${GREEN}✅ Ollama Service läuft bereits${NC}"
fi

# Verfügbare Modelle anzeigen
echo -e "\n${CYAN}📋 Verfügbare Modelle:${NC}"
if command -v ollama &> /dev/null; then
    MODELS=$(ollama list 2>/dev/null)
    if [ ! -z "$MODELS" ]; then
        echo -e "${WHITE}$MODELS${NC}"
    else
        echo -e "${YELLOW}⚠️  Keine Modelle installiert. Verwenden Sie: ollama pull <model-name>${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Konnte Modelle nicht auflisten${NC}"
fi

# Production Build erstellen (falls noch nicht vorhanden)
if [ ! -d "dist" ]; then
    echo -e "\n${YELLOW}🔨 Production Build wird erstellt...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Build fehlgeschlagen${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Build erfolgreich erstellt${NC}"
fi

# LocalLLM Electron App starten
echo -e "\n${GREEN}🖥️  Electron App wird gestartet...${NC}"
echo -e "${CYAN}🤖 Ollama API läuft auf http://localhost:11434${NC}"
echo -e "\n${YELLOW}⏹️  Zum Beenden: App-Fenster schließen\n${NC}"

# Prüfen ob electron:start verfügbar ist
if grep -q '"electron:start"' package.json; then
    npm run electron:start
else
    echo -e "${YELLOW}⚠️  electron:start Script nicht gefunden. Verwende Preview...${NC}"
    npm run preview
fi
