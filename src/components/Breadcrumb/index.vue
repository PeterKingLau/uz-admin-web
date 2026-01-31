<template>
    <el-breadcrumb class="app-breadcrumb" separator="/">
        <transition-group name="breadcrumb">
            <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
                <span v-if="item.redirect === 'noRedirect' || index == levelList.length - 1" class="no-redirect">
                    {{ item.meta.title }}
                </span>
                <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
            </el-breadcrumb-item>
        </transition-group>
    </el-breadcrumb>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import usePermissionStore from '@/store/modules/permission'

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()
const levelList = ref([])

function getBreadcrumb() {
    let matched = route.matched.filter(r => r.meta && r.meta.title)

    if (!matched.length) {
        const reg = /\/[^/]+/g
        const pathList = (route.path.match(reg) || []).map((seg, i) => (i === 0 ? seg.slice(1) : seg.slice(1)))
        const temp = []
        getMatched(pathList, permissionStore.defaultRoutes, temp)
        matched = temp.filter(r => r.meta && r.meta.title)
    }

    if (!isDashboard(matched[0])) {
        matched = [{ path: '/index', meta: { title: '首页' } }].concat(matched)
    }

    levelList.value = matched.filter(r => r.meta && r.meta.title && r.meta.breadcrumb !== false)
}

function getMatched(pathList, routeList, matched) {
    const key = pathList[0]
    const data = routeList.find(item => item.path === key || String(item.name).toLowerCase() === key)
    if (data) {
        matched.push(data)
        if (data.children && pathList.length) {
            pathList.shift()
            getMatched(pathList, data.children, matched)
        }
    }
}

function isDashboard(route) {
    const name = route && route.name
    if (!name) {
        return false
    }
    return name.trim() === 'Index'
}

function handleLink(item) {
    const { redirect, path } = item
    if (redirect) {
        router.push(redirect)
        return
    }
    router.push(path)
}

watchEffect(() => {
    if (route.path.startsWith('/redirect/')) {
        return
    }
    getBreadcrumb()
})

getBreadcrumb()
</script>

<style lang="scss" scoped>
.app-breadcrumb.el-breadcrumb {
    display: inline-block;
    font-size: 14px;
    line-height: 50px;
    margin-left: 8px;

    .no-redirect {
        color: var(--el-text-color-placeholder);
        cursor: text;
    }

    a {
        color: var(--el-text-color-regular);
        font-weight: 600;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
            color: var(--el-color-primary);
        }
    }
}

.breadcrumb-enter-active,
.breadcrumb-leave-active {
    transition: all 0.5s;
}

.breadcrumb-enter-from,
.breadcrumb-leave-active {
    opacity: 0;
    transform: translateX(20px);
}

.breadcrumb-move {
    transition: all 0.5s;
}

.breadcrumb-leave-active {
    position: absolute;
}
</style>
