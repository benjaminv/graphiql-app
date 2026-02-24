import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    saveTabs: (data: string) => ipcRenderer.send('save-tabs', data),
    loadTabs: (): string | null => ipcRenderer.sendSync('load-tabs'),
})
