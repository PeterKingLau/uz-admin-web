import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

export const adminConstantRoutes: RouteRecordRaw[] = [
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
    }
]

export const adminDynamicRoutes: RouteRecordRaw[] = [
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
