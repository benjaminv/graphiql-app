import { app, BrowserWindow, session, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

// --- File-based persistence (bypasses unreliable Chromium localStorage) ---
const storageDir = app.getPath('userData')

// Pending writes keyed by storage name, each debounced independently
const pendingWrites: Record<string, string> = {}
const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {}

function getFilePath(name: string): string {
    // Sanitize name to be filesystem-safe
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(storageDir, `${safeName}.json`)
}

function flushWrite(name: string) {
    if (name in pendingWrites) {
        try {
            fs.writeFileSync(getFilePath(name), pendingWrites[name], 'utf-8')
        } catch (e) {
            console.error(`Failed to save "${name}" to disk:`, e)
        }
        delete pendingWrites[name]
    }
    if (saveTimers[name]) {
        clearTimeout(saveTimers[name])
        delete saveTimers[name]
    }
}

function flushAllWrites() {
    for (const name of Object.keys(pendingWrites)) {
        flushWrite(name)
    }
}

// Renderer sends data on every state change; we debounce the disk write
ipcMain.on('store-save', (_event, name: string, data: string) => {
    pendingWrites[name] = data
    if (saveTimers[name]) clearTimeout(saveTimers[name])
    saveTimers[name] = setTimeout(() => flushWrite(name), 1000)
})

// Synchronous IPC: renderer blocks until we return the saved data
ipcMain.on('store-load', (event, name: string) => {
    try {
        const filePath = getFilePath(name)
        if (fs.existsSync(filePath)) {
            event.returnValue = fs.readFileSync(filePath, 'utf-8')
        } else {
            event.returnValue = null
        }
    } catch (e) {
        console.error(`Failed to load "${name}" from disk:`, e)
        event.returnValue = null
    }
})

// --- One-time migration from v5.2.2 initial release ---
const oldTabsFile = path.join(storageDir, 'tabs-data.json')
const newTabsFile = getFilePath('graphiql-desktop-tabs')
if (fs.existsSync(oldTabsFile) && !fs.existsSync(newTabsFile)) {
    fs.renameSync(oldTabsFile, newTabsFile)
}

// --- Window management ---
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: 'hiddenInset', // macOS native traffic lights
        trafficLightPosition: { x: 15, y: 15 },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    // In development, load from Vite dev server
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        // In production, load the built index.html
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    // Flush any pending file writes before the window is destroyed
    mainWindow.on('close', () => {
        flushAllWrites()
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.session.flushStorageData()
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('before-quit', () => {
    flushAllWrites()
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.session.flushStorageData()
    }
})

app.on('will-quit', () => {
    flushAllWrites()
    session.defaultSession.flushStorageData()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
