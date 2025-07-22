import type { Component } from '../types'

export const components: Component[] = [
  {
    id: 'accordion',
    name: 'Accordion',
    description: 'Fasst Informationen in Überschriften zusammen und ermöglicht das Ein- und Ausblenden der zugehörigen Inhalte.',
    category: 'content',
    status: 'stable',
    tags: ['zusammenklappbar', 'navigation', 'inhalte', 'strukturierung'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/accordion',
    examples: [
      {
        title: 'Standard Accordion',
        description: 'Einfaches Accordion mit mehreren Bereichen',
        code: '<details class="kern-accordion"><summary>Bereich 1</summary><p>Inhalt des ersten Bereichs</p></details>'
      }
    ]
  },
  {
    id: 'alert',
    name: 'Alert',
    description: 'Gibt einen Hinweis zu einer wichtigen Information mit knapper Erläuterung und optionalem Link.',
    category: 'feedback',
    status: 'stable',
    tags: ['hinweis', 'warnung', 'information', 'feedback'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/alert'
  },
  {
    id: 'badge',
    name: 'Badge',
    description: 'Gibt einen knappen Status-Hinweis zu einem übergeordneten Element.',
    category: 'content',
    status: 'stable',
    tags: ['status', 'label', 'markierung', 'kennzeichnung'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/badge'
  },
  {
    id: 'button',
    name: 'Button',
    description: 'Löst eine Aktion aus, seine Beschriftung benennt diese Aktion.',
    category: 'form',
    status: 'stable',
    tags: ['aktion', 'interaktion', 'formular', 'schaltfläche'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/button',
    examples: [
      {
        title: 'Primär Button',
        description: 'Hauptaktion auf der Seite',
        code: '<button class="kern-button kern-button--primary">Absenden</button>'
      },
      {
        title: 'Sekundär Button',
        description: 'Nebenaktion',
        code: '<button class="kern-button kern-button--secondary">Abbrechen</button>'
      }
    ]
  },
  {
    id: 'card',
    name: 'Card',
    description: 'Zeigt zusammengehörige Inhalte kompakt in einem visuell abgegrenzten Bereich, oft mit Titel, Bild und Aktionen.',
    category: 'layout',
    status: 'stable',
    tags: ['container', 'gruppierung', 'layout', 'struktur'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/card'
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'Dient der Auswahl einer oder mehrerer Optionen.',
    category: 'form',
    status: 'stable',
    tags: ['auswahl', 'formular', 'mehrfachauswahl', 'eingabe'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/form-inputs/checkboxes'
  },
  {
    id: 'dialog',
    name: 'Dialog',
    description: 'Vermitteln Informationen und fordern eine Reaktion von Nutzenden.',
    category: 'feedback',
    status: 'stable',
    tags: ['modal', 'popup', 'overlay', 'interaktion'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/dialog'
  },
  {
    id: 'divider',
    name: 'Divider',
    description: 'Unterteilt Inhaltsblöcke visuell in verschiedene Gruppen und kann eine Hierarchie aufbauen.',
    category: 'layout',
    status: 'stable',
    tags: ['trennung', 'struktur', 'abgrenzung', 'hierarchie'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/divider'
  },
  {
    id: 'fieldset',
    name: 'Fieldset',
    description: 'Gruppiert zusammengehörige Formularfelder und kann eine Hierarchie aufbauen.',
    category: 'form',
    status: 'stable',
    tags: ['gruppierung', 'formular', 'struktur', 'accessibility'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/fieldset'
  },
  {
    id: 'grid',
    name: 'Grid',
    description: 'Ermöglicht strukturierte Layouts durch Aufteilung in Zeilen und Spalten.',
    category: 'layout',
    status: 'stable',
    tags: ['layout', 'raster', 'responsive', 'struktur'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/grid'
  },
  {
    id: 'icon',
    name: 'Icon',
    description: 'Visualisieren Aktionen, Inhalte oder Statusinformationen.',
    category: 'content',
    status: 'stable',
    tags: ['symbol', 'grafik', 'visual', 'interface'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/icon'
  },
  {
    id: 'input-text',
    name: 'Text Input',
    description: 'Ermöglicht Nutzenden, Buchstaben, Zahlen und Sonderzeichen einzugeben.',
    category: 'form',
    status: 'stable',
    tags: ['eingabe', 'formular', 'text', 'input'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/form-inputs/text'
  },
  {
    id: 'input-email',
    name: 'E-Mail Input',
    description: 'Unterstützt Nutzende bei der Eingabe einer E-Mail-Adresse.',
    category: 'form',
    status: 'stable',
    tags: ['email', 'eingabe', 'formular', 'validierung'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/form-inputs/e-mail'
  },
  {
    id: 'input-password',
    name: 'Password Input',
    description: 'Ermöglicht die Eingabe oder Erstellung eines Passworts.',
    category: 'form',
    status: 'stable',
    tags: ['passwort', 'sicherheit', 'eingabe', 'formular'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/form-inputs/password'
  },
  {
    id: 'link',
    name: 'Link',
    description: 'Ist eine direkte Verbindung zu anderen Inhalten.',
    category: 'navigation',
    status: 'stable',
    tags: ['navigation', 'verweis', 'url', 'hyperlink'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/link'
  },
  {
    id: 'loader',
    name: 'Loader',
    description: 'Ist ein animiertes, sich drehendes Symbol, das die Nutzenden darauf hinweist, dass ein Inhalt geladen wird.',
    category: 'feedback',
    status: 'stable',
    tags: ['loading', 'spinner', 'warten', 'feedback'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/loader'
  },
  {
    id: 'progress',
    name: 'Progress',
    description: 'Zeigt die Gesamtdauer und den Fortschritt eines mehrstufigen Prozesses an.',
    category: 'feedback',
    status: 'stable',
    tags: ['fortschritt', 'prozess', 'status', 'feedback'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/progress'
  },
  {
    id: 'radio',
    name: 'Radio Button',
    description: 'Dienen der Auswahl nur einer Option aus sich gegenseitig ausschließenden Optionen.',
    category: 'form',
    status: 'stable',
    tags: ['auswahl', 'formular', 'exklusiv', 'option'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/form-inputs/radios'
  },
  {
    id: 'select',
    name: 'Select',
    description: 'Bietet die Möglichkeit zur Auswahl einer Option aus einer ausklappbaren Liste von Optionen.',
    category: 'form',
    status: 'stable',
    tags: ['dropdown', 'auswahl', 'formular', 'liste'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/form-inputs/select'
  },
  {
    id: 'table',
    name: 'Table',
    description: 'Stellt Daten tabellarisch dar für schnellen Vergleich und Überblick.',
    category: 'content',
    status: 'stable',
    tags: ['tabelle', 'daten', 'vergleich', 'übersicht'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/table'
  },
  {
    id: 'tabs',
    name: 'Tabs',
    description: 'Ermöglicht das strukturierte Anzeigen und Wechseln zwischen Inhaltselementen.',
    category: 'navigation',
    status: 'stable',
    tags: ['reiter', 'navigation', 'gruppierung', 'wechsel'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/tabs'
  },
  {
    id: 'textarea',
    name: 'Textarea',
    description: 'Ermöglicht eine Eingabe von langen Textinhalten durch Nutzende.',
    category: 'form',
    status: 'stable',
    tags: ['eingabe', 'formular', 'text', 'mehrzeilig'],
    documentationUrl: 'https://www.kern-ux.de/komponenten/form-inputs/textarea'
  }
]
