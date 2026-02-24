import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { createFileStorage } from './fileStorage'

export interface Tab {
    id: string
    title: string
    endpoint: string
    query: string
    variables: string
    headers: string
}

interface TabStore {
    tabs: Tab[]
    activeTabId: string | null

    // Actions
    addTab: () => void
    removeTab: (id: string) => void
    setActiveTab: (id: string) => void
    updateTab: (id: string, updates: Partial<Omit<Tab, 'id'>>) => void
    getActiveTab: () => Tab | undefined
    cloneTab: (id: string) => void
    moveTab: (id: string, newIndex: number) => void
}

const createDefaultTab = (): Tab => ({
    id: uuidv4(),
    title: 'New Endpoint',
    endpoint: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
    query: `# Welcome to GraphiQL Desktop
#
# Enter your GraphQL query here.

query {
  __typename
}
`,
    variables: '{}',
    headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2),
})

// Create the default tab once so the ID is stable during initialization
const defaultTab = createDefaultTab()

export const useTabStore = create<TabStore>()(
    persist(
        (set, get) => ({
            tabs: [defaultTab],
            activeTabId: defaultTab.id,

            addTab: () => {
                const newTab = createDefaultTab()
                set((state) => ({
                    tabs: [...state.tabs, newTab],
                    activeTabId: newTab.id,
                }))
            },

            removeTab: (id: string) => {
                set((state) => {
                    const newTabs = state.tabs.filter((t) => t.id !== id)
                    if (newTabs.length === 0) {
                        const freshTab = createDefaultTab()
                        return { tabs: [freshTab], activeTabId: freshTab.id }
                    }
                    const newActiveId = state.activeTabId === id
                        ? newTabs[0].id
                        : state.activeTabId
                    return { tabs: newTabs, activeTabId: newActiveId }
                })
            },

            setActiveTab: (id: string) => {
                set({ activeTabId: id })
            },

            updateTab: (id: string, updates: Partial<Omit<Tab, 'id'>>) => {
                set((state) => ({
                    tabs: state.tabs.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                }))
            },

            getActiveTab: () => {
                const state = get()
                return state.tabs.find((t) => t.id === state.activeTabId)
            },

            cloneTab: (id: string) => {
                const state = get()
                const tabToClone = state.tabs.find((t) => t.id === id)
                if (!tabToClone) return

                const newTab: Tab = {
                    ...tabToClone,
                    id: uuidv4(),
                    title: `${tabToClone.title} (Copy)`,
                }

                // Clone the GraphiQL internal storage for this tab
                const sourcePrefix = `graphiql-tab-${id}:`
                const destPrefix = `graphiql-tab-${newTab.id}:`
                Object.keys(localStorage)
                    .filter(k => k.startsWith(sourcePrefix))
                    .forEach(k => {
                        const newKey = k.replace(sourcePrefix, destPrefix)
                        const value = localStorage.getItem(k)
                        if (value) localStorage.setItem(newKey, value)
                    })

                const tabIndex = state.tabs.findIndex((t) => t.id === id)
                const newTabs = [...state.tabs]
                newTabs.splice(tabIndex + 1, 0, newTab)

                set({
                    tabs: newTabs,
                    activeTabId: newTab.id,
                })
            },

            moveTab: (id: string, newIndex: number) => {
                set((state) => {
                    const currentIndex = state.tabs.findIndex((t) => t.id === id)
                    if (currentIndex === -1 || newIndex < 0 || newIndex >= state.tabs.length) {
                        return state
                    }

                    const newTabs = [...state.tabs]
                    const [movedTab] = newTabs.splice(currentIndex, 1)
                    newTabs.splice(newIndex, 0, movedTab)

                    return { tabs: newTabs }
                })
            },
        }),
        {
            name: 'graphiql-desktop-tabs',
            storage: createFileStorage('graphiql-desktop-tabs'),
            // After rehydration: ensure activeTabId is valid
            onRehydrateStorage: () => {
                return (state?: TabStore) => {
                    if (state) {
                        const { tabs, activeTabId } = state
                        // If activeTabId is missing or doesn't match any tab, fix it
                        const isValid = activeTabId && tabs.some(t => t.id === activeTabId)
                        if (!isValid && tabs.length > 0) {
                            useTabStore.setState({ activeTabId: tabs[0].id })
                        }
                    }
                }
            },
        }
    )
)
