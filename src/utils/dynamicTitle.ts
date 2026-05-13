import defaultSettings from '@/settings'
import useSettingsStore from '@/store/modules/settings'
import { isClientRoutePath } from '@/utils/routeAccess'




export function useDynamicTitle() {
    const settingsStore = useSettingsStore()
    const nextTitle = String(settingsStore.title || '').trim()
    const path = window.location.pathname || ''

    if (path === '/portal') {
        document.title = nextTitle || '职场吧'
        return
    }

    if (nextTitle === '职场吧' || isClientRoutePath(path)) {
        document.title = '职场吧'
        return
    }

    if (settingsStore.dynamicTitle) {
        document.title = nextTitle ? `${nextTitle} - ${defaultSettings.title}` : defaultSettings.title
        return
    }

    document.title = defaultSettings.title
}
