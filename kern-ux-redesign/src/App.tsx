import { useState, useMemo } from 'react'
import { Search, Grid, List, Code, ExternalLink } from 'lucide-react'
import { ComponentCard } from './components/ComponentCard'
import { SearchBar } from './components/SearchBar'
import { FilterDropdown } from './components/FilterDropdown'
import { Header } from './components/Header'
import { components } from './data/components'
import type { Category, ViewMode } from './types'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const categories: Array<{ value: Category | 'all'; label: string }> = [
    { value: 'all', label: 'Alle Komponenten' },
    { value: 'form', label: 'Formulare' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'layout', label: 'Layout' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'content', label: 'Inhalte' },
  ]

  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          component.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  const toggleFavorite = (componentId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(componentId)) {
      newFavorites.delete(componentId)
    } else {
      newFavorites.add(componentId)
    }
    setFavorites(newFavorites)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            KERN UX-Komponenten
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Gezielt entwickelt für Online-Dienste der deutschen Verwaltung. 
            Native HTML5-Komponenten für höchste Stabilität und Barrierefreiheit.
          </p>
          <div className="flex justify-center gap-4">
            <button className="btn-primary">
              <Code className="w-4 h-4 mr-2" />
              Entwickler-Guide
            </button>
            <button className="btn-secondary">
              <ExternalLink className="w-4 h-4 mr-2" />
              Figma Library
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 animate-slide-up">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Komponenten durchsuchen..."
              />
            </div>
            
            <div className="flex gap-4 items-center">
              <FilterDropdown
                options={categories}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="Kategorie"
              />
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {filteredComponents.length} Komponenten gefunden
            </span>
            <span className="text-sm text-gray-500">
              {favorites.size} Favoriten
            </span>
          </div>
        </div>

        {/* Components Grid */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {filteredComponents.map((component) => (
            <div key={component.id} className="animate-scale-in">
              <ComponentCard
                component={component}
                viewMode={viewMode}
                isFavorite={favorites.has(component.id)}
                onToggleFavorite={() => toggleFavorite(component.id)}
              />
            </div>
          ))}
        </div>

        {filteredComponents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Komponenten gefunden
            </h3>
            <p className="text-gray-500">
              Versuchen Sie andere Suchbegriffe oder ändern Sie die Filtereinstellungen.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
