export type Category = 'form' | 'navigation' | 'layout' | 'feedback' | 'content'

export type ViewMode = 'grid' | 'list'

export type Status = 'stable' | 'beta' | 'experimental'

export interface Component {
  id: string
  name: string
  description: string
  category: Category
  tags: string[]
  status: Status
  previewUrl?: string
  documentationUrl: string
  codeUrl?: string
  examples?: ComponentExample[]
}

export interface ComponentExample {
  title: string
  description: string
  code: string
  preview?: string
}
