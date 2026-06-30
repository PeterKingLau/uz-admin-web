import router from './index'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import { getToken } from '@/utils/auth'
import { isHttp } from '@/utils/validate'
import { isRelogin } from '@/utils/request'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import { getClientHomeRoute, isClientRoutePath, isMobileWebViewport } from '@/utils/routeAccess'

NProgress.configure({
    showSpinner: false,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    speed: 420,
    minimum: 0.12,
    trickleSpeed: 180
})

const whiteList = ['/', '/portal', '/login', '/register', '/user-agreement', '/privacy-policy', '/h5/app-download', '/h5/user-agreement', '/h5/privacy-policy']
const isIndexPath = (path: string) => path === '/' || path === '/index'
const H5_APP_DOWNLOAD_PATH = '/h5/app-download'
const AUTH_ROUTE_SHELL_CLASS = 'auth-route-shell'
const CLIENT_ROUTE_SHELL_CLASS = 'client-route-shell'
const PORTAL_ROUTE_SHELL_CLASS = 'portal-route-shell'
const ADMIN_ROUTE_SHELL_CLASS = 'admin-route-shell'
const ROUTE_SHELL_CLASSES = [AUTH_ROUTE_SHELL_CLASS, CLIENT_ROUTE_SHELL_CLASS, PORTAL_ROUTE_SHELL_CLASS, ADMIN_ROUTE_SHELL_CLASS]
const ROUTE_PROGRESS_MIN_DURATION = 420
let routeProgressStartTime = 0
let routeProgressTimer: number | null = null

const clearRouteProgressTimer = () => {
    if (!routeProgressTimer) return
    window.clearTimeout(routeProgressTimer)
    routeProgressTimer = null
}

const startRouteProgress = () => {
    clearRouteProgressTimer()
    routeProgressStartTime = Date.now()
    NProgress.start()
}

const finishRouteProgress = () => {
    const elapsed = Date.now() - routeProgressStartTime
    const delay = Math.max(0, ROUTE_PROGRESS_MIN_DURATION - elapsed)
    clearRouteProgressTimer()
    routeProgressTimer = window.setTimeout(() => {
        NProgress.done()
        routeProgressTimer = null
    }, delay)
}

const getLoginRedirectPath = (redirect: unknown) => {
    const value = Array.isArray(redirect) ? redirect[0] : redirect
    if (typeof value === 'string' && value && value !== '/login') return value
    return '/index'
}

const resolveRouteShellClass = (to: any) => {
    const path = to.path || ''
    const metaPlatform = String(to.meta?.platform || '')
        .trim()
        .toLowerCase()

    if (path === '/login' || path === '/register') return AUTH_ROUTE_SHELL_CLASS
    if (path === '/' || path === '/portal') return PORTAL_ROUTE_SHELL_CLASS
    if (metaPlatform === 'client' || isClientRoutePath(path)) return CLIENT_ROUTE_SHELL_CLASS
    if (metaPlatform === 'admin') return ADMIN_ROUTE_SHELL_CLASS
    return ''
}

const syncRouteShell = (to: any) => {
    if (typeof document === 'undefined') return
    const activeClass = resolveRouteShellClass(to)
    ROUTE_SHELL_CLASSES.forEach(className => {
        document.documentElement.classList.toggle(className, className === activeClass)
        document.body?.classList.toggle(className, className === activeClass)
    })
}

const resolveContinueNavigation = (to: any) => {
    const userStore = useUserStore()
    const clientRedirect = userStore.isCommonClient ? resolveClientRouteIsolation(to) : null
    return clientRedirect || { path: to.fullPath, replace: true }
}

const resolveClientRouteIsolation = (to: any) => {
    const metaPlatform = String(to.meta?.platform || '')
        .trim()
        .toLowerCase()
    if (metaPlatform === 'public') {
        return null
    }
    if (isIndexPath(to.path)) {
        return { path: '/discover', replace: true }
    }
    if (metaPlatform === 'admin' || !isClientRoutePath(to.path)) {
        return { path: '/discover', replace: true }
    }
    return null
}

const shouldRedirectMobileClientRoute = (to: any) => {
    const path = to.path || ''
    const metaPlatform = String(to.meta?.platform || '')
        .trim()
        .toLowerCase()

    if (!isMobileWebViewport()) return false
    if (path === H5_APP_DOWNLOAD_PATH) return false
    if (path === '/login' || path === '/register') return false
    if (whiteList.includes(path)) return false
    if (metaPlatform === 'public' || metaPlatform === 'admin') return false
    return metaPlatform === 'client' || isClientRoutePath(path)
}

router.beforeEach(async to => {
    syncRouteShell(to)
    startRouteProgress()
    to.meta.title && useSettingsStore().setTitle(to.meta.title)
    if (to.path === '/portal') {
        useUserStore().logOut(false)
    }
    if (shouldRedirectMobileClientRoute(to)) {
        return { path: H5_APP_DOWNLOAD_PATH, query: { redirect: to.fullPath }, replace: true }
    }
    if (getToken()) {
        if (to.path === '/login') {
            return { path: getLoginRedirectPath(to.query?.redirect) }
        }

        if (useUserStore().roles.length === 0) {
            isRelogin.show = true
            try {
                await useUserStore().getInfo()
                isRelogin.show = false
                try {
                    const accessRoutes = await usePermissionStore().generateRoutes()
                    accessRoutes.forEach(route => {
                        if (!isHttp(route.path)) {
                            router.addRoute(route)
                        }
                    })
                    return resolveContinueNavigation(to)
                } catch (err) {
                    if (isClientRoutePath(to.path)) {
                        console.warn('Generate admin routes failed, continue client route navigation.', err)
                        return resolveContinueNavigation(to)
                    }
                    await useUserStore().logOut(false)
                    ElMessage.error(err as any)
                    return { path: '/' }
                }
            } catch (err) {
                isRelogin.show = false
                await useUserStore().logOut(false)
                ElMessage.error(err as any)
                return { path: '/' }
            }
        }

        const clientRedirect = useUserStore().isCommonClient ? resolveClientRouteIsolation(to) : null
        return clientRedirect || true
    }

    if (whiteList.indexOf(to.path) !== -1) {
        return true
    }

    return `/login?redirect=${to.fullPath}`
})

router.afterEach(() => {
    finishRouteProgress()
})

router.onError(() => {
    finishRouteProgress()
})
