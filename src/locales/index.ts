import { createI18n } from 'vue-i18n'

export const SUPPORT_LOCALES = ['zh-CN', 'zh-TW', 'en-US'] as const
export type SupportLocale = (typeof SUPPORT_LOCALES)[number]

export const localeLabels: Record<SupportLocale, { label: string; shortLabel: string }> = {
    'zh-CN': { label: '简体中文', shortLabel: '简中' },
    'zh-TW': { label: '繁體中文', shortLabel: '繁中' },
    'en-US': { label: 'English', shortLabel: 'EN' }
}

const messages = {
    'zh-CN': {
        appDownload: {
            brandName: '测吧',
            headerDownload: '下载 App',
            headerLoading: '获取中',
            headerFetch: '获取下载',
            headerIos: 'iOS 开发中',
            kicker: '用户下载入口',
            title: '请前往 App 使用测吧',
            description: '移动端内容浏览、发布、互动和活动参与已在 App 内提供更完整、稳定的使用体验。',
            ariaCarousel: '测吧 App 功能展示',
            ariaQr: '测吧 App 下载二维码',
            slides: {
                contentLabel: '内容推荐',
                contentTitle: '持续浏览内容动态',
                activityLabel: '活动作品',
                activityTitle: '参与活动与作品展示',
                creatorLabel: '创作者主页',
                creatorTitle: '沉淀主页与作品合集',
                dashboardLabel: '运营看板',
                dashboardTitle: '查看进展与互动反馈'
            },
            iosTitle: 'iOS 版本开发中',
            iosDesc: '当前仅提供 Android APK 下载。iOS 版本上线后，我们会在此页面同步更新。',
            emptyLoading: '正在获取下载地址',
            emptyUnavailable: '下载地址暂不可用',
            downloadTitle: '扫码或点击下载',
            latestVersionPending: '获取最新版本后即可下载',
            currentVersion: '当前版本 v{version}',
            downloadAndroid: '立即下载 Android 版',
            retry: '重新获取下载地址',
            backPortal: '返回门户首页',
            toastUnavailable: '下载地址暂不可用',
            toastFailed: '获取下载地址失败，请稍后重试',
            pageTitle: '下载测吧 App'
        }
    },
    'zh-TW': {
        appDownload: {
            brandName: '測吧',
            headerDownload: '下載 App',
            headerLoading: '取得中',
            headerFetch: '取得下載',
            headerIos: 'iOS 開發中',
            kicker: '使用者下載入口',
            title: '請前往 App 使用測吧',
            description: '行動端內容瀏覽、發布、互動和活動參與已在 App 內提供更完整、穩定的使用體驗。',
            ariaCarousel: '測吧 App 功能展示',
            ariaQr: '測吧 App 下載 QR Code',
            slides: {
                contentLabel: '內容推薦',
                contentTitle: '持續瀏覽內容動態',
                activityLabel: '活動作品',
                activityTitle: '參與活動與作品展示',
                creatorLabel: '創作者主頁',
                creatorTitle: '沉澱主頁與作品合集',
                dashboardLabel: '營運看板',
                dashboardTitle: '查看進展與互動回饋'
            },
            iosTitle: 'iOS 版本開發中',
            iosDesc: '目前僅提供 Android APK 下載。iOS 版本上線後，我們會在此頁面同步更新。',
            emptyLoading: '正在取得下載地址',
            emptyUnavailable: '下載地址暫不可用',
            downloadTitle: '掃碼或點擊下載',
            latestVersionPending: '取得最新版本後即可下載',
            currentVersion: '目前版本 v{version}',
            downloadAndroid: '立即下載 Android 版',
            retry: '重新取得下載地址',
            backPortal: '返回門戶首頁',
            toastUnavailable: '下載地址暫不可用',
            toastFailed: '取得下載地址失敗，請稍後重試',
            pageTitle: '下載測吧 App'
        }
    },
    'en-US': {
        appDownload: {
            brandName: 'CeBa',
            headerDownload: 'Download App',
            headerLoading: 'Loading',
            headerFetch: 'Get Link',
            headerIos: 'iOS in progress',
            kicker: 'User download',
            title: 'Continue in the CeBa App',
            description: 'For mobile browsing, publishing, interaction, and activity participation, the app provides a more complete and stable experience.',
            ariaCarousel: 'CeBa app feature showcase',
            ariaQr: 'CeBa app download QR code',
            slides: {
                contentLabel: 'Content feed',
                contentTitle: 'Keep up with content updates',
                activityLabel: 'Activities',
                activityTitle: 'Join activities and showcase works',
                creatorLabel: 'Creator profile',
                creatorTitle: 'Build a profile and work collection',
                dashboardLabel: 'Operations',
                dashboardTitle: 'View progress and engagement'
            },
            iosTitle: 'iOS version in development',
            iosDesc: 'Only the Android APK is available for now. We will update this page when the iOS version is released.',
            emptyLoading: 'Fetching download link',
            emptyUnavailable: 'Download link is unavailable',
            downloadTitle: 'Scan or tap to download',
            latestVersionPending: 'Fetch the latest version to download',
            currentVersion: 'Current version v{version}',
            downloadAndroid: 'Download Android',
            retry: 'Retry download link',
            backPortal: 'Back to portal',
            toastUnavailable: 'Download link is unavailable',
            toastFailed: 'Failed to fetch download link. Please try again later.',
            pageTitle: 'Download CeBa App'
        }
    }
}

export function normalizeLocale(locale?: string | null): SupportLocale {
    const value = String(locale || '').trim()
    if (/^zh-(tw|hk|mo)$/i.test(value)) return 'zh-TW'
    if (/^en/i.test(value)) return 'en-US'
    return 'zh-CN'
}

export const i18n = createI18n({
    legacy: false,
    locale: normalizeLocale(typeof navigator === 'undefined' ? 'zh-CN' : navigator.language),
    fallbackLocale: 'zh-CN',
    messages
})
