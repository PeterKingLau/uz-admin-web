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
$sidebar-collapse-width: 54px; // 调整为更标准的折叠宽度，与 Logo 区域更协调

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
        height: calc(100% - 50px); // 减去 Logo 高度，防止滚动条溢出
        overflow-x: hidden !important;
    }

    :deep(.el-menu) {
        border: none;
        height: 100%;
        width: 100% !important;
        background-color: transparent !important;
    }
}

// 展开状态样式
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

// 折叠状态样式 (核心修复部分)
:deep(.sidebar--collapse) {
    .el-menu-item,
    .el-sub-menu__title {
        height: 50px !important; // 与 Logo 高度一致
        line-height: 50px !important;
        padding: 0 !important;
        width: 100% !important; // 占满容器宽度
        margin: 0 !important; // 移除 margin，靠 flex 居中
        border-radius: 0; // 折叠模式通常不需要圆角，或者保持 0
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;

        // 隐藏文字和箭头
        .el-sub-menu__icon-arrow,
        span {
            display: none !important;
            visibility: hidden;
        }

        // 图标重置
        .svg-icon,
        .nav-icon {
            margin: 0 !important; // 强制移除边距
            font-size: 20px;
            width: 20px;
            height: 20px;
        }

        // 修复 Tooltip 包裹层的对齐问题
        .el-tooltip__trigger {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }
    }

    // 选中状态 (折叠时通常不高亮背景块，只高亮图标，或者显示左侧边条)
    .el-menu-item.is-active {
        background-color: rgba(0, 0, 0, 0.05) !important; // 轻微背景区分

        .svg-icon,
        .nav-icon {
            color: var(--el-color-primary) !important;
        }
    }

    // 子菜单容器对齐
    .el-sub-menu {
        width: 100%;
        .el-sub-menu__title {
            justify-content: center !important;
        }
    }
}
</style>
