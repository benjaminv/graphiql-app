/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        platform: string
        store: {
            save: (name: string, data: string) => void
            load: (name: string) => string | null
        }
    }
}
