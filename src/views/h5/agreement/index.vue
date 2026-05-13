<template>
    <div class="legal-page">
        <div class="h5-legal-toolbar">
            <LocaleSwitcher compact />
        </div>
        <header class="legal-hero">
            <div class="eyebrow">{{ legalContent.agreement.title }}</div>
            <h1>{{ legalContent.agreement.title }}</h1>
            <p>{{ legalContent.agreement.summary }}</p>
            <div class="hero-meta">
                <span v-for="meta in legalContent.agreement.metas" :key="meta.label">{{ meta.label }}：{{ meta.value }}</span>
            </div>
        </header>

        <nav class="toc-card" aria-label="用户协议目录">
            <a v-for="section in displaySections" :key="section.id" :href="`#${section.id}`">{{ section.shortTitle || section.title }}</a>
        </nav>

        <main class="content-panel">
            <section v-for="section in displaySections" :id="section.id" :key="section.id" class="content-card">
                <div class="section-head">
                    <span>{{ section.badge }}</span>
                    <h2>{{ section.title }}</h2>
                </div>
                <p v-for="paragraph in section.paragraphs" :key="paragraph" class="section-paragraph">{{ paragraph }}</p>
                <ul v-if="section.items?.length" class="section-list">
                    <li v-for="item in section.items" :key="item">
                        <Icon icon="mdi:check-circle-outline" class="section-list-icon" />
                        <span class="section-list-text">{{ item }}</span>
                    </li>
                </ul>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import LocaleSwitcher from '@/components/LocaleSwitcher/index.vue'
import { getLegalContent } from '@/views/legal/content'
import { useRouteLocale } from '@/locales/useRouteLocale'

defineOptions({ name: 'ViewsH5Agreement' })

const { locale } = useRouteLocale()
const legalContent = computed(() => getLegalContent(locale.value))
const displaySections = computed(() => legalContent.value.agreement.sections)

watch(
    () => legalContent.value.agreement.title,
    title => {
        document.title = title
    },
    { immediate: true }
)
</script>

<style scoped lang="scss">
.legal-page {
    min-height: 100vh;
    padding-bottom: 36px;
    background:
        linear-gradient(180deg, rgba(37, 99, 235, 0.08), rgba(248, 250, 252, 0) 320px),
        #f8fafc;
    color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', STHeiti, 'Microsoft Yahei', Tahoma, Simsun, sans-serif;
}

.legal-hero {
    padding: 20px 18px 18px;
    text-align: center;
}

.h5-legal-toolbar {
    width: min(100% - 28px, 820px);
    margin: 0 auto;
    padding: 14px 0 0;
    display: flex;
    justify-content: flex-end;
}

.eyebrow {
    display: inline-flex;
    height: 26px;
    padding: 0 12px;
    border-radius: 999px;
    align-items: center;
    background: #eff6ff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
}

.legal-hero h1 {
    margin: 16px 0 0;
    font-size: 30px;
    line-height: 1.3;
}

.legal-hero p {
    margin: 14px auto 0;
    max-width: 720px;
    color: #475569;
    font-size: 15px;
    line-height: 1.75;
}

.hero-meta {
    margin-top: 18px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
}

.hero-meta span {
    padding: 6px 10px;
    border: 1px solid #dbeafe;
    border-radius: 999px;
    background: #ffffff;
    color: #475569;
    font-size: 12px;
}

.toc-card,
.content-panel {
    width: min(100% - 28px, 820px);
    margin: 0 auto;
}

.toc-card {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
    scrollbar-width: none;
}

.toc-card::-webkit-scrollbar {
    display: none;
}

.toc-card a {
    flex-shrink: 0;
    padding: 8px 10px;
    border-radius: 999px;
    color: #475569;
    font-size: 13px;
    text-decoration: none;
    white-space: nowrap;
}

.toc-card a:hover {
    background: #eff6ff;
    color: #2563eb;
}

.content-panel {
    margin-top: 16px;
    display: grid;
    gap: 14px;
}

.content-card {
    scroll-margin-top: 72px;
    padding: 20px;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.section-head {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.section-head span {
    flex: 0 0 auto;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
    line-height: 28px;
}

.section-head h2 {
    margin: 0;
    color: #0f172a;
    font-size: 19px;
    line-height: 1.48;
}

.section-paragraph {
    margin: 14px 0 0;
    color: #475569;
    font-size: 14px;
    line-height: 1.85;
}

.section-list {
    margin: 16px 0 0;
    padding: 0;
    display: grid;
    gap: 11px;
    list-style: none;
}

.section-list li {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr);
    column-gap: 9px;
    align-items: start;
    color: #475569;
    font-size: 14px;
    line-height: 1.75;
}

.section-list-icon {
    width: 16px;
    height: 16px;
    margin-top: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    justify-self: center;
    color: #64748b;
    line-height: 1;
}

.section-list-icon :deep(.iconify) {
    width: 16px;
    height: 16px;
    display: block;
}

.section-list-text {
    display: block;
    min-width: 0;
}
</style>
