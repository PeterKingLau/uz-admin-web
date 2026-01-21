import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus'

let loadingInstance: ReturnType<typeof ElLoading.service> | null = null
const MESSAGE_Z_INDEX = 10000
const MESSAGE_BOX_Z_INDEX = 10000

type AnyObj = Record<string, any>
type TitleOrOptions = string | AnyObj | undefined

interface ModalMethods {
    msg(content: string): void
    msgError(content: string): void
    msgSuccess(content: string): void
    msgWarning(content: string): void
    alert(content: string): Promise<any>
    alertError(content: string): Promise<any>
    alertSuccess(content: string): Promise<any>
    alertWarning(content: string): Promise<any>
    notify(content: string): void
    notifyError(content: string): void
    notifySuccess(content: string): void
    notifyWarning(content: string): void
    confirm(content: string, title?: TitleOrOptions, options?: AnyObj): Promise<any>
    prompt(content: string, title?: TitleOrOptions, options?: AnyObj): Promise<any>
    loading(content: string): void
    closeLoading(): void
}

function resolveTitleAndOptions(title?: TitleOrOptions, options?: AnyObj) {
    const resolvedTitle = typeof title === 'string' ? title : '系统提示'
    const resolvedOptions = (title && typeof title === 'object' ? title : options) || {}
    return { resolvedTitle, resolvedOptions }
}

function patchNotificationZIndex() {
    const el = document?.documentElement
    if (!el) return
    const style = getComputedStyle(el)
    const current = Number(style.getPropertyValue('--el-notification-z-index') || 0)
    if (!Number.isFinite(current) || current < MESSAGE_Z_INDEX) {
        el.style.setProperty('--el-notification-z-index', String(MESSAGE_Z_INDEX))
    }
}

function boxOptionsBase(extra?: AnyObj) {
    return {
        title: '系统提示',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        lockScroll: false,
        closeOnClickModal: false,
        closeOnPressEscape: true,
        ...extra
    } as AnyObj
}

function forceLoadingZIndex(inst: any, z: number) {
    if (!inst) return
    if (typeof inst.setText === 'function') {
        try {
            inst.setText(inst.text || '')
        } catch {}
    }
    try {
        if ('zIndex' in inst) inst.zIndex = z
    } catch {}
    const vmEl: HTMLElement | undefined = inst?.vm?.$el
    if (vmEl && vmEl.style) vmEl.style.zIndex = String(z)
    const mask: HTMLElement | null = document.querySelector('.el-loading-mask.is-fullscreen')
    if (mask) mask.style.zIndex = String(z)
}

const modal: ModalMethods = {
    msg(content: string) {
        ElMessage({ message: content, type: 'info', zIndex: MESSAGE_Z_INDEX })
    },
    msgError(content: string) {
        ElMessage({ message: content, type: 'error', zIndex: MESSAGE_Z_INDEX })
    },
    msgSuccess(content: string) {
        ElMessage({ message: content, type: 'success', zIndex: MESSAGE_Z_INDEX })
    },
    msgWarning(content: string) {
        ElMessage({ message: content, type: 'warning', zIndex: MESSAGE_Z_INDEX })
    },

    alert(content: string) {
        const opts = boxOptionsBase({ type: 'info', zIndex: MESSAGE_BOX_Z_INDEX })
        return ElMessageBox.alert(content, opts as any)
    },
    alertError(content: string) {
        const opts = boxOptionsBase({ type: 'error', zIndex: MESSAGE_BOX_Z_INDEX })
        return ElMessageBox.alert(content, opts as any)
    },
    alertSuccess(content: string) {
        const opts = boxOptionsBase({ type: 'success', zIndex: MESSAGE_BOX_Z_INDEX })
        return ElMessageBox.alert(content, opts as any)
    },
    alertWarning(content: string) {
        const opts = boxOptionsBase({ type: 'warning', zIndex: MESSAGE_BOX_Z_INDEX })
        return ElMessageBox.alert(content, opts as any)
    },

    notify(content: string) {
        patchNotificationZIndex()
        ElNotification({ message: content, type: 'info', zIndex: MESSAGE_Z_INDEX })
    },
    notifyError(content: string) {
        patchNotificationZIndex()
        ElNotification({ message: content, type: 'error', zIndex: MESSAGE_Z_INDEX })
    },
    notifySuccess(content: string) {
        patchNotificationZIndex()
        ElNotification({ message: content, type: 'success', zIndex: MESSAGE_Z_INDEX })
    },
    notifyWarning(content: string) {
        patchNotificationZIndex()
        ElNotification({ message: content, type: 'warning', zIndex: MESSAGE_Z_INDEX })
    },

    confirm(content: string, title?: TitleOrOptions, options?: AnyObj) {
        const { resolvedTitle, resolvedOptions } = resolveTitleAndOptions(title, options)
        const opts = boxOptionsBase({
            title: resolvedTitle,
            type: 'warning',
            zIndex: MESSAGE_BOX_Z_INDEX,
            ...resolvedOptions
        })
        return ElMessageBox.confirm(content, opts as any)
    },

    prompt(content: string, title?: TitleOrOptions, options?: AnyObj) {
        const { resolvedTitle, resolvedOptions } = resolveTitleAndOptions(title, options)
        const opts = boxOptionsBase({
            title: resolvedTitle,
            type: 'warning',
            zIndex: MESSAGE_BOX_Z_INDEX,
            ...resolvedOptions
        })
        return ElMessageBox.prompt(content, opts as any)
    },

    loading(content: string) {
        loadingInstance?.close()
        loadingInstance = ElLoading.service({
            lock: true,
            text: content,
            background: 'rgba(0, 0, 0, 0.7)',
            fullscreen: true
        })
        forceLoadingZIndex(loadingInstance as any, MESSAGE_BOX_Z_INDEX)
    },

    closeLoading() {
        loadingInstance?.close()
        loadingInstance = null
    }
}

export default modal
