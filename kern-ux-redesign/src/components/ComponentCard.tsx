import React from 'react'
import { ExternalLink, Code, Heart, Tag } from 'lucide-react'
import type { Component, ViewMode } from '../types'

interface ComponentCardProps {
  component: Component
  viewMode: ViewMode
  isFavorite: boolean
  onToggleFavorite: () => void
}

const StatusBadge: React.FC<{ status: Component['status'] }> = ({ status }) => {
  const statusStyles = {
    stable: 'bg-secondary-100 text-secondary-800',
    beta: 'bg-accent-100 text-accent-800',
    experimental: 'bg-gray-100 text-gray-800'
  }

  const statusLabels = {
    stable: 'Stabil',
    beta: 'Beta',
    experimental: 'Experimentell'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

const CategoryBadge: React.FC<{ category: Component['category'] }> = ({ category }) => {
  const categoryStyles = {
    form: 'bg-blue-100 text-blue-800',
    navigation: 'bg-purple-100 text-purple-800',
    layout: 'bg-green-100 text-green-800',
    feedback: 'bg-yellow-100 text-yellow-800',
    content: 'bg-pink-100 text-pink-800'
  }

  const categoryLabels = {
    form: 'Formular',
    navigation: 'Navigation',
    layout: 'Layout',
    feedback: 'Feedback',
    content: 'Inhalt'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyles[category]}`}>
      {categoryLabels[category]}
    </span>
  )
}

const ComponentPreview: React.FC<{ component: Component }> = ({ component }) => {
  // Simplified preview based on component type
  const renderPreview = () => {
    switch (component.id) {
      case 'button':
        return (
          <div className="space-x-2">
            <button className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded">
              Primär
            </button>
            <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded">
              Sekundär
            </button>
          </div>
        )
      case 'alert':
        return (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-2">
            <div className="flex">
              <div className="text-sm text-blue-700">
                Dies ist eine wichtige Information.
              </div>
            </div>
          </div>
        )
      case 'card':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <h4 className="font-medium text-sm mb-1">Card Titel</h4>
            <p className="text-xs text-gray-600">Card Beschreibung hier...</p>
          </div>
        )
      case 'input-text':
        return (
          <input 
            type="text" 
            placeholder="Text eingeben..." 
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
            disabled
          />
        )
      case 'checkbox':
        return (
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" className="rounded" defaultChecked />
            <span>Option auswählen</span>
          </label>
        )
      case 'progress':
        return (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
        )
      default:
        return (
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Komponenten-Preview</div>
          </div>
        )
    }
  }

  return (
    <div className="component-preview">
      {renderPreview()}
    </div>
  )
}

export const ComponentCard: React.FC<ComponentCardProps> = ({ 
  component, 
  viewMode, 
  isFavorite, 
  onToggleFavorite 
}) => {
  if (viewMode === 'list') {
    return (
      <div className="component-card flex items-center gap-6">
        <div className="flex-shrink-0 w-32">
          <ComponentPreview component={component} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{component.name}</h3>
                <StatusBadge status={component.status} />
                <CategoryBadge category={component.category} />
              </div>
              <p className="text-gray-600 mb-3">{component.description}</p>
              <div className="flex flex-wrap gap-1">
                {component.tags.slice(0, 3).map((tag) => (
                  <span 
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
                {component.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{component.tags.length - 3} weitere</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={onToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-gray-400 hover:text-red-600 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              
              <a
                href={component.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm flex items-center"
              >
                Dokumentation
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              
              {component.codeUrl && (
                <a
                  href={component.codeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm flex items-center"
                >
                  Code
                  <Code className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="component-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={component.status} />
          <CategoryBadge category={component.category} />
        </div>
        <button
          onClick={onToggleFavorite}
          className={`p-1.5 rounded-lg transition-colors ${
            isFavorite 
              ? 'text-red-600 hover:bg-red-50' 
              : 'text-gray-400 hover:text-red-600 hover:bg-gray-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <ComponentPreview component={component} />

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{component.name}</h3>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{component.description}</p>

      <div className="flex flex-wrap gap-1 mb-4">
        {component.tags.slice(0, 2).map((tag) => (
          <span 
            key={tag}
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
          >
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
        {component.tags.length > 2 && (
          <span className="text-xs text-gray-500">+{component.tags.length - 2}</span>
        )}
      </div>

      <div className="flex gap-2">
        <a
          href={component.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm flex items-center flex-1 justify-center"
        >
          Dokumentation
          <ExternalLink className="w-3 h-3 ml-1" />
        </a>
        
        {component.codeUrl && (
          <a
            href={component.codeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm flex items-center"
          >
            <Code className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}
