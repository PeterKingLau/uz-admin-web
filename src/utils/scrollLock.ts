import { onScopeDispose } from 'vue'

const HTML_LOCK_CLASS = 'app-scroll-locked'
const BODY_LOCK_CLASS = 'app-scroll-locked'
const ROOT_LOCK_CLASS = 'app-scroll-root-locked'
const CUSTOM_SCROLL_ROOT_SELECTORS = ['.discover-page']

const activeLocks = new Set<symbol>()
let lockSnapshot:
    | {
          scrollX: number
          scrollY: number
          bodyPosition: string
          bodyTop: string
          bodyLeft: string
          bodyRight: string
          bodyWidth: string
          bodyPaddingRight: string
      }
    | null = null

const isClient = () => typeof window !== 'undefined' && typeof document !== 'undefined'

const resolveCustomScrollRoots = () => {
    if (!isClient()) return [] as HTMLElement[]
    const selector = CUSTOM_SCROLL_ROOT_SELECTORS.join(', ')
    if (!selector) return [] as HTMLElement[]
    return Array.from(document.querySelectorAll<HTMLElement>(selector))
}

const syncScrollLockState = () => {
    if (!isClient()) return
    const locked = activeLocks.size > 0
    if (locked && !lockSnapshot) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
        lockSnapshot = {
            scrollX: window.scrollX || window.pageXOffset || 0,
            scrollY: window.scrollY || window.pageYOffset || 0,
            bodyPosition: document.body.style.position,
            bodyTop: document.body.style.top,
            bodyLeft: document.body.style.left,
            bodyRight: document.body.style.right,
            bodyWidth: document.body.style.width,
            bodyPaddingRight: document.body.style.paddingRight
        }
        document.body.style.position = 'fixed'
        document.body.style.top = `-${lockSnapshot.scrollY}px`
        document.body.style.left = `-${lockSnapshot.scrollX}px`
        document.body.style.right = '0'
        document.body.style.width = '100%'
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`
        }
    }
    document.documentElement.classList.toggle(HTML_LOCK_CLASS, locked)
    document.body.classList.toggle(BODY_LOCK_CLASS, locked)
    resolveCustomScrollRoots().forEach(element => {
        element.classList.toggle(ROOT_LOCK_CLASS, locked)
    })
    if (!locked && lockSnapshot) {
        const { scrollX, scrollY, bodyPosition, bodyTop, bodyLeft, bodyRight, bodyWidth, bodyPaddingRight } = lockSnapshot
        lockSnapshot = null
        document.body.style.position = bodyPosition
        document.body.style.top = bodyTop
        document.body.style.left = bodyLeft
        document.body.style.right = bodyRight
        document.body.style.width = bodyWidth
        document.body.style.paddingRight = bodyPaddingRight
        window.scrollTo(scrollX, scrollY)
    }
}

const releaseLock = (token: symbol) => {
    if (!activeLocks.has(token)) return
    activeLocks.delete(token)
    syncScrollLockState()
}

export const clearAllPageScrollLocks = () => {
    if (!isClient()) return
    activeLocks.clear()
    syncScrollLockState()
}

export const usePageScrollLock = () => {
    const token = Symbol('page-scroll-lock')
    let locked = false

    const setLocked = (value: boolean) => {
        if (!isClient() || locked === value) return
        locked = value
        if (value) activeLocks.add(token)
        else activeLocks.delete(token)
        syncScrollLockState()
    }

    const lock = () => setLocked(true)
    const unlock = () => setLocked(false)

    onScopeDispose(() => {
        locked = false
        releaseLock(token)
    })

    return {
        lock,
        unlock,
        setLocked
    }
}
