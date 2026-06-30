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

type GuardRoute = {
    path: string
    fullPath: string
    query?: Record<string, unknown>
    meta?: Record<string, any>
}

const H5_APP_DOWNLOAD_PATH = '/h5/app-download'
const LOGIN_PATH = '/login'
const INDEX_PATH = '/index'
const PUBLIC_PATHS = new Set([
    '/',
    '/portal',
    LOGIN_PATH,
    '/register',
    '/user-agreement',
    '/privacy-policy',
    H5_APP_DOWNLOAD_PATH,
    '/h5/user-agreement',
    '/h5/privacy-policy'
])
const INDEX_PATHS = new Set(['/', INDEX_PATH])

const ROUTE_SHELL_CLASS = {
    auth: 'auth-route-shell',
    client: 'client-route-shell',
    portal: 'portal-route-shell',
    admin: 'admin-route-shell'
} as const
const ROUTE_SHELL_CLASSES = Object.values(ROUTE_SHELL_CLASS)
const ROUTE_PROGRESS_MIN_DURATION = 420

let routeProgressStartTime = 0
let routeProgressTimer: number | null = null

NProgress.configure({
    showSpinner: false,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    speed: 420,
    minimum: 0.12,
    trickleSpeed: 180
})

const getRoutePlatform = (to: GuardRoute) =>
    String(to.meta?.platform || '')
        .trim()
        .toLowerCase()

const isPublicRoute = (to: GuardRoute) => PUBLIC_PATHS.has(to.path)

const isIndexPath = (path: string) => INDEX_PATHS.has(path)

const createClientHomeRedirect = () => {
    const route = getClientHomeRoute()
    return {
        ...(typeof route === 'string' ? { path: route } : route),
        replace: true
    }
}

const createLoginRedirect = (to: GuardRoute) => ({
    path: LOGIN_PATH,
    query: { redirect: to.fullPath }
})

const getLoginRedirectPath = (redirect: unknown) => {
    const value = Array.isArray(redirect) ? redirect[0] : redirect
    if (typeof value === 'string' && value && value !== LOGIN_PATH) return value
    return INDEX_PATH
}

const resolveErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) return error.message
    if (typeof error === 'string' && error.trim()) return error
    return '操作失败，请稍后重试'
}

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

const resolveRouteShellClass = (to: GuardRoute) => {
    const platform = getRoutePlatform(to)

    if (to.path === LOGIN_PATH || to.path === '/register') return ROUTE_SHELL_CLASS.auth
    if (to.path === '/' || to.path === '/portal') return ROUTE_SHELL_CLASS.portal
    if (platform === 'client' || isClientRoutePath(to.path)) return ROUTE_SHELL_CLASS.client
    if (platform === 'admin') return ROUTE_SHELL_CLASS.admin
    return ''
}

const syncRouteShell = (to: GuardRoute) => {
    if (typeof document === 'undefined') return

    const activeClass = resolveRouteShellClass(to)
    ROUTE_SHELL_CLASSES.forEach(className => {
        const isActive = className === activeClass
        document.documentElement.classList.toggle(className, isActive)
        document.body?.classList.toggle(className, isActive)
    })
}

const prepareRouteUi = (to: GuardRoute) => {
    syncRouteShell(to)
    startRouteProgress()

    if (to.meta?.title) {
        useSettingsStore().setTitle(String(to.meta.title))
    }
    if (to.path === '/portal') {
        useUserStore().logOut(false)
    }
}

const resolveClientRouteIsolation = (to: GuardRoute) => {
    const platform = getRoutePlatform(to)

    if (platform === 'public') return null
    if (isIndexPath(to.path)) return createClientHomeRedirect()
    if (platform === 'admin' || !isClientRoutePath(to.path)) return createClientHomeRedirect()
    return null
}

const resolvePostRouteRegistrationNavigation = (to: GuardRoute) => {
    const userStore = useUserStore()
    const clientRedirect = userStore.isCommonClient ? resolveClientRouteIsolation(to) : null
    return clientRedirect || { path: to.fullPath, replace: true }
}

const resolveAuthenticatedNavigation = (to: GuardRoute) => {
    const userStore = useUserStore()
    const clientRedirect = userStore.isCommonClient ? resolveClientRouteIsolation(to) : null
    return clientRedirect || true
}

const shouldRedirectMobileClientRoute = (to: GuardRoute) => {
    const platform = getRoutePlatform(to)

    if (!isMobileWebViewport()) return false
    if (to.path === H5_APP_DOWNLOAD_PATH || to.path === LOGIN_PATH || to.path === '/register') return false
    if (isPublicRoute(to)) return false
    if (platform === 'public' || platform === 'admin') return false
    return platform === 'client' || isClientRoutePath(to.path)
}

const addAccessRoutes = (routes: Array<{ path: string }>) => {
    routes.forEach(route => {
        if (!isHttp(route.path)) {
            router.addRoute(route as any)
        }
    })
}

const logoutToPortal = async (error: unknown) => {
    await useUserStore().logOut(false)
    ElMessage.error(resolveErrorMessage(error))
    return { path: '/' }
}

const loadUserAndRoutes = async (to: GuardRoute) => {
    isRelogin.show = true
    try {
        await useUserStore().getInfo()
    } catch (error) {
        return logoutToPortal(error)
    } finally {
        isRelogin.show = false
    }

    try {
        const accessRoutes = await usePermissionStore().generateRoutes()
        addAccessRoutes(accessRoutes)
        return resolvePostRouteRegistrationNavigation(to)
    } catch (error) {
        if (isClientRoutePath(to.path)) {
            console.warn('Generate admin routes failed, continue client route navigation.')
            return resolvePostRouteRegistrationNavigation(to)
        }
        return logoutToPortal(error)
    }
}

router.beforeEach(async to => {
    prepareRouteUi(to)

    if (shouldRedirectMobileClientRoute(to)) {
        return { path: H5_APP_DOWNLOAD_PATH, query: { redirect: to.fullPath }, replace: true }
    }

    if (!getToken()) {
        return isPublicRoute(to) ? true : createLoginRedirect(to)
    }

    if (to.path === LOGIN_PATH) {
        return { path: getLoginRedirectPath(to.query?.redirect) }
    }

    if (useUserStore().roles.length === 0) {
        return loadUserAndRoutes(to)
    }

    return resolveAuthenticatedNavigation(to)
})

router.afterEach(() => {
    finishRouteProgress()
})

router.onError(() => {
    finishRouteProgress()
})
