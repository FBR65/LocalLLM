import React from "react";
import { 
  MessageSquare, 
  FileText, 
  Mail, 
  Brain, 
  Home
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
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "documents" as const, label: "Dokumente", icon: FileText },
    { id: "pst" as const, label: "PST Analyse", icon: Mail },
    { id: "models" as const, label: "Modelle", icon: Brain },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Home className="w-8 h-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">LocalLLM</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    currentView === item.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          <p className="font-medium text-gray-900">LocalLLM Desktop v0.1.0</p>
          <p>German AI Assistant</p>
        </div>
      </div>
    </div>
  );
};
