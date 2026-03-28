import router from './router'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import { getToken } from '@/utils/auth'
import { isHttp } from '@/utils/validate'
import { isRelogin } from '@/utils/request'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

NProgress.configure({
    showSpinner: false,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    speed: 500,
    minimum: 0.1
})

const whiteList = ['/login', '/register', '/h5/user-agreement', '/h5/privacy-policy']

router.beforeEach((to, _from, next) => {
    NProgress.start()
    if (getToken()) {
        to.meta.title && useSettingsStore().setTitle(to.meta.title)
        if (to.path === '/login') {
            next({ path: '/' })
            NProgress.done()
        } else {
            if (useUserStore().roles.length === 0) {
                isRelogin.show = true
                useUserStore()
                    .getInfo()
                    .then(() => {
                        isRelogin.show = false
                        usePermissionStore()
                            .generateRoutes()
                            .then(accessRoutes => {
                                accessRoutes.forEach(route => {
                                    if (!isHttp(route.path)) {
                                        router.addRoute(route)
                                    }
                                })
                                next({ ...to, replace: true })
                            })
                    })
                    .catch(err => {
                        useUserStore()
                            .logOut(false)
                            .then(() => {
                                ElMessage.error(err)
                                next({ path: '/' })
                            })
                    })
            } else {
                next()
            }
        }
    } else {
        if (whiteList.indexOf(to.path) !== -1) {
            next()
        } else {
            next(`/login?redirect=${to.fullPath}`)
            NProgress.done()
        }
    }
})

router.afterEach(() => {
    NProgress.done()
})
