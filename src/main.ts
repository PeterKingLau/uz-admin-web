import { createApp } from 'vue'
import Cookies from 'js-cookie'
import ElementPlus, { type ComponentSize } from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import zhCN from 'video.js/dist/lang/zh-CN.json'
import locale from 'element-plus/es/locale/lang/zh-cn'

import '@/assets/styles/index.scss' // global css

import App from './App.vue'
import store from './store'
import router from './router'
import directive from './directive' // directive

// 注册指令
import plugins from './plugins' // plugins
import { download } from '@/utils/request'

// svg图标
// import 'virtual:svg-icons-register'
// import SvgIcon from '@/components/SvgIcon/index.vue'
import elementIcons from '@/components/SvgIcon/svgicon'

import './permission' // permission control

import { useDict } from '@/utils/dict'
import { getConfigKey } from '@/api/system/config'
import { parseTime, resetForm, addDateRange, handleTree, selectDictLabel, selectDictLabels } from '@/utils/utils'

// 分页组件
import Pagination from '@/components/Pagination/index.vue'
// 自定义表格工具组件
import RightToolbar from '@/components/RightToolbar/index.vue'
// 富文本组件
import Editor from '@/components/Editor/index.vue'
// 文件上传组件
import FileUpload from '@/components/FileUpload/index.vue'
// 图片上传组件
import ImageUpload from '@/components/ImageUpload/index.vue'
// 图片预览组件
import MediaPreview from '@/components/MediaPreview/index.vue'
// 字典标签组件
import DictTag from '@/components/DictTag/index.vue'

import { addCollection } from '@iconify/vue/dist/offline'
import AppIcon from '@/components/Icon/index.vue'
import type { IconifyJSON } from '@iconify/types'
import mdiIcons from '@iconify-json/mdi/icons.json'
import epIcons from '@iconify-json/ep/icons.json'
import simpleIcons from '@iconify-json/simple-icons/icons.json'
import materialSymbols from '@iconify-json/material-symbols/icons.json'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

addCollection(mdiIcons as IconifyJSON)
addCollection(epIcons as IconifyJSON)
addCollection(simpleIcons as IconifyJSON)
addCollection(materialSymbols as IconifyJSON)

videojs.addLanguage('zh-CN', zhCN as Record<string, string>)

const app = createApp(App)

type ExposeContext = {
    exposed?: Record<string, any>
    setupState: Record<string, any>
    exposeProxy?: Record<string, any>
    [key: string]: any
}

const hasOwn = (target: Record<string, any>, key: PropertyKey) => Object.prototype.hasOwnProperty.call(target, key)

function proxyDefine(context: ExposeContext, proxyContext: Record<string, any>, proxyKey: 'exposed' | 'setupState') {
    const source = context[proxyKey]
    if (!source) return
    Object.keys(source).forEach(key => {
        if (hasOwn(proxyContext, key)) return
        Object.defineProperty(proxyContext, key, {
            configurable: true,
            enumerable: true,
            get() {
                return source[key]
            },
            set(newValue) {
                source[key] = newValue
            }
        })
    })
}

function defineDev(context: ExposeContext) {
    const proxy = {}
    proxyDefine(context, proxy, 'exposed')
    proxyDefine(context, proxy, 'setupState')
    return proxy
}

function helpProxy(context: ExposeContext, key: PropertyKey, update: boolean, value?: any) {
    const get = (proxyContext: Record<string, any>) => Reflect.get(proxyContext, key)
    const set = (proxyContext: Record<string, any>, newValue: any) => Reflect.set(proxyContext, key, newValue)
    if (context.exposed && hasOwn(context.exposed, key)) return update ? set(context.exposed, value) : get(context.exposed)
    if (hasOwn(context.setupState, key)) return update ? set(context.setupState, value) : get(context.setupState)
    return Reflect.get(context, key)
}

const onVnodeBeforeMountRef_ = (vNode: any) => {
    const { component } = vNode
    if (!component) return
    const proxyContext = defineDev(component)
    component.exposeProxy = new Proxy(proxyContext, {
        get(_, key) {
            return helpProxy(component, key, false)
        },
        set(_, key, value) {
            return helpProxy(component, key, true, value)
        }
    })
}

app.config.globalProperties.$videojs = videojs
app.config.globalProperties.useDict = useDict
app.config.globalProperties.download = download
app.config.globalProperties.parseTime = parseTime
app.config.globalProperties.resetForm = resetForm
app.config.globalProperties.handleTree = handleTree
app.config.globalProperties.addDateRange = addDateRange
app.config.globalProperties.getConfigKey = getConfigKey
app.config.globalProperties.selectDictLabel = selectDictLabel
app.config.globalProperties.selectDictLabels = selectDictLabels

app.component('DictTag', DictTag)
app.component('Pagination', Pagination)
app.component('FileUpload', FileUpload)
app.component('ImageUpload', ImageUpload)
app.component('MediaPreview', MediaPreview)
app.component('RightToolbar', RightToolbar)
app.component('Editor', Editor)

store.use(piniaPluginPersistedstate)

app.use(router)
app.use(store)
app.use(plugins)
app.use(elementIcons)
app.config.globalProperties.onVnodeBeforeMountRef_ = onVnodeBeforeMountRef_
// app.component('svg-icon', SvgIcon)
app.component('Icon', AppIcon)

directive(app)

const cookieSize = Cookies.get('size') as ComponentSize | undefined
const elementSize: ComponentSize = cookieSize ?? 'default'

app.use(ElementPlus, {
    locale,
    size: elementSize,
    zIndex: 10000
})

app.mount('#app')
