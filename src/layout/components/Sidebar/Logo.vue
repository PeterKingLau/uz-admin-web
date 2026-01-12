<template>
    <div class="relative w-full h-[50px] flex items-center justify-center bg-transparent overflow-hidden">
        <transition name="sidebarLogoFade">
            <router-link v-if="collapse" key="collapse" class="!flex items-center justify-center w-full h-full" to="/">
                <img v-if="logo" :src="logo" class="w-8 h-8 object-contain select-none" />
                <h1 v-else class="font-bold text-base select-none truncate" :style="{ color: getLogoTextColor }">
                    {{ title }}
                </h1>
            </router-link>

            <router-link v-else key="expand" class="!flex items-center justify-center w-full h-full" to="/">
                <div class="flex items-center justify-center gap-3 h-full">
                    <img v-if="logo" :src="logo" class="w-7 h-7 object-contain select-none block" />
                    <h1
                        class="font-bold text-base select-none whitespace-nowrap leading-none mt-0.5"
                        :style="{ color: getLogoTextColor, fontFamily: 'Avenir, Helvetica Neue, Arial, Helvetica, sans-serif' }"
                    >
                        {{ title }}
                    </h1>
                </div>
            </router-link>
        </transition>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import logo from '@/assets/logo/logo.png'
import useSettingsStore from '@/store/modules/settings'

defineProps({
    collapse: {
        type: Boolean,
        required: true
    }
})

const title = import.meta.env.VITE_APP_TITLE
const settingsStore = useSettingsStore()

const getLogoTextColor = computed(() => {
    if (settingsStore.isDark || settingsStore.sideTheme === 'theme-dark') {
        return '#ffffff'
    }
    return '#1f2937'
})
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
    transition: opacity 1.5s;
}

.sidebarLogoFade-enter-from,
.sidebarLogoFade-leave-to {
    opacity: 0;
}
</style>
