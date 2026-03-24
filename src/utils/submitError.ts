const EXTENSION_MESSAGE_CHANNEL_CLOSED_ERROR =
    'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received'

export const isExtensionMessageChannelClosedError = (error: unknown): boolean =>
    String((error as any)?.message || error || '').includes(EXTENSION_MESSAGE_CHANNEL_CLOSED_ERROR)

export const resolveSubmitErrorMessage = (error: unknown, fallbackMessage = '发布失败，请重试'): string => {
    if (isExtensionMessageChannelClosedError(error)) {
        return '检测到浏览器扩展通信异常，请先禁用相关扩展后重试'
    }

    const message = String((error as any)?.message || '').trim()
    if (!message) return fallbackMessage

    if (message.toLowerCase().includes('timeout')) {
        return '请求超时，请稍后重试'
    }

    return message
}

export const logSubmitError = (error: unknown): void => {
    if (isExtensionMessageChannelClosedError(error)) return
    console.error(error)
}
