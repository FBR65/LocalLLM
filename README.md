# LocalLLM Desktop

Professionelle Desktop-Anwendung für lokale KI-Inferenz mit ONNX-Modellen - Sicherheit und Datenschutz durch lokale Verarbeitung

## 🚀 Überblick

LocalLLM Desktop ist eine innovative Desktop-Anwendung, die Large Language Models (LLMs) lokal auf Ihrem Computer ausführt. Entwickelt mit **Tauri 2.x** und **React**, bietet es eine professionelle Benutzeroberfläche für KI-gestützte Dokumentenanalyse, Chat-Funktionen und PST-Datei-Exploration - alles ohne externe Server oder Cloud-Abhängigkeiten.

## ✨ Features

- **🖥️ Desktop-Native**: Professionelle Tauri-basierte Desktop-Anwendung
- **🔒 Privacy-First**: Alle Daten bleiben auf Ihrem lokalen Computer
- **⚡ Schnell**: Direkte ONNX-Inferenz ohne Netzwerk-Latenz
- **📱 Moderne UI**: Professionelles weißes Design mit React 19
- **🤖 ONNX-Modelle**: Unterstützung für Llama, Phi, Gemma und BGE-Modelle
- **� Dokumentenanalyse**: KI-gestützte Analyse von Textdokumenten
- **� Intelligenter Chat**: Lokaler Chat-Bot ohne Emojis, professionell
- **📧 PST-Explorer**: Outlook PST-Dateien durchsuchen und analysieren
- **🎛️ Scrollbare Interfaces**: Alle Komponenten mit optimiertem Scrolling

## 🏗️ Architektur

```mermaid
┌─────────────────────────────────────────────────────────┐
│                  Tauri Desktop App                       │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   React Frontend │  │   Rust Backend   │              │
│  │  (TypeScript)    │  │    (Tauri)      │              │
│  │                 │  │                 │              │
│  │ • UI Components  │  │ • File System   │              │
│  │ • State Mgmt     │  │ • ONNX Runtime  │              │
│  │ • Professional  │  │ • Python Bridge │              │
│  │   White Design   │  │ • API Layer     │              │
│  └─────────────────┘  └─────────────────┘              │
│           │                     │                        │
│           └─────────┬───────────┘                        │
│                     │                                    │
│           ┌─────────────────┐                           │
│           │  ONNX Models    │                           │
│           │   (Local)       │                           │
│           │                 │                           │
│           │ • Llama 3.2 3B  │                           │
│           │ • Phi-4 Mini    │                           │
│           │ • Gemma 3 1B    │                           │
│           │ • BGE-M3        │                           │
│           └─────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Installation & Setup

### Voraussetzungen

- **Rust** (für Tauri-Entwicklung)
- **Node.js 18+** (für React Frontend)
- **Moderner Desktop** (Windows, macOS, Linux)

### Schnellstart

1. **Repository klonen**:

```bash
git clone <repository-url>
cd LocalLLM
```

2. **Entwicklungsumgebung starten**:

```bash
npm run tauri dev
```

3. **Desktop-App öffnet sich automatisch**

### Produktions-Build

```bash
npm run tauri build
```

## 📖 Verwendung

### Professionelle Desktop-Anwendung

Die LocalLLM Desktop-App bietet vier Hauptbereiche:

1. **📄 Dokumente**: Lokale Dokumentenanalyse mit KI
   - Dokumente hochladen und analysieren
   - KI-gestützte Zusammenfassungen
   - Scrollbare 3-Panel-Ansicht

2. **💬 Chat**: Professioneller Chat-Bot
   - Lokale ONNX-Modell-Inferenz
   - Saubere, emoji-freie Oberfläche
   - Scrollbare Gesprächshistorie

3. **📧 PST Explorer**: Outlook-Dateien durchsuchen
   - PST-Ordner auswählen (funktional)
   - Email-Listen durchsuchen
   - Manuelle Pfad-Eingabe als Fallback

4. **🤖 Modelle**: ONNX-Model-Management
   - Verfügbare Modelle anzeigen
   - Scrollbare Model-Liste
   - Performance-Informationen

### Tastaturkürzel

| Kürzel | Aktion |
|--------|--------|
| `Ctrl+1` | Dokumente-Ansicht |
| `Ctrl+2` | Chat-Ansicht |
| `Ctrl+3` | PST-Explorer |
| `Ctrl+4` | Modelle-Ansicht |
| `Ctrl+S` | Einstellungen speichern |
| `F5` | Aktualisieren |

### Verfügbare ONNX-Modelle

```yaml
Modelle:
  - Llama 3.2 3B: Vielseitiges Sprachmodell
  - Phi-4 Mini: Kompaktes, schnelles Modell  
  - Gemma 3 1B: Effizienter Google-Transformer
  - BGE-M3: Hochwertige Text-Embeddings
```

## 🔧 Entwicklung

### Projektstruktur

```text
LocalLLM/
├── src/                   # React Frontend (TypeScript)
│   ├── components/        # UI-Komponenten
│   │   ├── chat/         # Chat-Interface
│   │   ├── document/     # Dokumenten-Viewer
│   │   ├── pst/          # PST-Explorer
│   │   └── models/       # Model-Manager
│   ├── App.tsx           # Haupt-Anwendung
│   └── main.tsx          # React-Einstiegspunkt
├── src-tauri/            # Rust Backend
│   ├── src/
│   │   ├── main.rs       # Tauri-Hauptlogik
│   │   └── lib.rs        # API-Funktionen
│   └── Cargo.toml        # Rust-Dependencies
├── src/localllm/         # Python-Backend
│   ├── core.py           # KI-Kernfunktionen
│   ├── models.py         # ONNX-Model-Handling
│   └── server.py         # FastAPI-Backend
├── models/               # ONNX-Modell-Dateien
├── documents/            # Dokument-Speicher
├── package.json          # Node.js-Dependencies
└── tauri.conf.json       # Tauri-Konfiguration
```

### Entwicklungsbefehle

```bash
# Entwicklungsserver starten
npm run tauri dev

# Frontend separat entwickeln
npm run dev

# Production Build erstellen
npm run tauri build

# Tests ausführen
npm test

# Rust-Backend einzeln kompilieren
cd src-tauri && cargo build
```

### API-Integration

- **Tauri Commands**: Rust-zu-Frontend-Kommunikation
- **Python Bridge**: ONNX-Modell-Integration
- **File System**: Sichere lokale Dateizugriffe
- **IPC**: Inter-Process-Communication zwischen Frontend/Backend

## 🧪 ONNX-Modelle

### Unterstützte Modelle

- **Llama 3.2 3B**: Vielseitiges Sprachmodell von Meta
- **Phi-4 Mini**: Kompaktes Microsoft-Modell für schnelle Inferenz
- **Gemma 3 1B**: Effizienter Google-Transformer
- **BGE-M3**: Hochwertige Text-Embeddings für Dokumenten-Suche

### Model-Performance

| Modell | Größe | RAM | Inferenz-Zeit | Anwendung |
|--------|-------|-----|---------------|-----------|
| Llama 3.2 3B | ~6 GB | 8 GB | ~500ms | Allgemeine Konversation |
| Phi-4 Mini | ~2 GB | 4 GB | ~200ms | Schnelle Antworten |
| Gemma 3 1B | ~2 GB | 3 GB | ~150ms | Präzise Aufgaben |
| BGE-M3 | ~1 GB | 2 GB | ~50ms | Text-Embeddings |

### Model-Integration

Die Modelle werden automatisch erkannt und in der professionellen UI angezeigt. Jedes Modell zeigt:

- **Performance-Badge**: Geschwindigkeits-Klassifizierung
- **Speicheranforderungen**: RAM-Bedarf
- **Anwendungsbereich**: Empfohlene Nutzung
- **Status**: Geladen/Verfügbar/Download erforderlich

## 🎯 Anwendungsfälle

- **🏢 Business Intelligence**: Lokale Dokumentenanalyse ohne Cloud-Risiken
- **📚 Bildungsbereich**: KI-Lernen ohne Datenschutz-Bedenken
- **� Compliance**: DSGVO-konforme KI-Verarbeitung vor Ort
- **📧 Email-Analyse**: PST-Dateien durchsuchen und verstehen
- **🛠️ Rapid Prototyping**: Schnelle KI-Konzept-Validierung
- **🔍 Forschung**: Lokale Experimente ohne externe Abhängigkeiten

## 🔒 Datenschutz & Sicherheit

- **Zero Cloud**: Alle Daten bleiben auf Ihrem lokalen Computer
- **Offline-Betrieb**: Keine Internetverbindung erforderlich
- **Tauri-Sandbox**: Sichere Desktop-App-Umgebung
- **Open Source**: Vollständig transparenter und auditierbare Code
- **DSGVO-Ready**: Keine Datenübertragung an Dritte


## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- **Tauri-Team**: Cross-platform Desktop-App-Framework
- **React-Community**: Moderne UI-Entwicklung
- **ONNX-Runtime**: Optimierte KI-Inferenz
- **Rust-Community**: Sichere System-Programmierung
- **Meta, Microsoft, Google**: Bereitstellung der ONNX-Modelle

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/frank/localllm/issues)
- **Diskussionen**: [GitHub Discussions](https://github.com/frank/localllm/discussions)
- **Email**: [support@localllm.de](mailto:support@localllm.de)

---

**LocalLLM Desktop** - Professionelle KI-Lösungen für Ihren Desktop. Sicher, lokal, datenschutzkonform. 🚀🔒
