import { useTabStore } from './store/tabStore'
import { TabBar } from './components/TabBar'
import { EndpointBar } from './components/EndpointBar'
import { GraphiQLWrapper } from './components/GraphiQLWrapper'
import './App.css'

function App() {
    const { tabs, activeTabId } = useTabStore()
    const activeTab = tabs.find((t) => t.id === activeTabId)

    return (
        <div className="app">
            <div className="title-bar-spacer" />
            <TabBar />
            <EndpointBar />
            <div className="graphiql-container">
                {activeTab && <GraphiQLWrapper key={activeTab.id} tab={activeTab} />}
            </div>
        </div>
    )
}

export default App
