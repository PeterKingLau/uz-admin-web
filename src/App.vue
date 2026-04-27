<template>
    <router-view />
</template>

<script setup>
defineOptions({ name: 'App' })
import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import useSettingsStore from '@/store/modules/settings'
import { clearAllPageScrollLocks } from '@/utils/scrollLock'
import useUserStore from '@/store/modules/user'
import { handleThemeStyle } from '@/utils/theme'

const userStore = useUserStore()

function syncCurrentUserProfile() {
    userStore.ensureFreshProfile().catch(() => {})
}

function handleVisibilityChange() {
    if (document.visibilityState !== 'visible') return
    syncCurrentUserProfile()
}

onMounted(() => {
    clearAllPageScrollLocks()
    nextTick(() => {
        handleThemeStyle(useSettingsStore().theme)
    })
    window.addEventListener('focus', syncCurrentUserProfile)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    syncCurrentUserProfile()
})

onBeforeUnmount(() => {
    clearAllPageScrollLocks()
    window.removeEventListener('focus', syncCurrentUserProfile)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>
