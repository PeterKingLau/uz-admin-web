<template>
    <section class="section-shell metrics-section">
        <div class="section-heading">
            <div>
                <h2>{{ ui.title }}</h2>
                <p>{{ ui.desc }}</p>
            </div>
        </div>
        <div class="metrics-panel portal-card">
            <article v-for="item in dataMetrics" :key="item.label" class="data-metric-card">
                <div class="data-metric-icon">
                    <Icon :icon="item.icon" />
                </div>
                <div class="data-metric-content">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <p>{{ item.desc }}</p>
                </div>
            </article>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { PortalDataMetric, PortalUiText } from '../data'

defineOptions({ name: 'PortalDataMetrics' })
defineProps<{
    ui: PortalUiText['sections']['metrics']
    dataMetrics: PortalDataMetric[]
}>()
</script>
