<template>
    <header class="portal-header" :class="{ 'is-menu-open': mobileMenuOpen, 'is-scrolled': scrolled }">
        <a class="brand" href="#hero" @click.prevent="$emit('selectNav', '#hero')">
            <img :src="brandLogo" alt="" class="brand-logo" />
            <span class="brand-name">{{ ui.brandName }}</span>
        </a>

        <nav class="portal-nav" :aria-label="ui.navAriaLabel">
            <a
                v-for="item in navItems"
                :key="item.href"
                :href="item.href"
                :class="{ active: item.href === activeNav }"
                @click.prevent="$emit('selectNav', item.href)"
            >
                {{ item.label }}
            </a>
            <LocaleSwitcher compact class="nav-locale-switcher" />
        </nav>

        <div class="header-actions">
            <LocaleSwitcher compact class="portal-locale-switcher" />
            <button type="button" class="text-action hot-action" @click="$emit('showAppDownload')">
                <span class="hot-action-icon" aria-hidden="true">
                    <Icon icon="mdi:fire" />
                </span>
                {{ ui.appDownload }}
            </button>
            <button type="button" class="text-action" @click="$emit('goClient')">{{ ui.goClient }}</button>
            <button type="button" class="primary-action" @click="$emit('goConsole')">{{ ui.goConsole }}</button>
        </div>

        <button type="button" class="menu-toggle" :aria-expanded="mobileMenuOpen" :aria-label="ui.menuToggleAria" @click="$emit('toggleMobileMenu')">
            <Icon :icon="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" />
        </button>
    </header>
</template>

<script setup lang="ts">
import LocaleSwitcher from '@/components/LocaleSwitcher/index.vue'
import type { PortalUiText } from '../data'

defineOptions({ name: 'PortalHeader' })
defineProps<{
    ui: PortalUiText['header']
    brandLogo: string
    navItems: Array<{ label: string; href: string }>
    mobileMenuOpen: boolean
    scrolled: boolean
    activeNav: string
}>()
defineEmits<{
    closeMobileMenu: []
    selectNav: [href: string]
    toggleMobileMenu: []
    showAppDownload: []
    goClient: []
    goConsole: []
}>()
</script>

<style scoped lang="scss">
.nav-locale-switcher {
    display: none;
}

.portal-locale-switcher {
    flex: 0 0 auto;
}

@media screen and (max-width: 1200px) {
    .nav-locale-switcher {
        display: inline-flex;
        margin-top: 8px;
    }
}
</style>
