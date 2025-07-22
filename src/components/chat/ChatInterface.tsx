// src/components/chat/ChatInterface.tsx - Deutsche KI-Chat-Oberfläche
import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Send, FileText, Mail, Bot, User, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokensUsed?: number;
}

interface ChatInterfaceProps {
  currentModel: string | null;
  documentsFolder: string | null;
  pstFolder: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentModel,
  documentsFolder,
  pstFolder
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-scroll zu neuesten Nachrichten
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Neue Conversation starten
    if (!conversationId) {
      const newConversationId = `conv_${Date.now()}`;
      setConversationId(newConversationId);
      
      // Willkommensnachricht
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Hallo! Ich bin Ihr deutscher KI-Assistent. Ich kann Ihnen bei folgenden Aufgaben helfen:

**Dokumente befragen** - Stellen Sie Fragen zu Ihren PDFs und Textdateien
**E-Mails analysieren** - Durchsuchen und analysieren Sie Ihre PST-Dateien  
**Text übersetzen** - Übersetzen zwischen verschiedenen Sprachen
**Code generieren** - Erstellen Sie Code in verschiedenen Programmiersprachen
**Zusammenfassungen** - Erstellen Sie Zusammenfassungen von langen Texten

${currentModel ? `Aktuelles Modell: ${currentModel}` : 'Bitte wählen Sie ein Modell aus.'}

Wie kann ich Ihnen heute helfen?`,
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
    }
  }, [conversationId, currentModel]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentModel || isGenerating) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsGenerating(true);

    try {
      // Backend-Call für Textgenerierung
      const response = await invoke<string>('generate_german_text', {
        prompt: inputText.trim(),
        modelName: currentModel
      });

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Fehler bei der Textgenerierung:', error);
      
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage: ${error}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const formatMessage = (content: string) => {
    // KERN UX konforme Formatierung ohne hanging text
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-inherit">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-inherit">$1</em>')
      .replace(/`(.*?)`/g, '<code class="kern-code-inline">$1</code>');
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">KI-Assistent</h2>
              <p className="text-sm text-gray-600">
                {currentModel ? `Modell: ${currentModel}` : 'Kein Modell ausgewählt'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={clearConversation}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Gespräch löschen"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Löschen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat-Bereich - scrollbar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Willkommen beim KI-Assistenten</h3>
            <p className="text-gray-500 max-w-md">
              Stellen Sie Fragen, lassen Sie Texte übersetzen oder bitten Sie um Hilfe bei verschiedenen Aufgaben.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}
              
              <div
                className={`max-w-3xl px-4 py-3 rounded-lg kern-fade-in ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-12'
                    : 'bg-gray-100 text-gray-900 mr-12'
                }`}
              >
                <div
                  className="kern-message-content"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString('de-DE')}
                  {message.tokensUsed && ` • ${message.tokensUsed} Tokens`}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isGenerating && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg mr-12">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Antwort wird generiert...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input-Bereich */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {!currentModel && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-800 text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Bitte wählen Sie zuerst ein ONNX-Modell aus, um zu chatten.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                currentModel 
                  ? "Schreiben Sie Ihre Nachricht..." 
                  : "Modell auswählen, um zu chatten..."
              }
              disabled={!currentModel || isGenerating}
              className="w-full kern-input resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || !currentModel || isGenerating}
            className="kern-button-primary flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Senden</span>
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>Drücken Sie Enter zum Senden, Shift+Enter für neue Zeile</span>
          {documentsFolder && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Dokumente verfügbar
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
