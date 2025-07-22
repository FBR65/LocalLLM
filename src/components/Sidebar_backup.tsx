import React from "react";
import { 
  MessageSquare, 
  FileText, 
  Mail, 
  Brain, 
  Home,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

export interface SidebarProps {
  currentView: 'chat' | 'documents' | 'pst' | 'models';
  onViewChange: (view: 'chat' | 'documents' | 'pst' | 'models') => void;
  currentModel: string | null;
  documentsFolder: string | null;
  pstFolder: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  currentModel, 
  documentsFolder, 
  pstFolder 
}) => {
  const menuItems = [
    { 
      id: "chat" as const, 
      label: "Chat", 
      icon: MessageSquare,
      description: "KI-Assistant für Gespräche"
    },
    { 
      id: "documents" as const, 
      label: "Dokumente", 
      icon: FileText,
      description: "Dateien verwalten und durchsuchen"
    },
    { 
      id: "pst" as const, 
      label: "PST Analyse", 
      icon: Mail,
      description: "E-Mail-Archive analysieren"
    },
    { 
      id: "models" as const, 
      label: "Modelle", 
      icon: Brain,
      description: "KI-Modelle verwalten"
    }
  ];

  const getStatusIndicator = (itemId: string) => {
    switch(itemId) {
      case 'models':
        return currentModel ? (
          <div title="Modell aktiv">
            <CheckCircle className="w-4 h-4" 
                        style={{ color: 'var(--kern-success)' }} />
          </div>
        ) : (
          <div title="Kein Modell">
            <XCircle className="w-4 h-4" 
                     style={{ color: 'var(--kern-neutral-400)' }} />
          </div>
        );
      case 'documents':
        return documentsFolder ? (
          <div title="Ordner verbunden">
            <CheckCircle className="w-4 h-4" 
                        style={{ color: 'var(--kern-success)' }} />
          </div>
        ) : (
          <div title="Kein Ordner">
            <XCircle className="w-4 h-4" 
                     style={{ color: 'var(--kern-neutral-400)' }} />
          </div>
        );
      case 'pst':
        return pstFolder ? (
          <div title="PST-Ordner verbunden">
            <CheckCircle className="w-4 h-4" 
                        style={{ color: 'var(--kern-success)' }} />
          </div>
        ) : (
          <div title="Kein PST-Ordner">
            <AlertCircle className="w-4 h-4" 
                         style={{ color: 'var(--kern-warning)' }} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-300 h-screen flex flex-col" 
           style={{ 
             borderColor: 'var(--kern-border-color)',
             boxShadow: 'var(--kern-shadow-sm)'
           }}>
      {/* KERN UX Header */}
      <header className="p-6 border-b" 
              style={{ 
                borderColor: 'var(--kern-border-color)',
                backgroundColor: 'var(--kern-neutral-50)'
              }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" 
               style={{ backgroundColor: 'var(--kern-primary)' }}>
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" 
                style={{ 
                  color: 'var(--kern-neutral-900)',
                  fontSize: 'var(--kern-font-size-xl)',
                  fontFamily: 'var(--kern-font-family)'
                }}>
              LocalLLM
            </h1>
            <p className="text-xs" 
               style={{ 
                 color: 'var(--kern-neutral-600)',
                 fontSize: 'var(--kern-font-size-xs)'
               }}>
              Deutscher KI-Assistent
            </p>
          </div>
        </div>
      </header>
      
      {/* KERN UX Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const statusIndicator = getStatusIndicator(item.id);
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`kern-nav-item ${isActive ? 'kern-nav-item--active' : ''}`}
                >
                  <Icon className="kern-nav-item__icon" />
                  <div className="kern-nav-item__content">
                    <div className="kern-nav-item__title">{item.label}</div>
                    <div className="kern-nav-item__description">{item.description}</div>
                  </div>
                  {statusIndicator && (
                    <div className="kern-nav-item__status">
                      {statusIndicator}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </nav>
      
      {/* KERN UX Footer */}
      <footer className="p-4 border-t" 
              style={{ 
                borderColor: 'var(--kern-border-color)',
                backgroundColor: 'var(--kern-neutral-50)'
              }}>
        <div className="text-center">
          <div className="text-sm font-medium mb-1"
               style={{ 
                 color: 'var(--kern-neutral-900)',
                 fontSize: 'var(--kern-font-size-sm)',
                 fontFamily: 'var(--kern-font-family)'
               }}>
            LocalLLM Desktop v0.1.0
          </div>
          <div className="text-xs"
               style={{ 
                 color: 'var(--kern-neutral-600)',
                 fontSize: 'var(--kern-font-size-xs)'
               }}>
            Deutscher KI-Assistent
          </div>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-2 h-2 rounded-full" 
                 style={{ backgroundColor: 'var(--kern-success)' }}
                 title="System aktiv" />
            <div className="w-2 h-2 rounded-full" 
                 style={{ backgroundColor: 'var(--kern-info)' }}
                 title="Frontend geladen" />
            <div className={`w-2 h-2 rounded-full`} 
                 style={{ backgroundColor: currentModel ? 'var(--kern-success)' : 'var(--kern-neutral-400)' }}
                 title={currentModel ? 'Modell verbunden' : 'Kein Modell'} />
          </div>
        </div>
      </footer>
    </aside>
  );
};
