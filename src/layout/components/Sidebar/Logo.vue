<template>
    <div class="sidebar-logo-container" :class="{ collapse: collapse }">
        <transition name="sidebarLogoFade">
            <router-link v-if="collapse" key="collapse" class="sidebar-logo-link collapsed-link" to="/">
                <img v-if="logo" :src="logo" class="sidebar-logo" />
                <h1 v-else class="sidebar-title">{{ title }}</h1>
            </router-link>
            <router-link v-else key="expand" class="sidebar-logo-link expand-link" to="/">
                <img v-if="logo" :src="logo" class="sidebar-logo" />
                <h1 class="sidebar-title">{{ title }}</h1>
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

.sidebar-logo-container {
    position: relative;
    width: 100%;
    height: 48px;
    line-height: 50px;
    background: transparent;
    text-align: center;
    overflow: hidden;
    padding-top: 4px;
    box-sizing: content-box;

    & .sidebar-logo-link {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;

        & .sidebar-logo {
            width: 28px;
            height: 28px;
            object-fit: contain;
        }

        & .sidebar-title {
            display: inline-block;
            margin: 0 0 0 12px;
            color: v-bind(getLogoTextColor);
            font-weight: 700;
            line-height: 50px;
            font-size: 16px;
            font-family:
                Avenir,
                Helvetica Neue,
                Arial,
                Helvetica,
                sans-serif;
            white-space: nowrap;
        }
    }

    &.collapse {
        height: 50px;
        padding-top: 4px;

        .sidebar-logo-link.collapsed-link {
            width: 44px;
            height: 44px;
            margin: 0 auto;
            border-radius: 8px;

            &:hover {
                background: rgba(0, 0, 0, 0.04);
            }
        }

        .sidebar-logo {
            width: 32px;
            height: 32px;
            margin-right: 0;
        }
    }
}
</style>
