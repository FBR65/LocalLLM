// src/components/pst/PSTExplorer.tsx - PST-Datei Explorer mit funktionsfähiger Ordnerauswahl
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { 
  FolderOpen, 
  Mail, 
  Search, 
  Calendar, 
  User, 
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface EmailItem {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  date: string;
  body_preview: string;
  has_attachments: boolean;
  folder: string;
}

interface PSTExplorerProps {
  pstFolder: string | null;
  onPstFolderChange: (folder: string) => void;
}

export const PSTExplorer: React.FC<PSTExplorerProps> = ({
  pstFolder,
  onPstFolderChange
}) => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [manualPath, setManualPath] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PST-Ordner auswählen
  const selectPstFolder = async () => {
    try {
      setError(null);
      
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'PST-Ordner auswählen'
      });

      if (selected && typeof selected === 'string') {
        onPstFolderChange(selected);
        loadPstFiles(selected);
      }
    } catch (error) {
      console.error('Fehler beim Ordner auswählen:', error);
      setError('Fehler beim Öffnen des Dateidialogs. Verwenden Sie die manuelle Eingabe.');
      setShowManualInput(true);
    }
  };

  // Manuellen Pfad anwenden
  const applyManualPath = () => {
    if (manualPath.trim()) {
      onPstFolderChange(manualPath.trim());
      loadPstFiles(manualPath.trim());
      setShowManualInput(false);
      setError(null);
    }
  };

  // PST-Dateien laden
  const loadPstFiles = async (folderPath: string) => {
    setIsLoading(true);
    try {
      // Backend-Call für PST-Parsing
      const result = await invoke<EmailItem[]>('load_pst_emails', {
        folderPath: folderPath
      });
      
      setEmails(result || []);
    } catch (error) {
      console.error('Fehler beim Laden der PST-Dateien:', error);
      setError('Fehler beim Laden der PST-Dateien. Überprüfen Sie den Pfad.');
      // Simuliere Daten für Demo
      setEmails([
        {
          id: 'demo_1',
          subject: 'Projektbesprechung nächste Woche',
          sender: 'max.mustermann@firma.de',
          recipient: 'team@firma.de',
          date: '2025-01-15T10:30:00Z',
          body_preview: 'Hallo Team, ich möchte eine Besprechung für nächste Woche ansetzen...',
          has_attachments: true,
          folder: 'Inbox'
        },
        {
          id: 'demo_2',
          subject: 'Quartalsbericht Q4 2024',
          sender: 'controlling@firma.de',
          recipient: 'management@firma.de',
          date: '2025-01-10T14:20:00Z',
          body_preview: 'Anbei finden Sie den Quartalsbericht für Q4 2024...',
          has_attachments: true,
          folder: 'Reports'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // E-Mails laden wenn PST-Ordner gesetzt wird
  useEffect(() => {
    if (pstFolder) {
      loadPstFiles(pstFolder);
    }
  }, [pstFolder]);

  // Gefilterte E-Mails
  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.body_preview.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
          <Mail className="w-6 h-6 mr-3 text-blue-600" />
          PST-Explorer
        </h2>
        
        {/* Ordnerauswahl */}
        <div className="kern-content-section">
          <div className="kern-button-group">
            <button
              onClick={selectPstFolder}
              className="kern-button-primary flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span>PST-Ordner auswählen</span>
            </button>
            
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="kern-button-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Manuell eingeben</span>
            </button>
            
            {pstFolder && (
              <button
                onClick={() => loadPstFiles(pstFolder)}
                className="kern-button-secondary flex items-center gap-2"
                disabled={isLoading}
                style={{ 
                  backgroundColor: isLoading ? 'var(--kern-neutral-200)' : undefined,
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Neu laden</span>
              </button>
            )}
          </div>

          {/* Manuelle Pfadeingabe */}
          {showManualInput && (
            <div className="kern-button-group" style={{ marginTop: 'var(--kern-space-4)' }}>
              <input
                type="text"
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                placeholder="z.B. C:\Users\frank\Documents\PST-Dateien"
                className="kern-input"
                style={{ 
                  flex: '1 1 300px',
                  minWidth: '250px'
                }}
              />
              <button
                onClick={applyManualPath}
                className="kern-button-primary"
                style={{ 
                  minWidth: '120px',
                  flexShrink: 0
                }}
              >
                Übernehmen
              </button>
            </div>
          )}

          {/* Aktueller Pfad */}
          {pstFolder && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <span className="font-medium">Ausgewählter Ordner:</span> {pstFolder}
              </p>
            </div>
          )}

          {/* Fehlermeldung */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {pstFolder ? (
        <div className="flex-1 flex overflow-hidden">
          {/* E-Mail-Liste - scrollbar */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Suchbereich */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="E-Mails durchsuchen..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                {filteredEmails.length} von {emails.length} E-Mails
              </div>
            </div>

            {/* E-Mail-Liste - scrollbar */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Lade PST-Dateien...</span>
                </div>
              ) : filteredEmails.length > 0 ? (
                <div className="space-y-1 p-2">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedEmail?.id === email.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-gray-900 text-sm mb-1 truncate">
                        {email.subject}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        Von: {email.sender}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(email.date).toLocaleDateString('de-DE')} • {email.folder}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {email.body_preview}
                      </div>
                      {email.has_attachments && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            <FileText className="w-3 h-3 mr-1" />
                            Anhänge
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <Mail className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Keine E-Mails gefunden' : 'Keine PST-Dateien im ausgewählten Ordner'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* E-Mail-Detail - scrollbar */}
          <div className="w-1/2 flex flex-col">
            {selectedEmail ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {selectedEmail.subject}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Von: {selectedEmail.sender}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>An: {selectedEmail.recipient}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedEmail.date).toLocaleString('de-DE')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedEmail.body_preview}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Wählen Sie eine E-Mail aus der Liste aus</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              PST-Ordner auswählen
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              Wählen Sie einen Ordner mit PST-Dateien aus, um E-Mails zu durchsuchen und zu analysieren.
            </p>
            <button
              onClick={selectPstFolder}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ordner auswählen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
