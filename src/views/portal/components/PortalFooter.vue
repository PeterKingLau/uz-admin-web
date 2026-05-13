<template>
    <footer id="contact" class="portal-footer">
        <div class="footer-brand">
            <div class="brand-row">
                <img :src="brandLogo" alt="" />
                <strong>{{ ui.brandName }}</strong>
            </div>
            <p>{{ ui.intro }}</p>
        </div>
        <div v-for="group in footerGroups" :key="group.title" class="footer-group">
            <h3>{{ group.title }}</h3>
            <a v-for="item in group.items.filter(entry => entry.href)" :key="item.label" :href="item.href" :class="{ 'with-icon': item.icon }" @click.prevent="$emit('navigate', item.href || '')">
                <Icon v-if="item.icon" :icon="item.icon" />
                <span>{{ item.label }}</span>
            </a>
            <span v-for="item in group.items.filter(entry => !entry.href)" :key="item.label" class="footer-text" :class="{ 'with-icon': item.icon }">
                <Icon v-if="item.icon" :icon="item.icon" />
                <span>{{ item.label }}</span>
            </span>
        </div>
        <div class="footer-bottom">
            <span>{{ ui.copyright }}</span>
            <a href="https://beian.miit.gov.cn/#/Integrated/recordQuery" target="_blank" rel="noopener noreferrer">{{ ui.icpText }}</a>
        </div>
    </footer>
</template>

<script setup lang="ts">
import type { PortalFooterGroup, PortalUiText } from '../data'

defineOptions({ name: 'PortalFooter' })
defineProps<{
    ui: PortalUiText['footer']
    brandLogo: string
    footerGroups: PortalFooterGroup[]
}>()
defineEmits<{
    navigate: [route: string]
}>()
</script>
