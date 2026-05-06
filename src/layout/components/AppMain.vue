<template>
    <section class="app-main">
        <router-view v-slot="{ Component, route: viewRoute }">
            <transition name="app-route-fade">
                <keep-alive :include="cachedViews">
                    <component v-if="Component && !viewRoute.meta.link" :is="Component" :key="resolveRouteKey(viewRoute)" class="app-route-view" />
                </keep-alive>
            </transition>
        </router-view>
        <iframe-toggle />
        <copyright />
    </section>
</template>

<script setup>
defineOptions({ name: 'LayoutComponentsAppMain' })
import { computed, watch } from 'vue'
import copyright from './Copyright/index'
import iframeToggle from './IframeToggle/index'
import useTagsViewStore from '@/store/modules/tagsView'

const route = useRoute()
const tagsViewStore = useTagsViewStore()

const cachedViews = computed(() => tagsViewStore.cachedViews)

watch(
    () => route.fullPath,
    () => {
        addIframe()
    },
    { immediate: true }
)

function resolveRouteKey(viewRoute) {
    return viewRoute.path || viewRoute.name || viewRoute.fullPath
}

function addIframe() {
    if (route.meta.link) {
        tagsViewStore.addIframeView(route)
    }
}
</script>

<style scoped lang="scss">
.app-main {
    position: relative;
    min-height: calc(100vh - var(--app-header-height, 0px));
    overflow-x: hidden;
    background: var(--el-bg-color-page);
}

:deep(.app-route-view) {
    width: 100%;
    min-height: calc(100vh - var(--app-header-height, 0px));
}

.app-route-fade-enter-active,
.app-route-fade-leave-active {
    transition:
        opacity 0.16s ease,
        filter 0.16s ease;
    will-change: opacity, filter;
}

.app-route-fade-enter-from {
    opacity: 0;
    filter: saturate(0.96);
}

.app-route-fade-leave-to {
    opacity: 0;
    filter: saturate(0.96);
}

.app-route-fade-leave-active {
    position: absolute;
    inset: 0;
    width: 100%;
    pointer-events: none;
    z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
    .app-route-fade-enter-active,
    .app-route-fade-leave-active {
        transition: none;
    }
}
</style>
