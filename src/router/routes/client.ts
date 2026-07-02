import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

export const clientRoutes: RouteRecordRaw[] = [
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
    }
]
