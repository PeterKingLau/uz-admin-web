import { createApp } from 'vue'
import Cookies from 'js-cookie'
import ElementPlus, { type ComponentSize } from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
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
import 'virtual:svg-icons-register'
import SvgIcon from '@/components/SvgIcon/index.vue'
import elementIcons from '@/components/SvgIcon/svgicon'

import './permission' // permission control

import { useDict } from '@/utils/dict'
import { getConfigKey } from '@/api/system/config'
import { parseTime, resetForm, addDateRange, handleTree, selectDictLabel, selectDictLabels } from '@/utils/ruoyi'

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

import { Icon, addCollection } from '@iconify/vue/dist/offline'
import type { IconifyJSON } from '@iconify/types'
import mdiIcons from '@iconify-json/mdi/icons.json'
import epIcons from '@iconify-json/ep/icons.json'
import simpleIcons from '@iconify-json/simple-icons/icons.json'
import materialSymbols from '@iconify-json/material-symbols/icons.json'

addCollection(mdiIcons as IconifyJSON)
addCollection(epIcons as IconifyJSON)
addCollection(simpleIcons as IconifyJSON)
addCollection(materialSymbols as IconifyJSON)

const app = createApp(App)

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

app.use(router)
app.use(store)
app.use(plugins)
app.use(elementIcons)
app.component('svg-icon', SvgIcon)
app.component('Icon', Icon)

directive(app)

const cookieSize = Cookies.get('size') as ComponentSize | undefined
const elementSize: ComponentSize = cookieSize ?? 'default'

app.use(ElementPlus, {
    locale,
    size: elementSize
})

app.mount('#app')
