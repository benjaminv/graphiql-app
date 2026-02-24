import { useState } from 'react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    onCancel: () => void
    danger?: boolean
}

export function ConfirmDialog({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    danger = false,
}: ConfirmDialogProps) {
    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="confirm-btn cancel" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`confirm-btn confirm ${danger ? 'danger' : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Hook for easy confirm dialog management
export function useConfirmDialog() {
    const [dialog, setDialog] = useState<{
        title: string
        message: string
        confirmLabel?: string
        danger?: boolean
        resolve: (confirmed: boolean) => void
    } | null>(null)

    const confirm = (options: {
        title: string
        message: string
        confirmLabel?: string
        danger?: boolean
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialog({ ...options, resolve })
        })
    }

    const handleConfirm = () => {
        dialog?.resolve(true)
        setDialog(null)
    }

    const handleCancel = () => {
        dialog?.resolve(false)
        setDialog(null)
    }

    const DialogComponent = dialog ? (
        <ConfirmDialog
            title={dialog.title}
            message={dialog.message}
            confirmLabel={dialog.confirmLabel}
            danger={dialog.danger}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    ) : null

    return { confirm, DialogComponent }
}
