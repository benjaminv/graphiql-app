import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    store: {
        save: (name: string, data: string) => ipcRenderer.send('store-save', name, data),
        load: (name: string): string | null => ipcRenderer.sendSync('store-load', name),
    },
})
