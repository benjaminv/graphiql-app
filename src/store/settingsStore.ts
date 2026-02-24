import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'system' | 'light' | 'dark'

interface SettingsStore {
    theme: ThemeMode
    showInnerSettings: boolean
    setTheme: (theme: ThemeMode) => void
    setShowInnerSettings: (show: boolean) => void
}

function applyTheme(theme: ThemeMode) {
    const body = document.body

    // Remove existing GraphiQL theme classes
    body.classList.remove('graphiql-light', 'graphiql-dark')

    if (theme === 'light') {
        body.classList.add('graphiql-light')
        document.documentElement.setAttribute('data-theme', 'light')
    } else if (theme === 'dark') {
        body.classList.add('graphiql-dark')
        document.documentElement.setAttribute('data-theme', 'dark')
    } else {
        // System: let prefers-color-scheme handle GraphiQL
        // Detect system preference for our wrapper UI
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            theme: 'system' as ThemeMode,
            showInnerSettings: false,

            setTheme: (theme: ThemeMode) => {
                applyTheme(theme)
                set({ theme })
            },

            setShowInnerSettings: (show: boolean) => {
                set({ showInnerSettings: show })
            },
        }),
        {
            name: 'graphiql-desktop-settings',
            onRehydrateStorage: () => {
                // Called after rehydration — apply the persisted theme
                return (state?: SettingsStore) => {
                    if (state) {
                        applyTheme(state.theme)
                    }
                }
            },
        }
    )
)

// Apply theme on initial load
const initialState = useSettingsStore.getState()
applyTheme(initialState.theme)

// Listen for system theme changes when in 'system' mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useSettingsStore.getState()
    if (theme === 'system') {
        applyTheme('system')
    }
})
