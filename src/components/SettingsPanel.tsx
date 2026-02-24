import { useSettingsStore, ThemeMode } from '../store/settingsStore'
import { useConfirmDialog } from './ConfirmDialog'
import './SettingsPanel.css'

interface SettingsPanelProps {
    isOpen: boolean
    onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
    const { theme, setTheme, showInnerSettings, setShowInnerSettings } = useSettingsStore()
    const { confirm, DialogComponent } = useConfirmDialog()

    if (!isOpen) return null

    const handleClearData = async () => {
        const confirmed = await confirm({
            title: 'Clear all data?',
            message:
                'This will remove all locally stored data including saved tabs, queries, headers, and settings. This action cannot be undone.',
            confirmLabel: 'Clear data',
            danger: true,
        })
        if (confirmed) {
            localStorage.clear()
            window.location.reload()
        }
    }

    const handleToggleInnerSettings = async () => {
        if (showInnerSettings) {
            // Turning off — no confirmation needed
            setShowInnerSettings(false)
        } else {
            // Turning on — double confirmation
            const firstConfirm = await confirm({
                title: 'Show advanced settings?',
                message:
                    'This will expose GraphiQL\'s internal settings panel, which includes options that can clear your stored data. Are you sure?',
                confirmLabel: 'Continue',
                danger: true,
            })
            if (!firstConfirm) return

            const secondConfirm = await confirm({
                title: 'Are you really sure?',
                message:
                    'The internal settings panel can modify or delete your queries, headers, and history. Only enable this if you know what you\'re doing.',
                confirmLabel: 'Yes, show settings',
                danger: true,
            })
            if (secondConfirm) {
                setShowInnerSettings(true)
            }
        }
    }

    const themes: { value: ThemeMode; label: string }[] = [
        { value: 'system', label: 'System' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
    ]

    return (
        <>
            <div className="settings-overlay" onClick={onClose}>
                <div
                    className="settings-panel"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="settings-header">
                        <h2 className="settings-title">Settings</h2>
                        <button
                            className="settings-close"
                            onClick={onClose}
                            aria-label="Close settings"
                        >
                            ×
                        </button>
                    </div>

                    <div className="settings-section">
                        <label className="settings-label">Theme</label>
                        <p className="settings-description">
                            Adjust how the interface appears.
                        </p>
                        <div className="settings-toggle-group">
                            {themes.map(({ value, label }) => (
                                <button
                                    key={value}
                                    className={`settings-toggle-btn ${
                                        theme === value ? 'active' : ''
                                    }`}
                                    onClick={() => setTheme(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="settings-section">
                        <div className="settings-row">
                            <div>
                                <label className="settings-label">Advanced settings</label>
                                <p className="settings-description">
                                    Show GraphiQL's internal settings button.
                                </p>
                            </div>
                            <button
                                className={`settings-toggle-btn compact ${showInnerSettings ? 'active' : ''}`}
                                onClick={handleToggleInnerSettings}
                            >
                                {showInnerSettings ? 'On' : 'Off'}
                            </button>
                        </div>
                    </div>

                    <div className="settings-section">
                        <label className="settings-label">Clear storage</label>
                        <p className="settings-description">
                            Remove all locally stored data and start fresh.
                        </p>
                        <button
                            className="settings-danger-btn"
                            onClick={handleClearData}
                        >
                            Clear data
                        </button>
                    </div>
                </div>
            </div>
            {DialogComponent}
        </>
    )
}
