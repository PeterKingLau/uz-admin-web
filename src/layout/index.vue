<template>
    <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme }">
        <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />

        <sidebar v-if="!sidebar.hide" class="sidebar-container" />

        <div :class="{ hasTagsView: needTagsView, sidebarHide: sidebar.hide }" class="main-container">
            <div :class="{ 'fixed-header': fixedHeader }">
                <navbar @setLayout="setLayout" />
                <tags-view v-if="needTagsView" />
            </div>

            <app-main :style="contentStyle" />

            <settings ref="settingRef" />
        </div>
    </div>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { computed, watch, watchEffect, shallowRef } from 'vue'
import Sidebar from './components/Sidebar/index.vue'
import { AppMain, Navbar, Settings, TagsView } from './components'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const theme = computed(() => settingsStore.theme)
const sidebar = computed(() => appStore.sidebar)
const device = computed(() => appStore.device)
const needTagsView = computed(() => settingsStore.tagsView)
const fixedHeader = computed(() => settingsStore.fixedHeader)

const classObj = computed(() => ({
    hideSidebar: !sidebar.value.opened,
    openSidebar: sidebar.value.opened,
    withoutAnimation: sidebar.value.withoutAnimation,
    mobile: device.value === 'mobile'
}))

const { width } = useWindowSize()
const WIDTH = 992

const contentStyle = computed(() => {
    const height = fixedHeader.value ? (needTagsView.value ? '84px' : '50px') : '0px'
    const style = {
        '--app-header-height': height
    }
    if (!fixedHeader.value) return style
    return {
        ...style,
        paddingTop: height,
        transition: 'padding-top 0.28s'
    }
})

watch(
    () => device.value,
    () => {
        if (device.value === 'mobile' && sidebar.value.opened) {
            appStore.closeSideBar({ withoutAnimation: false })
        }
    }
)

watchEffect(() => {
    if (width.value - 1 < WIDTH) {
        appStore.toggleDevice('mobile')
        appStore.closeSideBar({ withoutAnimation: true })
    } else {
        appStore.toggleDevice('desktop')
    }
})

function handleClickOutside() {
    appStore.closeSideBar({ withoutAnimation: false })
}

// 改为 shallowRef
const settingRef = shallowRef(null)

function setLayout() {
    settingRef.value?.openSetting()
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/mixin.scss';
@import '@/assets/styles/variables.module.scss';

.app-wrapper {
    @include clearfix;
    position: relative;
    height: 100%;
    width: 100%;

    &.mobile.openSidebar {
        position: fixed;
        top: 0;
    }
}

.drawer-bg {
    background: #000;
    opacity: 0.3;
    width: 100%;
    top: 0;
    height: 100%;
    position: absolute;
    z-index: 999;
}

.fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    left: var(--sidebar-width);
    width: auto;

    transition: left 0.28s;
    background: var(--el-bg-color);
}

.hideSidebar .fixed-header {
    left: var(--sidebar-collapse-width);
}

.sidebarHide .fixed-header {
    left: 0;
}

.mobile .fixed-header {
    left: 0;
}
</style>
