<template>
    <el-scrollbar ref="scrollContainerRef" :vertical="false" class="scroll-container" @wheel.prevent="handleScroll">
        <slot />
    </el-scrollbar>
</template>

<script setup>
import useTagsViewStore from '@/store/modules/tagsView'

const tagAndTagSpacing = ref(4)
const scrollContainerRef = ref(null)

const scrollWrapper = computed(() => {
    const container = scrollContainerRef.value
    return container?.wrapRef || container?.$refs?.wrapRef || null
})

onMounted(() => {
    scrollWrapper.value?.addEventListener?.('scroll', emitScroll, true)
})

onBeforeUnmount(() => {
    scrollWrapper.value?.removeEventListener?.('scroll', emitScroll)
})

function handleScroll(e) {
    const $scrollWrapper = scrollWrapper.value
    if (!$scrollWrapper) return
    const eventDelta = e.wheelDelta || -e.deltaY * 40
    $scrollWrapper.scrollLeft = $scrollWrapper.scrollLeft + eventDelta / 4
}

const emits = defineEmits()
const emitScroll = () => {
    emits('scroll')
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

    // find first tag and last tag
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

        // the tag's offsetLeft after of nextTag
        const afterNextTagOffsetLeft = nextTag.offsetLeft + nextTag.offsetWidth + tagAndTagSpacing.value

        // the tag's offsetLeft before of prevTag
        const beforePrevTagOffsetLeft = prevTag.offsetLeft - tagAndTagSpacing.value
        if (afterNextTagOffsetLeft > $scrollWrapper.scrollLeft + $containerWidth) {
            $scrollWrapper.scrollLeft = afterNextTagOffsetLeft - $containerWidth
        } else if (beforePrevTagOffsetLeft < $scrollWrapper.scrollLeft) {
            $scrollWrapper.scrollLeft = beforePrevTagOffsetLeft
        }
    }
}

defineExpose({
    moveToTarget
})
</script>

<style lang="scss" scoped>
.scroll-container {
    white-space: nowrap;
    position: relative;
    overflow: hidden;
    width: 100%;
    :deep(.el-scrollbar__bar) {
        bottom: 0px;
    }
    :deep(.el-scrollbar__wrap) {
        height: 39px;
    }
}
</style>
