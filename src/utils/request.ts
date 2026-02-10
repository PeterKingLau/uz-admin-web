import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElNotification, ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { tansParams, blobValidate } from '@/utils/utils'
import cache from '@/plugins/cache'
import { saveAs } from 'file-saver'
import useUserStore from '@/store/modules/user'

let downloadLoadingInstance: ReturnType<typeof ElLoading.service> | undefined

export const isRelogin = { show: false }

const REPEAT_SUBMIT_INTERVAL = 1000
const REQUEST_SIZE_LIMIT = 5 * 1024 * 1024
const DEFAULT_TIMEOUT = 300000

axios.defaults.headers.common['Content-Type'] = 'application/json;charset=utf-8'

const service: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: DEFAULT_TIMEOUT
})

const pendingRequests = new Map<string, AbortController>()

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
    rawResponse?: boolean
    silentError?: boolean
    skipPending?: boolean
    isToken?: boolean
    repeatSubmit?: boolean
}

interface ExtendedInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
    rawResponse?: boolean
    silentError?: boolean
    skipPending?: boolean
    isToken?: boolean
    repeatSubmit?: boolean
}

const isAbsoluteHttpUrl = (url?: string): boolean => /^https?:\/\//i.test(String(url || '').trim())

function generateRequestKey(config: InternalAxiosRequestConfig): string {
    const { method, url, params, data } = config
    return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

function addPendingRequest(config: InternalAxiosRequestConfig) {
    const requestKey = generateRequestKey(config)

    if (pendingRequests.has(requestKey)) {
        const controller = pendingRequests.get(requestKey)
        controller?.abort()
    }

    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(requestKey, controller)
}

function removePendingRequest(config?: InternalAxiosRequestConfig | AxiosResponse | null) {
    if (!config) return
    const requestKey = generateRequestKey(config as InternalAxiosRequestConfig)
    pendingRequests.delete(requestKey)
}

function handleGetParams(config: InternalAxiosRequestConfig): void {
    if (config.method !== 'get' || !config.params) return

    let url = config.url || ''
    const paramsStr = tansParams(config.params)

    if (paramsStr) {
        url += (url.includes('?') ? '&' : '?') + paramsStr
        url = url.replace(/&$/, '')
    }

    config.params = {}
    config.url = url
}

interface RepeatSubmitCache {
    url: string
    data: string
    time: number
}

function checkRepeatSubmit(config: ExtendedInternalAxiosRequestConfig): boolean {
    const headers: Record<string, any> = (config.headers || {}) as any
    const isRepeatSubmit = config.repeatSubmit !== false && headers?.repeatSubmit !== false

    if (!isRepeatSubmit) return true
    if (config.method !== 'post' && config.method !== 'put') return true
    if (config.data instanceof FormData) return true

    const requestObj: RepeatSubmitCache = {
        url: config.url || '',
        data: typeof config.data === 'object' ? JSON.stringify(config.data) : String(config.data || ''),
        time: Date.now()
    }

    const requestSize = new Blob([JSON.stringify(requestObj)]).size
    if (requestSize >= REQUEST_SIZE_LIMIT) {
        console.warn(`[${config.url}]: request payload too large, skip repeat-submit check`)
        return true
    }

    const sessionObj = cache.session.getJSON('sessionObj') as RepeatSubmitCache | undefined

    if (!sessionObj) {
        cache.session.setJSON('sessionObj', requestObj)
        return true
    }

    const isDuplicate = sessionObj.data === requestObj.data && sessionObj.url === requestObj.url && requestObj.time - sessionObj.time < REPEAT_SUBMIT_INTERVAL
    if (isDuplicate) {
        const message = 'Data is being processed, please do not resubmit'
        console.warn(`[${sessionObj.url}]: ${message}`)
        return false
    }

    cache.session.setJSON('sessionObj', requestObj)
    return true
}

service.interceptors.request.use(
    (config: ExtendedInternalAxiosRequestConfig) => {
        const headers = axios.AxiosHeaders.from(config.headers || {})
        const headerFlags = headers as unknown as Record<string, any>
        config.headers = headers as any

        const isExternalRequest = isAbsoluteHttpUrl(config.url)
        if (isExternalRequest) {
            config.isToken = false
            config.repeatSubmit = false
            config.skipPending = true
            config.withCredentials = false
            if (config.rawResponse === undefined) config.rawResponse = true
            if (config.silentError === undefined) config.silentError = true
        }

        const needToken = config.isToken !== false && headerFlags?.isToken !== false
        if (getToken() && needToken) {
            headers.set('Authorization', `Bearer ${getToken()}`)
        }

        handleGetParams(config)

        if (config.data instanceof FormData) {
            headers.delete('Content-Type')
            headers.delete('content-type')
            return config
        }

        if (!checkRepeatSubmit(config)) {
            return Promise.reject(new Error('Data is being processed, please do not resubmit'))
        }

        const shouldSkipPending = Boolean(config.skipPending || headerFlags?.skipPending)
        if (!shouldSkipPending) {
            addPendingRequest(config)
        }

        // Strip internal meta flags to avoid leaking custom headers in cross-origin requests.
        headers.delete('isToken')
        headers.delete('repeatSubmit')
        headers.delete('skipPending')

        return config
    },
    error => {
        console.error('Request error:', error)
        return Promise.reject(error)
    }
)

const ERROR_HANDLERS: Record<number, (msg: string, res: AxiosResponse) => void> = {
    401: (msg: string, res: AxiosResponse) => {
        const config = (res?.config || {}) as ExtendedAxiosRequestConfig
        const isAnonymousRequest = config.isToken === false
        if (isAnonymousRequest) {
            ElMessage({ message: msg, type: 'error' })
            return
        }

        if (isRelogin.show) return

        isRelogin.show = true
        ElMessageBox.confirm('登录状态已过期，您可以继续停留在该页面，或者重新登录', '系统提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
        })
            .then(() => {
                isRelogin.show = false
                useUserStore()
                    .logOut(false)
                    .then(() => {
                        location.href = '/index'
                    })
            })
            .catch(() => {
                isRelogin.show = false
            })
    },
    500: (msg: string) => {
        ElMessage({ message: msg, type: 'error' })
    },
    601: (msg: string) => {
        ElMessage({ message: msg, type: 'warning' })
    }
}

service.interceptors.response.use(
    (res: AxiosResponse) => {
        removePendingRequest(res.config)

        const config = (res.config || {}) as ExtendedAxiosRequestConfig
        if (config.rawResponse) {
            return res.data
        }

        if (res.request?.responseType === 'blob' || res.request?.responseType === 'arraybuffer') {
            return res.data
        }

        const code = res.data?.code ?? 200
        const msg = errorCode[code] || res.data?.msg || errorCode['default']

        const errorHandler = ERROR_HANDLERS[code]
        if (errorHandler) {
            errorHandler(msg, res)
            return Promise.reject(new Error(msg))
        }

        if (code !== 200) {
            ElNotification.error({ title: msg })
            return Promise.reject(new Error(msg))
        }

        return res.data as any
    },
    error => {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message)
            return Promise.reject(error)
        }

        removePendingRequest(error?.config)

        console.error('Response error:', error)

        let message = error?.message || 'Unknown error'
        const ERROR_MESSAGES: Record<string, string> = {
            'Network Error': 'Network error',
            timeout: 'Request timeout'
        }

        for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
            if (message.includes(key)) {
                message = value
                break
            }
        }

        if (message.includes('Request failed with status code')) {
            const statusCode = message.slice(-3)
            message = `Request failed: ${statusCode}`
        }

        const silentError = Boolean((error?.config as ExtendedAxiosRequestConfig | undefined)?.silentError)
        if (!silentError) {
            ElMessage({ message, type: 'error', duration: 5000 })
        }

        return Promise.reject(error)
    }
)

export function requestOss(config: AxiosRequestConfig): Promise<any> {
    const baseHeaders = (config.headers || {}) as Record<string, any>
    return service({
        ...config,
        withCredentials: false,
        rawResponse: true,
        silentError: true,
        skipPending: true,
        isToken: false,
        repeatSubmit: false,
        headers: {
            ...baseHeaders
        }
    } as ExtendedAxiosRequestConfig)
}

export function download(url: string, params: Record<string, any>, filename: string, config?: AxiosRequestConfig): Promise<void> {
    downloadLoadingInstance = ElLoading.service({
        text: '正在下载数据，请稍候',
        background: 'rgba(0, 0, 0, 0.7)'
    })

    return service
        .post(url, params, {
            transformRequest: [params => tansParams(params)],
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            responseType: 'blob',
            ...config
        })
        .then(async (data: any) => {
            const isBlob = blobValidate(data)

            if (isBlob) {
                const blob = new Blob([data])
                saveAs(blob, filename)
            } else {
                const resText = await data.text()
                const rspObj = JSON.parse(resText)
                const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
                ElMessage.error(errMsg)
            }
        })
        .catch(err => {
            console.error('Download error:', err)
            ElMessage.error('下载文件出现错误，请联系管理员')
        })
        .finally(() => {
            downloadLoadingInstance?.close()
        })
}

export function cancelAllPendingRequests(): void {
    pendingRequests.forEach(controller => {
        controller.abort()
    })
    pendingRequests.clear()
}

export default service
