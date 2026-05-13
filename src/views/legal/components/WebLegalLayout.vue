<template>
    <div class="web-legal-page">
        <header class="web-legal-header">
            <router-link class="brand" :to="{ path: '/portal', query: $route.query }">
                <img :src="brandLogo" alt="" />
                <span>职场吧</span>
            </router-link>
            <nav class="legal-nav" aria-label="法务页面导航">
                <router-link :to="{ path: '/portal', query: $route.query }">{{ navLabels.portal }}</router-link>
                <router-link :to="{ path: '/user-agreement', query: $route.query }" :class="{ active: activePath === '/user-agreement' }">{{
                    navLabels.agreement
                }}</router-link>
                <router-link :to="{ path: '/privacy-policy', query: $route.query }" :class="{ active: activePath === '/privacy-policy' }">{{
                    navLabels.privacy
                }}</router-link>
            </nav>
            <LocaleSwitcher compact class="legal-locale-switcher" />
        </header>

        <main class="web-legal-shell">
            <section class="legal-hero">
                <div>
                    <span class="legal-kicker">{{ typeLabel }}</span>
                    <h1>{{ title }}</h1>
                    <p>{{ summary }}</p>
                </div>
                <div class="legal-meta-grid">
                    <div v-for="item in metas" :key="item.label" class="legal-meta-card">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                </div>
            </section>

            <div class="legal-layout">
                <aside class="legal-toc" aria-label="页面目录">
                    <a v-for="section in sections" :key="section.id" :href="`#${section.id}`">{{ section.shortTitle || section.title }}</a>
                    <a href="#contact">联系我们</a>
                </aside>

                <article class="legal-content">
                    <section v-for="section in sections" :id="section.id" :key="section.id" class="legal-card">
                        <span class="section-index">{{ section.badge }}</span>
                        <h2>{{ section.title }}</h2>
                        <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
                            <ul v-if="section.items?.length">
                                <li v-for="item in section.items" :key="item">
                                    <Icon icon="mdi:check-circle-outline" class="legal-list-icon" />
                                    <span class="legal-list-text">{{ item }}</span>
                                </li>
                            </ul>
                    </section>

                    <section id="contact" class="legal-card contact-card">
                        <span class="section-index">CONTACT</span>
                        <h2>{{ contactLabels.title }}</h2>
                        <p>{{ contactLabels.intro }}</p>
                        <div class="contact-grid">
                            <div class="contact-item">
                                <span>{{ contactLabels.companyName }}</span>
                                <strong>{{ contact.companyName }}</strong>
                            </div>
                            <div class="contact-item">
                                <span>{{ contactLabels.serviceName }}</span>
                                <strong>{{ contact.serviceName }}</strong>
                            </div>
                            <div class="contact-item">
                                <span>{{ contactLabels.email }}</span>
                                <strong>{{ contact.email }}</strong>
                            </div>
                            <div class="contact-item">
                                <span>{{ contactLabels.address }}</span>
                                <strong>{{ contact.address }}</strong>
                            </div>
                            <div class="contact-item wide">
                                <span>{{ contactLabels.responseTime }}</span>
                                <strong>{{ contact.responseTime }}</strong>
                            </div>
                        </div>
                    </section>
                </article>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import brandLogo from '@/assets/logo/logo.png'
import LocaleSwitcher from '@/components/LocaleSwitcher/index.vue'
import { platformContact } from '@/config/contact'
import type { LegalContactLabels, LegalMetaItem, LegalNavLabels, LegalSection } from '../types'

defineOptions({ name: 'WebLegalLayout' })

defineProps<{
    typeLabel: string
    title: string
    summary: string
    activePath: string
    metas: LegalMetaItem[]
    sections: LegalSection[]
    contact: typeof platformContact
    contactLabels: LegalContactLabels
    navLabels: LegalNavLabels
}>()
</script>

<style scoped lang="scss">
.web-legal-page {
    min-height: 100vh;
    background:
        linear-gradient(180deg, rgba(239, 246, 255, 0.8), rgba(248, 250, 252, 0.2) 360px),
        #f8fafc;
    color: #0f172a;
}

.web-legal-header {
    position: sticky;
    top: 0;
    z-index: 10;
    height: 64px;
    padding: 0 clamp(24px, 4vw, 56px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
    border-bottom: 1px solid #e2e8f0;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(10px);
}

.brand,
.legal-nav,
.legal-nav a {
    display: inline-flex;
    align-items: center;
}

.brand {
    gap: 10px;
    color: #0f172a;
    font-size: 18px;
    font-weight: 700;
    text-decoration: none;
}

.brand img {
    width: 32px;
    height: 32px;
}

.legal-nav {
    gap: 24px;
}

.legal-locale-switcher {
    flex: 0 0 auto;
}

.legal-nav a {
    position: relative;
    height: 64px;
    color: #475569;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
}

.legal-nav a::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    border-radius: 999px 999px 0 0;
    background: #2563eb;
    opacity: 0;
    transform: scaleX(0.68);
    transition:
        opacity 180ms ease,
        transform 180ms ease;
}

.legal-nav a:hover,
.legal-nav a.active {
    color: #2563eb;
}

.legal-nav a.active::after {
    opacity: 1;
    transform: scaleX(1);
}

.web-legal-shell {
    width: min(1200px, calc(100% - 48px));
    margin: 0 auto;
    padding: 56px 0 72px;
}

.legal-hero {
    padding: 40px;
    border: 1px solid #dbe4f0;
    border-radius: 18px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 40px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.legal-kicker {
    display: inline-flex;
    height: 28px;
    padding: 0 10px;
    border: 1px solid rgba(37, 99, 235, 0.2);
    border-radius: 999px;
    align-items: center;
    background: #eff6ff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
}

.legal-hero h1 {
    margin: 18px 0 0;
    font-size: clamp(34px, 4vw, 48px);
    line-height: 1.18;
}

.legal-hero p,
.legal-card p {
    color: #475569;
    font-size: 15px;
    line-height: 1.9;
}

.legal-hero p {
    max-width: 680px;
    margin: 18px 0 0;
}

.legal-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.legal-meta-card {
    padding: 18px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
}

.legal-meta-card span,
.contact-item span {
    display: block;
    color: #64748b;
    font-size: 13px;
}

.legal-meta-card strong,
.contact-item strong {
    display: block;
    margin-top: 8px;
    color: #0f172a;
    font-size: 15px;
    line-height: 1.55;
}

.legal-layout {
    margin-top: 28px;
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 28px;
    align-items: start;
}

.legal-toc {
    position: sticky;
    top: 88px;
    padding: 14px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    display: grid;
    gap: 4px;
    background: #ffffff;
}

.legal-toc a {
    padding: 10px 12px;
    border-radius: 8px;
    color: #475569;
    font-size: 14px;
    text-decoration: none;
}

.legal-toc a:hover {
    background: #eff6ff;
    color: #2563eb;
}

.legal-content {
    display: grid;
    gap: 18px;
}

.legal-card {
    scroll-margin-top: 90px;
    padding: 30px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.section-index {
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
}

.legal-card h2 {
    margin: 10px 0 0;
    color: #0f172a;
    font-size: 24px;
    line-height: 1.35;
}

.legal-card p {
    margin: 14px 0 0;
}

.legal-card ul {
    margin: 18px 0 0;
    padding: 0;
    display: grid;
    gap: 12px;
    list-style: none;
}

.legal-card li {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr);
    column-gap: 9px;
    align-items: start;
    color: #475569;
    font-size: 14px;
    line-height: 1.7;
}

.legal-list-icon {
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

.legal-list-icon :deep(.iconify) {
    width: 16px;
    height: 16px;
    display: block;
}

.legal-list-text {
    display: block;
    min-width: 0;
}

.contact-grid {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.contact-item {
    padding: 16px;
    border-radius: 10px;
    background: #f8fafc;
}

.contact-item.wide {
    grid-column: 1 / -1;
}

@media screen and (max-width: 960px) {
    .legal-hero,
    .legal-layout {
        grid-template-columns: 1fr;
    }

    .legal-toc {
        position: static;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media screen and (max-width: 640px) {
    .web-legal-header {
        height: auto;
        padding: 14px 18px;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .legal-nav {
        width: 100%;
        gap: 14px;
        overflow-x: auto;
    }

    .legal-locale-switcher {
        align-self: flex-end;
    }

    .legal-nav a {
        height: 34px;
        flex-shrink: 0;
    }

    .web-legal-shell {
        width: min(100% - 28px, 1200px);
        padding: 28px 0 44px;
    }

    .legal-hero,
    .legal-card {
        padding: 22px;
    }

    .legal-meta-grid,
    .legal-toc,
    .contact-grid {
        grid-template-columns: 1fr;
    }
}
</style>
