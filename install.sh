#!/bin/bash
# LocalLLM Auto-Installer für Linux/macOS
# =======================================

set -e  # Exit on any error

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Parameter
NO_MODELS=false
DEV_MODE=false
INSTALL_PATH="$HOME/LocalLLM"

# Parameter parsing
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-models)
            NO_MODELS=true
            shift
            ;;
        --dev-mode)
            DEV_MODE=true
            shift
            ;;
        --install-path)
            INSTALL_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unbekannter Parameter: $1"
            echo "Verwendung: $0 [--no-models] [--dev-mode] [--install-path PATH]"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🚀 LocalLLM Installation startet...${NC}"
echo -e "${YELLOW}📍 Installationsort: $INSTALL_PATH${NC}"

# 1. Betriebssystem erkennen
OS=""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo -e "${GREEN}🐧 Linux erkannt${NC}"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo -e "${GREEN}🍎 macOS erkannt${NC}"
else
    echo -e "${RED}❌ Nicht unterstütztes Betriebssystem: $OSTYPE${NC}"
    exit 1
fi

# 2. Node.js überprüfen und installieren
echo -e "\n${GREEN}📦 Node.js wird überprüft...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js nicht gefunden. Installation startet...${NC}"
    
    if [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            echo -e "${RED}❌ Homebrew nicht gefunden. Bitte Node.js manuell installieren: https://nodejs.org${NC}"
            exit 1
        fi
    elif [[ "$OS" == "linux" ]]; then
        # Check for different package managers
        if command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v dnf &> /dev/null; then
            sudo dnf install nodejs npm
        elif command -v pacman &> /dev/null; then
            sudo pacman -S nodejs npm
        else
            echo -e "${RED}❌ Kein unterstützter Paketmanager gefunden. Bitte Node.js manuell installieren.${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✅ Node.js erfolgreich installiert${NC}"
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js bereits installiert: $NODE_VERSION${NC}"
fi

# 3. Git überprüfen
echo -e "\n${GREEN}📦 Git wird überprüft...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git nicht gefunden. Installation startet...${NC}"
    
    if [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install git
        else
            echo -e "${RED}❌ Homebrew nicht gefunden. Bitte Git manuell installieren.${NC}"
            exit 1
        fi
    elif [[ "$OS" == "linux" ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y git
        elif command -v dnf &> /dev/null; then
            sudo dnf install git
        elif command -v pacman &> /dev/null; then
            sudo pacman -S git
        fi
    fi
    echo -e "${GREEN}✅ Git erfolgreich installiert${NC}"
else
    echo -e "${GREEN}✅ Git bereits installiert${NC}"
fi

# 4. Repository klonen
echo -e "\n${GREEN}📂 Repository wird geklont...${NC}"
if [ -d "$INSTALL_PATH" ]; then
    echo -e "${YELLOW}⚠️  Ordner existiert bereits. Wird aktualisiert...${NC}"
    cd "$INSTALL_PATH"
    git pull origin master
else
    git clone https://github.com/FBR65/LocalLLM.git "$INSTALL_PATH"
    cd "$INSTALL_PATH"
fi
echo -e "${GREEN}✅ Repository erfolgreich geklont/aktualisiert${NC}"

# 5. Dependencies installieren
echo -e "\n${GREEN}⚙️  Node.js Dependencies werden installiert...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies erfolgreich installiert${NC}"

# 5.1. PST-Dependencies installieren
echo -e "\n${GREEN}📧 PST-Verarbeitungs-Abhängigkeiten werden installiert...${NC}"
echo -e "${CYAN}   (Für E-Mail-Archive und .pst-Dateien)${NC}"

PST_PACKAGES=("pst-parser" "pst-extractor" "email-addresses" "date-fns" "lodash")

for package in "${PST_PACKAGES[@]}"; do
    echo -e "${YELLOW}📦 Installiere $package...${NC}"
    if npm install "$package"; then
        echo -e "${GREEN}✅ $package erfolgreich installiert${NC}"
    else
        echo -e "${YELLOW}⚠️  $package konnte nicht installiert werden - PST-Funktionen möglicherweise eingeschränkt${NC}"
    fi
done

echo -e "${GREEN}✅ PST-Dependencies Installation abgeschlossen${NC}"

# 6. Ollama installieren
echo -e "\n${GREEN}🤖 Ollama wird überprüft...${NC}"
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}⚠️  Ollama nicht gefunden. Installation startet...${NC}"
    curl -fsSL https://ollama.ai/install.sh | sh
    echo -e "${GREEN}✅ Ollama erfolgreich installiert${NC}"
    
    # Kurz warten damit Ollama verfügbar ist
    sleep 3
else
    echo -e "${GREEN}✅ Ollama bereits installiert${NC}"
fi

# 7. Ollama starten
echo -e "\n${GREEN}🔄 Ollama Service wird gestartet...${NC}"
if ! pgrep -x "ollama" > /dev/null; then
    ollama serve &
    sleep 5
    echo -e "${GREEN}✅ Ollama Service gestartet${NC}"
else
    echo -e "${GREEN}✅ Ollama Service läuft bereits${NC}"
fi

# 8. Modelle herunterladen
if [ "$NO_MODELS" = false ]; then
    echo -e "\n${GREEN}📥 Standard-Modelle werden heruntergeladen...${NC}"
    echo -e "${YELLOW}⏳ Dies kann einige Minuten dauern...${NC}"
    
    models=("gemma3:latest" "phi4-mini:latest" "qwen2.5:latest")
    
    for model in "${models[@]}"; do
        echo -e "${CYAN}📦 Lade $model...${NC}"
        if ollama pull "$model"; then
            echo -e "${GREEN}✅ $model erfolgreich heruntergeladen${NC}"
        else
            echo -e "${YELLOW}⚠️  $model konnte nicht heruntergeladen werden${NC}"
        fi
    done
else
    echo -e "\n${YELLOW}⏭️  Model-Download übersprungen (--no-models Parameter)${NC}"
fi

# 9. Startscripts erstellen
echo -e "\n${GREEN}📝 Startscripts werden erstellt...${NC}"

# Development Start Script
cat > "$INSTALL_PATH/start-dev.sh" << 'EOF'
#!/bin/bash
# LocalLLM Development Starter

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 LocalLLM wird gestartet...${NC}"

# Ollama Service überprüfen
if ! pgrep -x "ollama" > /dev/null; then
    echo -e "${YELLOW}🔄 Ollama wird gestartet...${NC}"
    ollama serve &
    sleep 3
fi

# LocalLLM Development Server starten
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo -e "${GREEN}🌐 Development Server wird gestartet...${NC}"
npm run dev
EOF

# Production Start Script
cat > "$INSTALL_PATH/start.sh" << 'EOF'
#!/bin/bash
# LocalLLM Production Starter

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 LocalLLM wird gestartet...${NC}"

# Ollama Service überprüfen
if ! pgrep -x "ollama" > /dev/null; then
    echo -e "${YELLOW}🔄 Ollama wird gestartet...${NC}"
    ollama serve &
    sleep 3
fi

# LocalLLM Electron App starten
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo -e "${GREEN}🖥️  Electron App wird gestartet...${NC}"
npm run electron:start
EOF

chmod +x "$INSTALL_PATH/start-dev.sh"
chmod +x "$INSTALL_PATH/start.sh"

echo -e "${GREEN}✅ Startscripts erstellt:${NC}"
echo -e "${CYAN}   📁 start-dev.sh  (Development)${NC}"
echo -e "${CYAN}   📁 start.sh      (Production)${NC}"

# 10. Desktop-Verknüpfung erstellen (nur Linux mit Desktop-Umgebung)
if [[ "$OS" == "linux" ]] && [ ! -z "$XDG_CURRENT_DESKTOP" ]; then
    echo -e "\n${GREEN}🔗 Desktop-Verknüpfung wird erstellt...${NC}"
    
    cat > "$HOME/Desktop/LocalLLM.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=LocalLLM
Comment=Lokale KI-Anwendung
Exec=$INSTALL_PATH/start.sh
Icon=$INSTALL_PATH/frontend/static/favicon.ico
Path=$INSTALL_PATH
Terminal=true
Categories=Development;
EOF
    
    chmod +x "$HOME/Desktop/LocalLLM.desktop"
fi

# 11. Installation abgeschlossen
echo -e "\n${GREEN}🎉 Installation erfolgreich abgeschlossen!${NC}"
echo -e "${CYAN}📍 Installationsort: $INSTALL_PATH${NC}"
echo -e "\n${YELLOW}🚀 Nächste Schritte:${NC}"
echo -e "${WHITE}   1. Development: ./start-dev.sh${NC}"
echo -e "${WHITE}   2. Production:  ./start.sh${NC}"
if [[ "$OS" == "linux" ]] && [ ! -z "$XDG_CURRENT_DESKTOP" ]; then
    echo -e "${WHITE}   3. Desktop:     LocalLLM Verknüpfung doppelklicken${NC}"
fi

if [ "$DEV_MODE" = true ]; then
    echo -e "\n${CYAN}🔧 Development-Modus aktiviert - App wird gestartet...${NC}"
    "$INSTALL_PATH/start-dev.sh"
fi
