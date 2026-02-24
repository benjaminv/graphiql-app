/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        platform: string
        saveTabs: (data: string) => void
        loadTabs: () => string | null
    }
}
