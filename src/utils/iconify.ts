import { addCollection } from '@iconify/vue/dist/offline'
import type { IconifyJSON } from '@iconify/types'
import epSubset from '@/assets/iconify/subsets/ep.json'
import mdiSubset from '@/assets/iconify/subsets/mdi.json'
import materialSymbolsSubset from '@/assets/iconify/subsets/material-symbols.json'
import epIconsUrl from '@iconify-json/ep/icons.json?url'
import mdiIconsUrl from '@iconify-json/mdi/icons.json?url'
import materialSymbolsIconsUrl from '@iconify-json/material-symbols/icons.json?url'
import simpleIconsUrl from '@iconify-json/simple-icons/icons.json?url'

export type IconCollectionPrefix = 'ep' | 'mdi' | 'material-symbols' | 'simple-icons'

export const iconCollectionTabs: Array<{ label: string; value: IconCollectionPrefix }> = [
    { label: 'Element Plus', value: 'ep' },
    { label: 'Material Design', value: 'mdi' },
    { label: 'Material Symbols', value: 'material-symbols' },
    { label: 'Simple Icons', value: 'simple-icons' }
]

export function createIconStringMap<T>(factory: () => T): Record<IconCollectionPrefix, T> {
    return iconCollectionTabs.reduce(
        (acc, item) => {
            acc[item.value] = factory()
            return acc
        },
        {} as Record<IconCollectionPrefix, T>
    )
}

const staticCollections = [epSubset, mdiSubset, materialSymbolsSubset] as IconifyJSON[]
const collectionAssetUrls: Record<IconCollectionPrefix, string> = {
    ep: epIconsUrl,
    mdi: mdiIconsUrl,
    'material-symbols': materialSymbolsIconsUrl,
    'simple-icons': simpleIconsUrl
}

const loadedPrefixes = new Set<string>()
const loadingTasks = new Map<string, Promise<void>>()
const collectionDataCache = new Map<string, Promise<IconifyJSON | null>>()
const availableIcons = new Set<string>()
let hasRegisteredStaticCollections = false

function normalizePrefix(icon: string): string {
    const separatorIndex = icon.indexOf(':')
    if (separatorIndex <= 0) return ''
    return icon.slice(0, separatorIndex)
}

function registerCollection(collection: IconifyJSON | null) {
    if (!collection?.prefix || !collection.icons || typeof collection.icons !== 'object') return
    addCollection(collection)
    Object.keys(collection.icons).forEach(name => {
        availableIcons.add(`${collection.prefix}:${name}`)
    })
}

function registerStaticCollections() {
    if (hasRegisteredStaticCollections) return
    staticCollections.forEach(collection => {
        registerCollection(collection)
    })
    hasRegisteredStaticCollections = true
}

function resolveCollectionUrl(prefix: string): string | null {
    if (!prefix || !(prefix in collectionAssetUrls)) return null
    return collectionAssetUrls[prefix as IconCollectionPrefix]
}

async function fetchCollectionJson(url: string): Promise<IconifyJSON | null> {
    try {
        const response = await fetch(url)
        if (!response.ok) return null
        return (await response.json()) as IconifyJSON
    } catch {
        return null
    }
}

async function loadCollectionData(prefix: string): Promise<IconifyJSON | null> {
    const url = resolveCollectionUrl(prefix)
    if (!url) return null

    const runningTask = collectionDataCache.get(prefix)
    if (runningTask) return await runningTask

    const loadTask = fetchCollectionJson(url).catch(() => null)
    collectionDataCache.set(prefix, loadTask)
    return await loadTask
}

export async function ensureIconCollectionByPrefix(prefix: string): Promise<void> {
    registerStaticCollections()
    if (!prefix || loadedPrefixes.has(prefix)) return
    if (!resolveCollectionUrl(prefix)) return

    const runningTask = loadingTasks.get(prefix)
    if (runningTask) {
        await runningTask
        return
    }

    const loadTask = loadCollectionData(prefix)
        .then(collection => {
            if (!collection) return
            registerCollection(collection)
            loadedPrefixes.add(collection.prefix || prefix)
        })
        .catch(() => {})
        .finally(() => {
            loadingTasks.delete(prefix)
        })

    loadingTasks.set(prefix, loadTask)
    await loadTask
}

export async function ensureIconCollectionByName(iconName?: string | null): Promise<void> {
    registerStaticCollections()
    if (!iconName || typeof iconName !== 'string') return
    if (availableIcons.has(iconName)) return
    await ensureIconCollectionByPrefix(normalizePrefix(iconName))
}

export function preloadIconCollections(prefixes: string[]): void {
    registerStaticCollections()
    prefixes.forEach(prefix => {
        void ensureIconCollectionByPrefix(prefix)
    })
}

export async function loadIconNamesByPrefix(prefix: string): Promise<string[]> {
    registerStaticCollections()
    const collection = await loadCollectionData(prefix)
    if (!collection?.icons || typeof collection.icons !== 'object') return []
    return Object.keys(collection.icons)
}
