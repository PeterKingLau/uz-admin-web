<template>
    <section id="competition" class="section-shell showcase-section">
        <div class="showcase-copy">
            <h2>{{ ui.title }}</h2>
            <p>{{ ui.desc }}</p>
            <button type="button" class="secondary-action" @click="$emit('goConsole')">{{ ui.consoleButton }}</button>
        </div>
        <div class="work-list" :class="{ 'is-static': !shouldRollWorks }">
            <span id="works" class="work-list-anchor" aria-hidden="true"></span>
            <div class="work-list-track">
                <div class="work-list-group">
                    <article v-for="item in featuredWorks" :key="item.rank" class="work-row portal-card">
                        <div class="work-rank">{{ item.rank }}</div>
                        <div class="work-info">
                            <strong>{{ item.title }}</strong>
                            <span>{{ item.author }} {{ ui.itemSeparator }} {{ item.competition }}</span>
                            <em>{{ item.updateText }} {{ ui.itemSeparator }} {{ item.activityText }}</em>
                        </div>
                        <div class="work-score">{{ item.score }}</div>
                    </article>
                </div>
                <div v-if="shouldRollWorks" class="work-list-group" aria-hidden="true">
                    <article v-for="item in featuredWorks" :key="`copy-${item.rank}`" class="work-row portal-card">
                        <div class="work-rank">{{ item.rank }}</div>
                        <div class="work-info">
                            <strong>{{ item.title }}</strong>
                            <span>{{ item.author }} {{ ui.itemSeparator }} {{ item.competition }}</span>
                            <em>{{ item.updateText }} {{ ui.itemSeparator }} {{ item.activityText }}</em>
                        </div>
                        <div class="work-score">{{ item.score }}</div>
                    </article>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PortalUiText, PortalWorkItem } from '../data'

defineOptions({ name: 'PortalWorkShowcase' })
const props = defineProps<{
    ui: PortalUiText['sections']['work']
    featuredWorks: PortalWorkItem[]
}>()
defineEmits<{
    goConsole: []
}>()

const shouldRollWorks = computed(() => props.featuredWorks.length > 3)
</script>
