// src/plugins/index.ts
import { App } from 'vue'
import tab from './tab'
import auth from './auth'
import cache from './cache'
import modal from './modal'
import download from './download'
import { getImgUrl } from '@/utils/img'

export default function installPlugins(app: App): void {
    // 页签操作
    app.config.globalProperties.$tab = tab
    // 认证对象
    app.config.globalProperties.$auth = auth
    // 缓存对象
    app.config.globalProperties.$cache = cache
    // 模态框对象
    app.config.globalProperties.$modal = modal
    // 下载文件
    app.config.globalProperties.$download = download

    // 将 getImgUrl 方法注册为全局方法
    app.config.globalProperties.$imgUrl = getImgUrl

    // 组合式 API 注入
    app.provide('imgUrl', getImgUrl)
}
