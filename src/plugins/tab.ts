import useTagsViewStore from '@/store/modules/tagsView'
import router from '@/router'

export default {
    refreshPage(obj?: any) {
        const { path, query, matched } = router.currentRoute.value
        if (obj === undefined) {
            matched.forEach(m => {
                if (m.components && m.components.default && m.components.default.name) {
                    if (!['Layout', 'ParentView'].includes(m.components.default.name)) {
                        obj = { name: m.components.default.name, path: path, query: query }
                    }
                }
            })
        }
        return useTagsViewStore()
            .delCachedView(obj)
            .then(() => {
                const { path, query } = obj
                router.replace({
                    path: '/redirect' + path,
                    query: query
                })
            })
    },

    closeOpenPage(obj?: any) {
        useTagsViewStore().delView(router.currentRoute.value)
        if (obj !== undefined) {
            return router.push(obj)
        }
    },

    closePage(obj?: any) {
        if (obj === undefined) {
            return useTagsViewStore()
                .delView(router.currentRoute.value)
                .then(({ lastPath }) => {
                    return router.push(lastPath || '/index')
                })
        }
        return useTagsViewStore().delView(obj)
    },

    closeAllPage() {
        return useTagsViewStore().delAllViews()
    },

    closeLeftPage(obj: any) {
        return useTagsViewStore().delLeftTags(obj || router.currentRoute.value)
    },

    closeRightPage(obj: any) {
        return useTagsViewStore().delRightTags(obj || router.currentRoute.value)
    },

    closeOtherPage(obj: any) {
        return useTagsViewStore().delOthersViews(obj || router.currentRoute.value)
    },

    openPage(url: string) {
        return router.push(url)
    },

    updatePage(obj: any) {
        return useTagsViewStore().updateVisitedView(obj)
    }
}
