<template>
    <section class="app-main">
        <router-view v-slot="{ Component, route: viewRoute }">
            <transition name="fade-transform">
                <keep-alive :include="cachedViews">
                    <component v-if="Component && !viewRoute.meta.link" :is="Component" :key="resolveRouteKey(viewRoute)" />
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
