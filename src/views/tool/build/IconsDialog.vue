<template>
    <div class="icon-dialog">
        <el-dialog v-model="value" width="980px" :close-on-click-modal="false" :modal-append-to-body="false" @open="onOpen" @close="onClose">
            <template #header>
                选择图标
                <div class="header-tools">
                    <el-segmented v-model="activeSet" :options="setTabs" size="small" />

                    <el-input v-model="keyword" size="small" style="width: 260px" placeholder="输入关键字过滤，如 user / home" clearable>
                        <template #prefix>
                            <Icon icon="ep:search" class="search-prefix-icon" />
                        </template>
                    </el-input>
                </div>
            </template>

            <el-skeleton v-if="loading" :rows="4" animated style="padding: 16px 20px" />

            <template v-else>
                <div v-if="displayIcons.length" class="icon-scroll" ref="scrollRef" @scroll="onScroll">
                    <ul class="icon-ul">
                        <li v-for="name in displayIcons" :key="name" :class="active === fullName(name) ? 'active-item' : ''" @click="onSelect(name)">
                            <div>
                                <Icon :icon="fullName(name)" width="30" height="30" />
                                <div class="icon-name">{{ fullName(name) }}</div>
                            </div>
                        </li>
                    </ul>
                </div>

                <el-empty v-if="!displayIcons.length && !loading" description="没有匹配的图标" />

                <div v-if="!loading && filteredIcons.length > HARD_MAX" class="limit-tip">
                    当前共有 {{ filteredIcons.length }} 个图标，仅懒加载展示前 {{ HARD_MAX }} 个，建议继续输入关键字缩小范围。
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsToolBuildIconsDialog' })
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { createIconStringMap, ensureIconCollectionByPrefix, iconCollectionTabs, loadIconNamesByPrefix, type IconCollectionPrefix } from '@/utils/iconify'

const emit = defineEmits(['select'])
const value = defineModel<boolean>()

const keyword = ref('')
const debouncedKeyword = ref('')
let keywordTimer: ReturnType<typeof setTimeout> | null = null

const active = ref('')
const setTabs = iconCollectionTabs.map(item => ({ label: `${item.label}(${item.value})`, value: item.value }))
const activeSet = ref<IconCollectionPrefix>('ep')
const originMap = ref<Record<IconCollectionPrefix, string[]>>(createIconStringMap(() => []))
const loadedMap = ref<Record<IconCollectionPrefix, boolean>>(createIconStringMap(() => false))

const loading = ref(false)
const BATCH_SIZE = 200
const HARD_MAX = 1500
const visibleCount = ref(BATCH_SIZE)
const scrollRef = ref<HTMLElement | null>(null)

const currentList = computed(() => originMap.value[activeSet.value] || [])
const filteredIcons = computed(() => {
    const list = currentList.value
    const normalizedKeyword = debouncedKeyword.value.trim().toLowerCase()
    if (!normalizedKeyword) return list
    return list.filter(name => name.toLowerCase().includes(normalizedKeyword))
})
const displayIcons = computed(() => {
    const max = Math.min(visibleCount.value, HARD_MAX)
    return filteredIcons.value.slice(0, max)
})

const fullName = (name: string) => `${activeSet.value}:${name}`

function resetScrollTop() {
    nextTick(() => {
        const element = scrollRef.value
        if (element) element.scrollTop = 0
    })
}

function onOpen() {
    void ensureIconsLoaded(activeSet.value)
    resetScrollTop()
}

function resetAllState() {
    keyword.value = ''
    debouncedKeyword.value = ''
    if (keywordTimer) clearTimeout(keywordTimer)
    active.value = ''
    visibleCount.value = BATCH_SIZE
    resetScrollTop()
}

function onClose() {
    resetAllState()
}

function onSelect(name: string) {
    const full = fullName(name)
    active.value = full
    emit('select', full)
    value.value = false
}

async function ensureIconsLoaded(setKey: IconCollectionPrefix) {
    if (loadedMap.value[setKey]) return

    loading.value = true
    try {
        await ensureIconCollectionByPrefix(setKey)
        originMap.value[setKey] = await loadIconNamesByPrefix(setKey)
        loadedMap.value[setKey] = true
    } catch {
        originMap.value[setKey] = []
        loadedMap.value[setKey] = true
    } finally {
        loading.value = false
        visibleCount.value = BATCH_SIZE
    }
}

onMounted(() => {
    void ensureIconsLoaded(activeSet.value)
})

watch(activeSet, newSet => {
    active.value = ''
    keyword.value = ''
    debouncedKeyword.value = ''
    visibleCount.value = BATCH_SIZE
    void ensureIconsLoaded(newSet)
    resetScrollTop()
})

watch(
    keyword,
    value => {
        if (keywordTimer) clearTimeout(keywordTimer)
        keywordTimer = setTimeout(() => {
            debouncedKeyword.value = value
            visibleCount.value = BATCH_SIZE
            resetScrollTop()
        }, 200)
    },
    { flush: 'post' }
)

function onScroll(event: Event) {
    const element = event.target as HTMLElement
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight
    const limit = Math.min(filteredIcons.value.length, HARD_MAX)
    if (distance < 80 && visibleCount.value < limit) {
        visibleCount.value = Math.min(visibleCount.value + BATCH_SIZE, limit)
    }
}
</script>

<style lang="scss" scoped>
.header-tools {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-left: 12px;
}

.search-prefix-icon {
    font-size: 16px;
    color: var(--el-text-color-placeholder);
}

.icon-scroll {
    max-height: 520px;
    overflow-y: auto;
    padding: 0 20px 10px 20px;
    box-sizing: border-box;
}

.icon-ul {
    margin: 0;
    padding: 0;
    font-size: 0;

    li {
        list-style: none;
        text-align: center;
        font-size: 12px;
        display: inline-flex;
        width: 16.66%;
        box-sizing: border-box;
        height: 108px;
        padding: 6px;
        cursor: pointer;
        overflow: hidden;
        align-items: center;
        justify-content: center;

        &:hover {
            background: #f2f2f2;
        }

        &.active-item {
            background: #e1f3fb;
            color: #7a6df0;
        }

        .icon-name {
            margin-top: 8px;
            word-break: break-all;
            padding: 0 6px;
            color: #666;
        }
    }
}

.limit-tip {
    padding: 6px 20px 12px;
    font-size: 12px;
    color: #999;
}

.icon-dialog {
    :deep() {
        .el-dialog {
            border-radius: 8px;
            margin-top: 4vh !important;
            display: flex;
            flex-direction: column;
            max-height: 92vh;
            overflow: hidden;
            box-sizing: border-box;

            .el-dialog__header {
                padding-top: 14px;
            }

            .el-dialog__body {
                margin: 0;
                padding: 0;
                overflow: hidden;
            }
        }
    }
}
</style>
