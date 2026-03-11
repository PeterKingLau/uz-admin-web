<template>
    <div class="icon-body">
        <el-input v-model="searchText" class="icon-search" clearable placeholder="搜索图标，如 user、home、edit" @clear="filterIcons" @input="filterIcons">
            <template #prefix>
                <Icon icon="ep:search" class="search-icon" />
            </template>
        </el-input>

        <el-tabs v-model="activePrefix" class="icon-tabs">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="Element Plus" name="ep" />
            <el-tab-pane label="Material Design" name="mdi" />
            <el-tab-pane label="Material Symbols" name="material-symbols" />
            <el-tab-pane label="Simple Icons" name="simple-icons" />
        </el-tabs>

        <div class="icon-list-wrapper">
            <el-scrollbar ref="scrollbarRef">
                <div v-if="displayIcons.length > 0" class="icon-grid">
                    <div
                        v-for="icon in displayIcons"
                        :key="icon"
                        class="icon-item"
                        :class="{ active: activeIcon === icon }"
                        :title="icon"
                        @click="handleSelect(icon)"
                    >
                        <Icon :icon="icon" class="icon-svg" />
                        <span class="icon-name">{{ icon.split(':').pop() }}</span>
                    </div>
                </div>

                <div v-else class="empty-state">
                    <Icon icon="ep:folder-opened" class="empty-icon" />
                    <p>未找到相关图标</p>
                </div>
            </el-scrollbar>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ensureIconCollectionByPrefix, loadIconNamesByPrefix } from '@/utils/iconify'

type IconPrefix = 'all' | 'ep' | 'mdi' | 'material-symbols' | 'simple-icons'
type LoadedIconMap = Record<Exclude<IconPrefix, 'all'>, string[]>
type ScrollbarExpose = {
    setScrollTop?: (value: number) => void
    wrapRef?: HTMLElement | null
}

const props = defineProps({
    activeIcon: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['selected'])

const searchText = ref('')
const activePrefix = ref<IconPrefix>('ep')
const scrollbarRef = ref<ScrollbarExpose | null>(null)
const supportedPrefixes: Array<Exclude<IconPrefix, 'all'>> = ['ep', 'mdi', 'material-symbols', 'simple-icons']
const loadedIcons = ref<LoadedIconMap>({
    ep: [],
    mdi: [],
    'material-symbols': [],
    'simple-icons': []
})
const filteredIcons = ref<string[]>([])
const pageSize = 200
const displayIcons = ref<string[]>([])

const currentIcons = computed(() => {
    if (activePrefix.value === 'all') {
        return supportedPrefixes.flatMap(prefix => loadedIcons.value[prefix] || [])
    }
    return loadedIcons.value[activePrefix.value] || []
})

async function ensurePrefixLoaded(prefix: Exclude<IconPrefix, 'all'>) {
    if (loadedIcons.value[prefix]?.length) return
    await ensureIconCollectionByPrefix(prefix)
    const names = await loadIconNamesByPrefix(prefix)
    loadedIcons.value[prefix] = names.map(name => `${prefix}:${name}`)
}

async function ensureActivePrefixLoaded(prefix: IconPrefix) {
    if (prefix === 'all') {
        await Promise.all(supportedPrefixes.map(ensurePrefixLoaded))
        return
    }
    await ensurePrefixLoaded(prefix)
}

function filterIcons() {
    const text = searchText.value.toLowerCase().trim()
    filteredIcons.value = currentIcons.value.filter(icon => icon.toLowerCase().includes(text))
    resetPagination()
}

function resetPagination() {
    displayIcons.value = filteredIcons.value.slice(0, pageSize)
    scrollbarRef.value?.setScrollTop?.(0)
}

function loadMore() {
    if (displayIcons.value.length >= filteredIcons.value.length) return
    const nextPage = filteredIcons.value.slice(displayIcons.value.length, displayIcons.value.length + pageSize)
    displayIcons.value.push(...nextPage)
}

function handleSelect(icon: string) {
    emit('selected', icon)
}

function onScroll(scrollTop: number) {
    const wrap = scrollbarRef.value?.wrapRef
    if (!wrap) return
    const threshold = 50
    if (scrollTop + wrap.clientHeight >= wrap.scrollHeight - threshold) {
        loadMore()
    }
}

watch(activePrefix, () => {
    void ensureActivePrefixLoaded(activePrefix.value).then(() => {
        filterIcons()
    })
})

onMounted(() => {
    void ensureActivePrefixLoaded(activePrefix.value).then(() => {
        filterIcons()
    })
    if (scrollbarRef.value?.wrapRef) {
        scrollbarRef.value.wrapRef.addEventListener('scroll', event => {
            onScroll((event.target as HTMLElement).scrollTop)
        })
    }
})

defineExpose({
    reset() {
        searchText.value = ''
        activePrefix.value = 'ep'
        void ensureActivePrefixLoaded(activePrefix.value).then(() => {
            filterIcons()
        })
    }
})
</script>

<style lang="scss" scoped>
.icon-body {
    width: 100%;
    padding: 10px;
    display: flex;
    flex-direction: column;
    height: 480px;

    .icon-search {
        margin-bottom: 10px;

        :deep(.el-input__wrapper) {
            border-radius: 4px;
        }

        .search-icon {
            color: var(--el-text-color-placeholder);
        }
    }

    .icon-tabs {
        margin-bottom: 10px;

        :deep(.el-tabs__nav-wrap::after) {
            height: 1px;
            background-color: var(--el-border-color-lighter);
        }

        :deep(.el-tabs__item) {
            height: 32px;
            line-height: 32px;
            font-size: 13px;
            padding: 0 12px;
        }
    }

    .icon-list-wrapper {
        flex: 1;
        overflow: hidden;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 4px;
        background-color: var(--el-bg-color);

        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 1px;
            background-color: var(--el-border-color-lighter);
            padding: 1px;
        }

        .icon-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 80px;
            background-color: var(--el-bg-color);
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
            padding: 0 8px;

            &:hover {
                background-color: var(--el-fill-color-light);
                z-index: 1;
                box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);

                .icon-svg {
                    transform: scale(1.2);
                }
            }

            &.active {
                background-color: var(--el-color-primary-light-9);
                color: var(--el-color-primary);
                box-shadow: inset 0 0 0 1px var(--el-color-primary);
            }

            .icon-svg {
                font-size: 24px;
                margin-bottom: 8px;
                transition: transform 0.2s;
                flex-shrink: 0;
            }

            .icon-name {
                font-size: 12px;
                color: var(--el-text-color-regular);
                width: 100%;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: 1.2;
            }
        }

        .empty-state {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-secondary);
            min-height: 200px;

            .empty-icon {
                font-size: 48px;
                margin-bottom: 12px;
                opacity: 0.5;
            }

            p {
                font-size: 14px;
            }
        }
    }
}
</style>
