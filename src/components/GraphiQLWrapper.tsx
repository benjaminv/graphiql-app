import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { GraphiQL } from 'graphiql'
import { HISTORY_PLUGIN } from '@graphiql/plugin-history'
import { explorerPlugin } from '@graphiql/plugin-explorer'
import { useGraphiQL, useGraphiQLActions } from '@graphiql/react'
import { useTabStore, Tab } from '../store/tabStore'
import { useSettingsStore } from '../store/settingsStore'
import 'graphiql/style.css'
import '@graphiql/plugin-explorer/style.css'

interface GraphiQLWrapperProps {
    tab: Tab
}

// Storage keys that we lock to specific values (desktop environment = always trusted)
const LOCKED_STORAGE_KEYS: Record<string, string> = {
    'shouldPersistHeaders': 'true',
}

// Create isolated storage for each endpoint tab
// Also locks certain settings (e.g. shouldPersistHeaders is always ON)
function createTabStorage(tabId: string): Storage {
    const prefix = `graphiql-tab-${tabId}:`

    return {
        get length() {
            return Object.keys(localStorage).filter(k => k.startsWith(prefix)).length
        },
        key(index: number) {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix))
            return keys[index]?.replace(prefix, '') ?? null
        },
        getItem(key: string) {
            // Return locked value if this key is locked
            if (key in LOCKED_STORAGE_KEYS) {
                return LOCKED_STORAGE_KEYS[key]
            }
            return localStorage.getItem(prefix + key)
        },
        setItem(key: string, value: string) {
            // Silently ignore writes to locked keys
            if (key in LOCKED_STORAGE_KEYS) {
                return
            }
            localStorage.setItem(prefix + key, value)
        },
        removeItem(key: string) {
            // Prevent removal of locked keys
            if (key in LOCKED_STORAGE_KEYS) {
                return
            }
            localStorage.removeItem(prefix + key)
        },
        clear() {
            Object.keys(localStorage)
                .filter(k => k.startsWith(prefix))
                .forEach(k => localStorage.removeItem(k))
        }
    }
}

/**
 * Invisible component rendered inside <GraphiQL> to sync headers to new inner tabs.
 * When a new query tab is added, it copies the previous active tab's headers
 * to the new tab — so every new inner tab inherits the current headers.
 */
function HeaderSync() {
    const tabs = useGraphiQL(state => state.tabs)
    const activeTabIndex = useGraphiQL(state => state.activeTabIndex)
    const headerEditor = useGraphiQL(state => state.headerEditor)
    const { updateActiveTabValues } = useGraphiQLActions()

    const prevStateRef = useRef({ tabCount: tabs.length, activeIndex: activeTabIndex })

    useEffect(() => {
        const prev = prevStateRef.current

        if (tabs.length > prev.tabCount && headerEditor) {
            // A new tab was just added — copy headers from previously active tab
            const prevActiveTab = tabs[prev.activeIndex]
            if (prevActiveTab?.headers) {
                // Update both the editor display and the internal state
                headerEditor.setValue(prevActiveTab.headers)
                updateActiveTabValues({ headers: prevActiveTab.headers })
            }
        }

        prevStateRef.current = { tabCount: tabs.length, activeIndex: activeTabIndex }
    }, [tabs, activeTabIndex, headerEditor, updateActiveTabValues])

    return null
}

export function GraphiQLWrapper({ tab }: GraphiQLWrapperProps) {
    const updateTab = useTabStore((state) => state.updateTab)
    const theme = useSettingsStore((state) => state.theme)
    const showInnerSettings = useSettingsStore((state) => state.showInnerSettings)

    // Create isolated storage for this tab
    const storage = useMemo(() => createTabStorage(tab.id), [tab.id])

    // Map our theme setting to GraphiQL's forcedTheme
    const forcedTheme = theme === 'system' ? undefined : theme

    // Create a stable fetcher that uses the current tab's endpoint and headers
    const fetcher = useMemo(() => {
        let headers: Record<string, string> = {}
        try {
            headers = JSON.parse(tab.headers || '{}')
        } catch {
            headers = { 'Content-Type': 'application/json' }
        }

        return createGraphiQLFetcher({
            url: tab.endpoint,
            headers,
        })
    }, [tab.endpoint, tab.headers])

    const handleQueryChange = useCallback(
        (query: string | undefined) => {
            if (query !== undefined) {
                updateTab(tab.id, { query })
            }
        },
        [tab.id, updateTab]
    )

    const handleVariablesChange = useCallback(
        (variables: string | undefined) => {
            if (variables !== undefined) {
                updateTab(tab.id, { variables })
            }
        },
        [tab.id, updateTab]
    )

    const handleHeadersChange = useCallback(
        (headers: string | undefined) => {
            if (headers !== undefined) {
                updateTab(tab.id, { headers })
            }
        },
        [tab.id, updateTab]
    )

    // Create the explorer plugin - memoized to prevent flashing
    const explorer = useMemo(() => explorerPlugin(), [])

    return (
        <GraphiQL
            fetcher={fetcher}
            initialQuery={tab.query}
            initialVariables={tab.variables}
            initialHeaders={tab.headers}
            defaultHeaders={tab.headers}
            onEditQuery={handleQueryChange}
            onEditVariables={handleVariablesChange}
            onEditHeaders={handleHeadersChange}
            plugins={[explorer, HISTORY_PLUGIN]}
            storage={storage}
            shouldPersistHeaders={true}
            showPersistHeadersSettings={showInnerSettings}
            forcedTheme={forcedTheme}
        >
            <HeaderSync />
        </GraphiQL>
    )
}
