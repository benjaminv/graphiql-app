import { useState } from 'react'
import { useTabStore } from './store/tabStore'
import { useSettingsStore } from './store/settingsStore'
import { TabBar } from './components/TabBar'
import { EndpointBar } from './components/EndpointBar'
import { GraphiQLWrapper } from './components/GraphiQLWrapper'
import { SettingsPanel } from './components/SettingsPanel'
import './App.css'

function App() {
    const { tabs, activeTabId } = useTabStore()
    const showInnerSettings = useSettingsStore((s) => s.showInnerSettings)
    const activeTab = tabs.find((t) => t.id === activeTabId)
    const [settingsOpen, setSettingsOpen] = useState(false)

    return (
        <div className={`app ${!showInnerSettings ? 'hide-inner-settings' : ''}`}>
            <div className="title-bar-spacer" />
            <TabBar onOpenSettings={() => setSettingsOpen(true)} />
            <EndpointBar />
            <div className="graphiql-container">
                {activeTab && <GraphiQLWrapper key={activeTab.id} tab={activeTab} />}
            </div>
            <SettingsPanel
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </div>
    )
}

export default App
