# LocalLLM

Browser-based LLM Notebook mit Pyodide und ONNX - Lokale KI-Inferenz ohne Server-Abhängigkeiten

## 🚀 Überblick

LocalLLM ist eine innovative Lösung, die Large Language Models (LLMs) direkt im Browser ausführt. Durch die Kombination von **Pyodide** (Python im Browser) und **ONNX Runtime Web** ermöglicht es lokale KI-Inferenz ohne externe Server oder Cloud-Abhängigkeiten.

## ✨ Features

- **🌐 Browser-native**: Läuft vollständig im Browser ohne Backend-Server
- **🔒 Privacy-First**: Alle Daten bleiben auf Ihrem Gerät
- **⚡ Schnell**: Keine Netzwerk-Latenz durch lokale Verarbeitung
- **📱 Offline-fähig**: Funktioniert ohne Internetverbindung
- **🐍 Python-Integration**: Volle Python-Umgebung via Pyodide
- **📊 Notebook-Interface**: Jupyter-ähnliche Entwicklungsumgebung
- **🤖 ONNX-Modelle**: Unterstützung für optimierte ONNX-Modelle
- **🎛️ Interaktiv**: Echtzeit-Code-Ausführung und -Visualisierung

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────┐
│                     Browser                              │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │     Frontend     │  │     Pyodide     │              │
│  │   (JavaScript)   │  │   (Python)      │              │
│  │                 │  │                 │              │
│  │ • UI Management  │  │ • Code Execution│              │
│  │ • Cell Rendering │  │ • Data Science  │              │
│  │ • File I/O      │  │ • NumPy/Pandas │              │
│  └─────────────────┘  └─────────────────┘              │
│           │                     │                        │
│           └─────────┬───────────┘                        │
│                     │                                    │
│           ┌─────────────────┐                           │
│           │  ONNX Runtime   │                           │
│           │     Web         │                           │
│           │                 │                           │
│           │ • Model Loading │                           │
│           │ • Inference     │                           │
│           │ • WebGL/WASM    │                           │
│           └─────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Installation & Setup

### Voraussetzungen

- Python 3.10+
- uv (Package Manager)
- Moderner Browser (Chrome, Firefox, Safari, Edge)

### Schnellstart

1. **Repository klonen**:
```bash
git clone <repository-url>
cd LocalLLM
```

2. **Virtuelle Umgebung erstellen**:
```powershell
# Windows PowerShell
.venv\Scripts\activate
```

3. **Dependencies installieren**:
```bash
uv sync
```

4. **Entwicklungsserver starten**:
```bash
python main.py
```

5. **Browser öffnen**: 
   - Automatisch: http://localhost:8000
   - Oder manuell öffnen

## 📖 Verwendung

### Erste Schritte

1. **Modell hochladen**: Klicken Sie auf "Upload Model" und wählen Sie eine .onnx-Datei
2. **Zelle erstellen**: Verwenden Sie "+ Cell" oder `Ctrl+Shift+N`
3. **Code ausführen**: Drücken Sie `Ctrl+Enter` in einer Code-Zelle
4. **Notebook speichern**: `Ctrl+S` zum Speichern

### Tastaturkürzel

| Kürzel | Aktion |
|--------|--------|
| `Ctrl+Enter` | Aktuelle Zelle ausführen |
| `Shift+Enter` | Zelle ausführen und neue Zelle erstellen |
| `Ctrl+S` | Notebook speichern |
| `Ctrl+O` | Notebook öffnen |
| `Ctrl+Shift+A` | Alle Zellen ausführen |
| `Ctrl+Shift+N` | Neue Zelle erstellen |

### Beispiel-Code

```python
# Basis Python-Funktionalität
import numpy as np
import matplotlib.pyplot as plt

# Daten generieren
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Plotten
plt.figure(figsize=(10, 6))
plt.plot(x, y)
plt.title('Sinus-Funktion')
plt.show()
```

```python
# LLM-Inferenz (bei geladenem Modell)
prompt = "Die Zukunft der KI ist"
response = generate_text(prompt, max_length=100)
print(f"Eingabe: {prompt}")
print(f"Antwort: {response}")
```

## 🔧 Entwicklung

### Projektstruktur

```
LocalLLM/
├── src/localllm/           # Python-Backend
│   ├── __init__.py
│   ├── core.py            # LLM-Kernfunktionalität
│   ├── models.py          # Model-Management
│   ├── notebook.py        # Notebook-Engine
│   ├── server.py          # FastAPI-Server
│   └── cli.py             # Command-Line Interface
├── frontend/              # Browser-Frontend
│   ├── templates/
│   │   └── index.html     # Haupt-HTML
│   └── static/
│       ├── css/           # Stylesheets
│       └── js/            # JavaScript-Module
├── models/                # ONNX-Modelle
├── notebooks/             # Beispiel-Notebooks
├── tests/                 # Tests
├── docs/                  # Dokumentation
├── scripts/               # Build-/Deploy-Skripte
├── main.py               # Haupt-Einstiegspunkt
└── pyproject.toml        # Projekt-Konfiguration
```

### CLI-Befehle

```bash
# Server starten
localllm server --reload

# Modelle auflisten
localllm list-models

# Modell testen
localllm test-model --model my-model

# Notebook erstellen
localllm create-notebook --example basic

# Notebook ausführen
localllm run-notebook my-notebook.json
```

### API-Endpunkte

- `GET /` - Haupt-Anwendung
- `GET /api/health` - Gesundheitsstatus
- `GET /api/models` - Verfügbare Modelle
- `POST /api/models/upload` - Modell hochladen
- `POST /api/models/{name}/load` - Modell laden
- `POST /api/generate` - Text generieren

## 🧪 Modelle

### Unterstützte Formate

- **ONNX**: Optimierte Modelle für Browser-Inferenz
- **Quantisiert**: INT8/INT4-Modelle für bessere Performance
- **WebGL/WASM**: Hardware-beschleunigte Inferenz

### Modell-Konvertierung

```bash
# PyTorch zu ONNX (geplant)
localllm convert-model model.pt model.onnx --format pytorch

# TensorFlow zu ONNX (geplant)
localllm convert-model model.tf model.onnx --format tensorflow
```

### Empfohlene Modelle

- **TinyLLM**: Kleine, schnelle Modelle für den Browser
- **DistilBERT**: Kompakte BERT-Variante
- **GPT-2**: Klassisches generatives Modell
- **T5**: Text-zu-Text-Transfer-Transformer

## 🎯 Anwendungsfälle

- **🔬 Forschung**: Lokale KI-Experimente ohne Cloud-Kosten
- **📚 Bildung**: KI-Lernen ohne Datenschutz-Bedenken
- **💼 Business**: Sensitive Datenverarbeitung on-premise
- **🎨 Kreativität**: Interaktive KI-gestützte Inhalte
- **🛠️ Prototyping**: Schnelle KI-Konzept-Validierung

## 🔒 Datenschutz & Sicherheit

- **Keine Datenübertragung**: Alle Verarbeitungen bleiben lokal
- **Offline-Betrieb**: Funktioniert ohne Internetverbindung
- **Browser-Sandbox**: Ausführung in sicherer Browser-Umgebung
- **Open Source**: Vollständig nachvollziehbarer Code

## 🚀 Roadmap

### Version 0.2.0
- [ ] Erweiterte ONNX-Model-Unterstützung
- [ ] Modell-Konvertierungs-Tools
- [ ] Erweiterte Visualisierungen
- [ ] Plugin-System

### Version 0.3.0
- [ ] Multi-Modal-Modelle (Text + Bild)
- [ ] Collaborative Features
- [ ] Cloud-Sync (optional)
- [ ] Performance-Optimierungen

### Version 1.0.0
- [ ] Produktions-ready
- [ ] Umfassende Dokumentation
- [ ] Beispiel-Gallery
- [ ] Community-Features

## 🤝 Beitragen

Wir freuen uns über Beiträge! Siehe [CONTRIBUTING.md](CONTRIBUTING.md) für Details.

1. **Fork** des Repositories
2. **Feature-Branch** erstellen
3. **Änderungen** committen
4. **Pull Request** öffnen

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- **Pyodide-Team**: Python im Browser ermöglicht
- **ONNX-Community**: Standardisierte Modell-Formate
- **Hugging Face**: KI-Model-Ecosystem
- **FastAPI**: Moderne Python-Web-Frameworks

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/frank/localllm/issues)
- **Diskussionen**: [GitHub Discussions](https://github.com/frank/localllm/discussions)
- **Email**: support@localllm.dev

---

**LocalLLM** - Bringing AI to your browser, keeping your data with you. 🚀🔒
