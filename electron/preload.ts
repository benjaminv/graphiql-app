import { contextBridge } from 'electron'

// Expose any needed APIs to the renderer process here
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
})
