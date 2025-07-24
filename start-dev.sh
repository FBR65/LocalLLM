#!/bin/bash
# LocalLLM Development Starter
# ============================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
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

# LocalLLM Development Server starten
echo -e "\n${GREEN}🌐 Development Server wird gestartet...${NC}"
echo -e "${CYAN}📝 Hinweis: Vite Dev Server läuft auf http://localhost:5173${NC}"
echo -e "${CYAN}🤖 Ollama API läuft auf http://localhost:11434${NC}"
echo -e "\n${YELLOW}⏹️  Zum Beenden: Ctrl+C drücken\n${NC}"

npm run dev
