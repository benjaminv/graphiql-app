import { app, BrowserWindow, session, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

// --- File-based persistence (bypasses unreliable Chromium localStorage) ---
const storageDir = app.getPath('userData')
const tabsFilePath = path.join(storageDir, 'tabs-data.json')

let pendingTabsData: string | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

function saveTabsNow() {
    if (pendingTabsData !== null) {
        try {
            fs.writeFileSync(tabsFilePath, pendingTabsData, 'utf-8')
        } catch (e) {
            console.error('Failed to save tabs to disk:', e)
        }
        pendingTabsData = null
    }
    if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
    }
}

// Renderer sends tab data on every state change; we debounce the disk write
ipcMain.on('save-tabs', (_event, data: string) => {
    pendingTabsData = data
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveTabsNow, 1000)
})

// Synchronous IPC: renderer blocks until we return the saved data
ipcMain.on('load-tabs', (event) => {
    try {
        if (fs.existsSync(tabsFilePath)) {
            event.returnValue = fs.readFileSync(tabsFilePath, 'utf-8')
        } else {
            event.returnValue = null
        }
    } catch (e) {
        console.error('Failed to load tabs from disk:', e)
        event.returnValue = null
    }
})

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
        saveTabsNow()
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
    saveTabsNow()
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.session.flushStorageData()
    }
})

app.on('will-quit', () => {
    saveTabsNow()
    session.defaultSession.flushStorageData()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
