import { useTabStore } from '../store/tabStore'
import './EndpointBar.css'

export function EndpointBar() {
    const { tabs, activeTabId, updateTab } = useTabStore()
    const activeTab = tabs.find((t) => t.id === activeTabId)

    if (!activeTab) return null

    const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateTab(activeTab.id, { endpoint: e.target.value })
    }

    const handleEndpointKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Prevent window drag when selecting text
        e.stopPropagation()
    }

    return (
        <div className="endpoint-bar">
            <label className="endpoint-label">Endpoint:</label>
            <input
                type="text"
                className="endpoint-input"
                value={activeTab.endpoint}
                onChange={handleEndpointChange}
                onKeyDown={handleEndpointKeyDown}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="https://your-graphql-endpoint.com/graphql"
                spellCheck={false}
            />
        </div>
    )
}
