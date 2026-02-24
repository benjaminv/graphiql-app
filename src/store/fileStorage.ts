import { createJSONStorage } from 'zustand/middleware'

/**
 * Creates a file-backed storage adapter for Zustand persist.
 * Chromium's localStorage in Electron does not reliably persist to disk.
 * We bypass it by reading/writing JSON files via IPC to the main process,
 * with localStorage as an in-session cache for performance.
 */
function createFileBackedStorage(name: string) {
    return {
        getItem(key: string): string | null {
            const cached = localStorage.getItem(key)
            if (cached) {
                // One-time migration: persist localStorage data to file if file is empty
                const existing = window.electronAPI?.store.load(name)
                if (!existing) {
                    window.electronAPI?.store.save(name, cached)
                }
                return cached
            }

            const fromFile = window.electronAPI?.store.load(name)
            if (fromFile) {
                localStorage.setItem(key, fromFile)
                return fromFile
            }

            return null
        },
        setItem(key: string, value: string): void {
            localStorage.setItem(key, value)
            window.electronAPI?.store.save(name, value)
        },
        removeItem(key: string): void {
            localStorage.removeItem(key)
        },
    }
}

/**
 * Creates a Zustand persist `storage` option backed by a file on disk.
 * Usage: `persist(stateCreator, { name: 'key', storage: createFileStorage('key') })`
 */
export function createFileStorage(name: string) {
    return createJSONStorage(() => createFileBackedStorage(name))
}
