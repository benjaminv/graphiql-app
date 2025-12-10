import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

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

export const useTabStore = create<TabStore>()(
    persist(
        (set, get) => ({
            tabs: [createDefaultTab()],
            activeTabId: null,

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
                        const defaultTab = createDefaultTab()
                        return { tabs: [defaultTab], activeTabId: defaultTab.id }
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
        }
    )
)

// Initialize activeTabId if not set
const state = useTabStore.getState()
if (!state.activeTabId && state.tabs.length > 0) {
    useTabStore.setState({ activeTabId: state.tabs[0].id })
}
