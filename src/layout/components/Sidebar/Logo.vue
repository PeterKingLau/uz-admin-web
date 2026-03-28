<template>
    <div class="sidebar-logo">
        <transition name="sidebarLogoFade" mode="out-in">
            <router-link :key="collapse ? 'collapse' : 'expand'" to="/" class="logo-link" :class="{ 'is-collapse': collapse }">
                <div class="logo-content" :class="{ 'is-collapse': collapse }">
                    <img v-if="logo" :src="logo" class="logo-image" :class="{ 'is-collapse': collapse }" />
                    <h1 v-if="!collapse" class="logo-title" :class="{ 'is-collapse': collapse }" :style="{ color: logoTextColor }">
                        {{ title }}
                    </h1>
                </div>
            </router-link>
        </transition>
    </div>
</template>

<script setup>
defineOptions({ name: 'LayoutComponentsSidebarLogo' })
import { computed } from 'vue'
import logo from '@/assets/logo/logo.png'
import variables from '@/assets/styles/variables.module.scss'
import useSettingsStore from '@/store/modules/settings'

defineProps({
    collapse: {
        type: Boolean,
        required: true
    }
})

const title = import.meta.env.VITE_APP_TITLE
const settingsStore = useSettingsStore()

const logoTextColor = computed(() => {
    if (settingsStore.sideTheme === 'theme-dark') {
        return variables.menuActiveText
    }
    if (settingsStore.isDark) {
        return variables.menuActiveText
    }
    return variables.menuLightText
})
</script>

<style lang="scss" scoped>
.sidebar-logo {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 50px;
    overflow: hidden;
    background: transparent;
}

.logo-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    text-decoration: none;

    &.is-collapse {
        padding: 0 8px;
    }
}

.logo-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 100%;
    min-width: 0;

    &.is-collapse {
        gap: 0;
    }
}

.logo-image {
    display: block;
    width: 28px;
    height: 28px;
    object-fit: contain;
    user-select: none;

    &.is-collapse {
        width: 32px;
        height: 32px;
    }
}

.logo-title {
    margin: 2px 0 0;
    font-family:
        Avenir,
        Helvetica Neue,
        Arial,
        Helvetica,
        sans-serif;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    user-select: none;

    &.is-collapse {
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

.sidebarLogoFade-enter-active,
.sidebarLogoFade-leave-active {
    transition:
        opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
        transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
        filter 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.sidebarLogoFade-enter-from,
.sidebarLogoFade-leave-to {
    opacity: 0;
    transform: translateX(-8px) scale(0.985);
    filter: blur(2px);
}

.sidebarLogoFade-enter-to,
.sidebarLogoFade-leave-from {
    opacity: 1;
    transform: translateX(0) scale(1);
    filter: blur(0);
}
</style>
