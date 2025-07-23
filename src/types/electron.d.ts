declare global {
  interface Window {
    electronAPI: {
      ollama: {
        status: () => Promise<boolean>
        chat: (message: string, context?: string) => Promise<{
          success: boolean
          response?: string
          error?: string
        }>
        models: () => Promise<{
          success: boolean
          models: Array<{ name: string; size: number }>
          error?: string
        }>
        summarize: (content: string, type: string) => Promise<{
          success: boolean
          summary?: string
          error?: string
        }>
        analyze: (content: string, analysisType: string) => Promise<{
          success: boolean
          analysis?: string
          error?: string
        }>
        generatePodcast: (content: string, style: string) => Promise<{
          success: boolean
          script?: string
          error?: string
        }>
      }
      settings: {
        get: (key?: string) => Promise<any>
        set: (key: string, value: any) => Promise<boolean>
      }
      dialog: {
        openFile: (filters?: Array<{ name: string; extensions: string[] }>) => Promise<{
          path: string
          name: string
          size: number
          extension: string
        } | null>
        openFolder: () => Promise<{
          path: string
          name: string
        } | null>
      }
      file: {
        read: (filePath: string) => Promise<{
          success: boolean
          content?: string
          error?: string
        }>
      }
      fs: {
        listDirectory: (dirPath: string) => Promise<{
          success: boolean
          items: Array<{
            name: string
            path: string
            isDirectory: boolean
            size: number
            extension: string
            modified: string
          }>
          error?: string
        }>
      }
      notebook: {
        analyzeAll: (directory: string) => Promise<{
          success: boolean
          analysis?: {
            totalDocuments: number
            totalSize: number
            fileTypes: Record<string, number>
            topics: string[]
            summary: string
          }
          error?: string
        }>
        searchContent: (query: string, directory: string) => Promise<{
          success: boolean
          results?: Array<{
            file: string
            relevance: number
            snippet: string
            path: string
          }>
          error?: string
        }>
      }
      pst: {
        analyze: (filePath: string) => Promise<{
          success: boolean
          info?: {
            totalEmails: number
            totalSize: number
            dateRange: { start: string; end: string }
            folders: string[]
          }
          error?: string
        }>
        search: (filePath: string, searchTerm: string) => Promise<{
          success: boolean
          results?: Array<{
            id: string
            subject: string
            sender: string
            recipient: string
            date: string
            body: string
            attachments: string[]
            folder: string
          }>
          totalFound?: number
          error?: string
        }>
      }
    }
  }
}

export {}
