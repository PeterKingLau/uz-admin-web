<template>
    <div class="sidebar-container" :class="{ 'has-logo': showLogo, 'is-collapse': isCollapse }">
        <logo v-if="showLogo" :collapse="isCollapse" />

        <el-scrollbar wrap-class="scrollbar-wrapper">
            <el-menu
                :default-active="activeMenu"
                :collapse="isCollapse"
                :background-color="menuBgColor"
                :text-color="menuTextColor"
                :unique-opened="true"
                :active-text-color="theme"
                :collapse-transition="false"
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
defineOptions({ name: 'LayoutComponentsSidebar' })
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
const LIGHT_MENU_BG = 'var(--el-fill-color-blank)'
const LIGHT_MENU_TEXT = 'var(--el-text-color-regular)'
const DARK_MENU_BG = 'var(--el-bg-color-overlay)'
const DARK_MENU_TEXT = 'var(--el-text-color-regular)'

const menuColors = computed(() => {
    if (settingsStore.isDark) {
        return {
            background: DARK_MENU_BG,
            text: DARK_MENU_TEXT
        }
    }

    if (sideTheme.value === 'theme-dark') {
        return {
            background: variables.menuBg,
            text: variables.menuText
        }
    }

    return {
        background: LIGHT_MENU_BG,
        text: LIGHT_MENU_TEXT
    }
})

const menuBgColor = computed(() => menuColors.value.background)
const menuTextColor = computed(() => menuColors.value.text)
const activeMenu = computed(() => route.meta.activeMenu || route.path)

function handleMenuSelect() {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
    }
}
</script>

<style lang="scss" scoped>
$sidebar-width: 240px;
$sidebar-width-collapsed: 64px;
$transition-duration: 0.3s;

.sidebar-container {
    height: 100%;
    position: relative;
    background-color: v-bind(menuBgColor);
    border-right: 1px solid var(--el-border-color-extra-light);
    width: $sidebar-width;
    transition:
        width $transition-duration cubic-bezier(0.25, 0.8, 0.25, 1),
        background-color 0.2s;
    will-change: width;
    overflow: hidden;
    z-index: 1001;
    box-sizing: border-box;

    &.is-collapse {
        width: $sidebar-width-collapsed;
    }

    .scrollbar-wrapper {
        height: calc(100% - 50px);
        overflow-x: hidden !important;

        :deep(.el-scrollbar__view) {
            height: 100%;
        }

        &::-webkit-scrollbar {
            width: 0 !important;
            height: 0 !important;
        }
    }

    :deep(.el-menu) {
        border: none;
        height: 100%;
        width: 100% !important;
        background-color: transparent !important;
        padding: 8px 0;
        overflow: hidden;
    }

    :deep(.sidebar-menu > .el-menu-item),
    :deep(.sidebar-menu > .el-sub-menu > .el-sub-menu__title) {
        height: 48px;
        line-height: 48px;
        margin: 4px 12px;
        border-radius: 8px;
        padding: 0 16px !important;
        display: flex;
        align-items: center;
        font-weight: 600;
        color: v-bind(menuTextColor);
        transition: all 0.2s ease-in-out;

        .svg-icon,
        .nav-icon {
            margin-right: 12px;
            font-size: 18px;
            width: 18px;
            height: 18px;
            flex-shrink: 0;
            transition: margin-right $transition-duration;
        }

        span {
            font-size: 14px;
            opacity: 1;
            width: auto;
            transition:
                opacity $transition-duration,
                width $transition-duration;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &:hover {
            background-color: rgba(var(--el-color-primary-rgb), 0.08) !important;
            color: var(--el-color-primary) !important;

            .svg-icon,
            .nav-icon {
                color: var(--el-color-primary);
                transform: scale(1.1);
            }
        }

        &.is-active {
            background: linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.15) 0%, rgba(var(--el-color-primary-rgb), 0.05) 100%) !important;
            color: var(--el-color-primary) !important;
            position: relative;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 3px;
                height: 24px;
                background: var(--el-color-primary);
                border-radius: 0 4px 4px 0;
            }

            .svg-icon,
            .nav-icon {
                color: var(--el-color-primary);
            }
        }
    }

    :deep(.el-sub-menu .el-menu-item) {
        height: 40px;
        line-height: 40px;
        margin: 2px 12px 2px 24px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 400;
        color: v-bind(menuTextColor);
        opacity: 0.9;
        transition: all 0.2s;

        padding-left: 48px !important;

        span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &:hover {
            background-color: color-mix(in srgb, var(--el-color-black) 4%, transparent) !important;
            color: var(--el-text-color-primary) !important;
            transform: translateX(4px);
        }

        &.is-active {
            background-color: rgba(var(--el-color-primary-rgb), 0.1) !important;
            color: var(--el-color-primary) !important;
            font-weight: 500;

            &::before {
                display: none;
            }
        }
    }

    @media (prefers-color-scheme: dark) {
        :deep(.el-sub-menu .el-menu-item:hover) {
            background-color: color-mix(in srgb, var(--el-color-white) 8%, transparent) !important;
        }
    }

    &.is-collapse {
        :deep(.sidebar-menu > .el-menu-item),
        :deep(.sidebar-menu > .el-sub-menu > .el-sub-menu__title) {
            margin: 4px 0;
            border-radius: 0;
            justify-content: center;
            padding: 0 !important;
            width: 100%;

            .svg-icon,
            .nav-icon {
                margin-right: 0;
                font-size: 20px;
            }

            span {
                width: 0;
                opacity: 0;
                overflow: hidden;
            }

            .el-sub-menu__icon-arrow {
                display: none;
            }

            &.is-active::before {
                height: 36px;
            }
        }
    }
}
</style>
