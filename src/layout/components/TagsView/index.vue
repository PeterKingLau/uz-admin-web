<template>
    <div id="tags-view-container" class="tags-view-container">
        <button
            v-if="hasOverflow"
            type="button"
            class="scroll-nav prev"
            :class="{ disabled: !canScrollPrev }"
            :disabled="!canScrollPrev"
            @click.stop="scrollTabs('prev')"
            aria-label="向左滚动标签"
        >
            <Icon icon="ep:arrow-left-bold" />
        </button>
        <ScrollPane ref="scrollPaneRef" class="tags-view-wrapper" @scroll="handleScroll">
            <router-link
                v-for="tag in visitedViews"
                :key="tag.path"
                :data-path="tag.path"
                :class="{ active: isActive(tag), 'has-icon': tagsIcon }"
                :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
                class="tags-view-item"
                @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''"
                @contextmenu.prevent="openMenu(tag, $event)"
            >
                <Icon v-if="tagsIcon && tag.meta && tag.meta.icon && tag.meta.icon !== '#'" :icon="tag.meta.icon" class="tag-icon" />
                <span class="tag-title">{{ tag.title }}</span>
                <span v-if="!isAffix(tag)" @click.prevent.stop="closeSelectedTag(tag)" class="close-icon-wrapper">
                    <Icon icon="ep:close" class="el-icon-close" />
                </span>
            </router-link>
        </ScrollPane>
        <button
            v-if="hasOverflow"
            type="button"
            class="scroll-nav next"
            :class="{ disabled: !canScrollNext }"
            :disabled="!canScrollNext"
            @click.stop="scrollTabs('next')"
            aria-label="向右滚动标签"
        >
            <Icon icon="ep:arrow-right-bold" />
        </button>
        <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu modern-contextmenu">
            <li @click="refreshSelectedTag(selectedTag)"><Icon icon="ep:refresh-right" class="menu-icon" /> 刷新页面</li>
            <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)"><Icon icon="ep:close" class="menu-icon" /> 关闭当前</li>
            <li @click="closeOthersTags"><Icon icon="ep:circle-close" class="menu-icon" /> 关闭其他</li>
            <li v-if="!isFirstView()" @click="closeLeftTags"><Icon icon="ep:back" class="menu-icon" /> 关闭左侧</li>
            <li v-if="!isLastView()" @click="closeRightTags"><Icon icon="ep:right" class="menu-icon" /> 关闭右侧</li>
            <li @click="closeAllTags(selectedTag)" class="danger-item"><Icon icon="ep:circle-close-filled" class="menu-icon" /> 全部关闭</li>
        </ul>
    </div>
</template>

<script setup>
defineOptions({ name: 'LayoutComponentsTagsView' })
import ScrollPane from './ScrollPane.vue'
import { getNormalPath } from '@/utils/utils'
import useTagsViewStore from '@/store/modules/tagsView'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import { ref, watch, onMounted, onBeforeUnmount, computed, getCurrentInstance, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref({})
const affixTags = ref([])
const scrollPaneRef = ref(null)
const hasOverflow = ref(false)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)
let scrollStateTimer = null
const TAG_SCROLL_STEP = 220

const { proxy } = getCurrentInstance()
const route = useRoute()
const router = useRouter()

const visitedViews = computed(() => useTagsViewStore().visitedViews)
const routes = computed(() => usePermissionStore().routes)
const tagsIcon = computed(() => useSettingsStore().tagsIcon)

watch(route, () => {
    addTags()
    moveToCurrentTag()
})

watch(
    visitedViews,
    () => {
        nextTick(() => {
            updateScrollState()
        })
    },
    { deep: true }
)

watch(visible, value => {
    if (value) {
        document.body.addEventListener('click', closeMenu)
    } else {
        document.body.removeEventListener('click', closeMenu)
    }
})

onMounted(() => {
    initTags()
    addTags()
    nextTick(() => {
        updateScrollState()
    })
    window.addEventListener('resize', updateScrollState)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateScrollState)
    document.body.removeEventListener('click', closeMenu)
    if (scrollStateTimer) {
        clearTimeout(scrollStateTimer)
        scrollStateTimer = null
    }
})

function isActive(r) {
    return r.path === route.path
}

function isAffix(tag) {
    return tag.meta && tag.meta.affix
}

function isFirstView() {
    try {
        return selectedTag.value.fullPath === '/index' || selectedTag.value.fullPath === visitedViews.value[1].fullPath
    } catch (err) {
        return false
    }
}

function isLastView() {
    try {
        return selectedTag.value.fullPath === visitedViews.value[visitedViews.value.length - 1].fullPath
    } catch (err) {
        return false
    }
}

function filterAffixTags(routes, basePath = '') {
    let tags = []
    routes.forEach(route => {
        if (route.meta && route.meta.affix) {
            const tagPath = getNormalPath(basePath + '/' + route.path)
            tags.push({
                fullPath: tagPath,
                path: tagPath,
                name: route.name,
                meta: { ...route.meta }
            })
        }
        if (route.children) {
            const tempTags = filterAffixTags(route.children, route.path)
            if (tempTags.length >= 1) {
                tags = [...tags, ...tempTags]
            }
        }
    })
    return tags
}

function initTags() {
    const res = filterAffixTags(routes.value)
    affixTags.value = res
    for (const tag of res) {
        if (tag.name) {
            useTagsViewStore().addVisitedView(tag)
        }
    }
}

function addTags() {
    const { name } = route
    if (name) {
        useTagsViewStore().addView(route)
    }
}

function moveToCurrentTag() {
    nextTick(() => {
        for (const r of visitedViews.value) {
            if (r.path === route.path) {
                scrollPaneRef.value?.moveToTarget?.(r)
                if (r.fullPath !== route.fullPath) {
                    useTagsViewStore().updateVisitedView(route)
                }
                updateScrollState()
            }
        }
    })
}

function updateScrollState() {
    const state = scrollPaneRef.value?.getScrollState?.()
    if (!state) {
        hasOverflow.value = false
        canScrollPrev.value = false
        canScrollNext.value = false
        return
    }

    hasOverflow.value = state.scrollWidth > state.containerWidth + 2
    canScrollPrev.value = state.scrollLeft > 2
    canScrollNext.value = state.scrollLeft + state.containerWidth < state.scrollWidth - 2
}

function scrollTabs(direction) {
    const distance = direction === 'prev' ? -TAG_SCROLL_STEP : TAG_SCROLL_STEP
    scrollPaneRef.value?.scrollBy?.(distance)
    if (scrollStateTimer) clearTimeout(scrollStateTimer)
    scrollStateTimer = window.setTimeout(() => {
        scrollStateTimer = null
        updateScrollState()
    }, 220)
}

function refreshSelectedTag(view) {
    proxy.$tab.refreshPage(view)
    if (route.meta.link) {
        useTagsViewStore().delIframeView(route)
    }
}

function closeSelectedTag(view) {
    proxy.$tab.closePage(view).then(({ visitedViews }) => {
        if (isActive(view)) {
            toLastView(visitedViews, view)
        }
    })
}

function closeRightTags() {
    proxy.$tab.closeRightPage(selectedTag.value).then(visitedViews => {
        if (!visitedViews.find(i => i.fullPath === route.fullPath)) {
            toLastView(visitedViews)
        }
    })
}

function closeLeftTags() {
    proxy.$tab.closeLeftPage(selectedTag.value).then(visitedViews => {
        if (!visitedViews.find(i => i.fullPath === route.fullPath)) {
            toLastView(visitedViews)
        }
    })
}

function closeOthersTags() {
    router.push(selectedTag.value).catch(() => {})
    proxy.$tab.closeOtherPage(selectedTag.value).then(() => {
        moveToCurrentTag()
    })
}

function closeAllTags(view) {
    proxy.$tab.closeAllPage().then(({ visitedViews }) => {
        if (affixTags.value.some(tag => tag.path === route.path)) {
            return
        }
        toLastView(visitedViews, view)
    })
}

function toLastView(visitedViews, view) {
    const latestView = visitedViews.slice(-1)[0]
    if (latestView) {
        router.push(latestView.fullPath)
    } else {
        if (view.name === 'Dashboard') {
            router.replace({ path: '/redirect' + view.fullPath })
        } else {
            router.push('/')
        }
    }
}

function openMenu(tag, e) {
    const menuMinWidth = 120
    const offsetLeft = proxy.$el.getBoundingClientRect().left
    const offsetWidth = proxy.$el.offsetWidth
    const maxLeft = offsetWidth - menuMinWidth
    const l = e.clientX - offsetLeft + 15

    if (l > maxLeft) {
        left.value = maxLeft
    } else {
        left.value = l
    }

    top.value = e.clientY
    visible.value = true
    selectedTag.value = tag
}

function closeMenu() {
    visible.value = false
}

function handleScroll() {
    closeMenu()
    updateScrollState()
}
</script>

<style lang="scss" scoped>
.tags-view-container {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 44px;
    width: 100%;
    padding: 6px 8px 0;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-light);

    .scroll-nav {
        width: 32px;
        height: 32px;
        margin-bottom: 3px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--el-text-color-secondary);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

        &:hover:not(.disabled) {
            color: var(--el-color-primary);
            background: var(--el-fill-color);
        }

        &.disabled,
        &:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
    }

    .tags-view-wrapper {
        flex: 1;
        min-width: 0;
        height: 38px;
        display: flex;

        .tags-view-item {
            display: inline-flex;
            align-items: center;
            position: relative;
            cursor: pointer;
            height: 38px;
            line-height: 38px;
            min-width: 100px;
            max-width: 220px;
            border: 0;
            color: var(--el-text-color-regular);
            background: transparent;
            padding: 0 12px 0 16px;
            font-size: 13px;
            border-radius: 10px 10px 0 0;
            transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
            user-select: none;

            &::after {
                content: '';
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 1px;
                height: 16px;
                background: var(--el-border-color);
                opacity: 0.8;
                transition: opacity 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
            }

            &:last-child::after {
                display: none;
            }

            &:hover {
                color: var(--el-text-color-primary);
                background: var(--el-fill-color);

                &::after {
                    opacity: 0;
                }
            }

            &.active {
                z-index: 2;
                background-color: var(--el-bg-color);
                color: var(--el-color-primary);
                font-weight: 500;

                &::after {
                    opacity: 0;
                }
            }

            &.active + .tags-view-item::after,
            &:hover + .tags-view-item::after,
            &:has(+ .tags-view-item.active)::after,
            &:has(+ .tags-view-item:hover)::after {
                opacity: 0;
            }

            .tag-icon {
                margin-right: 6px;
                font-size: 14px;
                flex-shrink: 0;
            }

            .tag-title {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-right: 4px;
            }

            .close-icon-wrapper {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                margin-left: 2px;
                border-radius: 50%;
                flex-shrink: 0;
                color: var(--el-text-color-secondary);
                line-height: 1;
                transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

                .el-icon-close {
                    display: block;
                    width: 12px;
                    height: 12px;
                    font-size: 12px;
                    line-height: 1;
                    flex-shrink: 0;
                }

                :deep(svg) {
                    display: block;
                }

                &:hover {
                    background-color: var(--el-fill-color-dark);
                    color: var(--el-text-color-primary);
                }
            }

            &:not(:hover):not(.active) .close-icon-wrapper {
                opacity: 0;
                width: 0;
                margin-left: 0;
                pointer-events: none;
            }
        }
    }

    .modern-contextmenu {
        margin: 0;
        background: var(--el-bg-color-overlay);
        z-index: 3000;
        position: absolute;
        list-style-type: none;
        padding: 6px 0;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 400;
        color: var(--el-text-color-regular);
        box-shadow: var(--el-box-shadow-light);
        border: 1px solid var(--el-border-color-lighter);
        min-width: 130px;

        li {
            margin: 0;
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition:
                background-color 0.2s,
                color 0.2s;

            .menu-icon {
                font-size: 15px;
                color: var(--el-text-color-secondary);
                transition: color 0.2s;
            }

            &:hover {
                background: var(--el-fill-color-light);
                color: var(--el-color-primary);

                .menu-icon {
                    color: var(--el-color-primary);
                }
            }

            &.danger-item {
                &:hover {
                    background: var(--el-color-danger-light-9);
                    color: var(--el-color-danger);

                    .menu-icon {
                        color: var(--el-color-danger);
                    }
                }
            }
        }
    }
}

:global(html.dark) .tags-view-container {
    background: var(--el-bg-color-page);
    border-bottom: 1px solid var(--el-border-color-dark);

    .scroll-nav {
        &:hover:not(.disabled) {
            background: var(--el-fill-color-dark);
        }
    }

    .tags-view-wrapper .tags-view-item {
        &::after {
            background: var(--el-border-color-dark);
        }

        &:hover {
            background: var(--el-bg-color-overlay);
        }

        &.active {
            background-color: var(--el-bg-color);
        }

        .close-icon-wrapper:hover {
            background-color: var(--el-fill-color-darker);
        }
    }

    .modern-contextmenu {
        border-color: var(--el-border-color-darker);
        box-shadow: var(--el-box-shadow-dark);

        li:hover {
            background: var(--el-fill-color-darker);
        }

        li.danger-item:hover {
            background: var(--el-color-danger-dark-2);
        }
    }
}
</style>
