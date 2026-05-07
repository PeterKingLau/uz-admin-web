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
        
        changeSetting(data: { key: any; value: any }) {
            const { key, value } = data
            if (Object.prototype.hasOwnProperty.call(this, key)) {
                Reflect.set(this, key, value)
            }
        },
        
        setTitle(title: string) {
            this.title = title
            useDynamicTitle()
        },
        
        toggleTheme() {
            this.isDark = !this.isDark
            toggleDark() 
        }
    }
})

export default useSettingsStore
