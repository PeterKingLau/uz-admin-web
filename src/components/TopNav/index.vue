<template>
    <el-menu :default-active="activeMenu" mode="horizontal" @select="handleSelect" :ellipsis="false" class="topmenu-container">
        <template v-for="(item, index) in topMenus">
            <el-menu-item :index="item.path" :key="index" v-if="index < visibleNumber">
                <Icon v-if="item.meta && item.meta.icon && item.meta.icon !== '#'" :icon="item.meta.icon" class="menu-icon" />
                <span class="menu-title">{{ item.meta.title }}</span>
            </el-menu-item>
        </template>

        <el-sub-menu index="more" v-if="topMenus.length > visibleNumber" popper-class="top-menu-popper">
            <template #title>
                <span class="more-btn">更多菜单</span>
            </template>
            <template v-for="(item, index) in topMenus">
                <el-menu-item :index="item.path" :key="index" v-if="index >= visibleNumber">
                    <Icon v-if="item.meta && item.meta.icon && item.meta.icon !== '#'" :icon="item.meta.icon" class="menu-icon" />
                    <span class="menu-title">{{ item.meta.title }}</span>
                </el-menu-item>
            </template>
        </el-sub-menu>
    </el-menu>
</template>

<script setup>
import { constantRoutes } from '@/router'
import { isHttp } from '@/utils/validate'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const visibleNumber = ref(null)
const currentIndex = ref(null)
const hideList = ['/index', '/user/profile']

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const route = useRoute()
const router = useRouter()

const theme = computed(() => settingsStore.theme)
const routers = computed(() => permissionStore.topbarRouters)

const topMenus = computed(() => {
    let topMenus = []
    routers.value.map(menu => {
        if (menu.hidden !== true) {
            if (menu.path === '/' && menu.children) {
                topMenus.push(menu.children[0])
            } else {
                topMenus.push(menu)
            }
        }
    })
    return topMenus
})

const childrenMenus = computed(() => {
    let childrenMenus = []
    routers.value.map(router => {
        for (let item in router.children) {
            if (router.children[item].parentPath === undefined) {
                if (router.path === '/') {
                    router.children[item].path = '/' + router.children[item].path
                } else {
                    if (!isHttp(router.children[item].path)) {
                        router.children[item].path = router.path + '/' + router.children[item].path
                    }
                }
                router.children[item].parentPath = router.path
            }
            childrenMenus.push(router.children[item])
        }
    })
    return constantRoutes.concat(childrenMenus)
})

const activeMenu = computed(() => {
    const path = route.path
    let activePath = path
    if (path !== undefined && path.lastIndexOf('/') > 0 && hideList.indexOf(path) === -1) {
        const tmpPath = path.substring(1, path.length)
        if (!route.meta.link) {
            activePath = '/' + tmpPath.substring(0, tmpPath.indexOf('/'))
            appStore.toggleSideBarHide(false)
        }
    } else if (!route.children) {
        activePath = path
        appStore.toggleSideBarHide(true)
    }
    activeRoutes(activePath)
    return activePath
})

function setVisibleNumber() {
    const width = document.body.getBoundingClientRect().width / 3
    visibleNumber.value = parseInt(width / 110) // 稍微调整宽度系数
}

function handleSelect(key, keyPath) {
    currentIndex.value = key
    const route = routers.value.find(item => item.path === key)
    if (isHttp(key)) {
        window.open(key, '_blank')
    } else if (!route || !route.children) {
        const routeMenu = childrenMenus.value.find(item => item.path === key)
        if (routeMenu && routeMenu.query) {
            let query = JSON.parse(routeMenu.query)
            router.push({ path: key, query: query })
        } else {
            router.push({ path: key })
        }
        appStore.toggleSideBarHide(true)
    } else {
        activeRoutes(key)
        appStore.toggleSideBarHide(false)
    }
}

function activeRoutes(key) {
    let routes = []
    if (childrenMenus.value && childrenMenus.value.length > 0) {
        childrenMenus.value.map(item => {
            if (key == item.parentPath || (key == 'index' && '' == item.path)) {
                routes.push(item)
            }
        })
    }
    if (routes.length > 0) {
        permissionStore.setSidebarRouters(routes)
    } else {
        appStore.toggleSideBarHide(true)
    }
    return routes
}

onMounted(() => {
    window.addEventListener('resize', setVisibleNumber)
    setVisibleNumber()
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', setVisibleNumber)
})
</script>

<style lang="scss" scoped>
.topmenu-container {
    border-bottom: none;
    background: transparent;
    height: 50px;
    display: flex;
    align-items: center;

    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
        height: 40px;
        line-height: 40px;
        border-radius: 6px;
        margin: 0 4px;
        padding: 0 12px;
        color: var(--el-text-color-regular);
        font-weight: 500;
        border-bottom: none !important;
        transition: all 0.3s;
        display: flex;
        align-items: center;

        &:hover {
            color: var(--el-color-primary);
            background-color: var(--el-fill-color);
        }

        &.is-active {
            color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
            font-weight: 600;
        }

        .menu-icon {
            margin-right: 6px;
            font-size: 16px;
        }
    }

    :deep(.el-sub-menu) {
        .el-sub-menu__icon-arrow {
            position: static;
            margin-left: 6px;
            margin-top: 0;
            font-size: 12px;
        }
    }
}
</style>

<style lang="scss">
.top-menu-popper {
    &.el-popper {
        border: none !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
        border-radius: 8px !important;
        padding: 6px 0 !important;
    }

    &.el-popper.is-dark {
        background: var(--el-bg-color-overlay) !important;
        border: 1px solid var(--el-border-color-darker) !important;
    }

    .el-menu--popup {
        padding: 4px;
        min-width: 140px;
        background-color: var(--el-bg-color-overlay);

        .el-menu-item {
            height: 40px;
            line-height: 40px;
            border-radius: 6px;
            margin-bottom: 2px;
            padding: 0 12px !important;
            color: var(--el-text-color-regular);
            display: flex;
            align-items: center;

            &:last-child {
                margin-bottom: 0;
            }

            &:hover,
            &.is-active {
                color: var(--el-color-primary);
                background-color: var(--el-color-primary-light-9);
            }

            .menu-icon {
                margin-right: 8px;
                font-size: 16px;
                width: 1em;
                height: 1em;
            }

            .menu-title {
                font-size: 14px;
            }
        }
    }
}
</style>
