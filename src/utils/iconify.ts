import { addCollection } from '@iconify/vue/dist/offline'
import type { IconifyJSON } from '@iconify/types'

type IconCollectionModule = { default?: IconifyJSON } | IconifyJSON
type IconCollectionLoader = () => Promise<IconCollectionModule>

const collectionLoaders: Record<string, IconCollectionLoader> = {
    ep: () => import('@iconify-json/ep/icons.json'),
    mdi: () => import('@iconify-json/mdi/icons.json'),
    'simple-icons': () => import('@iconify-json/simple-icons/icons.json'),
    'material-symbols': () => import('@iconify-json/material-symbols/icons.json')
}

const loadedPrefixes = new Set<string>()
const loadingTasks = new Map<string, Promise<void>>()

function normalizePrefix(icon: string): string {
    const separatorIndex = icon.indexOf(':')
    if (separatorIndex <= 0) return ''
    return icon.slice(0, separatorIndex)
}

function toIconCollection(module: IconCollectionModule): IconifyJSON | null {
    if (!module || typeof module !== 'object') return null
    if ('default' in module && module.default && typeof module.default === 'object') {
        return module.default as IconifyJSON
    }
    return module as IconifyJSON
}

export async function ensureIconCollectionByPrefix(prefix: string): Promise<void> {
    if (!prefix || loadedPrefixes.has(prefix)) return
    const loader = collectionLoaders[prefix]
    if (!loader) return

    const runningTask = loadingTasks.get(prefix)
    if (runningTask) {
        await runningTask
        return
    }

    const loadTask = loader()
        .then(module => {
            const collection = toIconCollection(module)
            if (!collection) return
            addCollection(collection)
            loadedPrefixes.add(prefix)
        })
        .catch(() => {})
        .finally(() => {
            loadingTasks.delete(prefix)
        })

    loadingTasks.set(prefix, loadTask)
    await loadTask
}

export async function ensureIconCollectionByName(iconName?: string | null): Promise<void> {
    if (!iconName || typeof iconName !== 'string') return
    await ensureIconCollectionByPrefix(normalizePrefix(iconName))
}

export function preloadIconCollections(prefixes: string[]): void {
    prefixes.forEach(prefix => {
        void ensureIconCollectionByPrefix(prefix)
    })
}
