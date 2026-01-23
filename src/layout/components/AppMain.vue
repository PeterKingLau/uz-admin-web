<template>
    <section class="app-main">
        <router-view v-slot="{ Component, route: viewRoute }">
            <transition name="fade-transform" mode="out-in">
                <keep-alive :include="cachedViews">
                    <component v-if="Component && !viewRoute.meta.link" :is="Component" :key="viewRoute.fullPath" />
                </keep-alive>
            </transition>
        </router-view>
        <iframe-toggle />
        <copyright />
    </section>
</template>

<script setup>
import { computed } from 'vue'
import copyright from './Copyright/index'
import iframeToggle from './IframeToggle/index'
import useTagsViewStore from '@/store/modules/tagsView'

const route = useRoute()
const tagsViewStore = useTagsViewStore()

const cachedViews = computed(() => tagsViewStore.cachedViews)

onMounted(() => {
    addIframe()
})

watchEffect(() => {
    addIframe()
})

function addIframe() {
    if (route.meta.link) {
        tagsViewStore.addIframeView(route)
    }
}
</script>
