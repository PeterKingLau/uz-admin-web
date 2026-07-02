import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { adminConstantRoutes, adminDynamicRoutes } from './routes/admin'
import { clientRoutes } from './routes/client'
import { publicFallbackRoutes, publicRoutes } from './routes/public'

declare module 'vue-router' {
    interface RouteMeta {
        hidden?: boolean
        title?: string
        icon?: string
        elSvgIcon?: string
        permissions?: string[]
        platform?: 'public' | 'client' | 'admin'
        requiresAuth?: boolean
    }
    interface _RouteRecordBase {
        hidden?: boolean
        parentPath?: string
        permissions?: string[]
    }
    interface _RouteLocationBase {
        title?: string
    }
}

export const constantRoutes: RouteRecordRaw[] = [...publicRoutes, ...adminConstantRoutes, ...clientRoutes, ...publicFallbackRoutes]

export const dynamicRoutes: RouteRecordRaw[] = adminDynamicRoutes

const router = createRouter({
    history: createWebHistory(),
    routes: constantRoutes,
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        return { top: 0 }
    }
})

export default router
