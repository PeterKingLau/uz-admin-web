export const CONTENT_LIST_REFRESH_EVENT = 'content:list:refresh'

const CONTENT_LIST_REFRESH_KEY = 'content:list:refresh_at'

const parseMark = (value: string | null) => {
    const next = Number(value || 0)
    return Number.isFinite(next) ? next : 0
}

export const getContentListRefreshMark = (): number => {
    if (typeof window === 'undefined') return 0
    try {
        return parseMark(window.sessionStorage.getItem(CONTENT_LIST_REFRESH_KEY))
    } catch {
        return 0
    }
}

export const markContentListRefreshNeeded = (): number => {
    const mark = Date.now()
    if (typeof window === 'undefined') return mark
    try {
        window.sessionStorage.setItem(CONTENT_LIST_REFRESH_KEY, String(mark))
    } catch {}
    window.dispatchEvent(new CustomEvent(CONTENT_LIST_REFRESH_EVENT, { detail: { mark } }))
    return mark
}
