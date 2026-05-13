<template>
    <div v-if="!item.hidden">
        <template v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
            <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path, onlyOneChild.query)">
                <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }">
                    <Icon
                        v-if="resolveMenuIcon(onlyOneChild.meta.icon || (item.meta && item.meta.icon), onlyOneChild)"
                        :icon="resolveMenuIcon(onlyOneChild.meta.icon || (item.meta && item.meta.icon), onlyOneChild)"
                        class="nav-icon"
                    />
                    <template #title>
                        <span class="menu-title truncate" :title="hasTitle(onlyOneChild.meta.title)">{{ onlyOneChild.meta.title }}</span>
                    </template>
                </el-menu-item>
            </app-link>
        </template>

        <el-sub-menu v-else :index="resolvePath(item.path)" teleported>
            <template v-if="item.meta" #title>
                <Icon v-if="resolveMenuIcon(item.meta.icon, item)" :icon="resolveMenuIcon(item.meta.icon, item)" class="nav-icon" />
                <span class="menu-title truncate" :title="hasTitle(item.meta.title)">{{ item.meta.title }}</span>
            </template>

            <sidebar-item
                v-for="(child, index) in item.children"
                :key="child.path + index"
                :is-nest="true"
                :item="child"
                :base-path="resolvePath(child.path)"
                class="nest-menu"
            />
        </el-sub-menu>
    </div>
</template>

<script setup>
defineOptions({ name: 'LayoutComponentsSidebarSidebarItem' })
import { ref } from 'vue'
import { isExternal } from '@/utils/validate'
import AppLink from './Link'
import { getNormalPath } from '@/utils/utils'
import Icon from '@/components/Icon/index.vue'

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    isNest: {
        type: Boolean,
        default: false
    },
    basePath: {
        type: String,
        default: ''
    }
})

const onlyOneChild = ref({})

function hasOneShowingChild(children = [], parent) {
    if (!children) children = []
    const showingChildren = children.filter(item => {
        if (item.hidden) return false
        onlyOneChild.value = item
        return true
    })
    if (showingChildren.length === 1) return true
    if (showingChildren.length === 0) {
        onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
        return true
    }
    return false
}

function resolvePath(routePath, routeQuery) {
    if (isExternal(routePath)) return routePath
    if (isExternal(props.basePath)) return props.basePath
    if (routeQuery) {
        const query = JSON.parse(routeQuery)
        return { path: getNormalPath(props.basePath + '/' + routePath), query }
    }
    return getNormalPath(props.basePath + '/' + routePath)
}

function hasTitle(title) {
    return title.length > 5 ? title : ''
}

function isHomeRoute(route) {
    return route?.path === '/index' || route?.path === 'index' || route?.name === 'Index' || route?.meta?.title === '首页'
}

function resolveMenuIcon(icon, route) {
    const normalizedIcon = String(icon || '').trim()
    if (normalizedIcon.includes(':')) return normalizedIcon
    if (isHomeRoute(route)) return 'mdi:chart-line'
    return ''
}
</script>

<style scoped>
.nav-icon {
    width: 1em;
    height: 1em;
    font-size: 18px;
    vertical-align: -0.15em;
    fill: currentcolor;
    overflow: hidden;
}

.menu-title {
    margin-left: 10px;
}
</style>
