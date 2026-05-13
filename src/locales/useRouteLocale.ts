import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { normalizeLocale } from './index'

export function useRouteLocale() {
    const route = useRoute()
    const { locale } = useI18n({ useScope: 'global' })

    const syncLocale = (value: unknown) => {
        const queryLocale = Array.isArray(value) ? value[0] : value
        locale.value = normalizeLocale(typeof queryLocale === 'string' ? queryLocale : window.navigator.language)
    }

    watch(() => route.query.lang, syncLocale)
    onMounted(() => syncLocale(route.query.lang))

    return { locale }
}
