import { useState, useRef, useEffect } from 'react'
import { useTabStore } from '../store/tabStore'
import './TabBar.css'

interface ContextMenuState {
    visible: boolean
    x: number
    y: number
    tabId: string | null
}

export function TabBar() {
    const { tabs, activeTabId, addTab, removeTab, setActiveTab, updateTab, cloneTab, moveTab } = useTabStore()
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        tabId: null
    })
    const [editingTabId, setEditingTabId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const menuRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu(prev => ({ ...prev, visible: false }))
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Focus input when editing starts
    useEffect(() => {
        if (editingTabId && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [editingTabId])

    const handleTabClick = (id: string) => {
        if (editingTabId !== id) {
            setActiveTab(id)
        }
    }

    const handleCloseTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        removeTab(id)
    }

    const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            tabId
        })
    }

    const startEditing = (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId)
        if (tab) {
            setEditValue(tab.title)
            setEditingTabId(tabId)
        }
    }

    const finishEditing = () => {
        if (editingTabId && editValue.trim()) {
            updateTab(editingTabId, { title: editValue.trim() })
        }
        setEditingTabId(null)
        setEditValue('')
    }

    const cancelEditing = () => {
        setEditingTabId(null)
        setEditValue('')
    }

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            finishEditing()
        } else if (e.key === 'Escape') {
            cancelEditing()
        }
    }

    const handleMenuAction = (action: string) => {
        const tabId = contextMenu.tabId
        if (!tabId) return

        const tabIndex = tabs.findIndex(t => t.id === tabId)

        switch (action) {
            case 'rename':
                startEditing(tabId)
                break
            case 'clone':
                cloneTab(tabId)
                break
            case 'moveLeft':
                if (tabIndex > 0) {
                    moveTab(tabId, tabIndex - 1)
                }
                break
            case 'moveRight':
                if (tabIndex < tabs.length - 1) {
                    moveTab(tabId, tabIndex + 1)
                }
                break
        }

        setContextMenu(prev => ({ ...prev, visible: false }))
    }

    const tabIndex = contextMenu.tabId ? tabs.findIndex(t => t.id === contextMenu.tabId) : -1

    return (
        <div className="tab-bar">
            <div className="tabs-container">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                        onClick={() => handleTabClick(tab.id)}
                        onContextMenu={(e) => handleContextMenu(e, tab.id)}
                    >
                        {editingTabId === tab.id ? (
                            <input
                                ref={inputRef}
                                className="tab-edit-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={finishEditing}
                                onKeyDown={handleEditKeyDown}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="tab-title">{tab.title}</span>
                        )}
                        <button
                            className="tab-close"
                            onClick={(e) => handleCloseTab(e, tab.id)}
                            aria-label="Close tab"
                        >
                            ×
                        </button>
                    </div>
                ))}
                <button className="add-tab" onClick={addTab} aria-label="Add new tab">
                    +
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    ref={menuRef}
                    className="context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button onClick={() => handleMenuAction('rename')}>Rename Tab</button>
                    <button onClick={() => handleMenuAction('clone')}>Clone Tab</button>
                    <div className="menu-divider" />
                    <button
                        onClick={() => handleMenuAction('moveLeft')}
                        disabled={tabIndex <= 0}
                    >
                        Move Left
                    </button>
                    <button
                        onClick={() => handleMenuAction('moveRight')}
                        disabled={tabIndex >= tabs.length - 1}
                    >
                        Move Right
                    </button>
                </div>
            )}
        </div>
    )
}
