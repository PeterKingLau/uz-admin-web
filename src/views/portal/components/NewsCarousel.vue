<template>
    <section id="updates" class="section-shell updates-section">
        <div class="section-heading">
            <div>
                <h2>{{ ui.title }}</h2>
                <p>{{ ui.desc }}</p>
            </div>
            <div class="section-controls">
                <button type="button" :aria-label="ui.prevAriaLabel" @click="$emit('switchNewsPage', 'prev')"><Icon icon="mdi:chevron-left" /></button>
                <button type="button" :aria-label="ui.nextAriaLabel" @click="$emit('switchNewsPage', 'next')"><Icon icon="mdi:chevron-right" /></button>
            </div>
        </div>
        <div class="updates-carousel">
            <div class="updates-track" :style="{ transform: `translateX(-${activeNewsPage * 100}%)` }">
                <div v-for="(page, pageIndex) in newsPages" :key="pageIndex" class="updates-page">
                    <article v-for="item in page" :key="item.title" class="portal-card update-card">
                        <div class="card-meta">
                            <span class="tag">{{ item.type }}</span>
                            <time>{{ item.date }}</time>
                        </div>
                        <h3>{{ item.title }}</h3>
                        <p>{{ item.desc }}</p>
                        <a :href="item.href" class="card-link" @click.prevent="$emit('navigate', item.href)">{{ ui.linkText }} <Icon icon="mdi:arrow-right" /></a>
                    </article>
                </div>
            </div>
        </div>
        <div class="carousel-progress" aria-hidden="true">
            <span v-for="(_, index) in newsPages" :key="index" :class="{ active: index === activeNewsPage }"></span>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { PortalNewsItem, PortalUiText } from '../data'

defineOptions({ name: 'PortalNewsCarousel' })
defineProps<{
    ui: PortalUiText['sections']['news']
    newsPages: PortalNewsItem[][]
    activeNewsPage: number
}>()
defineEmits<{
    switchNewsPage: [direction: 'prev' | 'next']
    navigate: [route: string]
}>()
</script>
