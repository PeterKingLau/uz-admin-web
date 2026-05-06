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
                :style="activeStyle(tag)"
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
const TAG_SCROLL_STEP = 220

const { proxy } = getCurrentInstance()
const route = useRoute()
const router = useRouter()

const visitedViews = computed(() => useTagsViewStore().visitedViews)
const routes = computed(() => usePermissionStore().routes)
const theme = computed(() => useSettingsStore().theme)
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
})

function isActive(r) {
    return r.path === route.path
}

function activeStyle(tag) {
    if (!isActive(tag)) return {}
    return {
        'background-color': `var(--el-color-primary-light-9)`,
        color: `var(--el-color-primary)`,
        'border-color': `var(--el-color-primary-light-5)`
    }
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
    window.setTimeout(() => {
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
    align-items: center;
    gap: 0;
    height: 44px;
    width: 100%;
    padding: 6px 8px 0;
    background: var(--el-fill-color-lighter);
    box-shadow: inset 0 -1px 0 var(--el-border-color-lighter);

    .scroll-nav {
        width: 30px;
        height: 30px;
        margin-bottom: 6px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--el-text-color-regular);
        cursor: pointer;
        transition:
            background-color var(--app-motion-fast),
            border-color var(--app-motion-fast),
            color var(--app-motion-fast),
            opacity var(--app-motion-fast);

        &:hover:not(.disabled) {
            color: var(--el-color-primary);
            background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
        }

        &.disabled,
        &:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }
    }

    .tags-view-wrapper {
        flex: 1;
        min-width: 0;
        height: 38px;

        .tags-view-item {
            display: inline-flex;
            align-items: center;
            position: relative;
            cursor: pointer;
            height: 38px;
            line-height: 38px;
            min-width: 112px;
            max-width: 210px;
            border: 0;
            color: var(--el-text-color-regular);
            background: transparent;
            padding: 0 10px 0 14px;
            font-size: 13px;
            border-radius: 10px 10px 0 0;
            transition:
                background-color var(--app-motion-fast),
                color var(--app-motion-fast);

            &::after {
                content: '';
                position: absolute;
                right: -1px;
                top: 9px;
                width: 1px;
                height: 20px;
                background: var(--el-border-color);
                opacity: 0.75;
            }

            &:hover {
                color: var(--el-text-color-primary);
                background: color-mix(in srgb, var(--el-bg-color) 72%, transparent);

                &::after {
                    opacity: 0;
                }
            }

            &.active {
                z-index: 2;
                background-color: var(--el-bg-color);
                color: var(--el-text-color-primary);
                font-weight: 600;
                box-shadow:
                    0 -1px 0 var(--el-border-color-lighter),
                    1px 0 0 var(--el-border-color-lighter),
                    -1px 0 0 var(--el-border-color-lighter);

                &::before {
                    content: none;
                }

                &::after {
                    opacity: 0;
                }
            }

            .tag-icon {
                margin-right: 6px;
                font-size: 14px;
                flex-shrink: 0;
            }

            .tag-title {
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .close-icon-wrapper {
                margin-left: auto;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                flex-shrink: 0;
                color: var(--el-text-color-secondary);
                opacity: 0.72;
                line-height: 1;
                transition:
                    background-color var(--app-motion-fast),
                    color var(--app-motion-fast),
                    opacity var(--app-motion-fast);

                .el-icon-close {
                    display: block;
                    width: 10px;
                    height: 10px;
                    font-size: 10px;
                    stroke-width: 2.4;
                    background: transparent !important;
                    transition: color var(--app-motion-fast);

                    &:hover {
                        background: transparent !important;
                    }
                }

                &:hover {
                    opacity: 1;
                    background-color: color-mix(in srgb, var(--el-text-color-primary) 10%, transparent);
                    color: var(--el-text-color-primary);

                    .el-icon-close {
                        background: transparent !important;
                        color: var(--el-text-color-primary);
                    }
                }
            }

            &:not(:hover):not(.active) .close-icon-wrapper {
                opacity: 0;
            }

            &.active .close-icon-wrapper {
                opacity: 0.82;
            }
        }
    }

    .tags-view-item.active.has-icon::before {
        content: none !important;
    }

    .modern-contextmenu {
        margin: 0;
        background: var(--el-bg-color-overlay);
        z-index: 3000;
        position: absolute;
        list-style-type: none;
        padding: 6px 0;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 400;
        color: var(--el-text-color-regular);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--el-border-color-lighter);
        min-width: 120px;

        li {
            margin: 0;
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition:
                background-color var(--app-motion-fast),
                color var(--app-motion-fast);

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
    background: var(--el-fill-color-darker);
    box-shadow: inset 0 -1px 0 var(--el-border-color-darker);

    .scroll-nav {
        background: transparent;

        &:hover:not(.disabled) {
            background: color-mix(in srgb, var(--el-color-primary) 16%, transparent);
        }
    }

    .tags-view-wrapper .tags-view-item {
        background: transparent;

        &::after {
            background: var(--el-border-color-darker);
        }

        &:hover {
            background: color-mix(in srgb, var(--el-bg-color-overlay) 62%, transparent);
        }

        &.active {
            background-color: var(--el-bg-color);
            color: var(--el-text-color-primary);
            box-shadow:
                0 -1px 0 var(--el-border-color-darker),
                1px 0 0 var(--el-border-color-darker),
                -1px 0 0 var(--el-border-color-darker);
        }

        .close-icon-wrapper:hover {
            background-color: color-mix(in srgb, var(--el-color-white) 12%, transparent);
            color: var(--el-text-color-primary);
        }
    }

    .modern-contextmenu {
        background: var(--el-bg-color-overlay);
        border-color: var(--el-border-color-darker);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);

        li:hover {
            background: var(--el-fill-color-darker);
        }

        li.danger-item:hover {
            background: var(--el-color-danger-dark-2);
        }
    }
}
</style>
