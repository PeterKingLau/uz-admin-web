
import { App } from 'vue'
import tab from './tab'
import auth from './auth'
import cache from './cache'
import modal from './modal'
import download from './download'
import { getImgUrl } from '@/utils/img'

export default function installPlugins(app: App): void {
    
    app.config.globalProperties.$tab = tab
    
    app.config.globalProperties.$auth = auth
    
    app.config.globalProperties.$cache = cache
    
    app.config.globalProperties.$modal = modal
    
    app.config.globalProperties.$download = download

    
    app.config.globalProperties.$imgUrl = getImgUrl

    
    app.provide('imgUrl', getImgUrl)
}
