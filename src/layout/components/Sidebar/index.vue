<template>
    <div class="sidebar-container" :class="[{ 'has-logo': showLogo }, isCollapse ? 'sidebar--collapse' : 'sidebar--expand']">
        <logo v-if="showLogo" :collapse="isCollapse" />

        <el-scrollbar wrap-class="scrollbar-wrapper">
            <el-menu
                :default-active="activeMenu"
                :collapse="isCollapse"
                :background-color="menuBgColor"
                :text-color="menuTextColor"
                :unique-opened="true"
                :active-text-color="theme"
                mode="vertical"
                class="sidebar-menu"
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

const menuBgColor = computed(() => {
    if (settingsStore.isDark) return '#141414'
    return sideTheme.value === 'theme-dark' ? variables.menuBg : '#ffffff'
})

const menuTextColor = computed(() => {
    if (settingsStore.isDark) return '#bfcbd9'
    return sideTheme.value === 'theme-dark' ? variables.menuText : '#64748b'
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
$sidebar-expand-width: 220px;
$sidebar-collapse-width: 54px;

.sidebar-container {
    position: relative;
    height: 100%;
    background-color: v-bind(menuBgColor);
    box-shadow: 1px 0 10px rgba(0, 0, 0, 0.05);
    transition:
        width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
        background-color 0.3s;
    overflow: hidden;
    z-index: 1001;

    &.sidebar--expand {
        width: $sidebar-expand-width;
    }

    &.sidebar--collapse {
        width: $sidebar-collapse-width;
    }

    .scrollbar-wrapper {
        height: calc(100% - 50px);
        overflow-x: hidden !important;
    }

    :deep(.el-menu) {
        border: none;
        height: 100%;
        width: 100% !important;
        background-color: transparent !important;
    }
}

:deep(.sidebar--expand) {
    .el-menu-item,
    .el-sub-menu__title {
        height: 48px;
        line-height: 48px;
        margin: 4px 10px;
        border-radius: 8px;
        width: auto !important;
        padding-right: 0;
        display: flex;
        align-items: center;

        span {
            font-weight: 500;
            letter-spacing: 0.3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &:hover {
            background-color: rgba(0, 0, 0, 0.04) !important;
            color: #333 !important;
            @media (prefers-color-scheme: dark) {
                background-color: rgba(255, 255, 255, 0.05) !important;
                color: #eee !important;
            }
        }
    }

    .el-menu-item.is-active {
        background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%) !important;
        color: #ffffff !important;
        box-shadow: 0 4px 10px rgba(var(--el-color-primary-rgb), 0.3);
        font-weight: 600;

        .svg-icon,
        .nav-icon {
            color: #ffffff !important;
            fill: #ffffff !important;
        }
    }
}

:deep(.sidebar--collapse) {
    .el-menu-item,
    .el-sub-menu__title {
        height: 50px !important;
        line-height: 50px !important;
        padding: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        border-radius: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;

        .el-sub-menu__icon-arrow,
        .menu-title {
            display: none !important;
            visibility: hidden;
        }

        .svg-icon,
        .nav-icon {
            margin: 0 !important;
            font-size: 20px;
            width: 20px;
            height: 20px;
        }

        .el-tooltip__trigger {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }
    }

    .el-menu-item.is-active {
        background-color: rgba(0, 0, 0, 0.05) !important;

        .svg-icon,
        .nav-icon {
            color: var(--el-color-primary) !important;
        }
    }

    .el-sub-menu {
        width: 100%;
        .el-sub-menu__title {
            justify-content: center !important;
        }
    }
}

:deep(.el-tooltip__popper),
:deep(.el-popper.is-dark),
:deep(.el-popper.is-light) {
    background: linear-gradient(135deg, var(--el-fill-color-dark) 0%, var(--el-bg-color-overlay) 100%) !important;
    border: 1px solid var(--el-border-color-light) !important;
    color: var(--el-text-color-primary) !important;
    box-shadow: 0 12px 30px rgba(var(--el-color-black-rgb), 0.35) !important;
    border-radius: 10px !important;
    padding: 10px 12px !important;
    font-size: 13px !important;
    letter-spacing: 0.2px;
}

:deep(.el-popper.is-dark .el-popper__arrow::before),
:deep(.el-popper.is-light .el-popper__arrow::before),
:deep(.el-tooltip__popper .el-popper__arrow::before) {
    background: var(--el-fill-color-dark) !important;
    border: 1px solid var(--el-border-color-light) !important;
}
</style>
