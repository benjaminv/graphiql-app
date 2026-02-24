/**
 * Registry for flush callbacks keyed by outer tab ID.
 * GraphiQLWrapper registers its flush function on mount.
 * TabBar calls flushTab() before clone/close to ensure the store is current.
 * Lives outside React — no re-renders.
 */
const callbacks = new Map<string, () => void>()

export function registerFlush(tabId: string, fn: () => void) {
    callbacks.set(tabId, fn)
}

export function unregisterFlush(tabId: string) {
    callbacks.delete(tabId)
}

export function flushTab(tabId: string) {
    callbacks.get(tabId)?.()
}
