import defaultSettings from '@/settings'
import { useDark, useToggle } from '@vueuse/core'
import { useDynamicTitle } from '@/utils/dynamicTitle'
import { defineStore } from 'pinia'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const { sideTheme, showSettings, topNav, tagsView, tagsIcon, fixedHeader, sidebarLogo, dynamicTitle, footerVisible, footerContent } = defaultSettings

const getStorageSetting = () => JSON.parse(localStorage.getItem('layout-setting') ?? '{}') || {}

const storageSetting = getStorageSetting()

const useSettingsStore = defineStore('settings', {
    state: () => ({
        title: '',
        theme: storageSetting.theme || '#409EFF',
        sideTheme: storageSetting.sideTheme || sideTheme,
        showSettings: storageSetting.showSettings ?? showSettings,
        topNav: storageSetting.topNav ?? topNav,
        tagsView: storageSetting.tagsView ?? tagsView,
        tagsIcon: storageSetting.tagsIcon ?? tagsIcon,
        fixedHeader: storageSetting.fixedHeader ?? fixedHeader,
        sidebarLogo: storageSetting.sidebarLogo ?? sidebarLogo,
        dynamicTitle: storageSetting.dynamicTitle ?? dynamicTitle,
        footerVisible: storageSetting.footerVisible ?? footerVisible,
        footerContent: footerContent,
        isDark: isDark.value
    }),
    actions: {
        // 修改布局设置
        changeSetting(data: { key: any; value: any }) {
            const { key, value } = data
            if (this.hasOwnProperty(key)) {
                Reflect.set(this, key, value)
            }
        },
        // 设置网页标题
        setTitle(title: string) {
            this.title = title
            useDynamicTitle()
        },
        // 切换暗黑模式
        toggleTheme() {
            this.isDark = !this.isDark
            toggleDark() // 切换暗黑模式的逻辑
        }
    }
})

export default useSettingsStore
