import React from 'react'
import { ExternalLink } from 'lucide-react'

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary-600">KERN UX</h1>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Komponenten
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Design System
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Guidelines
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Community
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://www.kern-ux.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm flex items-center"
            >
              Original Site
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
