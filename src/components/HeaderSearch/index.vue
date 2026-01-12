<template>
    <div @click.stop="click">
        <Icon icon="ep:search" />

        <el-dialog v-model="show" width="600" @close="close" :show-close="false" append-to-body>
            <el-input
                v-model="search"
                ref="headerSearchSelectRef"
                size="large"
                placeholder="菜单搜索,支持标题、URL模糊查询"
                clearable
                @input="querySearch"
                @keyup.enter="selectActiveResult"
                @keydown.up.prevent="navigateResult('up')"
                @keydown.down.prevent="navigateResult('down')"
            >
                <template #prefix>
                    <Icon icon="ep:search" class="input-prefix-icon" />
                </template>
            </el-input>

            <div class="result-wrap">
                <el-scrollbar>
                    <div
                        class="search-item"
                        tabindex="1"
                        v-for="(item, index) in options"
                        :key="item.path"
                        :style="activeStyle(index)"
                        @mouseenter="activeIndex = index"
                        @mouseleave="activeIndex = -1"
                        @click="change(item)"
                    >
                        <div class="left">
                            <Icon v-if="item.icon" :icon="item.icon" class="menu-icon" />
                            <Icon v-else icon="ep:menu" class="menu-icon" />
                        </div>
                        <div class="search-info">
                            <div class="menu-title">
                                {{ item.title.join(' / ') }}
                            </div>
                            <div class="menu-path">
                                {{ item.path }}
                            </div>
                        </div>
                        <Icon icon="ep:right" class="enter-icon" v-show="index === activeIndex" />
                    </div>
                </el-scrollbar>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import Fuse from 'fuse.js'
import { getNormalPath } from '@/utils/ruoyi'
import { isHttp } from '@/utils/validate'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const search = ref('')
const options = ref([])
const searchPool = ref([])
const activeIndex = ref(-1)
const show = ref(false)
const fuse = ref(undefined)
const headerSearchSelectRef = ref(null)
const router = useRouter()
const theme = computed(() => useSettingsStore().theme)
const routes = computed(() => usePermissionStore().defaultRoutes)

function click() {
    show.value = !show.value
    if (show.value) {
        options.value = searchPool.value
        nextTick(() => {
            headerSearchSelectRef.value && headerSearchSelectRef.value.focus()
        })
    }
}

function close() {
    headerSearchSelectRef.value && headerSearchSelectRef.value.blur()
    options.value = []
    show.value = false
    activeIndex.value = -1
}

function change(val) {
    const path = val.path
    const query = val.query
    if (isHttp(path)) {
        const pindex = path.indexOf('http')
        window.open(path.substr(pindex, path.length), '_blank')
    } else {
        if (query) {
            router.push({ path: path, query: JSON.parse(query) })
        } else {
            router.push(path)
        }
    }

    search.value = ''
    options.value = []
    nextTick(() => {
        show.value = false
    })
}

function initFuse(list) {
    fuse.value = new Fuse(list, {
        shouldSort: true,
        threshold: 0.4,
        location: 0,
        distance: 100,
        minMatchCharLength: 1,
        keys: [
            {
                name: 'title',
                weight: 0.7
            },
            {
                name: 'path',
                weight: 0.3
            }
        ]
    })
}

function generateRoutes(routes, basePath = '', prefixTitle = []) {
    let res = []

    for (const r of routes) {
        if (r.hidden) {
            continue
        }
        const p = r.path.length > 0 && r.path[0] === '/' ? r.path : '/' + r.path
        const data = {
            path: !isHttp(r.path) ? getNormalPath(basePath + p) : r.path,
            title: [...prefixTitle],
            icon: ''
        }

        if (r.meta && r.meta.title) {
            data.title = [...data.title, r.meta.title]
            data.icon = r.meta.icon
            if (r.redirect !== 'noRedirect') {
                res.push(data)
            }
        }
        if (r.query) {
            data.query = r.query
        }

        if (r.children) {
            const tempRoutes = generateRoutes(r.children, data.path, data.title)
            if (tempRoutes.length >= 1) {
                res = [...res, ...tempRoutes]
            }
        }
    }
    return res
}

function querySearch(query) {
    activeIndex.value = -1
    if (query !== '') {
        options.value = fuse.value.search(query).map(item => item.item) ?? searchPool.value
    } else {
        options.value = searchPool.value
    }
}

function activeStyle(index) {
    if (index !== activeIndex.value) return {}
    return {
        'background-color': theme.value,
        color: '#fff'
    }
}

function navigateResult(direction) {
    if (direction === 'up') {
        activeIndex.value = activeIndex.value <= 0 ? options.value.length - 1 : activeIndex.value - 1
    } else if (direction === 'down') {
        activeIndex.value = activeIndex.value >= options.value.length - 1 ? 0 : activeIndex.value + 1
    }
}

function selectActiveResult() {
    if (options.value.length > 0 && activeIndex.value >= 0) {
        change(options.value[activeIndex.value])
    }
}

onMounted(() => {
    searchPool.value = generateRoutes(routes.value)
})

watch(searchPool, list => {
    initFuse(list)
})
</script>

<style lang="scss" scoped>
.result-wrap {
    height: 300px;
    margin-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);

    .search-item {
        display: flex;
        height: 56px;
        align-items: center;
        padding: 0 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--el-border-color-lighter);
        transition: all 0.2s;

        .left {
            width: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;

            .menu-icon {
                font-size: 20px;
                color: var(--el-text-color-secondary);
            }
        }

        .search-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;

            .menu-title {
                font-size: 14px;
                line-height: 20px;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .menu-path {
                font-size: 12px;
                line-height: 18px;
                color: var(--el-text-color-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }

        .enter-icon {
            font-size: 16px;
            margin-left: 8px;
        }

        &:hover {
            background-color: var(--el-fill-color-light);
        }
    }
}
</style>
