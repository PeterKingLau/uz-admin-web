import { ElLoading, ElMessage, ElMessageBox, ElNotification } from 'element-plus'

let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

const MESSAGE_Z_INDEX = 10000
const MESSAGE_BOX_Z_INDEX = 10000
const DEFAULT_TITLE = '系统提示'
const MESSAGE_CLASS = 'modern-message'
const NOTIFICATION_CLASS = 'modern-notification'
const MESSAGE_BOX_CLASS = 'modern-message-box'
const LOADING_CLASS = 'modern-loading'
const STYLE_ELEMENT_ID = 'app-modern-modal-style'

type AnyObj = Record<string, any>
type TitleOrOptions = string | AnyObj | undefined
type MessageType = 'info' | 'success' | 'warning' | 'error'

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

const MODAL_STYLE_TEXT = `
.modern-message {
    padding: 12px 20px !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
    border: none !important;
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
}

.modern-message .el-message__content {
    font-weight: 500 !important;
}

.modern-message.el-message--success {
    background: rgba(240, 249, 235, 0.9) !important;
}

.modern-message.el-message--warning {
    background: rgba(253, 246, 236, 0.9) !important;
}

.modern-message.el-message--error {
    background: rgba(254, 240, 240, 0.9) !important;
}

html.dark .modern-message {
    background: rgba(30, 30, 30, 0.85) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
}

.modern-notification {
    border-radius: 16px !important;
    padding: 16px 24px !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px) !important;
}

html.dark .modern-notification {
    background: rgba(30, 30, 30, 0.9) !important;
    border-color: rgba(255, 255, 255, 0.05) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
}

.modern-message-box {
    position: relative !important;
    border-radius: 20px !important;
    padding: 24px !important;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12) !important;
    border: none !important;
}

.modern-message-box .el-message-box__header {
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    min-height: 32px !important;
    padding: 0 44px 16px 0 !important;
}

.modern-message-box .el-message-box__title {
    font-weight: 700 !important;
    font-size: 18px !important;
    line-height: 1.4 !important;
    color: var(--el-text-color-primary) !important;
}

.modern-message-box .el-message-box__headerbtn {
    top: 0 !important;
    right: 0 !important;
    width: 32px !important;
    height: 32px !important;
    border-radius: 999px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: var(--el-text-color-secondary) !important;
    transition:
        background-color 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease !important;
}

.modern-message-box .el-message-box__headerbtn:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent) !important;
    color: var(--el-color-primary) !important;
    transform: scale(1.04) !important;
}

.modern-message-box .el-message-box__close {
    font-size: 18px !important;
    line-height: 1 !important;
}

.modern-message-box .el-message-box__content {
    font-size: 15px !important;
    padding: 0 0 20px !important;
    line-height: 1.6 !important;
}

.modern-message-box .el-message-box__container {
    display: flex !important;
    align-items: flex-start !important;
    gap: 12px !important;
}

.modern-message-box .el-message-box__status {
    position: static !important;
    margin-top: 2px !important;
    transform: none !important;
    flex-shrink: 0 !important;
    font-size: 22px !important;
}

.modern-message-box .el-message-box__message {
    margin: 0 !important;
    color: var(--el-text-color-regular) !important;
    line-height: 1.7 !important;
}

.modern-message-box .el-message-box__btns {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 12px !important;
    padding-top: 4px !important;
}

.modern-message-box .el-message-box__btns .el-button + .el-button {
    margin-left: 0 !important;
}

.modern-message-box .el-button {
    min-width: 80px !important;
    border-radius: 10px !important;
    padding: 10px 24px !important;
    height: auto !important;
    font-weight: 600 !important;
    transition: all 0.2s !important;
}

.modern-message-box .el-button--primary {
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2) !important;
}

.modern-message-box .el-button--primary:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3) !important;
}

.modern-message-box .el-message-box__input {
    padding-top: 10px !important;
}

.modern-message-box .el-input__wrapper {
    border-radius: 10px !important;
    padding: 4px 12px !important;
    box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset !important;
}

.modern-message-box .el-input__wrapper:hover {
    box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
}

.modern-message-box .el-input__wrapper.is-focus {
    box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2) inset !important;
}

html.dark .modern-message-box {
    background-color: var(--el-bg-color-overlay) !important;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
}

html.dark .modern-message-box .el-message-box__headerbtn:hover {
    background: color-mix(in srgb, var(--el-color-primary) 18%, transparent) !important;
}

.modern-loading .el-loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.modern-loading .el-loading-text {
    font-size: 15px !important;
    font-weight: 600 !important;
    margin-top: 12px !important;
    letter-spacing: 1px !important;
}
`

function isClient() {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function normalizeCustomClass(customClass?: string) {
    return [MESSAGE_BOX_CLASS, customClass].filter(Boolean).join(' ')
}

function ensureModalStyles() {
    if (!isClient()) return
    if (document.getElementById(STYLE_ELEMENT_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ELEMENT_ID
    style.textContent = MODAL_STYLE_TEXT
    document.head.appendChild(style)
}

function resolveTitleAndOptions(title?: TitleOrOptions, options?: AnyObj) {
    const resolvedTitle = typeof title === 'string' ? title : DEFAULT_TITLE
    const resolvedOptions = (title && typeof title === 'object' ? title : options) || {}
    return { resolvedTitle, resolvedOptions }
}

function patchNotificationZIndex() {
    if (!isClient()) return
    const root = document.documentElement
    const current = Number(getComputedStyle(root).getPropertyValue('--el-notification-z-index') || 0)
    if (!Number.isFinite(current) || current < MESSAGE_Z_INDEX) {
        root.style.setProperty('--el-notification-z-index', String(MESSAGE_Z_INDEX))
    }
}

function createBoxOptions(extra: AnyObj = {}) {
    return {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        lockScroll: false,
        closeOnClickModal: false,
        closeOnPressEscape: true,
        customClass: normalizeCustomClass(extra.customClass),
        ...extra
    } as AnyObj
}

function forceLoadingZIndex(inst: any, zIndex: number) {
    if (!inst || !isClient()) return

    if (typeof inst.setText === 'function') {
        try {
            inst.setText(inst.text || '')
        } catch {}
    }

    try {
        if ('zIndex' in inst) inst.zIndex = zIndex
    } catch {}

    const vmEl: HTMLElement | undefined = inst?.vm?.$el
    if (vmEl?.style) {
        vmEl.style.zIndex = String(zIndex)
    }

    const mask = document.querySelector<HTMLElement>('.el-loading-mask.is-fullscreen')
    if (mask) {
        mask.style.zIndex = String(zIndex)
    }
}

function openMessage(type: MessageType, content: string) {
    ensureModalStyles()
    ElMessage({
        message: content,
        type,
        zIndex: MESSAGE_Z_INDEX,
        customClass: MESSAGE_CLASS
    })
}

function openNotification(type: MessageType, content: string) {
    ensureModalStyles()
    patchNotificationZIndex()
    ElNotification({
        message: content,
        type,
        zIndex: MESSAGE_Z_INDEX,
        customClass: NOTIFICATION_CLASS
    })
}

function openAlert(type: MessageType, content: string) {
    ensureModalStyles()
    const options = createBoxOptions({
        type,
        zIndex: MESSAGE_BOX_Z_INDEX
    })
    return ElMessageBox.alert(content, DEFAULT_TITLE, options as any)
}

const modal: ModalMethods = {
    msg(content: string) {
        openMessage('info', content)
    },
    msgError(content: string) {
        openMessage('error', content)
    },
    msgSuccess(content: string) {
        openMessage('success', content)
    },
    msgWarning(content: string) {
        openMessage('warning', content)
    },

    alert(content: string) {
        return openAlert('info', content)
    },
    alertError(content: string) {
        return openAlert('error', content)
    },
    alertSuccess(content: string) {
        return openAlert('success', content)
    },
    alertWarning(content: string) {
        return openAlert('warning', content)
    },

    notify(content: string) {
        openNotification('info', content)
    },
    notifyError(content: string) {
        openNotification('error', content)
    },
    notifySuccess(content: string) {
        openNotification('success', content)
    },
    notifyWarning(content: string) {
        openNotification('warning', content)
    },

    confirm(content: string, title?: TitleOrOptions, options?: AnyObj) {
        ensureModalStyles()
        const { resolvedTitle, resolvedOptions } = resolveTitleAndOptions(title, options)
        const boxOptions = createBoxOptions({
            type: 'warning',
            zIndex: MESSAGE_BOX_Z_INDEX,
            ...resolvedOptions
        })
        return ElMessageBox.confirm(content, resolvedTitle, boxOptions as any)
    },

    prompt(content: string, title?: TitleOrOptions, options?: AnyObj) {
        ensureModalStyles()
        const { resolvedTitle, resolvedOptions } = resolveTitleAndOptions(title, options)
        const boxOptions = createBoxOptions({
            type: 'info',
            zIndex: MESSAGE_BOX_Z_INDEX,
            ...resolvedOptions
        })
        return ElMessageBox.prompt(content, resolvedTitle, boxOptions as any)
    },

    loading(content: string) {
        ensureModalStyles()
        loadingInstance?.close()
        loadingInstance = ElLoading.service({
            lock: true,
            text: content,
            background: 'rgba(0, 0, 0, 0.65)',
            fullscreen: true,
            customClass: LOADING_CLASS
        })
        forceLoadingZIndex(loadingInstance as any, MESSAGE_BOX_Z_INDEX)
    },

    closeLoading() {
        loadingInstance?.close()
        loadingInstance = null
    }
}

export default modal
