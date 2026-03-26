<template>
    <el-scrollbar ref="scrollContainerRef" :vertical="false" class="scroll-container" @wheel.prevent="handleScroll">
        <slot />
    </el-scrollbar>
</template>

<script setup name="LayoutComponentsTagsViewScrollPane">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import useTagsViewStore from '@/store/modules/tagsView'

const tagAndTagSpacing = ref(4)
const scrollContainerRef = ref(null)

const scrollWrapper = computed(() => {
    const container = scrollContainerRef.value
    return container?.wrapRef || container?.$refs?.wrapRef || null
})

const emits = defineEmits(['scroll'])

const emitScroll = () => {
    emits('scroll')
}

onMounted(() => {
    scrollWrapper.value?.addEventListener?.('scroll', emitScroll, true)
})

onBeforeUnmount(() => {
    scrollWrapper.value?.removeEventListener?.('scroll', emitScroll)
})

function handleScroll(e) {
    const $scrollWrapper = scrollWrapper.value
    if (!$scrollWrapper) return
    const eventDelta = e.deltaX || e.wheelDelta || -e.deltaY * 40
    $scrollWrapper.scrollLeft = $scrollWrapper.scrollLeft + eventDelta / 4
}

function scrollBy(distance) {
    const $scrollWrapper = scrollWrapper.value
    if (!$scrollWrapper) return
    const nextLeft = $scrollWrapper.scrollLeft + distance
    if (typeof $scrollWrapper.scrollTo === 'function') {
        $scrollWrapper.scrollTo({
            left: nextLeft,
            behavior: 'smooth'
        })
        return
    }
    $scrollWrapper.scrollLeft = nextLeft
}

function getScrollState() {
    const $scrollWrapper = scrollWrapper.value
    if (!$scrollWrapper) {
        return {
            scrollLeft: 0,
            scrollWidth: 0,
            containerWidth: 0
        }
    }
    return {
        scrollLeft: $scrollWrapper.scrollLeft,
        scrollWidth: $scrollWrapper.scrollWidth,
        containerWidth: $scrollWrapper.clientWidth
    }
}

const tagsViewStore = useTagsViewStore()
const visitedViews = computed(() => tagsViewStore.visitedViews)

function moveToTarget(currentTag) {
    const $container = scrollContainerRef.value?.$el
    if (!$container || !scrollWrapper.value) return
    const $containerWidth = $container.offsetWidth
    const $scrollWrapper = scrollWrapper.value

    let firstTag = null
    let lastTag = null

    if (visitedViews.value.length > 0) {
        firstTag = visitedViews.value[0]
        lastTag = visitedViews.value[visitedViews.value.length - 1]
    }

    if (firstTag === currentTag) {
        $scrollWrapper.scrollLeft = 0
    } else if (lastTag === currentTag) {
        $scrollWrapper.scrollLeft = $scrollWrapper.scrollWidth - $containerWidth
    } else {
        const tagListDom = document.getElementsByClassName('tags-view-item')
        const currentIndex = visitedViews.value.findIndex(item => item === currentTag)
        if (currentIndex <= 0 || currentIndex >= visitedViews.value.length - 1) return

        let prevTag = null
        let nextTag = null

        for (const k in tagListDom) {
            if (k !== 'length' && Object.hasOwnProperty.call(tagListDom, k)) {
                if (tagListDom[k].dataset.path === visitedViews.value[currentIndex - 1].path) {
                    prevTag = tagListDom[k]
                }
                if (tagListDom[k].dataset.path === visitedViews.value[currentIndex + 1].path) {
                    nextTag = tagListDom[k]
                }
            }
        }
        if (!prevTag || !nextTag) return

        const afterNextTagOffsetLeft = nextTag.offsetLeft + nextTag.offsetWidth + tagAndTagSpacing.value
        const beforePrevTagOffsetLeft = prevTag.offsetLeft - tagAndTagSpacing.value

        if (afterNextTagOffsetLeft > $scrollWrapper.scrollLeft + $containerWidth) {
            $scrollWrapper.scrollLeft = afterNextTagOffsetLeft - $containerWidth
        } else if (beforePrevTagOffsetLeft < $scrollWrapper.scrollLeft) {
            $scrollWrapper.scrollLeft = beforePrevTagOffsetLeft
        }
    }
}

defineExpose({
    moveToTarget,
    scrollBy,
    getScrollState
})
</script>

<style lang="scss" scoped>
.scroll-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    background-color: var(--el-bg-color);
    box-shadow: inset 0 -1px 0 var(--el-border-color-light);

    :deep(.el-scrollbar__wrap) {
        height: 44px;
        display: flex;
        align-items: center;
    }

    :deep(.el-scrollbar__view) {
        display: inline-flex;
        align-items: center;
        height: 100%;
        padding: 0 12px;
        gap: 6px;
    }

    :deep(.el-scrollbar__bar.is-horizontal) {
        height: 3px;
        bottom: 0;
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: transparent;

        .el-scrollbar__thumb {
            background-color: var(--el-border-color-dark);
            border-radius: 3px;

            &:hover {
                background-color: var(--el-text-color-secondary);
            }
        }
    }

    &:hover :deep(.el-scrollbar__bar.is-horizontal) {
        opacity: 1;
    }
}

:global(html.dark) .scroll-container {
    background-color: var(--el-bg-color-overlay);
    box-shadow: inset 0 -1px 0 var(--el-border-color-darker);
}
</style>
