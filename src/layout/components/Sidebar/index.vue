<template>
    <div class="sidebar-container" :class="[{ 'has-logo': showLogo }, isCollapse ? 'sidebar--collapse' : 'sidebar--expand']">
        <logo v-if="showLogo" :collapse="isCollapse" />

        <el-scrollbar wrap-class="scrollbar-wrapper">
            <el-menu
                :default-active="activeMenu"
                :collapse="isCollapse"
                :background-color="getMenuBackground"
                :text-color="getMenuTextColor"
                :unique-opened="true"
                :active-text-color="theme"
                mode="vertical"
                :class="sideTheme"
                @select="handleMenuSelect"
            >
                <sidebar-item v-for="(route, index) in sidebarRouters" :key="route.path + index" :item="route" :base-path="route.path" />
            </el-menu>
        </el-scrollbar>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/assets/styles/variables.module.scss'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const sidebarRouters = computed(() => permissionStore.sidebarRouters)
const showLogo = computed(() => settingsStore.sidebarLogo)
const sideTheme = computed(() => settingsStore.sideTheme)
const theme = computed(() => settingsStore.theme)
const isCollapse = computed(() => !appStore.sidebar.opened)

const getMenuBackground = computed(() => {
    if (settingsStore.isDark) {
        return 'var(--sidebar-bg)'
    }
    return sideTheme.value === 'theme-dark' ? variables.menuBg : variables.menuLightBg
})

const getMenuTextColor = computed(() => {
    if (settingsStore.isDark) {
        return 'var(--sidebar-text)'
    }
    return sideTheme.value === 'theme-dark' ? variables.menuText : variables.menuLightText
})

const activeMenu = computed(() => {
    const { meta, path } = route
    if (meta.activeMenu) return meta.activeMenu
    return path
})

function handleMenuSelect() {
    const activeEl = document.activeElement
    if (activeEl && activeEl instanceof HTMLElement) {
        activeEl.blur()
    }
}
</script>

<style lang="scss" scoped>
$sidebar-expand-width: 210px;
$sidebar-collapse-width: 60px;

.sidebar-container {
    position: relative;
    height: 100%;
    background-color: v-bind(getMenuBackground);
    transition:
        width 0.2s ease-in-out,
        background-color 0.2s ease-in-out;
    overflow: hidden;

    &.sidebar--expand {
        width: $sidebar-expand-width;
    }

    &.sidebar--collapse {
        width: $sidebar-collapse-width;
    }

    .scrollbar-wrapper {
        background-color: v-bind(getMenuBackground);
    }

    .el-menu {
        border: none;
        height: 100%;
        width: 100% !important;
        transition:
            width 0.2s ease-in-out,
            background-color 0.2s ease-in-out;

        .el-menu-item,
        .el-sub-menu__title {
            &:hover {
                background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important;
            }
        }

        .el-menu-item {
            color: v-bind(getMenuTextColor);

            &.is-active {
                color: var(--menu-active-text, #409eff);
                background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important;
            }
        }

        .el-sub-menu__title {
            color: v-bind(getMenuTextColor);
        }
    }
}

:deep(.sidebar--collapse) {
    .el-sub-menu__title span,
    .el-menu-item span {
        transition: opacity 0.15s ease-in-out;
        opacity: 0;
    }
}

:deep(.sidebar--expand) {
    .el-sub-menu__title span,
    .el-menu-item span {
        transition: opacity 0.15s ease-in-out;
        opacity: 1;
    }
}
</style>
