<template>
    <section id="partners" class="section-shell partner-section">
        <div class="section-heading">
            <h2>{{ ui.title }}</h2>
            <p>{{ ui.desc }}</p>
        </div>
        <div class="partner-marquee" :aria-label="ui.ariaLabel">
            <div class="partner-track">
                <div v-for="(item, index) in partnerMarqueeItems" :key="`${item}-${index}`" class="partner-logo portal-card">
                    <span>{{ item.slice(0, 2) }}</span>
                    <strong>{{ item }}</strong>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { PortalUiText } from '../data'

defineOptions({ name: 'PortalPartnerShowcase' })
defineProps<{
    ui: PortalUiText['sections']['partners']
    partnerMarqueeItems: string[]
}>()
</script>
