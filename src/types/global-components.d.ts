type ElementPlusIconComponents = typeof import('@element-plus/icons-vue')

export {}

declare module 'vue' {
    export interface GlobalComponents extends ElementPlusIconComponents {
        DictTag: typeof import('../components/DictTag/index.vue')['default']
        Icon: typeof import('../components/Icon/index.vue')['default']
        Pagination: typeof import('../components/Pagination/index.vue')['default']
        RightToolbar: typeof import('../components/RightToolbar/index.vue')['default']
        RouterLink: typeof import('vue-router')['RouterLink']
        RouterView: typeof import('vue-router')['RouterView']
    }
}
