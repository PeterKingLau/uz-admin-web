<template>
    <section id="hero" class="hero-section section-shell">
        <div class="hero-copy">
            <Transition name="portal-fade" mode="out-in">
                <div :key="activeHeroSlide.key" class="hero-copy-slide">
                    <span class="hero-topic">{{ activeHeroSlide.topic }}</span>
                    <h1>{{ activeHeroSlide.title }}</h1>
                    <p>{{ activeHeroSlide.desc }}</p>
                </div>
            </Transition>
            <div class="hero-actions">
                <button type="button" class="primary-action large" @click="$emit('goClient')">{{ ui.enter }}</button>
                <a class="secondary-action large" :href="activeHeroSlide.primaryHref" @click.prevent="$emit('navigate', activeHeroSlide.primaryHref)">
                    {{ activeHeroSlide.primaryText }}
                </a>
                <a class="ghost-action large" :href="activeHeroSlide.secondaryHref" @click.prevent="$emit('navigate', activeHeroSlide.secondaryHref)">
                    {{ activeHeroSlide.secondaryText }}
                </a>
            </div>
            <div class="hero-carousel-controls" :aria-label="ui.carouselAriaLabel">
                <button
                    v-for="(item, index) in heroSlides"
                    :key="item.key"
                    type="button"
                    :class="{ active: index === activeHeroIndex }"
                    :aria-label="`${ui.slideAriaPrefix}${item.topic}`"
                    @click="$emit('setHeroSlide', index)"
                >
                    <span></span>
                </button>
            </div>
        </div>

        <div class="hero-board" :class="activeHeroSlide.tone" :aria-label="ui.boardAriaLabel">
            <div class="hero-board-media" aria-hidden="true">
                <img :src="boardImage" alt="" />
            </div>
            <div class="board-main portal-card">
                <div class="hero-image-frame">
                    <Transition name="portal-fade" mode="out-in">
                        <img :key="activeHeroImage" :src="activeHeroImage" :alt="ui.imageAlt" />
                    </Transition>
                </div>
                <div class="board-head">
                    <span>{{ activeHeroSlide.boardLabel }}</span>
                    <strong>{{ activeHeroSlide.boardStatus }}</strong>
                </div>
                <div class="board-metrics-row">
                    <div v-for="item in heroMetrics.slice(0, 3)" :key="item.label" class="metric-card">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                </div>
                <div class="board-timeline">
                    <div v-for="step in heroFlow" :key="step" class="timeline-row">
                        <i></i>
                        <span>{{ step }}</span>
                    </div>
                </div>
            </div>
            <div class="board-side">
                <div
                    v-for="(card, index) in activeHeroSlide.sideCards"
                    :key="card.label"
                    class="event-card board-side-card portal-card"
                    :class="`side-card-${index}`"
                >
                    <div class="side-card-visual" aria-hidden="true">
                        <img :src="sideCardImages[index % sideCardImages.length]" alt="" />
                    </div>
                    <div class="side-card-content">
                        <span>{{ card.label }}</span>
                        <strong>{{ card.value }}</strong>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PortalHeroSlide, PortalMetric, PortalUiText } from '../data'
import heroImage from '@/assets/images/portal-hero-overview.png'
import eventImage from '@/assets/images/portal-hero-event.png'
import creatorImage from '@/assets/images/portal-hero-creator.png'
import stageImage from '@/assets/images/portal-hero-stage.png'
import metricsImage from '@/assets/images/portal-hero-metrics.png'

defineOptions({ name: 'PortalHeroSection' })
const boardImage = eventImage
const heroImages = [heroImage, eventImage, creatorImage]
const sideCardImages = [stageImage, metricsImage]
const props = defineProps<{
    ui: PortalUiText['hero']
    heroSlides: PortalHeroSlide[]
    activeHeroIndex: number
    activeHeroSlide: PortalHeroSlide
    heroMetrics: PortalMetric[]
    heroFlow: string[]
}>()
const activeHeroImage = computed(() => heroImages[props.activeHeroIndex % heroImages.length])
defineEmits<{
    goClient: []
    navigate: [route: string]
    setHeroSlide: [index: number]
}>()
</script>
