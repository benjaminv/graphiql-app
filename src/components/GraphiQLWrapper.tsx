import { useCallback, useMemo } from 'react'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { GraphiQL } from 'graphiql'
import { explorerPlugin } from '@graphiql/plugin-explorer'
import { useTabStore, Tab } from '../store/tabStore'
import 'graphiql/graphiql.css'
import '@graphiql/plugin-explorer/dist/style.css'

interface GraphiQLWrapperProps {
    tab: Tab
}

// Create isolated storage for each endpoint tab
// Also sets default values for GraphiQL settings
function createTabStorage(tabId: string): Storage {
    const prefix = `graphiql-tab-${tabId}:`

    // Ensure persist headers is enabled by default
    const persistHeadersKey = prefix + 'graphiql:shouldPersistHeaders'
    if (localStorage.getItem(persistHeadersKey) === null) {
        localStorage.setItem(persistHeadersKey, 'true')
    }

    return {
        get length() {
            return Object.keys(localStorage).filter(k => k.startsWith(prefix)).length
        },
        key(index: number) {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix))
            return keys[index]?.replace(prefix, '') ?? null
        },
        getItem(key: string) {
            return localStorage.getItem(prefix + key)
        },
        setItem(key: string, value: string) {
            localStorage.setItem(prefix + key, value)
        },
        removeItem(key: string) {
            localStorage.removeItem(prefix + key)
        },
        clear() {
            Object.keys(localStorage)
                .filter(k => k.startsWith(prefix))
                .forEach(k => localStorage.removeItem(k))
        }
    }
}

export function GraphiQLWrapper({ tab }: GraphiQLWrapperProps) {
    const updateTab = useTabStore((state) => state.updateTab)

    // Create isolated storage for this tab
    const storage = useMemo(() => createTabStorage(tab.id), [tab.id])

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
            query={tab.query}
            variables={tab.variables}
            headers={tab.headers}
            onEditQuery={handleQueryChange}
            onEditVariables={handleVariablesChange}
            onEditHeaders={handleHeadersChange}
            plugins={[explorer]}
            storage={storage}
            shouldPersistHeaders={true}
            defaultHeaders={tab.headers}
        />
    )
}
