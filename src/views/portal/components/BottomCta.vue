<template>
    <section id="about" class="section-shell bottom-cta portal-card">
        <div class="cta-content">
            <h2>{{ ui.title }}</h2>
            <p>{{ ui.desc }}</p>
        </div>
        <div class="bottom-actions">
            <button type="button" class="secondary-action large" @click="$emit('showAppDownload')">{{ ui.download }}</button>
            <button type="button" class="primary-action large" @click="$emit('goClient')">{{ ui.enter }}</button>
            <a class="secondary-action large" href="#contact" @click.prevent="$emit('navigate', '#contact')">{{ ui.contact }}</a>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { PortalUiText } from '../data'

defineOptions({ name: 'PortalBottomCta' })
defineProps<{
    ui: PortalUiText['sections']['bottomCta']
}>()
defineEmits<{
    goClient: []
    showAppDownload: []
    navigate: [route: string]
}>()
</script>
