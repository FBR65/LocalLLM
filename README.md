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

1. **Repository klonen**:

```bash
git clone <repository-url>
cd LocalLLM
```

2. **Node.js-Dependencies installieren**:

```bash
npm install
```

3. **Ollama installieren und starten**:

```bash
# Ollama von https://ollama.ai herunterladen und installieren
ollama serve
ollama pull gemma3:latest
ollama pull phi4-mini:latest
```

4. **Entwicklungsumgebung starten**:

```bash
npm run dev
```

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
