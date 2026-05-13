<template>
    <section id="content-service" class="section-shell capability-section">
        <div class="section-heading">
            <h2>{{ ui.title }}</h2>
            <p>{{ ui.desc }}</p>
        </div>
        <div class="capability-grid">
            <article v-for="item in capabilityModules" :key="item.title" class="portal-card capability-card">
                <div class="module-icon">
                    <Icon :icon="item.icon" />
                </div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.desc }}</p>
                <ul>
                    <li v-for="point in item.points" :key="point">
                        <Icon icon="mdi:check-circle-outline" class="list-icon" />
                        {{ point }}
                    </li>
                </ul>
                <button type="button" class="card-link" @click="$emit('navigate', item.route)">{{ item.action }} <Icon icon="mdi:arrow-right" /></button>
            </article>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { PortalCapabilityModule, PortalUiText } from '../data'

defineOptions({ name: 'PortalCapabilitySection' })
defineProps<{
    ui: PortalUiText['sections']['capability']
    capabilityModules: PortalCapabilityModule[]
}>()
defineEmits<{
    navigate: [route: string]
}>()
</script>
