import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElNotification, ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { tansParams, blobValidate } from '@/utils/utils'
import cache from '@/plugins/cache'
import { saveAs } from 'file-saver'
import useUserStore from '@/store/modules/user'

let downloadLoadingInstance: ReturnType<typeof ElLoading.service> | undefined

// 是否显示重新登录
export let isRelogin: { show: boolean } = { show: false }

// axios 默认头（在 TS 下用 common 更稳一些）
axios.defaults.headers.common['Content-Type'] = 'application/json;charset=utf-8'

// 创建axios实例
const service: AxiosInstance = axios.create({
    // axios中请求配置有baseURL选项，表示请求URL公共部分
    baseURL: import.meta.env.VITE_APP_BASE_API,
    // 超时
    timeout: 300000
})

// request拦截器
service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // headers 可能为 AxiosHeaders，这里统一转成 any 方便挂自定义字段
        const headers: Record<string, any> = config.headers as any

        // 是否需要设置 token
        const isToken = headers?.isToken === false
        // 是否需要防止数据重复提交
        const isRepeatSubmit = headers?.repeatSubmit === false

        if (getToken() && !isToken) {
            headers['Authorization'] = 'Bearer ' + getToken() // 让每个请求携带自定义token
        }

        // get请求映射params参数
        if (config.method === 'get' && config.params) {
            let url = config.url || ''
            const paramsStr = tansParams(config.params)
            if (paramsStr) {
                url += (url.includes('?') ? '&' : '?') + paramsStr
                url = url.replace(/&$/, '')
            }
            config.params = {}
            config.url = url
        }

        if (config.data instanceof FormData) {
            delete headers['Content-Type']
            delete headers['content-type']
            return config
        }

        // 防重复提交（非 FormData）
        if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put') && !(config.data instanceof FormData)) {
            const requestObj = {
                url: config.url,
                data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
                time: new Date().getTime()
            }
            const requestSize = Object.keys(JSON.stringify(requestObj)).length // 请求数据大小
            const limitSize = 5 * 1024 * 1024 // 限制存放数据5M
            if (requestSize >= limitSize) {
                console.warn(`[${config.url}]: 请求数据大小超出允许的5M限制，无法进行防重复提交验证。`)
                return config
            }
            const sessionObj = cache.session.getJSON('sessionObj') as
                | {
                      url: string
                      data: string
                      time: number
                  }
                | undefined
            if (!sessionObj) {
                cache.session.setJSON('sessionObj', requestObj)
            } else {
                const s_url = sessionObj.url // 请求地址
                const s_data = sessionObj.data // 请求数据
                const s_time = sessionObj.time // 请求时间
                const interval = 1000 // 间隔时间(ms)，小于此时间视为重复提交
                if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
                    const message = '数据正在处理，请勿重复提交'
                    console.warn(`[${s_url}]: ` + message)
                    return Promise.reject(new Error(message))
                } else {
                    cache.session.setJSON('sessionObj', requestObj)
                }
            }
        }
        return config
    },
    error => {
        console.log(error)
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    (res: AxiosResponse<any>) => {
        // 未设置状态码则默认成功状态
        const code: number = res.data?.code ?? 200
        // 获取错误信息
        const msg: string = errorCode[code] || res.data?.msg || errorCode['default']

        // 二进制数据则直接返回
        if (res.request?.responseType === 'blob' || res.request?.responseType === 'arraybuffer') {
            return res.data
        }

        if (code === 401) {
            if (!isRelogin.show) {
                isRelogin.show = true
                ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
                    confirmButtonText: '重新登录',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                    .then(() => {
                        isRelogin.show = false
                        useUserStore()
                            .logOut()
                            .then(() => {
                                location.href = '/index'
                            })
                    })
                    .catch(() => {
                        isRelogin.show = false
                    })
            }
            return Promise.reject(new Error('无效的会话，或者会话已过期，请重新登录。'))
        } else if (code === 500) {
            ElMessage({ message: msg, type: 'error' })
            return Promise.reject(new Error(msg))
        } else if (code === 601) {
            ElMessage({ message: msg, type: 'warning' })
            return Promise.reject(new Error(msg))
        } else if (code !== 200) {
            ElNotification.error({ title: msg })
            return Promise.reject(new Error('error'))
        } else {
            // 这里直接返回 res.data（已在业务里约定了 code / data 等结构）
            return res.data
        }
    },
    error => {
        console.log('err' + error)
        let { message } = error as { message: string }

        if (message === 'Network Error') {
            message = '后端接口连接异常'
        } else if (message.includes('timeout')) {
            message = '系统接口请求超时'
        } else if (message.includes('Request failed with status code')) {
            message = '系统接口' + message.slice(-3) + '异常'
        }
        ElMessage({ message, type: 'error', duration: 5 * 1000 })
        return Promise.reject(error)
    }
)

// 通用下载方法
export function download(url: string, params: Record<string, any>, filename: string, config?: AxiosRequestConfig): Promise<void> {
    downloadLoadingInstance = ElLoading.service({
        text: '正在下载数据，请稍候',
        background: 'rgba(0, 0, 0, 0.7)'
    })
    return service
        .post(url, params, {
            transformRequest: [
                params => {
                    return tansParams(params)
                }
            ],
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            responseType: 'blob',
            ...(config || {})
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
            downloadLoadingInstance?.close()
        })
        .catch(err => {
            console.error(err)
            ElMessage.error('下载文件出现错误，请联系管理员！')
            downloadLoadingInstance?.close()
        })
}

export default service
