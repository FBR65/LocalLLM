import React, { useState, useMemo } from 'react';
import { kernComponents } from './components';
import type { ViewMode, Category, Status, Component } from './types';

interface FilterDropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ options, value, onChange, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const ViewModeToggle: React.FC<{ viewMode: ViewMode; onViewModeChange: (mode: ViewMode) => void }> = ({ 
  viewMode, 
  onViewModeChange 
}) => (
  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
    <button
      onClick={() => onViewModeChange('grid')}
      className={`px-3 py-2 text-sm ${
        viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      Kacheln
    </button>
    <button
      onClick={() => onViewModeChange('list')}
      className={`px-3 py-2 text-sm border-l border-gray-300 ${
        viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      Liste
    </button>
  </div>
);

const ComponentCard: React.FC<{
  component: Component;
  viewMode: ViewMode;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}> = ({ component, viewMode, isFavorite, onToggleFavorite }) => {
  const statusColors = {
    stable: 'bg-green-100 text-green-800',
    beta: 'bg-yellow-100 text-yellow-800',
    experimental: 'bg-gray-100 text-gray-800'
  };

  const categoryColors = {
    form: 'bg-blue-100 text-blue-800',
    navigation: 'bg-purple-100 text-purple-800',
    layout: 'bg-green-100 text-green-800',
    feedback: 'bg-yellow-100 text-yellow-800',
    content: 'bg-pink-100 text-pink-800'
  };

  const statusLabels = {
    stable: 'Stabil',
    beta: 'Beta',
    experimental: 'Experimentell'
  };

  const categoryLabels = {
    form: 'Formular',
    navigation: 'Navigation',
    layout: 'Layout',
    feedback: 'Feedback',
    content: 'Inhalt'
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{component.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[component.status]}`}>
                {statusLabels[component.status]}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[component.category]}`}>
                {categoryLabels[component.category]}
              </span>
            </div>
            <p className="text-gray-600 mb-3">{component.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {component.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {tag}
                </span>
              ))}
              {component.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{component.tags.length - 3} weitere</span>
              )}
            </div>
            <a
              href={component.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Dokumentation
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-gray-400 hover:text-red-600 hover:bg-gray-50'
            }`}
          >
            <svg className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[component.status]}`}>
            {statusLabels[component.status]}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[component.category]}`}>
            {categoryLabels[component.category]}
          </span>
        </div>
        <button
          onClick={onToggleFavorite}
          className={`p-1.5 rounded-lg transition-colors ${
            isFavorite 
              ? 'text-red-600 hover:bg-red-50' 
              : 'text-gray-400 hover:text-red-600 hover:bg-gray-50'
          }`}
        >
          <svg className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="text-xs text-gray-500 text-center">Komponenten-Vorschau</div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{component.name}</h3>
      
      <p className="text-gray-600 text-sm mb-4">{component.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {component.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {tag}
          </span>
        ))}
        {component.tags.length > 2 && (
          <span className="text-xs text-gray-500">+{component.tags.length - 2}</span>
        )}
      </div>

      <a
        href={component.documentationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
      >
        Dokumentation
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
};

export const KERNUXView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const categoryOptions = [
    { value: 'all', label: 'Alle Kategorien' },
    { value: 'form', label: 'Formular' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'layout', label: 'Layout' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'content', label: 'Inhalt' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Alle Status' },
    { value: 'stable', label: 'Stabil' },
    { value: 'beta', label: 'Beta' },
    { value: 'experimental', label: 'Experimentell' }
  ];

  const filteredComponents = useMemo(() => {
    return kernComponents.filter((component) => {
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          component.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || component.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, selectedStatus]);

  const toggleFavorite = (componentId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(componentId)) {
        newFavorites.delete(componentId);
      } else {
        newFavorites.add(componentId);
      }
      return newFavorites;
    });
  };

  const stats = {
    total: kernComponents.length,
    stable: kernComponents.filter((c) => c.status === 'stable').length,
    beta: kernComponents.filter((c) => c.status === 'beta').length,
    experimental: kernComponents.filter((c) => c.status === 'experimental').length
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  KERN UX Komponenten
                </h1>
                <p className="text-gray-600 max-w-2xl">
                  Das deutsche Designsystem für Behörden bietet wiederverwendbare HTML5-Komponenten 
                  für zugängliche und konsistente Benutzeroberflächen in der öffentlichen Verwaltung.
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</div>
                <div className="text-sm text-gray-500">Komponenten verfügbar</div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{stats.stable}</div>
                <div className="text-sm text-green-700">Stabile Komponenten</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.beta}</div>
                <div className="text-sm text-yellow-700">Beta Komponenten</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">{stats.experimental}</div>
                <div className="text-sm text-gray-700">Experimentelle Komponenten</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{favorites.size}</div>
                <div className="text-sm text-red-700">Favoriten</div>
              </div>
            </div>
          </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Komponenten durchsuchen..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-4">
              <FilterDropdown
                options={categoryOptions}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value as Category | 'all')}
                placeholder="Kategorie"
              />
              
              <FilterDropdown
                options={statusOptions}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value as Status | 'all')}
                placeholder="Status"
              />
              
              <ViewModeToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {filteredComponents.length === kernComponents.length
                ? `${kernComponents.length} Komponenten`
                : `${filteredComponents.length} von ${kernComponents.length} Komponenten`
              }
            </div>
            
            {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredComponents.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33M15 17H9v-2.34A7.962 7.962 0 0112 15c2.34 0 4.467.881 6.08 2.33M15 17v2.34a7.962 7.962 0 01-6.08 2.33v-2.34"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Komponenten gefunden
            </h3>
            <p className="text-gray-600 mb-4">
              Versuchen Sie andere Suchbegriffe oder Filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Alle Komponenten anzeigen
            </button>
          </div>
        )}

        {/* Component Grid/List */}
        {filteredComponents.length > 0 && (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredComponents.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                viewMode={viewMode}
                isFavorite={favorites.has(component.id)}
                onToggleFavorite={() => toggleFavorite(component.id)}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
