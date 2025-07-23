import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Store from 'electron-store';
import axios from 'axios';
import fs from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Konfiguration für lokale Einstellungen
const store = new Store({
  defaults: {
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'phi4-mini:latest', // Verfügbares Modell verwenden
      autoStart: true
    },
    ui: {
      theme: 'dark',
      language: 'de'
    }
  }
});

let mainWindow = null;
let ollamaProcess = null;

// Ollama Verbindung prüfen
async function checkOllamaConnection() {
  try {
    const baseUrl = store.get('ollama.baseUrl');
    console.log('Prüfe Ollama Verbindung zu:', baseUrl);
    const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
    console.log('Ollama Verbindung erfolgreich, Status:', response.status);
    console.log('Verfügbare Modelle:', response.data.models?.length || 0);
    return response.status === 200;
  } catch (error) {
    console.error('Ollama Verbindungsfehler:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Ollama Server läuft nicht auf Port 11434');
    }
    return false;
  }
}

// Ollama automatisch starten (falls installiert)
async function startOllama() {
  try {
    const { spawn } = await import('child_process');
    ollamaProcess = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // 3 Sekunden warten und prüfen
    await new Promise(resolve => setTimeout(resolve, 3000));
    return await checkOllamaConnection();
  } catch (error) {
    console.log('Ollama start fehlgeschlagen:', error.message);
    return false;
  }
}

// Haupt-Electron-Fenster erstellen
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    show: false, // Erst zeigen wenn bereit
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../public/icon.png')
  });

  // In development: Vite Dev Server laden
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173'); // Vite default port
    mainWindow.webContents.openDevTools(); // DevTools aktivieren für Debugging
  } else {
    // In production: Gebaute Dateien laden
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Fenster zeigen wenn bereit
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
    mainWindow?.setAlwaysOnTop(true); // Temporär in Vordergrund
    setTimeout(() => {
      mainWindow?.setAlwaysOnTop(false); // Nach 3 Sekunden normal
    }, 3000);
  });

  // Externe Links im Standard-Browser öffnen
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App Event Handler
app.whenReady().then(async () => {
  createMainWindow();

  // Ollama Verbindung beim Start prüfen
  const isConnected = await checkOllamaConnection();
  if (!isConnected && store.get('ollama.autoStart')) {
    console.log('Versuche Ollama zu starten...');
    await startOllama();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Ollama Prozess beenden
    if (ollamaProcess) {
      ollamaProcess.kill();
    }
    app.quit();
  }
});

// IPC Handlers für Frontend-Backend Kommunikation

// Ollama Status prüfen
ipcMain.handle('ollama:status', async () => {
  console.log('Backend: ollama:status Request empfangen');
  const result = await checkOllamaConnection();
  console.log('Backend: ollama:status Result:', result);
  return result;
});

// Chat-Nachricht an Ollama senden
ipcMain.handle('ollama:chat', async (_, message, context) => {
  console.log('Backend: ollama:chat Request empfangen, Message:', message);
  try {
    const baseUrl = store.get('ollama.baseUrl');
    let model = store.get('ollama.model');
    
    // Fallback zu verfügbarem Modell wenn das konfigurierte nicht existiert
    if (model === 'llama3.2:latest') {
      console.log('Backend: Verwende Fallback-Modell phi4-mini:latest statt', model);
      model = 'phi4-mini:latest';
      // Speichere die Korrektur
      store.set('ollama.model', model);
    }
    
    console.log('Backend: Verwende Modell:', model);
    
    // Deutsche Prompt-Optimierung
    const systemPrompt = "Du bist ein hilfsbereit deutscher KI-Assistent. Antworte immer auf Deutsch und sei höflich und präzise.";
    
    const prompt = context 
      ? `${systemPrompt}\n\nKontext aus hochgeladener Datei:\n${context}\n\nBenutzer-Frage: ${message}\n\nAntworte auf Deutsch:`
      : `${systemPrompt}\n\nBenutzer: ${message}\n\nAssistent:`;

    console.log('Backend: Sende Request an Ollama API mit Modell:', model);
    
    // Erweiterte Timeout und Retry-Logik
    const response = await axios.post(`${baseUrl}/api/generate`, {
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        repeat_penalty: 1.1
      }
    }, {
      timeout: 120000, // 2 Minuten Timeout
      headers: {
        'Connection': 'close', // Verbindung nach Request schließen
        'Content-Type': 'application/json'
      }
    });

    console.log('Backend: Ollama Response erhalten, Length:', response.data.response?.length || 0);
    return {
      success: true,
      response: response.data.response
    };
  } catch (error) {
    console.error('Backend: Ollama Chat Error:', error.message);
    console.error('Backend: Error Details:', error.response?.data || 'Keine Details');
    
    // Spezielle Behandlung für Socket-Fehler
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.message.includes('socket hang up')) {
      console.log('Backend: Socket-Fehler erkannt, versuche Reconnect');
      // Kurz warten und nochmal versuchen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const retryResponse = await axios.post(`${baseUrl}/api/generate`, {
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            repeat_penalty: 1.1
          }
        }, {
          timeout: 60000,
          headers: {
            'Connection': 'close',
            'Content-Type': 'application/json'
          }
        });
        
        return {
          success: true,
          response: retryResponse.data.response
        };
      } catch (retryError) {
        console.error('Backend: Retry auch fehlgeschlagen:', retryError.message);
      }
    }
    
    // Spezielle Behandlung für "model not found" Fehler
    if (error.response?.data?.error?.includes('not found')) {
      const currentModel = store.get('ollama.model');
      console.error('Backend: Modell nicht gefunden:', currentModel);
      return {
        success: false,
        error: `Modell "${currentModel}" nicht gefunden. Verfügbare Modelle: phi4-mini:latest, gemma3:latest. Bitte Einstellungen prüfen.`
      };
    }
    
    return {
      success: false,
      error: error.message + (error.response?.status ? ` (HTTP ${error.response.status})` : '')
    };
  }
});

// Verfügbare Modelle abrufen
ipcMain.handle('ollama:models', async () => {
  console.log('Backend: ollama:models Request empfangen');
  try {
    const baseUrl = store.get('ollama.baseUrl');
    console.log('Backend: Rufe Modelle ab von:', baseUrl);
    const response = await axios.get(`${baseUrl}/api/tags`, {
      timeout: 10000,
      headers: {
        'Connection': 'close'
      }
    });
    console.log('Backend: Modelle Response:', response.data);
    return {
      success: true,
      models: response.data.models || []
    };
  } catch (error) {
    console.error('Backend: Fehler beim Laden der Modelle:', error.message);
    
    // Bei Socket-Fehlern einen Retry versuchen
    if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
      console.log('Backend: Retry für Modellabfrage...');
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const baseUrl = store.get('ollama.baseUrl');
        const retryResponse = await axios.get(`${baseUrl}/api/tags`, {
          timeout: 5000,
          headers: {
            'Connection': 'close'
          }
        });
        return {
          success: true,
          models: retryResponse.data.models || []
        };
      } catch (retryError) {
        console.error('Backend: Retry für Modelle auch fehlgeschlagen:', retryError.message);
      }
    }
    
    return {
      success: false,
      error: error.message,
      models: []
    };
  }
});

// Einstellungen laden
ipcMain.handle('settings:get', (_, key) => {
  return key ? store.get(key) : store.store;
});

// Einstellungen speichern
ipcMain.handle('settings:set', (_, key, value) => {
  store.set(key, value);
  return true;
});

// Datei öffnen Dialog
ipcMain.handle('dialog:openFile', async (_, filters) => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [
      { name: 'Alle Dateien', extensions: ['*'] },
      { name: 'Dokumente', extensions: ['pdf', 'docx', 'txt', 'md', 'json'] },
      { name: 'Office Dateien', extensions: ['docx', 'xlsx', 'pptx'] },
      { name: 'Text Dateien', extensions: ['txt', 'md', 'json'] },
      { name: 'PST Dateien', extensions: ['pst'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const filePath = result.filePaths[0];
      const stats = await fs.stat(filePath);
      
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        extension: path.extname(filePath)
      };
    } catch (error) {
      return null;
    }
  }
  
  return null;
});

// Ordner öffnen Dialog
ipcMain.handle('dialog:openFolder', async () => {
  console.log('Backend: dialog:openFolder Request empfangen');
  if (!mainWindow) {
    console.error('Backend: Kein Hauptfenster verfügbar');
    return null;
  }
  
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    console.log('Backend: Dialog Result:', result);

    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      console.log('Backend: Ausgewählter Ordner:', folderPath);
      return {
        path: folderPath,
        name: path.basename(folderPath)
      };
    }
    
    console.log('Backend: Dialog abgebrochen oder kein Pfad');
    return null;
  } catch (error) {
    console.error('Backend: Fehler beim Ordner-Dialog:', error);
    return null;
  }
});

// Verzeichnis-Inhalt auflisten
ipcMain.handle('fs:listDirectory', async (_, dirPath) => {
  console.log('Backend: fs:listDirectory Request empfangen für:', dirPath);
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    console.log('Backend: Gefundene Einträge:', entries.length);
    const items = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stats = await fs.stat(fullPath);
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: entry.isFile() ? stats.size : 0,
          extension: entry.isFile() ? path.extname(entry.name) : '',
          modified: stats.mtime
        });
      } catch (error) {
        // Ignoriere Dateien, die nicht gelesen werden können
        console.log('Backend: Ignoriere nicht lesbare Datei:', entry.name);
        continue;
      }
    }
    
    const sortedItems = items.sort((a, b) => {
      // Ordner zuerst, dann Dateien
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, 'de');
    });
    
    console.log('Backend: Sortierte Items:', sortedItems.length);
    return {
      success: true,
      items: sortedItems
    };
  } catch (error) {
    console.error('Backend: Fehler beim Lesen des Verzeichnisses:', error.message);
    return {
      success: false,
      error: error.message,
      items: []
    };
  }
});

// PDF/Office-Parsing - EINFACH UND FUNKTIONIEREND
async function parseDocument(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    console.log('Backend: Parse Dokument:', filePath, 'Typ:', ext);
    
    if (ext === '.pdf') {
      console.log('Backend: Verwende pdf-parse für PDF');
      
      const pdfBuffer = await fs.readFile(filePath);
      console.log('Backend: PDF-Buffer gelesen, Größe:', pdfBuffer.length);
      
      const pdfData = await pdfParse(pdfBuffer);
      
      console.log('Backend: PDF-Parse Ergebnis:');
      console.log('  - Seiten:', pdfData.numpages);
      console.log('  - Text-Länge:', pdfData.text?.length || 0);
      
      const extractedText = pdfData.text || '';
      const cleanText = extractedText.trim();
      
      if (cleanText.length === 0) {
        return {
          success: false,
          error: 'PDF enthält keinen extrahierbaren Text'
        };
      }
      
      console.log('Backend: PDF-Parse erfolgreich, Text-Länge:', cleanText.length);
      
      return {
        success: true,
        text: cleanText,
        metadata: {
          pages: pdfData.numpages,
          info: pdfData.info,
          extractionMethod: 'pdf-parse'
        }
      };
    }
    
    if (ext === '.docx') {
      const docxBuffer = await fs.readFile(filePath);
      const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
      console.log('Backend: DOCX geparsed, Text-Länge:', docxResult.value.length);
      return {
        success: true,
        text: docxResult.value.trim(),
        metadata: {
          extractionMethod: 'mammoth'
        }
      };
    }
    
    if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.readFile(filePath);
      let excelText = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_txt(sheet);
        excelText += `=== ${sheetName} ===\n${sheetText}\n\n`;
      });
      console.log('Backend: Excel geparsed, Text-Länge:', excelText.length);
      return {
        success: true,
        text: excelText.trim(),
        metadata: {
          extractionMethod: 'xlsx'
        }
      };
    }
    
    if (ext === '.txt' || ext === '.md' || ext === '.json') {
      const textContent = await fs.readFile(filePath, 'utf-8');
      return {
        success: true,
        text: textContent,
        metadata: {
          extractionMethod: 'direct-read'
        }
      };
    }
    
    return {
      success: false,
      error: `Dateityp ${ext} wird nicht unterstützt`
    };
    
  } catch (error) {
    console.error('Backend: Fehler beim Parsen:', filePath, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Datei-Inhalt lesen
ipcMain.handle('file:read', async (_, filePath) => {
  try {
    console.log('Backend: Lese Datei:', filePath);
    
    // Verwende das neue schnelle Parsing
    const parseResult = await parseDocument(filePath);
    
    if (!parseResult.success) {
      return {
        success: false,
        error: `Dokument-Parsing fehlgeschlagen: ${parseResult.error}`
      };
    }
    
    if (!parseResult.text || parseResult.text.trim().length === 0) {
      console.warn('Backend: Dokument enthält keinen extrahierbaren Text');
      return {
        success: false,
        error: 'Dokument enthält keinen lesbaren Text oder konnte nicht verarbeitet werden'
      };
    }
    
    // Bereinige den Text von redundanten Leerzeichen und Formatierung
    const cleanedText = parseResult.text
      .replace(/\s+/g, ' ') // Mehrfache Leerzeichen durch ein einzelnes ersetzen
      .replace(/\n\s*\n/g, '\n') // Mehrfache Zeilenwechsel reduzieren
      .trim();
    
    console.log('Backend: Dokument-Parsing erfolgreich, bereinigte Text-Länge:', cleanedText.length);
    
    return {
      success: true,
      content: cleanedText,
      metadata: {
        ...parseResult.metadata,
        originalLength: parseResult.text.length,
        cleanedLength: cleanedText.length
      }
    };
  } catch (error) {
    console.error('Backend: Fehler beim Lesen der Datei:', filePath, error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

// PST-Datei analysieren
ipcMain.handle('pst:analyze', async (_, filePath) => {
  try {
    // Für jetzt simulieren wir PST-Analyse
    // In der echten Implementierung würde hier ein PST-Parser verwendet werden
    const stats = await fs.stat(filePath);
    
    // Mock PST-Daten
    const mockPstData = {
      success: true,
      info: {
        totalEmails: Math.floor(Math.random() * 5000) + 1000,
        totalSize: stats.size,
        dateRange: {
          start: '2020-01-01',
          end: '2024-12-31'
        },
        folders: [
          'Posteingang',
          'Gesendete Objekte', 
          'Entwürfe',
          'Gelöschte Objekte',
          'Spam'
        ]
      }
    };
    
    return mockPstData;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// PST-Suche durchführen
ipcMain.handle('pst:search', async (_, filePath, searchTerm) => {
  try {
    // Mock PST-Suchergebnisse
    const mockResults = [
      {
        id: '1',
        subject: `E-Mail über ${searchTerm}`,
        sender: 'beispiel@firma.de',
        recipient: 'empfaenger@firma.de',
        date: '2024-01-15T10:30:00Z',
        body: `Dies ist eine Beispiel-E-Mail über ${searchTerm}. Hier stehen wichtige Informationen...`,
        attachments: [],
        folder: 'Posteingang'
      },
      {
        id: '2',
        subject: `RE: ${searchTerm} - Nachfrage`,
        sender: 'kollege@firma.de',
        recipient: 'empfaenger@firma.de',
        date: '2024-01-16T14:45:00Z',
        body: `Danke für die Information zu ${searchTerm}. Ich hätte noch eine Frage dazu...`,
        attachments: ['dokument.pdf'],
        folder: 'Posteingang'
      }
    ];
    
    return {
      success: true,
      results: mockResults,
      totalFound: mockResults.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
});

// ===== OPEN NOTEBOOK LLM FEATURES =====

// Dokumenten-Zusammenfassung mit Ollama
ipcMain.handle('ollama:summarize', async (_, content, type) => {
  console.log('Backend: Erstelle Zusammenfassung, Typ:', type, 'Content-Länge:', content?.length || 0);
  try {
    const baseUrl = store.get('ollama.baseUrl');
    const currentModel = store.get('ollama.model');
    
    // Prüfe ob Content vorhanden ist
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'Kein Inhalt zum Zusammenfassen vorhanden'
      };
    }
    
    // Kürze sehr langen Content für bessere Performance
    const maxLength = 8000; // Maximale Anzahl Zeichen
    let processedContent = content;
    if (content.length > maxLength) {
      processedContent = content.substring(0, maxLength) + '\n\n[Inhalt wurde gekürzt...]';
      console.log('Backend: Content gekürzt von', content.length, 'auf', processedContent.length, 'Zeichen');
    }
    
    let prompt = '';
    switch (type) {
      case 'brief':
        prompt = `Du bist ein deutscher Assistent. Analysiere den folgenden Dokumentinhalt und erstelle eine prägnante Zusammenfassung (maximal 3 Sätze) auf Deutsch. Konzentriere dich auf die wichtigsten Fakten und Aussagen:\n\n${processedContent}\n\nPrägnante Zusammenfassung:`;
        break;
      case 'detailed':
        prompt = `Du bist ein deutscher Assistent. Analysiere den folgenden Dokumentinhalt und erstelle eine detaillierte Zusammenfassung auf Deutsch. Strukturiere die wichtigsten Punkte und Informationen übersichtlich:\n\n${processedContent}\n\nDetaillierte Zusammenfassung:`;
        break;
      case 'key-points':
        prompt = `Du bist ein deutscher Assistent. Analysiere den folgenden Dokumentinhalt und extrahiere die wichtigsten Punkte. Erstelle eine strukturierte Aufzählung der Kernaussagen auf Deutsch:\n\n${processedContent}\n\nWichtige Punkte:`;
        break;
      default:
        prompt = `Du bist ein deutscher Assistent. Analysiere den folgenden Dokumentinhalt und fasse ihn verständlich zusammen. Achte auf die wichtigsten Informationen und Fakten:\n\n${processedContent}\n\nZusammenfassung:`;
    }

    const requestData = {
      model: currentModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        repeat_penalty: 1.1
      }
    };

    console.log('Backend: Sende Zusammenfassungs-Request an Ollama');
    const response = await axios.post(`${baseUrl}/api/generate`, requestData, {
      timeout: 90000, // 90 Sekunden Timeout
      headers: {
        'Connection': 'close',
        'Content-Type': 'application/json'
      }
    });

    const summary = response.data.response?.trim();
    console.log('Backend: Zusammenfassung erstellt, Länge:', summary?.length || 0);

    return {
      success: true,
      summary: summary || 'Keine Zusammenfassung generiert'
    };
  } catch (error) {
    console.error('Backend: Fehler bei Zusammenfassung:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

// Content-Analyse mit Ollama
ipcMain.handle('ollama:analyze', async (_, content, analysisType) => {
  console.log('Backend: Führe Analyse durch, Typ:', analysisType);
  try {
    const baseUrl = store.get('ollama.baseUrl');
    const currentModel = store.get('ollama.model');
    
    let prompt = '';
    switch (analysisType) {
      case 'insights':
        prompt = `Analysiere den folgenden Text und gebe wichtige Erkenntnisse und Einsichten auf Deutsch. Erkläre Verbindungen und Bedeutung:\n\n${content}`;
        break;
      case 'themes':
        prompt = `Identifiziere die Hauptthemen und wiederkehrende Muster in diesem Text auf Deutsch:\n\n${content}`;
        break;
      case 'questions':
        prompt = `Erstelle relevante Fragen, die sich aus diesem Text ergeben auf Deutsch:\n\n${content}`;
        break;
      case 'action-items':
        prompt = `Extrahiere konkrete Handlungsempfehlungen und nächste Schritte aus diesem Text auf Deutsch:\n\n${content}`;
        break;
      default:
        prompt = `Analysiere diesen Text detailliert auf Deutsch:\n\n${content}`;
    }

    const requestData = {
      model: currentModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.4
      }
    };

    const response = await axios.post(`${baseUrl}/api/generate`, requestData, {
      timeout: 90000,
      headers: {
        'Connection': 'close',
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      analysis: response.data.response?.trim()
    };
  } catch (error) {
    console.error('Backend: Fehler bei Analyse:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

// Podcast-Script Generierung
ipcMain.handle('ollama:generatePodcast', async (_, content, style) => {
  console.log('Backend: Generiere Podcast-Script, Stil:', style);
  try {
    const baseUrl = store.get('ollama.baseUrl');
    const currentModel = store.get('ollama.model');
    
    let prompt = '';
    switch (style) {
      case 'informative':
        prompt = `Erstelle ein informatives Podcast-Script auf Deutsch basierend auf diesem Inhalt. Strukturiert und sachlich:\n\n${content}`;
        break;
      case 'conversational':
        prompt = `Erstelle ein conversational Podcast-Script auf Deutsch mit zwei Sprechern (Alex und Sam), die den Inhalt diskutieren. Natürlich und engaging:\n\n${content}`;
        break;
      case 'interview':
        prompt = `Erstelle ein Interview-Style Podcast-Script auf Deutsch mit Moderator und Experte über diesen Inhalt:\n\n${content}`;
        break;
      default:
        prompt = `Erstelle ein Podcast-Script auf Deutsch für diesen Inhalt:\n\n${content}`;
    }

    const requestData = {
      model: currentModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.6
      }
    };

    const response = await axios.post(`${baseUrl}/api/generate`, requestData, {
      timeout: 120000,
      headers: {
        'Connection': 'close',
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      script: response.data.response?.trim()
    };
  } catch (error) {
    console.error('Backend: Fehler bei Podcast-Generierung:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

// Notebook-Ordner analysieren
ipcMain.handle('notebook:analyzeAll', async (_, directory) => {
  console.log('Backend: Analysiere Notebook-Ordner:', directory);
  try {
    const items = await fs.readdir(directory, { withFileTypes: true });
    
    let totalDocuments = 0;
    let totalSize = 0;
    const fileTypes = {};
    const topics = [];
    
    // Sammle Statistiken
    for (const item of items) {
      if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        const supportedExts = ['.txt', '.md', '.pdf', '.docx', '.json'];
        
        if (supportedExts.includes(ext)) {
          totalDocuments++;
          const stats = await fs.stat(path.join(directory, item.name));
          totalSize += stats.size;
          
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
          
          // Einfache Topic-Extraktion basierend auf Dateinamen
          const name = item.name.toLowerCase();
          if (name.includes('bericht')) topics.push('Berichte');
          if (name.includes('analyse')) topics.push('Analysen');
          if (name.includes('protokoll')) topics.push('Protokolle');
          if (name.includes('dokumentation')) topics.push('Dokumentation');
          if (name.includes('pdf')) topics.push('PDF-Dokumente');
        }
      }
    }
    
    // Entferne Duplikate
    const uniqueTopics = [...new Set(topics)];
    
    const summary = `Der Ordner enthält ${totalDocuments} Dokumente mit einer Gesamtgröße von ${(totalSize / 1024 / 1024).toFixed(2)} MB. ` +
                   `Hauptsächlich ${Object.keys(fileTypes).join(', ')}-Dateien. ` +
                   `Erkannte Themenbereiche: ${uniqueTopics.join(', ') || 'Diverse Inhalte'}.`;

    return {
      success: true,
      analysis: {
        totalDocuments,
        totalSize,
        fileTypes,
        topics: uniqueTopics,
        summary
      }
    };
  } catch (error) {
    console.error('Backend: Fehler bei Notebook-Analyse:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

// Content-Suche in Verzeichnis
ipcMain.handle('notebook:searchContent', async (_, query, directory) => {
  console.log('Backend: Suche Content in:', directory, 'Query:', query);
  try {
    const items = await fs.readdir(directory, { withFileTypes: true });
    const results = [];
    
    for (const item of items) {
      if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        const supportedExts = ['.txt', '.md', '.json', '.pdf', '.docx', '.xlsx', '.xls'];
        
        if (supportedExts.includes(ext)) {
          try {
            const filePath = path.join(directory, item.name);
            let content = '';
            
            if (ext === '.pdf' || ext === '.docx' || ext === '.xlsx' || ext === '.xls') {
              // Dokument über das neue Parsing verarbeiten
              console.log('Backend: Parse Dokument für Suche:', item.name);
              const parseResult = await parseDocument(filePath);
              
              if (parseResult.success && parseResult.text) {
                // Bereinige den Text
                content = parseResult.text
                  .replace(/\s+/g, ' ')
                  .replace(/\n\s*\n/g, '\n')
                  .trim();
                
                console.log('Backend: Dokument geparsed für Suche, Länge:', content.length);
              } else {
                console.warn('Backend: Dokument-Parsing fehlgeschlagen für:', item.name);
                continue; // Überspringe diese Datei
              }
            } else {
              // Text-Datei lesen
              content = await fs.readFile(filePath, 'utf-8');
            }
            
            // Einfache Textsuche
            const lowerContent = content.toLowerCase();
            const lowerQuery = query.toLowerCase();
            
            if (lowerContent.includes(lowerQuery)) {
              const index = lowerContent.indexOf(lowerQuery);
              const start = Math.max(0, index - 100);
              const end = Math.min(content.length, index + 200);
              const snippet = content.slice(start, end);
              
              // Relevanz basierend auf Häufigkeit
              const matches = (lowerContent.match(new RegExp(lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
              const relevance = Math.min(1, matches / 10);
              
              results.push({
                file: item.name,
                relevance,
                snippet: snippet.trim(),
                path: filePath,
                matches: matches
              });
            }
          } catch (fileError) {
            console.warn('Datei konnte nicht gelesen werden:', item.name, fileError.message);
          }
        }
      }
    }
    
    // Sortiere nach Relevanz
    results.sort((a, b) => b.relevance - a.relevance);
    
    console.log('Backend: Suche abgeschlossen,', results.length, 'Ergebnisse gefunden');
    return {
      success: true,
      results: results.slice(0, 20) // Maximal 20 Ergebnisse
    };
  } catch (error) {
    console.error('Backend: Fehler bei Content-Suche:', error.message);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
});

// Datei-Suche im Verzeichnis
ipcMain.handle('file:search', async (_, searchTerm, directory) => {
  console.log('Backend: Durchsuche Dateien in:', directory, 'Term:', searchTerm);
  try {
    const items = await fs.readdir(directory, { withFileTypes: true });
    const results = [];
    
    for (const item of items) {
      if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        const supportedExts = ['.txt', '.md', '.json', '.pdf', '.docx', '.xlsx', '.xls'];
        
        if (supportedExts.includes(ext)) {
          try {
            const filePath = path.join(directory, item.name);
            let content = '';
            
            if (ext === '.pdf' || ext === '.docx' || ext === '.xlsx' || ext === '.xls') {
              // Dokument über das neue Parsing verarbeiten
              console.log('Backend: Parse Dokument für Dateisuche:', item.name);
              const parseResult = await parseDocument(filePath);
              
              if (parseResult.success && parseResult.text) {
                // Bereinige den Text
                content = parseResult.text
                  .replace(/\s+/g, ' ')
                  .replace(/\n\s*\n/g, '\n')
                  .trim();
              } else {
                console.warn('Backend: Dokument-Parsing fehlgeschlagen für:', item.name);
                continue; // Überspringe diese Datei
              }
            } else {
              // Text-Datei lesen
              content = await fs.readFile(filePath, 'utf-8');
            }
            
            const lines = content.split('\n');
            
            const matches = [];
            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
                matches.push({
                  line: index + 1,
                  text: line.trim()
                });
              }
            });
            
            if (matches.length > 0) {
              results.push({
                path: filePath,
                name: item.name,
                matches: matches.slice(0, 10), // Maximal 10 Matches pro Datei
                totalMatches: matches.length
              });
            }
          } catch (fileError) {
            console.warn('Datei konnte nicht durchsucht werden:', item.name, fileError.message);
          }
        }
      }
    }
    
    console.log('Backend: Datei-Suche abgeschlossen,', results.length, 'Dateien mit Treffern');
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Backend: Fehler bei Datei-Suche:', error.message);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
});

console.log('LocalLLM Electron Backend mit Open Notebook Features gestartet');
