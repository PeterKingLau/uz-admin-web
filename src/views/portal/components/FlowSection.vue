<template>
    <section id="guide" class="section-shell flow-section">
        <div class="section-heading">
            <h2>{{ ui.title }}</h2>
            <p>{{ ui.desc }}</p>
        </div>
        <div class="flow-grid">
            <article v-for="(item, index) in flowSteps" :key="item.title" class="flow-card portal-card">
                <span class="step-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <h3>{{ item.title }}</h3>
                <p>{{ item.desc }}</p>
            </article>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { PortalFlowStep, PortalUiText } from '../data'

defineOptions({ name: 'PortalFlowSection' })
defineProps<{
    ui: PortalUiText['sections']['flow']
    flowSteps: PortalFlowStep[]
}>()
</script>
