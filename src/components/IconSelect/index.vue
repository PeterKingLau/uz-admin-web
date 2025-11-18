<template>
    <div class="icon-body">
        <el-input v-model="iconName" class="icon-search" clearable placeholder="请输入图标名称" @clear="handleSearchChange" @input="handleSearchChange">
            <template #suffix>
                <i class="el-icon-search el-input__icon" />
            </template>
        </el-input>

        <div ref="listRef" class="icon-list" @scroll.passive="onScroll">
            <div class="list-container">
                <div v-for="(item, index) in visibleIcons" :key="item + index" class="icon-item-wrapper" @click="selectedIcon(item)">
                    <div :class="['icon-item', { active: activeIcon === item }]">
                        <svg-icon :icon-class="item" class-name="icon" style="height: 25px; width: 16px" />
                        <span>{{ item }}</span>
                    </div>
                </div>

                <div v-if="visibleIcons.length < filteredIcons.length" class="icon-loading-tip">下滑加载更多图标...</div>
                <div v-else-if="filteredIcons.length === 0" class="icon-empty-tip">没有匹配到图标</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import icons from './requireIcons'

const props = defineProps({
    activeIcon: {
        type: String
    }
})

const emit = defineEmits(['selected'])

/** 全量图标（一次性从 requireIcons 里拿） */
const allIcons = icons

/** 搜索关键字 */
const iconName = ref('')

/** 过滤后的结果（内存中的完整列表） */
const filteredIcons = ref(allIcons)

/** 实际渲染到页面上的一小部分（懒加载目标） */
const visibleIcons = ref([])

/** 懒加载分页配置 */
const pageSize = 120 // 一页多少个（你可以调大/调小）
const currentPage = ref(1)

/** 滚动容器 DOM */
const listRef = ref(null)

/** 初始化可见数据 */
function initVisible() {
    currentPage.value = 1
    visibleIcons.value = filteredIcons.value.slice(0, pageSize)
    // 滚动条复位到顶部
    nextTick(() => {
        if (listRef.value) {
            listRef.value.scrollTop = 0
        }
    })
}

/** 继续加载下一页 */
function loadMore() {
    const total = filteredIcons.value.length
    const loaded = visibleIcons.value.length
    if (loaded >= total) return

    currentPage.value += 1
    const next = filteredIcons.value.slice(0, currentPage.value * pageSize)
    visibleIcons.value = next
}

/** 滚动事件：靠近底部时加载更多 */
function onScroll(e) {
    const el = e.target
    if (!el) return
    const threshold = 20 // 距离底部 20px 以内触发加载
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
        loadMore()
    }
}

/** 根据搜索关键字过滤 + 重置分页 */
function doFilter() {
    const keyword = iconName.value.trim()
    if (!keyword) {
        filteredIcons.value = allIcons
    } else {
        const lower = keyword.toLowerCase()
        filteredIcons.value = allIcons.filter(item => item.toLowerCase().includes(lower))
    }
    initVisible()
}

/** 输入事件做一个简单防抖，避免每敲一个字就大规模 filter 卡顿 */
let searchTimer = null
function handleSearchChange() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        doFilter()
    }, 150)
}

/** 选中图标 */
function selectedIcon(name) {
    emit('selected', name)
    // 保留你原来的行为：点击后关闭 popover
    document.body.click()
}

/** 暴露给父组件，用于 dialog 打开时重置 */
function reset() {
    iconName.value = ''
    filteredIcons.value = allIcons
    initVisible()
}

defineExpose({
    reset
})

onMounted(() => {
    initVisible()
})
</script>

<style lang="scss" scoped>
.icon-body {
    width: 100%;
    padding: 10px;

    .icon-search {
        position: relative;
        margin-bottom: 5px;
    }

    .icon-list {
        height: 200px;
        overflow: auto;

        .list-container {
            display: flex;
            flex-wrap: wrap;

            .icon-item-wrapper {
                width: calc(100% / 3);
                height: 25px;
                line-height: 25px;
                cursor: pointer;
                display: flex;

                .icon-item {
                    display: flex;
                    max-width: 100%;
                    height: 100%;
                    padding: 0 5px;

                    &:hover {
                        background: #ececec;
                        border-radius: 5px;
                    }

                    .icon {
                        flex-shrink: 0;
                    }

                    span {
                        display: inline-block;
                        vertical-align: -0.15em;
                        fill: currentColor;
                        padding-left: 2px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }

                .icon-item.active {
                    background: #ececec;
                    border-radius: 5px;
                }
            }

            .icon-loading-tip,
            .icon-empty-tip {
                width: 100%;
                text-align: center;
                font-size: 12px;
                color: #999;
                padding: 4px 0;
            }
        }
    }
}
</style>
