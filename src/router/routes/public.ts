import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

export const publicRoutes: RouteRecordRaw[] = [
    {
        path: '/redirect',
        component: Layout,
        hidden: true,
        children: [
            {
                path: '/redirect/:path(.*)',
                component: () => import('@/views/redirect/index.vue'),
                meta: { platform: 'public' }
            }
        ]
    },
    {
        path: '/login',
        component: () => import('@/views/login.vue'),
        hidden: true,
        meta: { platform: 'public' }
    },
    {
        path: '/client-login',
        component: () => import('@/views/client/login/index.vue'),
        hidden: true,
        meta: { platform: 'public' }
    },
    {
        path: '/portal',
        component: () => import('@/views/portal/index.vue'),
        hidden: true,
        name: 'PortalHome',
        meta: { title: '测吧', platform: 'public' }
    },
    {
        path: '/user-agreement',
        component: () => import('@/views/legal/agreement/index.vue'),
        hidden: true,
        meta: { title: '用户协议', platform: 'public' }
    },
    {
        path: '/privacy-policy',
        component: () => import('@/views/legal/privacy/index.vue'),
        hidden: true,
        meta: { title: '隐私政策', platform: 'public' }
    },
    {
        path: '/h5/app-download',
        component: () => import('@/views/h5/appDownload/index.vue'),
        hidden: true,
        meta: { title: '下载测吧 App', platform: 'public' }
    },
    {
        path: '/h5/user-agreement',
        component: () => import('@/views/h5/agreement/index.vue'),
        hidden: true,
        meta: { title: '用户协议', platform: 'public' }
    },
    {
        path: '/h5/privacy-policy',
        component: () => import('@/views/h5/privacy/index.vue'),
        hidden: true,
        meta: { title: '隐私政策', platform: 'public' }
    },
    {
        path: '/401',
        component: () => import('@/views/error/401.vue'),
        hidden: true,
        meta: { platform: 'public' }
    },
    {
        path: '/',
        redirect: '/portal',
        hidden: true,
        meta: { platform: 'public' }
    }
]

export const publicFallbackRoutes: RouteRecordRaw[] = [
    {
        path: '/:pathMatch(.*)*',
        component: () => import('@/views/error/404.vue'),
        hidden: true,
        meta: { platform: 'public' }
    }
]
