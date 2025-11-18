<template>
    <div class="icon-dialog">
        <el-dialog v-model="value" width="980px" :close-on-click-modal="false" :modal-append-to-body="false" @open="onOpen" @close="onClose">
            <template #header>
                选择图标
                <div class="header-tools">
                    <!-- 图标集合切换：ep / mdi / simple-icons -->
                    <el-segmented v-model="activeSet" :options="setTabs" size="small" />

                    <!-- 搜索框：Iconify 前缀 + 防抖 -->
                    <el-input v-model="keyword" size="small" style="width: 260px" placeholder="输入关键字过滤(如 user / home ...)" clearable>
                        <template #prefix>
                            <Icon icon="ep:search" class="search-prefix-icon" />
                        </template>
                    </el-input>
                </div>
            </template>

            <!-- 加载中骨架屏 -->
            <el-skeleton v-if="loading" :rows="4" animated style="padding: 16px 20px" />

            <template v-else>
                <!-- 可滚动区域 + 懒加载 -->
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

                <!-- 大集合提示 -->
                <div v-if="!loading && filteredIcons.length > HARD_MAX" class="limit-tip">
                    当前共 {{ filteredIcons.length }} 个图标，仅懒加载展示前 {{ HARD_MAX }} 个，建议继续输入关键字缩小范围。
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const emit = defineEmits(['select'])
const value = defineModel() // v-model: 是否显示图标弹窗

// 搜索关键字 & 防抖关键字
const keyword = ref('')
const debouncedKeyword = ref('')
let keywordTimer = null

const active = ref('')

// 三套图标集合：ep / mdi / simple-icons
const setTabs = [
    { label: 'ElementPlus(ep)', value: 'ep' },
    { label: 'Material(mdi)', value: 'mdi' },
    { label: 'Simple(simple-icons)', value: 'simple-icons' }
]
const activeSet = ref('ep')

// 原始图标名集合：{ ep: string[], mdi: string[], 'simple-icons': string[] }
const originMap = ref({
    ep: [],
    mdi: [],
    'simple-icons': []
})

// 每个集合是否已经懒加载过
const loadedMap = ref({
    ep: false,
    mdi: false,
    'simple-icons': false
})

const loading = ref(false)

// 懒加载参数
const BATCH_SIZE = 200 // 每次追加 200 个
const HARD_MAX = 1500 // 单集合最多展示 1500 个，避免一次性几千个卡爆
const visibleCount = ref(BATCH_SIZE)

const scrollRef = ref(null)

// 当前集合的原始列表
const currentList = computed(() => originMap.value[activeSet.value] || [])

// 按关键字过滤后的完整列表
const filteredIcons = computed(() => {
    const list = currentList.value
    const k = debouncedKeyword.value.trim().toLowerCase()
    if (!k) return list
    return list.filter(n => n.toLowerCase().includes(k))
})

// 实际渲染的列表（懒加载 + 上限）
const displayIcons = computed(() => {
    const max = Math.min(visibleCount.value, HARD_MAX)
    return filteredIcons.value.slice(0, max)
})

// 组合完整 Iconify 名
const fullName = name => `${activeSet.value}:${name}`

function onOpen() {
    // 打开时确保当前集合已加载
    ensureIconsLoaded(activeSet.value)
    // 重置滚动位置
    nextTick(() => {
        const el = scrollRef.value
        if (el) el.scrollTop = 0
    })
}

function resetAllState() {
    // 清空关键字（搜索框）
    keyword.value = ''
    debouncedKeyword.value = ''
    if (keywordTimer) clearTimeout(keywordTimer)

    // 清空选中项
    active.value = ''

    // 重置懒加载数量
    visibleCount.value = BATCH_SIZE

    // 重置滚动条
    nextTick(() => {
        const el = scrollRef.value
        if (el) el.scrollTop = 0
    })
}

function onClose() {
    resetAllState()
}

// 选择图标
function onSelect(name) {
    const full = fullName(name)
    active.value = full
    emit('select', full)
    value.value = false
}

// 懒加载某个集合
async function ensureIconsLoaded(setKey) {
    if (loadedMap.value[setKey]) return

    loading.value = true
    try {
        if (setKey === 'ep') {
            const epMod = await import('@iconify-json/ep/icons.json')
            const epNames = Object.keys(epMod.default?.icons || {})
            originMap.value.ep = epNames
        } else if (setKey === 'mdi') {
            const mdiMod = await import('@iconify-json/mdi/icons.json')
            const mdiNames = Object.keys(mdiMod.default?.icons || {})
            originMap.value.mdi = mdiNames
        } else if (setKey === 'simple-icons') {
            const siMod = await import('@iconify-json/simple-icons/icons.json')
            const siNames = Object.keys(siMod.default?.icons || {})
            originMap.value['simple-icons'] = siNames
        }
        loadedMap.value[setKey] = true
    } catch (e) {
        // ep 兜底：用 element-plus 组件名兜底
        if (setKey === 'ep') {
            const names = Object.keys(ElementPlusIconsVue || {}).map(k => k)
            const trans = names.map(n => n.replace(/[A-Z]/g, (m, idx) => (idx ? '-' : '') + m.toLowerCase()))
            originMap.value.ep = Array.from(new Set(trans))
            loadedMap.value.ep = true
        } else {
            originMap.value[setKey] = []
            loadedMap.value[setKey] = true
        }
    } finally {
        loading.value = false
        visibleCount.value = BATCH_SIZE
    }
}

// 初始加载 ep
onMounted(() => {
    ensureIconsLoaded(activeSet.value)
})

// 集合切换：清空搜索 + 重置懒加载 + 加载新集合
watch(activeSet, newSet => {
    active.value = ''
    keyword.value = ''
    debouncedKeyword.value = ''
    visibleCount.value = BATCH_SIZE
    ensureIconsLoaded(newSet)
    nextTick(() => {
        const el = scrollRef.value
        if (el) el.scrollTop = 0
    })
})

// 搜索防抖：200ms 才更新一次 debouncedKeyword
watch(
    keyword,
    val => {
        if (keywordTimer) clearTimeout(keywordTimer)
        keywordTimer = setTimeout(() => {
            debouncedKeyword.value = val
            // 搜索条件变了，重新从第一批开始加载
            visibleCount.value = BATCH_SIZE
            nextTick(() => {
                const el = scrollRef.value
                if (el) el.scrollTop = 0
            })
        }, 200)
    },
    { flush: 'post' }
)

// 滚动懒加载：快到底部时，多加载一批
function onScroll(e) {
    const el = e.target
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const limit = Math.min(filteredIcons.value.length, HARD_MAX)
    // 距离底部 < 80px 且还有未展示的，就加一批
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
