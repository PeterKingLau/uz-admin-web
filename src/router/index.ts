import { createWebHistory, createRouter, RouteRecordRaw } from 'vue-router'

import Layout from '@/layout/index.vue'

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

export const constantRoutes: RouteRecordRaw[] = [
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
        path: '/configuration/tag-data',
        component: Layout,
        hidden: true,
        children: [
            {
                path: 'index/:id',
                component: () => import('@/views/configuration/tag/data.vue'),
                name: 'TagData',
                meta: { title: '标签数据', activeMenu: '/configuration/tag', platform: 'admin' }
            }
        ]
    },
    {
        path: '/',
        redirect: '/portal',
        hidden: true,
        meta: { platform: 'public' }
    },
    {
        path: '/index',
        component: Layout,
        children: [
            {
                path: '',
                component: () => import('@/views/index.vue'),
                name: 'Index',
                meta: { title: '首页', icon: 'mdi:chart-line', affix: true, platform: 'admin' }
            }
        ]
    },
    {
        path: '/discover',
        hidden: true,
        component: () => import('@/views/client/home/index.vue'),
        name: 'ClientDiscover',
        meta: { title: '测吧', platform: 'client' }
    },
    {
        path: '/publish',
        hidden: true,
        component: () => import('@/views/client/publish/index.vue'),
        name: 'ClientPublish',
        meta: { title: '测吧', platform: 'client' }
    },
    {
        path: '/profile',
        hidden: true,
        component: () => import('@/views/client/profile/index.vue'),
        name: 'ClientProfile',
        meta: { title: '个人主页', platform: 'client', requiresAuth: true }
    },
    {
        path: '/profile/:userId',
        hidden: true,
        component: () => import('@/views/client/profile/index.vue'),
        name: 'ClientUserProfile',
        meta: { title: '个人主页', platform: 'client', requiresAuth: true }
    },
    {
        path: '/user',
        component: Layout,
        hidden: true,
        redirect: 'noredirect',
        children: [
            {
                path: 'profile',
                component: () => import('@/views/system/user/profile/index.vue'),
                name: 'Profile',
                meta: { title: '个人中心', icon: 'ep:user', platform: 'admin' }
            }
        ]
    },
    {
        path: '/content/userProfile',
        component: Layout,
        hidden: true,
        children: [
            {
                path: '',
                component: () => import('@/views/content/userProfile/index.vue'),
                name: 'UserProfileView',
                meta: { title: '个人主页', platform: 'client' }
            }
        ]
    },
    {
        path: '/content/video-player/:id',
        component: () => import('@/views/content/videoPlayer/index.vue'),
        name: 'VideoPlayer',
        hidden: true,
        meta: { title: '视频播放器', platform: 'client' }
    },
    {
        path: '/content/media-viewer/:id',
        component: () => import('@/views/client/mediaViewer/index.vue'),
        name: 'ClientMediaViewer',
        hidden: true,
        meta: { title: '内容预览', platform: 'client' }
    },
    {
        path: '/circle-manage/circle-data',
        component: Layout,
        hidden: true,
        children: [
            {
                path: 'index/:id',
                component: () => import('@/views/circle/circleRecommend/detail.vue'),
                name: 'CircleDetail',
                meta: { title: '圈子详情', platform: 'client' }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        component: () => import('@/views/error/404.vue'),
        hidden: true,
        meta: { platform: 'public' }
    }
]

export const dynamicRoutes: RouteRecordRaw[] = [
    {
        path: '/system/user-auth',
        component: Layout,
        hidden: true,
        permissions: ['system:user:edit'],
        children: [
            {
                path: 'role/:userId',
                component: () => import('@/views/system/user/authRole.vue'),
                name: 'AuthRole',
                meta: { title: '分配角色', activeMenu: '/system/user', platform: 'admin' }
            }
        ]
    },
    {
        path: '/system/role-auth',
        component: Layout,
        hidden: true,
        permissions: ['system:role:edit'],
        children: [
            {
                path: 'user/:roleId',
                component: () => import('@/views/system/role/authUser.vue'),
                name: 'AuthUser',
                meta: { title: '分配用户', activeMenu: '/system/role', platform: 'admin' }
            }
        ]
    },
    {
        path: '/system/dict-data',
        component: Layout,
        hidden: true,
        permissions: ['system:dict:list'],
        children: [
            {
                path: 'index/:dictId',
                component: () => import('@/views/system/dict/data.vue'),
                name: 'Data',
                meta: { title: '字典数据', activeMenu: '/system/dict', platform: 'admin' }
            }
        ]
    },
    {
        path: '/content/competition-work',
        component: Layout,
        hidden: true,
        permissions: ['content:competition:list'],
        children: [
            {
                path: 'index/:competitionId',
                component: () => import('@/views/content/competitionWork/index.vue'),
                name: 'CompetitionWorkData',
                meta: { title: '作品管理', activeMenu: '/content/competition', platform: 'admin' }
            }
        ]
    },
    {
        path: '/monitor/job-log',
        component: Layout,
        hidden: true,
        permissions: ['monitor:job:list'],
        children: [
            {
                path: 'index/:jobId',
                component: () => import('@/views/monitor/job/log.vue'),
                name: 'JobLog',
                meta: { title: '调度日志', activeMenu: '/monitor/job', platform: 'admin' }
            }
        ]
    },
    {
        path: '/tool/gen-edit',
        component: Layout,
        hidden: true,
        permissions: ['tool:gen:edit'],
        children: [
            {
                path: 'index/:tableId',
                component: () => import('@/views/tool/gen/editTable.vue'),
                name: 'GenEdit',
                meta: { title: '修改生成配置', activeMenu: '/tool/gen', platform: 'admin' }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes: constantRoutes,
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

export default router
