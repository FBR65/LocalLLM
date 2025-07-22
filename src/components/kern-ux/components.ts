import type { Component } from './types';

export const kernComponents: Component[] = [
  {
    id: 'accordion',
    name: 'Accordion',
    description: 'Fasst Informationen in Überschriften zusammen und ermöglicht das Ein- und Ausblenden der zugehörigen Inhalte.',
    category: 'content',
    status: 'stable',
    tags: ['zusammenklappbar', 'navigation', 'strukturierung', 'inhalt'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/accordion'
  },
  {
    id: 'alert',
    name: 'Alert',
    description: 'Gibt einen Hinweis zu einer wichtigen Information mit knapper Erläuterung und optionalem Link.',
    category: 'feedback',
    status: 'stable',
    tags: ['hinweis', 'warnung', 'information', 'meldung'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/alert'
  },
  {
    id: 'badge',
    name: 'Badge',
    description: 'Gibt einen knappen Status-Hinweis zu einem übergeordneten Element.',
    category: 'content',
    status: 'stable',
    tags: ['status', 'label', 'kennzeichnung', 'indikator'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/badge'
  },
  {
    id: 'button',
    name: 'Button',
    description: 'Löst eine Aktion aus, seine Beschriftung benennt diese Aktion.',
    category: 'form',
    status: 'stable',
    tags: ['aktion', 'interaktion', 'schaltfläche', 'klick'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/button'
  },
  {
    id: 'card',
    name: 'Card',
    description: 'Zeigt zusammengehörige Inhalte kompakt in einem visuell abgegrenzten Bereich, oft mit Titel, Bild und Aktionen.',
    category: 'layout',
    status: 'stable',
    tags: ['container', 'gruppierung', 'karte', 'panel'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/card'
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'Dient der Auswahl einer oder mehrerer Optionen.',
    category: 'form',
    status: 'stable',
    tags: ['auswahl', 'formular', 'eingabe', 'mehrfach'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/form-inputs/checkboxes'
  }
];