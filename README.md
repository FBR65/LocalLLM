# LocalLLM Desktop

Professionelle Desktop-Anwendung für lokale KI-Inferenz mit Ollama - Sicherheit und Datenschutz durch lokale Verarbeitung

## Überblick

LocalLLM Desktop ist eine moderne Desktop-Anwendung, die Large Language Models (LLMs) lokal über Ollama auf Ihrem Computer ausführt. Entwickelt mit **Electron** und **React**, bietet es eine professionelle Benutzeroberfläche für KI-gestützte Dokumentenanalyse, Chat-Funktionen und Content-Suche - alles ohne externe Server oder Cloud-Abhängigkeiten.

## Features

- **Desktop-Native**: Professionelle Electron-basierte Desktop-Anwendung
- **Privacy-First**: Alle Daten bleiben auf Ihrem lokalen Computer
- **Schnell**: Direkte Ollama-Inferenz ohne Netzwerk-Latenz
- **Moderne UI**: Professionelles Design mit React und TypeScript
- **Ollama-Integration**: Unterstützung für alle Ollama-kompatiblen Modelle
- **Dokumentenanalyse**: KI-gestützte Analyse von PDF, DOCX, TXT und anderen Formaten
- **Intelligenter Chat**: Lokaler Chat-Bot mit professionellem Design
- **Content-Suche**: Durchsuchen und Analysieren von Dokumenteninhalten
- **Übersetzungsfunktionen**: Professionelle Übersetzung in und aus verschiedenen Sprachen

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                  Electron Desktop App                   │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   React Frontend │  │ Electron Main   │              │
│  │  (TypeScript)    │  │   Process       │              │
│  │                 │  │                 │              │
│  │ • UI Components  │  │ • File System   │              │
│  │ • State Mgmt     │  │ • Window Mgmt   │              │
│  │ • Professional  │  │ • Document      │              │
│  │   Design         │  │   Processing    │              │
│  └─────────────────┘  └─────────────────┘              │
│           │                     │                        │
│           └─────────┬───────────┘                        │
│                     │                                    │
│           ┌─────────────────┐                           │
│           │  Ollama Server  │                           │
│           │   (localhost)   │                           │
│           │                 │                           │
│           │ • Llama Models  │                           │
│           │ • Phi Models    │                           │
│           │ • Gemma Models  │                           │
│           │ • Custom Models │                           │
│           └─────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

## Installation & Setup

### Voraussetzungen

- **Node.js 18+** (für Electron Frontend)
- **Ollama** (für KI-Modelle)
- **Moderner Desktop** (Windows, macOS, Linux)

### Schnellstart

#### Option 1: Automatische Installation (Empfohlen)

**Windows:**
```powershell
# PowerShell als Administrator öffnen
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/FBR65/LocalLLM/master/install.ps1" -OutFile "install.ps1"
.\install.ps1

# Mit Optionen:
.\install.ps1 -DevMode          # Startet automatisch Development-Modus
.\install.ps1 -NoModels         # Überspringt Model-Download
.\install.ps1 -InstallPath "C:\MyApps\LocalLLM"  # Benutzerdefinierter Pfad
```

**Linux/macOS:**
```bash
# Installation starten
curl -fsSL https://raw.githubusercontent.com/FBR65/LocalLLM/master/install.sh | bash

# Oder mit Optionen:
wget https://raw.githubusercontent.com/FBR65/LocalLLM/master/install.sh
chmod +x install.sh
./install.sh --dev-mode        # Startet automatisch Development-Modus
./install.sh --no-models       # Überspringt Model-Download
./install.sh --install-path ~/MyApps/LocalLLM  # Benutzerdefinierter Pfad
```

#### Option 2: Manuelle Installation

1. **Repository klonen**:

```bash
git clone https://github.com/FBR65/LocalLLM.git
cd LocalLLM
```

2. **Node.js-Dependencies installieren**:

```bash
npm install
```

3. **Ollama installieren und starten**:

```bash
# Windows (winget)
winget install Ollama.Ollama

# macOS (Homebrew)
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Ollama starten und Modelle herunterladen
ollama serve
ollama pull gemma3:latest
ollama pull phi4-mini:latest
ollama pull qwen2.5:latest
```

4. **Startscripts ausführbar machen (Linux/macOS)**:

```bash
chmod +x start-dev.sh
chmod +x start.sh
chmod +x install.sh
```

#### Nach der Installation

**Windows:**
```powershell
# Development-Modus
.\start-dev.ps1

# Production-Modus
.\start.ps1

# Oder Desktop-Verknüpfung verwenden
```

**Linux/macOS:**
```bash
# Development-Modus
./start-dev.sh

# Production-Modus
./start.sh
```

### Verfügbare Scripts

Nach der Installation stehen folgende Scripts zur Verfügung:

**Windows PowerShell:**
- `install.ps1` - Vollautomatische Installation
- `start-dev.ps1` - Development-Server starten  
- `start.ps1` - Production-App starten

**Linux/macOS Bash:**
- `install.sh` - Vollautomatische Installation
- `start-dev.sh` - Development-Server starten
- `start.sh` - Production-App starten

**Installationsoptionen:**
```powershell
# Windows
.\install.ps1 -DevMode -NoModels -InstallPath "C:\LocalLLM"

# Linux/macOS  
./install.sh --dev-mode --no-models --install-path ~/LocalLLM
```

**Script-Features:**
- ✅ Automatische Dependency-Installation (Node.js, Git, Ollama)
- ✅ Repository-Kloning und Updates
- ✅ Model-Download (gemma3, phi4-mini, qwen2.5)
- ✅ Desktop-Verknüpfungen erstellen
- ✅ Service-Management (Ollama Auto-Start)
- ✅ Fehlerbehandlung und Status-Anzeige

### Produktions-Build

```bash
npm run build
npm run electron:build
```

## Verwendung

### Professionelle Desktop-Anwendung

Die LocalLLM Desktop-App bietet vier Hauptbereiche:

1. **Modelle**: Ollama-Model-Management
   - Verfügbare Modelle anzeigen
   - Model-Auswahl und -Status
   - Verbindungsüberwachung zu Ollama

2. **Quellen**: Dokumenten-Management
   - Lokale Ordner auswählen
   - Dateien durchsuchen (PDF, DOCX, TXT)
   - Multi-Datei-Auswahl für Analyse

3. **Analysen**: KI-gestützte Dokumentenanalyse
   - Zusammenfassung erstellen
   - Insights generieren
   - Podcast erstellen
   - Datenanalyse durchführen
   - Tiefenanalyse starten
   - Detaillierten Bericht generieren
   - Schlüsselwörter extrahieren
   - Strukturierte Notizen erstellen

4. **Content Suche**: Intelligente Dokumentensuche
   - Volltextsuche in Dokumenten
   - KI-gestützte Content-Analyse
   - Relevanz-Scoring

### Übersetzungsfunktionen

Das System bietet professionelle Übersetzungsoptionen:

**Übersetzung nach Deutsch:**
- Englisch → Deutsch
- Französisch → Deutsch
- Spanisch → Deutsch
- Italienisch → Deutsch
- Portugiesisch → Deutsch

**Flexible Übersetzung:**
- Deutsch → Zielsprache wählen
- Automatische Spracherkennung

### Chat-Interface

- **Professionelles Design**: Saubere, emoji-freie Oberfläche
- **Kontext-Integration**: Ausgewählte Dateien werden automatisch einbezogen
- **Model-Auswahl**: Dynamische Auswahl verfügbarer Ollama-Modelle
- **Gesprächshistorie**: Scrollbare Chat-Historie mit Zeitstempel

## Entwicklung

### Projektstruktur

```text
LocalLLM/
├── src/                      # React Frontend (TypeScript)
│   ├── CompleteOpenNotebook.tsx  # Haupt-UI-Komponente
│   ├── App.tsx              # React-Anwendung
│   └── main.tsx             # React-Einstiegspunkt
├── electron/                # Electron-Backend
│   ├── main.js              # Electron-Hauptprozess
│   └── preload.js           # Preload-Script
├── frontend/               # Statische Assets
│   ├── templates/
│   └── static/
├── documents/              # Dokument-Speicher
├── package.json           # Node.js-Dependencies
└── vite.config.ts         # Vite-Konfiguration
```

### Entwicklungsbefehle

```bash
# Frontend-Entwicklung (Vite)
npm run dev

# Electron-App im Dev-Modus
npm run electron:dev

# Production Build
npm run build
npm run electron:build

# Tests ausführen
npm test
```

### API-Integration

- **Electron IPC**: Frontend-zu-Backend-Kommunikation
- **Ollama API**: HTTP-Requests an localhost:11434
- **File System**: Sichere lokale Dateizugriffe über Electron

## Ollama-Modelle

### Empfohlene Modelle

- **gemma3:latest**: Vielseitiges Sprachmodell
- **phi4-mini:latest**: Kompaktes Microsoft-Modell für schnelle Inferenz
- **qwen2.5:latest**: Hochperformantes chinesisches Modell


### Model-Management

Die verfügbaren Modelle werden automatisch erkannt und angezeigt:

- **Status-Anzeige**: Verbunden/Getrennt zu Ollama
- **Model-Auswahl**: Dropdown mit verfügbaren Modellen
- **Automatische Erkennung**: Dynamische Model-Liste von Ollama
- **Performance-Info**: Geschätzte Antwortzeiten

## Anwendungsfälle

- **Business Intelligence**: Lokale Dokumentenanalyse ohne Cloud-Risiken
- **Bildungsbereich**: KI-Lernen ohne Datenschutz-Bedenken
- **Compliance**: DSGVO-konforme KI-Verarbeitung vor Ort
- **Content-Management**: Intelligente Dokumenten-Organisation
- **Übersetzungsservice**: Professionelle Sprachübersetzung
- **Forschung**: Lokale Experimente ohne externe Abhängigkeiten

## Datenschutz & Sicherheit

- **Zero Cloud**: Alle Daten bleiben auf Ihrem lokalen Computer
- **Offline-Betrieb**: Keine Internetverbindung für KI-Inferenz erforderlich
- **Electron-Sandbox**: Sichere Desktop-App-Umgebung
- **Open Source**: Vollständig transparenter und auditierbare Code
- **DSGVO-Ready**: Keine Datenübertragung an Dritte
- **Lokale Modelle**: Alle KI-Verarbeitung erfolgt lokal über Ollama

## Technische Details

### Frontend-Stack
- **React 18** mit TypeScript
- **Tailwind CSS** für professionelles Styling
- **Lucide React** für Icons
- **Vite** als Build-Tool

### Backend-Stack

- **Electron** für Desktop-Integration
- **Document Processing** über Browser-APIs (PDF.js, etc.)
- **Ollama** für KI-Inferenz

### Systemanforderungen
- **Windows 10+, macOS 10.15+, oder Linux**
- **8 GB RAM** (empfohlen für größere Modelle)
- **4 GB freier Speicherplatz**
- **Ollama-Installation** erforderlich

## Lizenz

AGPLv3 License - siehe [LICENSE](LICENSE) für Details.

## Danksagungen

- **Ollama-Team**: Lokale LLM-Inferenz-Engine
- **Electron-Community**: Cross-platform Desktop-Apps
- **React-Community**: Moderne UI-Entwicklung
- **Qwen, Microsoft, Google**: Bereitstellung der Sprachmodelle

---

**LocalLLM Desktop** - Professionelle KI-Lösungen für Ihren Desktop. Sicher, lokal, datenschutzkonform.
