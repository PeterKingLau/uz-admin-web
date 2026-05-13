<template>
    <section id="solutions" class="section-shell solution-section">
        <div class="section-heading">
            <h2>{{ ui.title }}</h2>
            <p>{{ ui.desc }}</p>
        </div>
        <div class="solution-grid">
            <article v-for="item in solutionItems" :key="item.title" class="portal-card solution-card">
                <h3>{{ item.title }}</h3>
                <p>{{ item.desc }}</p>
                <div class="solution-points">
                    <span v-for="point in item.points" :key="point">{{ point }}</span>
                </div>
                <a :href="item.href" class="card-link" @click.prevent="$emit('navigate', item.href)">{{ ui.linkText }} <Icon icon="mdi:arrow-right" /></a>
            </article>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { PortalSolutionItem, PortalUiText } from '../data'

defineOptions({ name: 'PortalSolutionSection' })
defineProps<{
    ui: PortalUiText['sections']['solution']
    solutionItems: PortalSolutionItem[]
}>()
defineEmits<{
    navigate: [route: string]
}>()
</script>
