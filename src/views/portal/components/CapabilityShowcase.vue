<template>
    <section id="capability-demo" class="section-shell capability-demo-section">
        <div class="section-heading">
            <div>
                <h2>{{ ui.title }}</h2>
                <p>{{ ui.desc }}</p>
            </div>
            <div class="play-state">
                <Icon icon="mdi:play-circle-outline" />
                {{ ui.playState }}
            </div>
        </div>
        <div class="capability-demo portal-card">
            <nav class="demo-tabs" :aria-label="ui.navAriaLabel">
                <button
                    v-for="(item, index) in capabilityShowcaseItems"
                    :key="item.key"
                    type="button"
                    :class="{ active: index === activeCapabilityIndex }"
                    @click="$emit('setCapabilitySlide', index)"
                >
                    <Icon :icon="item.icon" />
                    <span>{{ item.nav }}</span>
                </button>
            </nav>
            <Transition name="portal-slide" mode="out-in">
                <div :key="activeCapability.key" class="demo-panel">
                    <div class="demo-copy">
                        <span class="demo-kicker">{{ activeCapability.kicker }}</span>
                        <h3>{{ activeCapability.title }}</h3>
                        <p>{{ activeCapability.desc }}</p>
                        <ul>
                            <li v-for="point in activeCapability.points" :key="point">
                                <Icon icon="mdi:check-circle-outline" />
                                {{ point }}
                            </li>
                        </ul>
                    </div>
                    <div class="demo-visual" :class="activeCapability.tone">
                        <div class="demo-visual-head">
                            <span>{{ activeCapability.visualTitle }}</span>
                            <em>{{ activeCapability.visualStatus }}</em>
                        </div>
                        <div class="demo-stat-grid">
                            <div v-for="stat in activeCapability.stats" :key="stat.label" class="demo-stat">
                                <span>{{ stat.label }}</span>
                                <strong>{{ stat.value }}</strong>
                            </div>
                        </div>
                        <div class="demo-lines">
                            <span v-for="line in activeCapability.lines" :key="line"></span>
                        </div>
                        <div class="demo-progress">
                            <i :key="activeCapability.key"></i>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { PortalCapabilityShowcaseItem, PortalUiText } from '../data'

defineOptions({ name: 'PortalCapabilityShowcase' })
defineProps<{
    ui: PortalUiText['sections']['showcase']
    capabilityShowcaseItems: PortalCapabilityShowcaseItem[]
    activeCapabilityIndex: number
    activeCapability: PortalCapabilityShowcaseItem
}>()
defineEmits<{
    setCapabilitySlide: [index: number]
}>()
</script>
