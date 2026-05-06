import auth from '@/plugins/auth'
import cache from '@/plugins/cache'
import modal from '@/plugins/modal'
import tab from '@/plugins/tab'
import download from '@/plugins/download'
import { getImgUrl } from '@/utils/img'
import { useDict } from '@/utils/dict'
import { download as utilsDownload } from '@/utils/request'
import { addDateRange, handleTree, parseTime, resetForm, selectDictLabel, selectDictLabels } from '@/utils/utils'

export {}
declare module 'vue' {
    interface ComponentCustomProperties {
        useDict: typeof useDict
        download: typeof utilsDownload
        parseTime: typeof parseTime
        resetForm: typeof resetForm
        handleTree: typeof handleTree
        addDateRange: typeof addDateRange
        selectDictLabel: typeof selectDictLabel
        selectDictLabels: typeof selectDictLabels

        $tab: typeof tab
        
        $auth: typeof auth
        
        $cache: typeof cache
        
        $modal: typeof modal
        
        $download: typeof download
        
        $imgUrl: typeof getImgUrl
    }
}

declare global {
    interface Window {
        VConsole: any
    }
}
