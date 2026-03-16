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
import ScrollPane from './ScrollPane'
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
    gap: 6px;
    height: 44px;
    width: 100%;
    background: var(--el-bg-color);
    box-shadow: inset 0 -1px 0 var(--el-border-color-light);

    .scroll-nav {
        width: 28px;
        height: 28px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 999px;
        background: var(--el-fill-color-blank);
        color: var(--el-text-color-regular);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(.disabled) {
            color: var(--el-color-primary);
            border-color: var(--el-color-primary-light-5);
            background: var(--el-color-primary-light-9);
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

        .tags-view-item {
            display: inline-flex;
            align-items: center;
            position: relative;
            cursor: pointer;
            height: 30px;
            line-height: 30px;
            border: 1px solid var(--el-border-color-lighter);
            color: var(--el-text-color-regular);
            background: var(--el-fill-color-blank);
            padding: 0 12px;
            font-size: 13px;
            border-radius: 15px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &:hover {
                color: var(--el-color-primary);
                background: var(--el-color-primary-light-9);
                border-color: var(--el-color-primary-light-7);
            }

            &.active {
                background-color: var(--el-color-primary-light-9);
                color: var(--el-color-primary);
                border-color: var(--el-color-primary-light-5);
                font-weight: 500;

                &::before {
                    content: '';
                    background: var(--el-color-primary);
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    position: relative;
                    margin-right: 6px;
                    transition: all 0.3s;
                }
            }

            .tag-icon {
                margin-right: 6px;
                font-size: 14px;
            }

            .close-icon-wrapper {
                margin-left: 6px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                transition: all 0.3s;

                .el-icon-close {
                    font-size: 12px;
                    transition: all 0.3s;
                }

                &:hover {
                    background-color: var(--el-color-danger);
                    color: #fff;

                    .el-icon-close {
                        transform: scale(1.1);
                    }
                }
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
            transition: all 0.2s;

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
    background: var(--el-bg-color);
    box-shadow: inset 0 -1px 0 var(--el-border-color-darker);

    .scroll-nav {
        background: var(--el-fill-color-dark);
        border-color: var(--el-border-color-darker);

        &:hover:not(.disabled) {
            background: var(--el-fill-color-darker);
            border-color: var(--el-color-primary-dark-2);
        }
    }

    .tags-view-wrapper .tags-view-item {
        background: var(--el-fill-color-dark);
        border-color: var(--el-border-color-darker);

        &:hover {
            background: var(--el-fill-color-darker);
            border-color: var(--el-color-primary-dark-2);
        }

        &.active {
            background-color: var(--el-color-primary-dark-2);
            color: var(--el-color-primary-light-3);
            border-color: var(--el-color-primary);

            &::before {
                background: var(--el-color-primary-light-3);
            }
        }

        .close-icon-wrapper:hover {
            background-color: var(--el-color-danger);
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
