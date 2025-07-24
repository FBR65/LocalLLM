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

// PST-spezifische Imports
let PSTFile = null;
let pstExtractor = null;
let emailAddresses = null;
let dateFns = null;
let lodash = null;

// PST-Dependencies dynamisch laden (falls installiert)
try {
  // Versuche verschiedene PST-Parser
  try {
    PSTFile = require('pst-parser');
    console.log('✅ PST-Parser (pst-parser) erfolgreich geladen');
  } catch (pstParserError) {
    try {
      pstExtractor = require('pst-extractor');
      console.log('✅ PST-Extractor (pst-extractor) erfolgreich geladen');
    } catch (extractorError) {
      throw new Error('Kein PST-Parser verfügbar');
    }
  }
  
  emailAddresses = require('email-addresses');
  dateFns = require('date-fns');
  lodash = require('lodash');
  console.log('✅ PST-Dependencies erfolgreich geladen');
} catch (error) {
  console.warn('⚠️ PST-Dependencies nicht gefunden. PST-Funktionen verwenden Fallback-Modus.');
  console.warn('Führe "npm install pst-parser pst-extractor email-addresses date-fns lodash" aus für volle PST-Unterstützung.');
}

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
    // DevTools sind jetzt standardmäßig deaktiviert - aktiviere mit Strg+Shift+I bei Bedarf
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

// PST-Ordner öffnen und strukturiert anzeigen
ipcMain.handle('pst:openFolder', async (_, filePath) => {
  console.log('Backend: PST-Ordner-Struktur laden für:', filePath);
  
  try {
    if (!PSTFile) {
      return {
        success: false,
        error: 'PST-Library nicht installiert. Führe install-pst-deps.ps1 aus.',
        folders: []
      };
    }

    const pstFile = new PSTFile(filePath);
    const folders = [];

    const mapFolders = (folder, path = '', level = 0) => {
      try {
        const folderName = folder.displayName || 'Unbekannt';
        const fullPath = path ? `${path}/${folderName}` : folderName;
        
        folders.push({
          id: folder.descriptorNodeId || Date.now(),
          name: folderName,
          path: fullPath,
          level,
          emailCount: folder.contentCount || 0,
          hasSubfolders: folder.hasSubfolders,
          type: getFolderType(folderName)
        });

        if (folder.hasSubfolders) {
          const subfolders = folder.getSubFolders();
          subfolders.forEach(subfolder => {
            mapFolders(subfolder, fullPath, level + 1);
          });
        }
      } catch (error) {
        console.warn('Backend: Fehler beim Mappen eines Ordners:', error.message);
      }
    };

    const rootFolder = pstFile.getRootFolder();
    mapFolders(rootFolder);

    return {
      success: true,
      folders,
      totalFolders: folders.length
    };

  } catch (error) {
    console.error('Backend: Fehler beim Laden der PST-Ordner:', error.message);
    return {
      success: false,
      error: error.message,
      folders: []
    };
  }
});

// PST-E-Mails aus spezifischem Ordner laden
ipcMain.handle('pst:loadEmails', async (_, filePath, folderPath, limit = 50, offset = 0) => {
  console.log('Backend: Lade E-Mails aus Ordner:', folderPath);
  
  try {
    if (!PSTFile) {
      return {
        success: false,
        error: 'PST-Library nicht installiert',
        emails: []
      };
    }

    const pstFile = new PSTFile(filePath);
    const emails = [];
    let found = false;

    const findAndLoadEmails = (folder, path = '') => {
      try {
        const folderName = folder.displayName || 'Unbekannt';
        const currentPath = path ? `${path}/${folderName}` : folderName;
        
        if (currentPath === folderPath) {
          found = true;
          const folderEmails = folder.getEmails();
          
          for (let i = offset; i < Math.min(folderEmails.length, offset + limit); i++) {
            try {
              const email = folderEmails[i];
              emails.push({
                id: `email-${email.descriptorNodeId || Date.now()}-${i}`,
                subject: email.subject || '(Kein Betreff)',
                sender: email.senderName || email.senderEmailAddress || 'Unbekannt',
                senderEmail: email.senderEmailAddress || '',
                recipient: email.displayTo || '',
                date: email.clientSubmitTime ? new Date(email.clientSubmitTime).toISOString() : null,
                dateFormatted: email.clientSubmitTime ? new Date(email.clientSubmitTime).toLocaleString('de-DE') : 'Unbekannt',
                hasAttachments: email.hasAttachments || false,
                importance: email.importance || 0,
                isRead: email.isRead || false,
                messageSize: email.messageSize || 0,
                folder: currentPath
              });
            } catch (emailError) {
              console.warn('Backend: Fehler beim Laden einer E-Mail:', emailError.message);
            }
          }
          return;
        }

        if (folder.hasSubfolders) {
          const subfolders = folder.getSubFolders();
          subfolders.forEach(subfolder => {
            if (!found) findAndLoadEmails(subfolder, currentPath);
          });
        }
      } catch (error) {
        console.warn('Backend: Fehler beim Durchsuchen der Ordner:', error.message);
      }
    };

    const rootFolder = pstFile.getRootFolder();
    findAndLoadEmails(rootFolder);

    return {
      success: true,
      emails,
      totalLoaded: emails.length,
      folderPath,
      hasMore: emails.length === limit
    };

  } catch (error) {
    console.error('Backend: Fehler beim Laden der E-Mails:', error.message);
    return {
      success: false,
      error: error.message,
      emails: []
    };
  }
});

// PST-E-Mail-Details laden
ipcMain.handle('pst:loadEmailDetails', async (_, filePath, emailId) => {
  console.log('Backend: Lade E-Mail-Details für:', emailId);
  
  try {
    if (!PSTFile) {
      return {
        success: false,
        error: 'PST-Library nicht installiert'
      };
    }

    // Vereinfachte Implementierung - in echter Anwendung würde man
    // die E-Mail über ihre ID direkt laden
    return {
      success: true,
      email: {
        id: emailId,
        fullBody: 'Vollständiger E-Mail-Inhalt würde hier stehen...',
        headers: {},
        attachments: []
      }
    };

  } catch (error) {
    console.error('Backend: Fehler beim Laden der E-Mail-Details:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

// PST-Statistiken generieren
ipcMain.handle('pst:generateStats', async (_, filePath, analysisType) => {
  console.log('Backend: Generiere PST-Statistiken, Typ:', analysisType);
  
  try {
    if (!PSTFile) {
      return {
        success: false,
        error: 'PST-Library nicht installiert'
      };
    }

    const pstFile = new PSTFile(filePath);
    const stats = {
      emailCategories: {},
      frequentContacts: {},
      emailVolume: {},
      autoTags: [],
      attachmentTypes: {},
      sentimentAnalysis: {},
      appointments: [],
      importantThreads: []
    };

    // Hier würde die spezifische Analyse basierend auf analysisType durchgeführt
    switch (analysisType) {
      case 'email-categories':
        stats.emailCategories = await analyzeEmailCategories(pstFile);
        break;
      case 'frequent-contacts':
        stats.frequentContacts = await analyzeFrequentContacts(pstFile);
        break;
      case 'email-volume':
        stats.emailVolume = await analyzeEmailVolume(pstFile);
        break;
      // ... weitere Analysetypen
    }

    return {
      success: true,
      stats,
      analysisType
    };

  } catch (error) {
    console.error('Backend: Fehler bei PST-Statistiken:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

// Hilfsfunktionen
function getFolderType(folderName) {
  const name = folderName.toLowerCase();
  if (name.includes('posteingang') || name.includes('inbox')) return 'inbox';
  if (name.includes('gesendet') || name.includes('sent')) return 'sent';
  if (name.includes('entwurf') || name.includes('draft')) return 'drafts';
  if (name.includes('gelöscht') || name.includes('deleted') || name.includes('trash')) return 'deleted';
  if (name.includes('spam') || name.includes('junk')) return 'spam';
  return 'folder';
}

async function analyzeEmailCategories(pstFile) {
  // Implementierung für E-Mail-Kategorisierung
  return {
    business: 0,
    personal: 0,
    system: 0,
    spam: 0
  };
}

async function analyzeFrequentContacts(pstFile) {
  // Implementierung für häufige Kontakte
  return {};
}

async function analyzeEmailVolume(pstFile) {
  // Implementierung für E-Mail-Volumen-Analyse
  return {};
}

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

// =====================================
// PST-SPEZIFISCHE IPC HANDLERS
// =====================================

// PST-Datei öffnen und validieren
ipcMain.handle('pst:open', async (_, pstPath) => {
  console.log('Backend: PST öffnen Request für:', pstPath);
  
  if (!PSTFile) {
    console.warn('Backend: PST-Dependencies nicht verfügbar');
    return {
      success: false,
      error: 'PST-Funktionalität nicht verfügbar. Bitte installiere: npm install node-pst email-addresses date-fns lodash'
    };
  }

  try {
    // Überprüfe ob Datei existiert
    await fs.access(pstPath);
    
    // Versuche PST-Datei zu öffnen (einfache Validierung)
    const buffer = await fs.readFile(pstPath);
    const pstFile = new PSTFile(buffer);
    
    console.log('Backend: PST-Datei erfolgreich geöffnet:', pstPath);
    return {
      success: true,
      info: {
        path: pstPath,
        size: buffer.length,
        isValid: true
      }
    };
  } catch (error) {
    console.error('Backend: Fehler beim Öffnen der PST-Datei:', error.message);
    return {
      success: false,
      error: `PST-Datei konnte nicht geöffnet werden: ${error.message}`
    };
  }
});

// PST-Datei durchsuchen
ipcMain.handle('pst:search', async (_, query) => {
  console.log('Backend: PST-Suche Request für Query:', query);
  
  if (!PSTFile || !emailAddresses || !dateFns) {
    return {
      success: false,
      error: 'PST-Dependencies nicht verfügbar',
      results: []
    };
  }

  try {
    // Ermittle alle PST-Dateien aus der Dateiliste
    const searchParams = store.get('search.lastParams', { files: [], query: '' });
    const pstFiles = searchParams.files?.filter(f => f.toLowerCase().endsWith('.pst')) || [];
    
    if (pstFiles.length === 0) {
      return {
        success: true,
        results: [],
        message: 'Keine PST-Dateien ausgewählt'
      };
    }

    const allResults = [];
    
    for (const pstPath of pstFiles) {
      try {
        const searchResults = await searchInPSTFile(pstPath, query);
        allResults.push(...searchResults);
      } catch (fileError) {
        console.warn('Backend: Fehler beim Durchsuchen von PST:', pstPath, fileError.message);
      }
    }

    console.log('Backend: PST-Suche abgeschlossen,', allResults.length, 'Ergebnisse gefunden');
    return {
      success: true,
      results: allResults.slice(0, 50) // Limitiere auf 50 Ergebnisse
    };
    
  } catch (error) {
    console.error('Backend: Fehler bei PST-Suche:', error.message);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
});

// PST-Datei analysieren
ipcMain.handle('pst:analyze', async (_, pstPath) => {
  console.log('Backend: PST-Analyse Request für:', pstPath);
  
  if (!PSTFile || !lodash || !dateFns) {
    return {
      success: false,
      error: 'PST-Dependencies nicht verfügbar'
    };
  }

  try {
    const analysisResult = await analyzePSTFile(pstPath);
    
    console.log('Backend: PST-Analyse abgeschlossen für:', pstPath);
    return {
      success: true,
      analysis: analysisResult
    };
    
  } catch (error) {
    console.error('Backend: Fehler bei PST-Analyse:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

// =====================================
// PST-HILFSFUNKTIONEN
// =====================================

// PST-Datei durchsuchen
async function searchInPSTFile(pstPath, query) {
  const buffer = await fs.readFile(pstPath);
  const pstFile = new PSTFile(buffer);
  const results = [];
  
  // Parse Suchquery für erweiterte Suche
  const searchTerms = parseSearchQuery(query);
  
  try {
    // Durchsuche alle Ordner rekursiv
    const rootFolder = pstFile.getRootFolder();
    await searchPSTFolder(rootFolder, searchTerms, results, path.basename(pstPath));
    
  } catch (error) {
    console.warn('Backend: Fehler beim Durchsuchen der PST-Datei:', error.message);
  }
  
  return results;
}

// Ordner rekursiv durchsuchen
async function searchPSTFolder(folder, searchTerms, results, fileName, folderPath = '') {
  try {
    // Durchsuche E-Mails in diesem Ordner
    if (folder.hasSubMessages) {
      let email = folder.getSubMessage();
      while (email) {
        try {
          if (matchesSearchTerms(email, searchTerms)) {
            results.push({
              file: fileName,
              folder: folderPath || folder.displayName || 'Inbox',
              content: truncateText(email.body || email.subject || '', 200),
              score: calculateRelevanceScore(email, searchTerms),
              emailMeta: {
                from: email.senderEmailAddress || email.senderName || 'Unbekannt',
                to: email.recipientsList?.join(', ') || 'Unbekannt',
                subject: email.subject || '(Kein Betreff)',
                date: email.messageDeliveryTime ? dateFns.format(email.messageDeliveryTime, 'dd.MM.yyyy HH:mm') : 'Unbekannt',
                hasAttachments: email.numberOfAttachments > 0,
                importance: email.importance || 1
              }
            });
          }
          email = folder.getNextSubMessage();
        } catch (emailError) {
          // Überspringe beschädigte E-Mails
          email = folder.getNextSubMessage();
        }
      }
    }
    
    // Durchsuche Unterordner
    if (folder.hasSubFolders) {
      let subfolder = folder.getSubFolder();
      while (subfolder) {
        const subPath = folderPath ? `${folderPath}/${subfolder.displayName}` : subfolder.displayName;
        await searchPSTFolder(subfolder, searchTerms, results, fileName, subPath);
        subfolder = folder.getNextSubFolder();
      }
    }
    
  } catch (error) {
    console.warn('Backend: Fehler beim Durchsuchen von PST-Ordner:', error.message);
  }
}

// Suchquery parsen für erweiterte Suche
function parseSearchQuery(query) {
  const terms = {
    general: [],
    from: [],
    to: [],
    subject: [],
    date: [],
    hasAttachments: false,
    important: false
  };
  
  // Erweiterte Suchsyntax parsen
  const patterns = {
    from: /von:([^\s]+)/gi,
    to: /an:([^\s]+)/gi,
    subject: /betreff:([^\s]+)/gi,
    date: /datum:([^\s]+)/gi,
    attachments: /anhang:(ja|yes|true)/gi,
    important: /wichtig:(ja|yes|true)/gi
  };
  
  let remainingQuery = query;
  
  Object.entries(patterns).forEach(([key, pattern]) => {
    let match;
    while ((match = pattern.exec(query)) !== null) {
      if (key === 'attachments') {
        terms.hasAttachments = true;
      } else if (key === 'important') {
        terms.important = true;
      } else {
        terms[key].push(match[1].toLowerCase());
      }
      remainingQuery = remainingQuery.replace(match[0], '').trim();
    }
  });
  
  // Übrige Begriffe als allgemeine Suchbegriffe
  if (remainingQuery.trim()) {
    terms.general = remainingQuery.toLowerCase().split(/\s+/);
  }
  
  return terms;
}

// Prüfe ob E-Mail den Suchkriterien entspricht
function matchesSearchTerms(email, searchTerms) {
  // Von-Filter
  if (searchTerms.from.length > 0) {
    const fromAddress = (email.senderEmailAddress || email.senderName || '').toLowerCase();
    if (!searchTerms.from.some(term => fromAddress.includes(term))) {
      return false;
    }
  }
  
  // An-Filter
  if (searchTerms.to.length > 0) {
    const toAddresses = (email.recipientsList?.join(' ') || '').toLowerCase();
    if (!searchTerms.to.some(term => toAddresses.includes(term))) {
      return false;
    }
  }
  
  // Betreff-Filter
  if (searchTerms.subject.length > 0) {
    const subject = (email.subject || '').toLowerCase();
    if (!searchTerms.subject.some(term => subject.includes(term))) {
      return false;
    }
  }
  
  // Datum-Filter (vereinfacht)
  if (searchTerms.date.length > 0) {
    const dateStr = email.messageDeliveryTime ? 
      dateFns.format(email.messageDeliveryTime, 'yyyy-MM-dd') : '';
    if (!searchTerms.date.some(term => dateStr.includes(term))) {
      return false;
    }
  }
  
  // Anhang-Filter
  if (searchTerms.hasAttachments && email.numberOfAttachments === 0) {
    return false;
  }
  
  // Wichtigkeit-Filter
  if (searchTerms.important && email.importance < 2) {
    return false;
  }
  
  // Allgemeine Begriffe
  if (searchTerms.general.length > 0) {
    const content = [
      email.subject || '',
      email.body || '',
      email.senderName || '',
      email.senderEmailAddress || ''
    ].join(' ').toLowerCase();
    
    if (!searchTerms.general.some(term => content.includes(term))) {
      return false;
    }
  }
  
  return true;
}

// Berechne Relevanz-Score
function calculateRelevanceScore(email, searchTerms) {
  let score = 0.5; // Basis-Score
  
  const content = [email.subject || '', email.body || ''].join(' ').toLowerCase();
  
  // Score erhöhen basierend auf Übereinstimmungen
  searchTerms.general.forEach(term => {
    const matches = (content.match(new RegExp(term, 'gi')) || []).length;
    score += matches * 0.1;
  });
  
  // Bonus für wichtige E-Mails
  if (email.importance > 1) score += 0.2;
  
  // Bonus für neuere E-Mails
  if (email.messageDeliveryTime) {
    const daysSince = dateFns.differenceInDays(new Date(), email.messageDeliveryTime);
    if (daysSince < 30) score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

// PST-Datei analysieren
async function analyzePSTFile(pstPath) {
  const buffer = await fs.readFile(pstPath);
  const pstFile = new PSTFile(buffer);
  
  const analysis = {
    fileName: path.basename(pstPath),
    fileSize: buffer.length,
    totalEmails: 0,
    folders: [],
    dateRange: { earliest: null, latest: null },
    topSenders: {},
    topRecipients: {},
    averageEmailSize: 0,
    hasAttachments: 0,
    importantEmails: 0
  };
  
  try {
    const rootFolder = pstFile.getRootFolder();
    await analyzePSTFolder(rootFolder, analysis);
    
    // Statistiken berechnen
    analysis.topSenders = lodash.take(
      lodash.orderBy(
        Object.entries(analysis.topSenders),
        ([, count]) => count,
        'desc'
      ).map(([email, count]) => ({ email, count })),
      10
    );
    
    analysis.topRecipients = lodash.take(
      lodash.orderBy(
        Object.entries(analysis.topRecipients),
        ([, count]) => count,
        'desc'
      ).map(([email, count]) => ({ email, count })),
      10
    );
    
    if (analysis.totalEmails > 0) {
      analysis.averageEmailSize = Math.round(analysis.averageEmailSize / analysis.totalEmails);
    }
    
  } catch (error) {
    console.warn('Backend: Fehler bei PST-Analyse:', error.message);
  }
  
  return analysis;
}

// Ordner für Analyse durchsuchen
async function analyzePSTFolder(folder, analysis, folderPath = '') {
  const folderInfo = {
    name: folder.displayName || 'Root',
    path: folderPath,
    emailCount: 0,
    subFolders: []
  };
  
  try {
    // E-Mails in diesem Ordner analysieren
    if (folder.hasSubMessages) {
      let email = folder.getSubMessage();
      while (email) {
        try {
          analysis.totalEmails++;
          folderInfo.emailCount++;
          
          // Datums-Range aktualisieren
          if (email.messageDeliveryTime) {
            if (!analysis.dateRange.earliest || email.messageDeliveryTime < analysis.dateRange.earliest) {
              analysis.dateRange.earliest = email.messageDeliveryTime;
            }
            if (!analysis.dateRange.latest || email.messageDeliveryTime > analysis.dateRange.latest) {
              analysis.dateRange.latest = email.messageDeliveryTime;
            }
          }
          
          // Absender zählen
          const sender = email.senderEmailAddress || email.senderName || 'Unbekannt';
          analysis.topSenders[sender] = (analysis.topSenders[sender] || 0) + 1;
          
          // Empfänger zählen
          if (email.recipientsList) {
            email.recipientsList.forEach(recipient => {
              analysis.topRecipients[recipient] = (analysis.topRecipients[recipient] || 0) + 1;
            });
          }
          
          // E-Mail-Größe
          const emailSize = (email.body || '').length + (email.subject || '').length;
          analysis.averageEmailSize += emailSize;
          
          // Anhänge
          if (email.numberOfAttachments > 0) {
            analysis.hasAttachments++;
          }
          
          // Wichtige E-Mails
          if (email.importance > 1) {
            analysis.importantEmails++;
          }
          
          email = folder.getNextSubMessage();
        } catch (emailError) {
          email = folder.getNextSubMessage();
        }
      }
    }
    
    // Unterordner analysieren
    if (folder.hasSubFolders) {
      let subfolder = folder.getSubFolder();
      while (subfolder) {
        const subPath = folderPath ? `${folderPath}/${subfolder.displayName}` : subfolder.displayName;
        const subFolderInfo = await analyzePSTFolder(subfolder, analysis, subPath);
        folderInfo.subFolders.push(subFolderInfo);
        subfolder = folder.getNextSubFolder();
      }
    }
    
  } catch (error) {
    console.warn('Backend: Fehler beim Analysieren von PST-Ordner:', error.message);
  }
  
  analysis.folders.push(folderInfo);
  return folderInfo;
}

// Text kürzen
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

console.log('✅ PST-Funktionalität erfolgreich geladen');
