import { addCollection } from '@iconify/vue/dist/offline'
import type { IconifyJSON } from '@iconify/types'
import epSubset from '@/assets/iconify/subsets/ep.json'
import mdiSubset from '@/assets/iconify/subsets/mdi.json'
import materialSymbolsSubset from '@/assets/iconify/subsets/material-symbols.json'
import epIconsUrl from '@iconify-json/ep/icons.json?url'
import mdiIconsUrl from '@iconify-json/mdi/icons.json?url'
import simpleIconsUrl from '@iconify-json/simple-icons/icons.json?url'
import materialSymbolsUrl from '@iconify-json/material-symbols/icons.json?url'

const staticCollections = [epSubset, mdiSubset, materialSymbolsSubset] as IconifyJSON[]
const collectionAssetUrls: Record<string, string> = {
    ep: epIconsUrl,
    mdi: mdiIconsUrl,
    'simple-icons': simpleIconsUrl,
    'material-symbols': materialSymbolsUrl
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
    const url = collectionAssetUrls[prefix]
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
    if (!collectionAssetUrls[prefix]) return

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
