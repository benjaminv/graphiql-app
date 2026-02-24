import { useState, useRef, useEffect, useCallback } from 'react'
import { useTabStore, Tab } from '../store/tabStore'
import { useConfirmDialog } from './ConfirmDialog'
import './TabBar.css'

interface ContextMenuState {
    visible: boolean
    x: number
    y: number
    tabId: string | null
}

interface TabBarProps {
    onOpenSettings: () => void
}

const DEFAULT_ENDPOINT = 'https://swapi-graphql.netlify.app/.netlify/functions/index'
const DEFAULT_QUERY_START = '# Welcome to GraphiQL Desktop'

function isTabEmpty(tab: Tab): boolean {
    return (
        tab.endpoint === DEFAULT_ENDPOINT &&
        (tab.query.startsWith(DEFAULT_QUERY_START) || tab.query.trim() === '') &&
        (tab.variables === '{}' || tab.variables.trim() === '') &&
        tab.title === 'New Endpoint'
    )
}

export function TabBar({ onOpenSettings }: TabBarProps) {
    const { tabs, activeTabId, addTab, removeTab, setActiveTab, updateTab, cloneTab, moveTab } = useTabStore()
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        tabId: null
    })
    const [editingTabId, setEditingTabId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [dragOverTabId, setDragOverTabId] = useState<string | null>(null)
    const [draggingTabId, setDraggingTabId] = useState<string | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const { confirm, DialogComponent } = useConfirmDialog()

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

    const handleCloseTab = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        const tab = tabs.find((t) => t.id === id)
        if (tab && !isTabEmpty(tab)) {
            const confirmed = await confirm({
                title: `Close "${tab.title}"?`,
                message: 'All queries, headers, variables, and history in this endpoint tab will be permanently lost.',
                confirmLabel: 'Close tab',
                danger: true,
            })
            if (!confirmed) return
        }
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

    // Double-click to rename
    const handleDoubleClick = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault()
        e.stopPropagation()
        startEditing(tabId)
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

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, tabId: string) => {
        setDraggingTabId(tabId)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', tabId)
    }

    const handleDragOver = (e: React.DragEvent, tabId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (tabId !== draggingTabId) {
            setDragOverTabId(tabId)
        }
    }

    const handleDragLeave = () => {
        setDragOverTabId(null)
    }

    const handleDrop = (e: React.DragEvent, targetTabId: string) => {
        e.preventDefault()
        const sourceTabId = e.dataTransfer.getData('text/plain')
        if (sourceTabId && sourceTabId !== targetTabId) {
            const targetIndex = tabs.findIndex((t) => t.id === targetTabId)
            if (targetIndex !== -1) {
                moveTab(sourceTabId, targetIndex)
            }
        }
        setDragOverTabId(null)
        setDraggingTabId(null)
    }

    const handleDragEnd = () => {
        setDragOverTabId(null)
        setDraggingTabId(null)
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
                        className={`tab ${tab.id === activeTabId ? 'active' : ''} ${draggingTabId === tab.id ? 'dragging' : ''} ${dragOverTabId === tab.id ? 'drag-over' : ''}`}
                        onClick={() => handleTabClick(tab.id)}
                        onContextMenu={(e) => handleContextMenu(e, tab.id)}
                        onDoubleClick={(e) => handleDoubleClick(e, tab.id)}
                        draggable={editingTabId !== tab.id}
                        onDragStart={(e) => handleDragStart(e, tab.id)}
                        onDragOver={(e) => handleDragOver(e, tab.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, tab.id)}
                        onDragEnd={handleDragEnd}
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

            {/* Settings gear icon */}
            <button
                className="add-tab"
                onClick={onOpenSettings}
                aria-label="Open settings"
                style={{ marginLeft: '4px', marginRight: '4px' }}
            >
                ⚙
            </button>

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

            {/* Confirm Dialog */}
            {DialogComponent}
        </div>
    )
}
