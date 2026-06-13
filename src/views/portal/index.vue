<template>
    <div class="portal-page">
        <PortalHeader
            :ui="portalUi.header"
            :brand-logo="brandLogo"
            :nav-items="navItems"
            :mobile-menu-open="mobileMenuOpen"
            :scrolled="headerScrolled"
            :active-nav="activeNav"
            @close-mobile-menu="closeMobileMenu"
            @select-nav="navigateTo"
            @toggle-mobile-menu="toggleMobileMenu"
            @show-app-download="openAppDownloadQr"
            @go-client="goClient"
            @go-console="goConsole"
        />

        <div ref="portalScrollRef" class="portal-scroll">
            <main>
                <HeroSection
                    :ui="portalUi.hero"
                    :hero-slides="heroSlides"
                    :active-hero-index="activeHeroIndex"
                    :active-hero-slide="activeHeroSlide"
                    :hero-metrics="heroMetrics"
                    :hero-flow="heroFlow"
                    @go-client="goClient"
                    @navigate="navigateTo"
                    @set-hero-slide="setHeroSlide"
                />
                <NewsCarousel
                    :ui="portalUi.sections.news"
                    :news-pages="newsPages"
                    :active-news-page="activeNewsPage"
                    @switch-news-page="switchNewsPage"
                    @navigate="navigateTo"
                />
                <CapabilitySection :ui="portalUi.sections.capability" :capability-modules="capabilityModules" @navigate="navigateTo" />
                <CapabilityShowcase
                    :ui="portalUi.sections.showcase"
                    :capability-showcase-items="capabilityShowcaseItems"
                    :active-capability-index="activeCapabilityIndex"
                    :active-capability="activeCapability"
                    @set-capability-slide="setCapabilitySlide"
                />
                <DataMetrics :ui="portalUi.sections.metrics" :data-metrics="dataMetrics" />
                <WorkShowcase :ui="portalUi.sections.work" :featured-works="featuredWorks" @go-console="goConsole" />
                <SolutionSection :ui="portalUi.sections.solution" :solution-items="solutionItems" @navigate="navigateTo" />
                <FlowSection :ui="portalUi.sections.flow" :flow-steps="flowSteps" />
                <BottomCta :ui="portalUi.sections.bottomCta" @go-client="goClient" @show-app-download="openAppDownloadQr" @navigate="navigateTo" />
            </main>

            <PortalFooter :ui="portalUi.footer" :brand-logo="brandLogo" :footer-groups="footerGroups" @navigate="navigateTo" />
        </div>
        <AppDownloadDialog
            v-model="appDownloadQrVisible"
            :ui="portalUi.appDialog"
            :brand-logo="brandLogo"
            :download-url="appDownloadUrl"
            :version-name="latestAppVersion?.versionName"
        />
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'PortalHome' })
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import brandLogo from '@/assets/logo/logo.png'
import portalPageBg from '@/assets/images/portal-page-bg.jpg'
import { getNewVersion, parseNewVersion, type VersionItem } from '@/api/content/version'
import { getImgUrl } from '@/utils/img'
import { useRouteLocale } from '@/locales/useRouteLocale'
import { isMobileWebViewport } from '@/utils/routeAccess'
import AppDownloadDialog from './components/AppDownloadDialog.vue'
import BottomCta from './components/BottomCta.vue'
import CapabilitySection from './components/CapabilitySection.vue'
import CapabilityShowcase from './components/CapabilityShowcase.vue'
import DataMetrics from './components/DataMetrics.vue'
import FlowSection from './components/FlowSection.vue'
import HeroSection from './components/HeroSection.vue'
import NewsCarousel from './components/NewsCarousel.vue'
import PortalFooter from './components/PortalFooter.vue'
import PortalHeader from './components/PortalHeader.vue'
import SolutionSection from './components/SolutionSection.vue'
import WorkShowcase from './components/WorkShowcase.vue'
import { getPortalData, type PortalNewsItem } from './data'

const router = useRouter()
const { locale } = useRouteLocale()
const mobileMenuOpen = ref(false)
const activeHeroIndex = ref(0)
const activeCapabilityIndex = ref(0)
const activeNewsPage = ref(0)
const headerScrolled = ref(false)
const activeNav = ref('#hero')
const appDownloadQrVisible = ref(false)
const portalScrollRef = ref<HTMLElement | null>(null)
const latestAppVersion = ref<VersionItem | null>(null)
const latestAppVersionLoading = ref(false)
const HERO_INTERVAL_MS = 5200
const CAPABILITY_INTERVAL_MS = 5600
const NEWS_INTERVAL_MS = 6400
const ADMIN_CONSOLE_ROUTE = '/login?redirect=/index'
let heroTimer: number | null = null
let capabilityTimer: number | null = null
let newsTimer: number | null = null
let scrollRafId: number | null = null
let activeNavLockTimer: number | null = null
let lockedActiveNav: string | null = null
let sectionOffsets: Array<{ href: string; top: number }> = []

const portalData = computed(() => getPortalData(locale.value))
const portalUi = computed(() => portalData.value.ui)
const navItems = computed(() => portalData.value.navItems)
const heroSlides = computed(() => portalData.value.heroSlides)
const capabilityModules = computed(() => portalData.value.capabilityModules)
const capabilityShowcaseItems = computed(() => portalData.value.capabilityShowcaseItems)
const dataMetrics = computed(() => portalData.value.dataMetrics)
const solutionItems = computed(() => portalData.value.solutionItems)
const flowSteps = computed(() => portalData.value.flowSteps)
const footerGroups = computed(() => portalData.value.footerGroups)
const portalMockData = computed(() => portalData.value.mockData)
const heroMetrics = computed(() => portalMockData.value.metrics)
const heroFlow = computed(() => portalMockData.value.flow)
const newsItems = computed(() => portalMockData.value.updates)
const featuredWorks = computed(() => portalMockData.value.works)
const activeHeroSlide = computed(() => heroSlides.value[activeHeroIndex.value] || heroSlides.value[0])
const activeCapability = computed(() => capabilityShowcaseItems.value[activeCapabilityIndex.value] || capabilityShowcaseItems.value[0])
const newsPages = computed(() => chunkArray(newsItems.value, 3))
const portalPageBgImage = computed(() => `url("${portalPageBg}")`)
const appDownloadUrl = computed(() => {
    const rawUrl = String(latestAppVersion.value?.downloadUrl || '').trim()
    return rawUrl ? getImgUrl(rawUrl) : ''
})

function closeMobileMenu() {
    mobileMenuOpen.value = false
}

function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value
}

function navigateTo(route: string) {
    closeMobileMenu()
    if (!route) return
    if (/^(mailto:|tel:)/.test(route)) {
        window.location.href = route
        return
    }
    if (/^https?:\/\//.test(route)) {
        window.open(route, '_blank', 'noopener,noreferrer')
        return
    }
    if (isAdminConsoleRoute(route) && isMobileWebViewport()) {
        router.push(getMobileAppDownloadRoute())
        return
    }
    if (route.startsWith('#')) {
        lockActiveNav(route)
        const target = document.querySelector(route)
        const scrollRoot = portalScrollRef.value
        if (target instanceof HTMLElement && scrollRoot) {
            const top = resolveTargetOffset(target)
            scrollRoot.scrollTo({ top, behavior: 'smooth' })
        } else {
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        window.history.replaceState(null, '', route)
        return
    }
    router.push(route)
}

function getMobileAppDownloadRoute() {
    return { path: '/h5/app-download', query: { lang: locale.value } }
}

function isAdminConsoleRoute(route: string) {
    const normalizedRoute = String(route || '').trim()
    if (normalizedRoute === ADMIN_CONSOLE_ROUTE) return true
    const [path, queryText = ''] = normalizedRoute.split('?')
    if (path !== '/login') return false
    return new URLSearchParams(queryText).get('redirect') === '/index'
}

function updateHeaderScrollState() {
    headerScrolled.value = (portalScrollRef.value?.scrollTop || 0) > 8
    updateActiveNav()
}

function clearActiveNavLock() {
    if (activeNavLockTimer) {
        window.clearTimeout(activeNavLockTimer)
        activeNavLockTimer = null
    }
    lockedActiveNav = null
}

function lockActiveNav(route: string) {
    clearActiveNavLock()
    lockedActiveNav = route
    activeNav.value = route
    activeNavLockTimer = window.setTimeout(() => {
        clearActiveNavLock()
        updateActiveNav()
    }, 1600)
}

function scheduleHeaderScrollStateUpdate() {
    if (scrollRafId !== null) return
    scrollRafId = window.requestAnimationFrame(() => {
        scrollRafId = null
        updateHeaderScrollState()
    })
}

function resolveTargetOffset(target: HTMLElement) {
    let top = 0
    let current: HTMLElement | null = target
    const scrollRoot = portalScrollRef.value

    while (current && current !== scrollRoot) {
        top += current.offsetTop
        current = current.offsetParent as HTMLElement | null
    }

    return top
}

function refreshSectionOffsets() {
    sectionOffsets = navItems.value
        .filter(item => item.href.startsWith('#'))
        .map(item => {
            const target = document.querySelector(item.href)
            return target instanceof HTMLElement ? { href: item.href, top: resolveTargetOffset(target) } : null
        })
        .filter((item): item is { href: string; top: number } => Boolean(item))
        .sort((first, second) => first.top - second.top)
}

function updateActiveNav() {
    const scrollRoot = portalScrollRef.value
    const rootScrollTop = scrollRoot?.scrollTop || 0
    const scrollPosition = rootScrollTop + 96
    let nextActive = navItems.value[0]?.href || '#hero'
    const isScrollEnd = scrollRoot ? rootScrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 2 : false
    const lockedTarget = lockedActiveNav ? sectionOffsets.find(item => item.href === lockedActiveNav) : null

    if (scrollRoot && lockedActiveNav && lockedTarget) {
        const maxScrollTop = Math.max(scrollRoot.scrollHeight - scrollRoot.clientHeight, 0)
        const targetScrollTop = Math.min(lockedTarget.top, maxScrollTop)
        const hasReachedTarget = Math.abs(rootScrollTop - targetScrollTop) <= 2

        activeNav.value = lockedActiveNav
        if (hasReachedTarget || isScrollEnd) {
            clearActiveNavLock()
        }
        return
    }

    if (isScrollEnd && sectionOffsets.length) {
        activeNav.value = sectionOffsets[sectionOffsets.length - 1].href
        return
    }

    for (const item of sectionOffsets) {
        if (item.top <= scrollPosition) {
            nextActive = item.href
        }
    }

    activeNav.value = nextActive
}

function chunkArray(items: PortalNewsItem[], size: number) {
    const chunks: PortalNewsItem[][] = []
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size))
    }
    return chunks
}

function setHeroSlide(index: number) {
    activeHeroIndex.value = index
    restartHeroTimer()
}

function setCapabilitySlide(index: number) {
    activeCapabilityIndex.value = index
    restartCapabilityTimer()
}

function switchNewsPage(direction: 'prev' | 'next') {
    const total = newsPages.value.length
    if (total <= 1) return
    activeNewsPage.value = direction === 'next' ? (activeNewsPage.value + 1) % total : (activeNewsPage.value - 1 + total) % total
    restartNewsTimer()
}

async function loadLatestAppVersion(silent = true) {
    if (latestAppVersionLoading.value) return
    latestAppVersionLoading.value = true
    try {
        const response = await getNewVersion()
        latestAppVersion.value = parseNewVersion(response)
        if (!appDownloadUrl.value && !silent) {
            ElMessage.warning(portalUi.value.messages.versionUnavailable)
        }
    } catch (error) {
        console.error(error)
        if (!silent) {
            ElMessage.error(portalUi.value.messages.versionFailed)
        }
    } finally {
        latestAppVersionLoading.value = false
    }
}

async function openAppDownloadQr() {
    if (isMobileWebViewport()) {
        await router.push(getMobileAppDownloadRoute())
        return
    }
    if (!appDownloadUrl.value) {
        await loadLatestAppVersion(false)
    }
    if (!appDownloadUrl.value) return
    appDownloadQrVisible.value = true
}

function clearHeroTimer() {
    if (!heroTimer) return
    window.clearInterval(heroTimer)
    heroTimer = null
}

function clearCapabilityTimer() {
    if (!capabilityTimer) return
    window.clearInterval(capabilityTimer)
    capabilityTimer = null
}

function clearNewsTimer() {
    if (!newsTimer) return
    window.clearInterval(newsTimer)
    newsTimer = null
}

function restartHeroTimer() {
    clearHeroTimer()
    heroTimer = window.setInterval(() => {
        activeHeroIndex.value = (activeHeroIndex.value + 1) % heroSlides.value.length
    }, HERO_INTERVAL_MS)
}

function restartCapabilityTimer() {
    clearCapabilityTimer()
    capabilityTimer = window.setInterval(() => {
        activeCapabilityIndex.value = (activeCapabilityIndex.value + 1) % capabilityShowcaseItems.value.length
    }, CAPABILITY_INTERVAL_MS)
}

function restartNewsTimer() {
    clearNewsTimer()
    newsTimer = window.setInterval(() => {
        const total = newsPages.value.length
        if (total <= 1) return
        activeNewsPage.value = (activeNewsPage.value + 1) % total
    }, NEWS_INTERVAL_MS)
}

onMounted(() => {
    refreshSectionOffsets()
    window.requestAnimationFrame(refreshSectionOffsets)
    updateHeaderScrollState()
    portalScrollRef.value?.addEventListener('scroll', scheduleHeaderScrollStateUpdate, { passive: true })
    window.addEventListener('resize', refreshSectionOffsets)
    loadLatestAppVersion()
    restartHeroTimer()
    restartCapabilityTimer()
    restartNewsTimer()
})

watch(
    () => locale.value,
    async () => {
        activeHeroIndex.value = 0
        activeCapabilityIndex.value = 0
        activeNewsPage.value = 0
        await nextTick()
        refreshSectionOffsets()
        updateActiveNav()
    }
)

onBeforeUnmount(() => {
    portalScrollRef.value?.removeEventListener('scroll', scheduleHeaderScrollStateUpdate)
    window.removeEventListener('resize', refreshSectionOffsets)
    if (scrollRafId !== null) {
        window.cancelAnimationFrame(scrollRafId)
        scrollRafId = null
    }
    clearActiveNavLock()
    clearHeroTimer()
    clearCapabilityTimer()
    clearNewsTimer()
})

function goClient() {
    navigateTo('/discover')
}

function goConsole() {
    navigateTo(ADMIN_CONSOLE_ROUTE)
}
</script>

<style lang="scss">
.portal-page {
    --portal-bg: #f8fafc;
    --portal-surface: #ffffff;
    --portal-surface-muted: #f1f5f9;
    --portal-text: #0f172a;
    --portal-text-regular: #475569;
    --portal-text-muted: #64748b;
    --portal-border: #e2e8f0;
    --portal-primary: #2563eb;
    --portal-primary-hover: #1d4ed8;
    --portal-primary-weak: #eff6ff;
    --portal-radius: 8px;
    --portal-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    --portal-page-bg-image: v-bind(portalPageBgImage);

    position: relative;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--portal-bg);
    color: var(--portal-text);
    font-family:
        'PingFang SC',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        sans-serif;
}

.portal-page::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background-image: var(--portal-page-bg-image);
    background-repeat: no-repeat;
    background-position: center top;
    background-size: min(1440px, 100%) auto;
    opacity: 0.18;
    pointer-events: none;
}

.portal-page > * {
    position: relative;
    z-index: 1;
}

.portal-scroll {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    scroll-behavior: smooth;
    scrollbar-gutter: stable;
}

.portal-scroll::-webkit-scrollbar {
    width: 10px;
}

.portal-scroll::-webkit-scrollbar-thumb {
    border: 2px solid transparent;
    border-radius: 999px;
    background: color-mix(in srgb, var(--portal-text-muted) 38%, transparent);
    background-clip: content-box;
}

.portal-scroll::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--portal-text-muted) 52%, transparent);
    background-clip: content-box;
}

.portal-scroll::-webkit-scrollbar-track {
    background: transparent;
}

.portal-header {
    position: relative;
    z-index: 50;
    height: 64px;
    flex-shrink: 0;
    padding: 0 clamp(20px, 2.8vw, 40px);
    display: flex;
    align-items: center;
    gap: 32px;
    background: #ffffff;
    border-bottom: 1px solid var(--portal-border);
    transition:
        background-color 160ms ease,
        border-color 160ms ease,
        box-shadow 160ms ease;
}

.portal-header.is-scrolled {
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(15, 35, 80, 0.05);
}

.brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    color: var(--portal-text);
    text-decoration: none;
}

.brand-logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
}

.brand-name {
    font-size: 18px;
    font-weight: 700;
}

.portal-nav {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(24px, 3vw, 40px);
}

.portal-nav a {
    position: relative;
    height: 64px;
    color: var(--portal-text-regular);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    transition: color 220ms ease;
}

.portal-nav a::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    border-radius: 999px 999px 0 0;
    background: var(--portal-primary);
    opacity: 0;
    transform: translateY(4px) scaleX(0.65);
    transform-origin: center;
    transition:
        opacity 220ms ease,
        transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.portal-nav a:hover,
.portal-nav a.active {
    color: var(--portal-primary);
}

.portal-nav a.active::after {
    opacity: 1;
    transform: translateY(0) scaleX(1);
}

.header-actions,
.hero-actions,
.bottom-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

button,
a {
    -webkit-tap-highlight-color: transparent;
}

.text-action,
.primary-action,
.secondary-action,
.ghost-action {
    height: 36px;
    padding: 0 16px;
    border-radius: var(--portal-radius);
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
}

.text-action {
    border: 0;
    background: transparent;
    color: var(--portal-text-regular);
}

.text-action:hover {
    color: var(--portal-text);
    background: var(--portal-surface-muted);
}

.hot-action {
    gap: 4px;
    min-width: 92px;
    color: #ea580c;
}

.hot-action:hover {
    color: #c2410c;
    background: #fff7ed;
}

.hot-action-icon {
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 16px;
    font-size: 16px;
    line-height: 1;
}

.hot-action-icon .iconify {
    width: 16px;
    height: 16px;
    display: block;
}

.primary-action {
    background: var(--portal-primary);
    color: #ffffff;
}

.primary-action:hover {
    background: var(--portal-primary-hover);
}

.secondary-action {
    border-color: rgba(37, 99, 235, 0.3);
    background: var(--portal-primary-weak);
    color: var(--portal-primary);
}

.secondary-action:hover {
    background: rgba(37, 99, 235, 0.15);
}

.ghost-action {
    border-color: var(--portal-border);
    background: var(--portal-surface);
    color: var(--portal-text-regular);
}

.ghost-action:hover {
    border-color: var(--portal-text-muted);
    color: var(--portal-text);
}

.large {
    height: 44px;
    padding: 0 24px;
    font-size: 15px;
}

.menu-toggle {
    display: none;
    width: 36px;
    height: 36px;
    border: 1px solid var(--portal-border);
    border-radius: var(--portal-radius);
    background: var(--portal-surface);
    color: var(--portal-text);
    font-size: 20px;
}

.section-shell {
    width: min(1440px, calc(100% - 32px));
    margin: 0 auto;
    scroll-margin-top: 84px;
}

.hero-section {
    padding: 80px 0 60px;
    display: grid;
    grid-template-columns: minmax(420px, 0.9fr) minmax(620px, 1.35fr);
    gap: clamp(36px, 4vw, 72px);
    align-items: center;
}

.hero-copy h1,
.section-heading h2,
.showcase-copy h2,
.bottom-cta h2 {
    margin: 0;
    color: var(--portal-text);
}

.hero-copy-slide {
    min-height: 228px;
}

.hero-topic,
.demo-kicker {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 10px;
    border: 1px solid rgba(37, 99, 235, 0.22);
    border-radius: 999px;
    background: var(--portal-primary-weak);
    color: var(--portal-primary);
    font-size: 13px;
    font-weight: 600;
}

.hero-copy h1 {
    max-width: 720px;
    margin-top: 18px;
    font-size: clamp(36px, 4vw, 56px);
    line-height: 1.2;
    font-weight: 700;
}

.hero-copy p {
    max-width: 700px;
    margin: 24px 0 0;
    font-size: 16px;
    line-height: 1.8;
    color: var(--portal-text-regular);
}

.hero-actions {
    margin-top: 32px;
    flex-wrap: wrap;
}

.hero-carousel-controls {
    margin-top: 28px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.hero-carousel-controls button {
    width: 38px;
    height: 18px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
}

.hero-carousel-controls span {
    display: block;
    width: 100%;
    height: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--portal-text-muted) 32%, transparent);
    transition:
        background-color 160ms ease,
        width 160ms ease;
}

.hero-carousel-controls button.active span {
    background: var(--portal-primary);
}

.hero-board {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 210px;
    gap: 16px;
    position: relative;
    isolation: isolate;
    min-height: 560px;
    padding: 18px;
    overflow: hidden;
    border: 1px solid var(--portal-border);
    border-radius: 16px;
    background: var(--portal-surface);
    box-shadow: var(--portal-shadow);
}

.hero-board::before {
    content: '';
    position: absolute;
    inset: -14px;
    z-index: -1;
    border-radius: 18px;
    background: #f8fafc;
    opacity: 1;
}

.hero-board-media {
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: hidden;
}

.hero-board-media::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(248, 250, 252, 0.9);
    pointer-events: none;
}

.hero-board-media img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center;
    opacity: 0.46;
}

.board-main,
.board-side > div,
.portal-card {
    border: 1px solid var(--portal-border);
    border-radius: var(--portal-radius);
    background: var(--portal-surface);
    box-shadow: var(--portal-shadow);
}

.board-main {
    position: relative;
    z-index: 1;
    padding: 18px;
    background: var(--portal-surface);
}

.hero-image-frame {
    position: relative;
    height: 300px;
    margin-bottom: 16px;
    border: 1px solid var(--portal-border);
    border-radius: 12px;
    background: var(--portal-surface-muted);
    overflow: hidden;
}

.hero-image-frame::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 64%, rgba(255, 255, 255, 0.78));
    pointer-events: none;
}

.hero-image-frame img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center;
    transition: opacity 180ms ease;
}

.board-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
}

.board-head span,
.board-head strong,
.card-meta,
.event-card span,
.creator-card span {
    font-size: 13px;
    font-weight: 500;
}

.board-head span,
.event-card span,
.creator-card span {
    color: var(--portal-text-muted);
}

.board-head strong {
    color: var(--portal-primary);
    background: var(--portal-primary-weak);
    padding: 4px 8px;
    border-radius: 4px;
}

.board-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.board-metrics-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}

.metric-card {
    padding: 12px;
    border-radius: 6px;
    background: var(--portal-surface-muted);
    border: 1px solid var(--portal-border);
}

.metric-card span,
.timeline-row span {
    display: block;
    color: var(--portal-text-muted);
    font-size: 13px;
}

.metric-card strong {
    display: block;
    margin-top: 4px;
    font-size: 18px;
    font-weight: 600;
    color: var(--portal-text);
}

.metric-card em {
    display: block;
    margin-top: 6px;
    color: var(--portal-text-muted);
    font-size: 12px;
    font-style: normal;
    line-height: 1.4;
}

.board-timeline {
    margin-top: 16px;
    display: grid;
    gap: 10px;
}

.timeline-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.timeline-row i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--portal-primary);
}

.board-side {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.board-side > div {
    position: relative;
    overflow: hidden;
    min-height: 0;
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.board-side-card {
    background: var(--portal-surface);
    transition:
        border-color 180ms ease,
        background-color 180ms ease,
        box-shadow 180ms ease;
}

.side-card-visual {
    position: absolute;
    inset: 12px 12px auto;
    height: calc(100% - 88px);
    overflow: hidden;
    border: 1px solid var(--portal-border);
    border-radius: 8px;
    background: var(--portal-surface-muted);
    transition: border-color 160ms ease;
}

.side-card-visual img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center 18%;
    opacity: 0.9;
}

.side-card-content {
    position: relative;
    z-index: 2;
    min-height: 100%;
    padding-top: calc(100% + 10px);
    padding-bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 8px;
}

.board-side-card span {
    width: fit-content;
    padding: 3px 7px;
    border-radius: 999px;
    background: transparent;
}

.board-side strong {
    display: -webkit-box;
    overflow: hidden;
    font-size: 16px;
    line-height: 1.5;
    font-weight: 600;
    overflow-wrap: anywhere;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.section-heading {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
}

.section-heading h2,
.showcase-copy h2,
.bottom-cta h2 {
    font-size: clamp(24px, 3vw, 36px);
    line-height: 1.3;
    font-weight: 700;
}

.section-heading p,
.showcase-copy p,
.bottom-cta p {
    max-width: 720px;
    margin: 12px 0 0;
    color: var(--portal-text-regular);
    font-size: 15px;
    line-height: 1.6;
}

.updates-section,
.capability-section,
.capability-demo-section,
.metrics-section,
.showcase-section,
.solution-section,
.flow-section,
.partner-section,
.bottom-cta {
    padding: 60px 0;
}

.section-controls {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.section-controls button {
    width: 34px;
    height: 34px;
    padding: 0;
    border: 1px solid var(--portal-border);
    border-radius: var(--portal-radius);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--portal-surface);
    color: var(--portal-text-regular);
    cursor: pointer;
    line-height: 1;
    transition:
        border-color 160ms ease,
        color 160ms ease,
        background-color 160ms ease;
}

.section-controls button .iconify {
    display: block;
    width: 16px;
    height: 16px;
}

.section-controls button:hover {
    border-color: var(--portal-primary);
    color: var(--portal-primary);
    background: var(--portal-primary-weak);
}

.updates-carousel {
    overflow: hidden;
}

.updates-track {
    display: flex;
    transition: transform 420ms ease;
}

.updates-page {
    min-width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}

.updates-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
}

.portal-card {
    padding: 20px;
}

.card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    color: var(--portal-text-muted);
}

.tag {
    background: var(--portal-surface-muted);
    padding: 2px 8px;
    border-radius: 4px;
    color: var(--portal-text);
}

.update-card h3,
.capability-card h3,
.solution-card h3,
.flow-card h3 {
    margin: 16px 0 0;
    font-size: 16px;
    line-height: 1.5;
    font-weight: 600;
    color: var(--portal-text);
}

.update-card p,
.capability-card p,
.solution-card p,
.flow-card p {
    margin: 8px 0 0;
    color: var(--portal-text-regular);
    font-size: 14px;
    line-height: 1.6;
}

.card-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 16px;
    color: var(--portal-primary);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
}

.carousel-progress {
    margin-top: 16px;
    display: flex;
    gap: 8px;
}

.carousel-progress span {
    width: 30px;
    height: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--portal-text-muted) 28%, transparent);
}

.carousel-progress span.active {
    background: var(--portal-primary);
}

.capability-grid,
.solution-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
}

.module-icon {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--portal-surface-muted);
    color: var(--portal-primary);
    font-size: 20px;
}

.capability-card ul {
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 8px;
}

.capability-card li {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--portal-text-regular);
    font-size: 13px;
}

.list-icon {
    color: var(--portal-text-muted);
    font-size: 14px;
}

.metrics-panel {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1px;
    padding: 0;
    overflow: hidden;
    background: var(--portal-border);
}

.data-metric-card {
    min-height: 184px;
    padding: 22px;
    background: var(--portal-surface);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.data-metric-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: var(--portal-primary-weak);
    color: var(--portal-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
}

.data-metric-content span,
.data-metric-content strong,
.data-metric-content p {
    display: block;
}

.data-metric-content span {
    color: var(--portal-text-muted);
    font-size: 13px;
}

.data-metric-content strong {
    margin-top: 8px;
    color: var(--portal-text);
    font-size: 30px;
    line-height: 1.1;
    font-weight: 700;
}

.data-metric-content p {
    margin: 10px 0 0;
    color: var(--portal-text-regular);
    font-size: 13px;
    line-height: 1.55;
}

.play-state {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--portal-text-muted);
    font-size: 13px;
}

.capability-demo {
    padding: 0;
    overflow: hidden;
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
}

.demo-tabs {
    padding: 18px;
    border-right: 1px solid var(--portal-border);
    background: var(--portal-surface-muted);
    display: grid;
    align-content: start;
    gap: 8px;
}

.demo-tabs button {
    width: 100%;
    height: 44px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--portal-text-regular);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition:
        background-color 160ms ease,
        border-color 160ms ease,
        color 160ms ease;
}

.demo-tabs button:hover,
.demo-tabs button.active {
    background: var(--portal-surface);
    border-color: var(--portal-border);
    color: var(--portal-primary);
}

.demo-panel {
    min-height: 420px;
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1fr);
    gap: 28px;
    align-items: center;
}

.demo-copy h3 {
    margin: 18px 0 0;
    color: var(--portal-text);
    font-size: clamp(24px, 3vw, 34px);
    line-height: 1.25;
}

.demo-copy p {
    margin: 14px 0 0;
    color: var(--portal-text-regular);
    font-size: 15px;
    line-height: 1.75;
}

.demo-copy ul {
    margin: 22px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 10px;
}

.demo-copy li {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--portal-text-regular);
    font-size: 14px;
}

.demo-copy li svg {
    color: var(--portal-primary);
    flex-shrink: 0;
}

.demo-visual {
    position: relative;
    padding: 22px;
    border: 1px solid var(--portal-border);
    border-radius: 12px;
    background: var(--portal-surface);
    overflow: hidden;
}

.demo-visual::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(color-mix(in srgb, var(--portal-border) 55%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in srgb, var(--portal-border) 55%, transparent) 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: 0.18;
    pointer-events: none;
}

.demo-visual-head,
.demo-stat-grid,
.demo-lines,
.demo-progress {
    position: relative;
    z-index: 1;
}

.demo-visual-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--portal-text-muted);
    font-size: 13px;
}

.demo-visual-head em {
    color: var(--portal-primary);
    font-style: normal;
    font-weight: 600;
}

.demo-stat-grid {
    margin-top: 22px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.demo-stat {
    padding: 16px;
    border: 1px solid var(--portal-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--portal-surface) 88%, transparent);
}

.demo-stat span,
.demo-stat strong {
    display: block;
}

.demo-stat span {
    color: var(--portal-text-muted);
    font-size: 12px;
}

.demo-stat strong {
    margin-top: 8px;
    color: var(--portal-text);
    font-size: 22px;
}

.demo-lines {
    margin-top: 22px;
    display: grid;
    gap: 10px;
}

.demo-lines span {
    height: 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--portal-primary) 18%, var(--portal-surface-muted));
}

.demo-lines span:nth-child(2) {
    width: 82%;
}

.demo-lines span:nth-child(3) {
    width: 64%;
}

.demo-lines span:nth-child(4) {
    width: 74%;
}

.demo-progress {
    margin-top: 24px;
    height: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--portal-text-muted) 22%, transparent);
    overflow: hidden;
}

.demo-progress i {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background: var(--portal-primary);
    transform-origin: left;
    animation: demoProgress 5.6s linear;
}

.showcase-section {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(460px, 1fr);
    gap: 48px;
    align-items: center;
}

.showcase-copy .secondary-action {
    margin-top: 24px;
}

.work-list {
    --work-row-gap: 12px;

    position: relative;
    max-height: 324px;
    overflow: hidden;
    border-radius: var(--portal-radius);
}

.work-list::before,
.work-list::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    z-index: 2;
    height: 26px;
    pointer-events: none;
}

.work-list::before {
    top: 0;
    background: linear-gradient(180deg, var(--portal-bg), rgba(248, 250, 252, 0));
}

.work-list::after {
    bottom: 0;
    background: linear-gradient(0deg, var(--portal-bg), rgba(248, 250, 252, 0));
}

.work-list-anchor {
    position: absolute;
    top: 120px;
    left: 0;
    width: 1px;
    height: 1px;
    pointer-events: none;
    scroll-margin-top: 84px;
}

.work-list-track {
    display: grid;
    gap: var(--work-row-gap);
}

.work-list-group {
    display: grid;
    gap: var(--work-row-gap);
}

.work-list:not(.is-static) .work-list-track {
    animation: portalWorkRoll 30s linear infinite;
}

.work-list:not(.is-static):hover .work-list-track {
    animation-play-state: paused;
}

.work-row {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) minmax(64px, auto);
    align-items: center;
    gap: 16px;
    min-height: 96px;
    padding: 16px 20px;
}

@keyframes portalWorkRoll {
    from {
        transform: translateY(0);
    }
    to {
        transform: translateY(calc(-50% - var(--work-row-gap) / 2));
    }
}

.work-rank {
    color: var(--portal-primary);
    font-size: 18px;
    font-weight: 600;
}

.work-info {
    min-width: 0;
}

.work-info strong,
.work-info span,
.work-info em {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.work-info strong {
    color: var(--portal-text);
    font-size: 15px;
}

.work-info span,
.work-info em,
.work-score {
    margin-top: 4px;
    color: var(--portal-text-muted);
    font-size: 13px;
}

.work-info em {
    font-style: normal;
    color: var(--portal-primary);
}

.work-score {
    font-weight: 500;
    text-align: right;
}

.solution-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
}

.solution-points {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.solution-points span {
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--portal-surface-muted);
    color: var(--portal-text-regular);
    font-size: 12px;
}

.flow-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
}

.step-index {
    display: inline-block;
    color: var(--portal-primary);
    font-weight: 600;
    font-size: 18px;
    margin-bottom: 8px;
}

.partner-marquee {
    overflow: hidden;
    border: 1px solid var(--portal-border);
    border-radius: var(--portal-radius);
    background: var(--portal-surface);
}

.partner-track {
    width: max-content;
    display: flex;
    gap: 14px;
    padding: 16px;
    animation: partnerMarquee 28s linear infinite;
}

.partner-marquee:hover .partner-track {
    animation-play-state: paused;
}

.partner-logo {
    width: 176px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--portal-text-muted);
    font-size: 14px;
    font-weight: 500;
    box-shadow: none;
}

.partner-logo span {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--portal-surface-muted);
    color: var(--portal-primary);
    font-size: 12px;
}

.partner-logo strong {
    color: var(--portal-text-regular);
    font-size: 14px;
    font-weight: 600;
}

.bottom-cta {
    margin-bottom: 60px;
    padding: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    background: var(--portal-surface);
}

.bottom-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
}

.bottom-actions .large {
    min-width: 172px;
    white-space: nowrap;
}

.portal-footer {
    padding: 48px clamp(20px, 2.8vw, 40px) 24px;
    display: grid;
    grid-template-columns: 1.5fr repeat(5, minmax(112px, 1fr));
    gap: 32px;
    background: #1e293b;
    color: #e2e8f0;
}

.footer-brand p {
    max-width: 300px;
    margin: 12px 0 0;
    color: #94a3b8;
    line-height: 1.6;
    font-size: 14px;
}

.brand-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.brand-row img {
    width: 28px;
    height: 28px;
}

.brand-row strong {
    font-size: 16px;
}

.footer-group {
    display: grid;
    align-content: start;
    gap: 12px;
}

.footer-group h3 {
    margin: 0 0 4px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
}

.footer-group a {
    color: #94a3b8;
    font-size: 13px;
    text-decoration: none;
}

.footer-text {
    color: #94a3b8;
    font-size: 13px;
}

.footer-group a.with-icon,
.footer-text.with-icon {
    display: inline-flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.5;
}

.footer-group a.with-icon svg,
.footer-text.with-icon svg {
    margin-top: 2px;
    flex-shrink: 0;
    color: #cbd5e1;
    font-size: 15px;
}

.footer-group a:hover {
    color: #ffffff;
}

.footer-bottom {
    grid-column: 1 / -1;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: #64748b;
    font-size: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    align-items: center;
}

.footer-bottom a {
    color: #94a3b8;
    text-decoration: none;
}

.footer-bottom a:hover {
    color: #ffffff;
}

.portal-fade-enter-active,
.portal-fade-leave-active,
.portal-slide-enter-active,
.portal-slide-leave-active {
    transition:
        opacity 220ms ease,
        transform 220ms ease;
}

.portal-fade-enter-from,
.portal-fade-leave-to {
    opacity: 0;
}

.portal-slide-enter-from {
    opacity: 0;
    transform: translateX(12px);
}

.portal-slide-leave-to {
    opacity: 0;
    transform: translateX(-8px);
}

@keyframes demoProgress {
    from {
        transform: scaleX(0);
    }
    to {
        transform: scaleX(1);
    }
}

@keyframes partnerMarquee {
    from {
        transform: translateX(0);
    }
    to {
        transform: translateX(-50%);
    }
}

@media screen and (max-width: 1200px) {
    .portal-nav {
        display: none;
        position: absolute;
        left: 20px;
        right: 20px;
        top: 64px;
        padding: 16px;
        border: 1px solid var(--portal-border);
        border-radius: var(--portal-radius);
        background: var(--portal-surface);
        box-shadow: var(--portal-shadow);
        flex-direction: column;
        align-items: flex-start;
    }

    .portal-nav a {
        width: 100%;
        height: 38px;
        padding-left: 14px;
    }

    .portal-nav a::after {
        left: 0;
        right: auto;
        top: 50%;
        bottom: auto;
        width: 3px;
        height: 18px;
        border-radius: 999px;
        transform: translateY(-50%) scaleY(0.45);
        transform-origin: center;
    }

    .portal-nav a.active::after {
        transform: translateY(-50%) scaleY(1);
    }

    .portal-header.is-menu-open .portal-nav {
        display: flex;
    }

    .menu-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .header-actions {
        margin-left: auto;
    }

    .hero-section,
    .showcase-section {
        grid-template-columns: 1fr;
    }

    .hero-board {
        grid-template-columns: minmax(0, 1fr) 210px;
        max-width: 860px;
        min-height: 520px;
    }

    .flow-grid,
    .partner-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .updates-page {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .capability-grid,
    .solution-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .metrics-panel {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .capability-demo {
        grid-template-columns: 1fr;
    }

    .demo-tabs {
        border-right: 0;
        border-bottom: 1px solid var(--portal-border);
        grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .demo-tabs button {
        justify-content: center;
    }

    .portal-footer {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media screen and (max-width: 768px) {
    .portal-header {
        height: 56px;
        padding: 0 16px;
        gap: 12px;
    }

    .brand-name {
        font-size: 16px;
    }

    .header-actions {
        display: none;
    }

    .portal-nav {
        top: 56px;
        left: 12px;
        right: 12px;
    }

    .section-shell {
        width: min(100% - 24px, 1440px);
    }

    .hero-section {
        padding: 40px 0;
        gap: 32px;
    }

    .hero-copy-slide {
        min-height: auto;
    }

    .hero-copy h1 {
        font-size: 28px;
    }

    .hero-copy p {
        font-size: 14px;
    }

    .hero-actions,
    .bottom-actions {
        align-items: stretch;
        flex-direction: column;
    }

    .large {
        width: 100%;
        min-width: 0;
    }

    .hero-board {
        grid-template-columns: 1fr;
        min-height: auto;
        padding: 14px;
    }

    .hero-image-frame {
        height: 220px;
    }

    .board-side {
        grid-template-rows: none;
    }

    .board-side > div {
        min-height: 116px;
    }

    .board-metrics-row {
        grid-template-columns: 1fr;
    }

    .board-grid,
    .updates-page,
    .capability-grid,
    .solution-grid,
    .flow-grid,
    .partner-grid {
        grid-template-columns: 1fr;
    }

    .updates-section,
    .capability-section,
    .capability-demo-section,
    .metrics-section,
    .showcase-section,
    .solution-section,
    .flow-section,
    .partner-section,
    .bottom-cta {
        padding: 40px 0;
    }

    .section-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 14px;
    }

    .section-controls {
        align-self: flex-end;
    }

    .demo-tabs {
        display: flex;
        overflow-x: auto;
        scrollbar-width: none;
    }

    .demo-tabs::-webkit-scrollbar {
        display: none;
    }

    .demo-tabs button {
        width: auto;
        min-width: 128px;
        flex-shrink: 0;
    }

    .demo-panel {
        min-height: auto;
        padding: 22px;
        grid-template-columns: 1fr;
    }

    .demo-stat-grid {
        grid-template-columns: 1fr;
    }

    .metrics-panel {
        grid-template-columns: 1fr;
    }

    .work-row {
        grid-template-columns: 36px minmax(0, 1fr);
    }

    .work-score {
        grid-column: 2;
        margin-top: 0;
        justify-self: start;
    }

    .bottom-cta {
        margin-bottom: 40px;
        padding: 24px;
        align-items: stretch;
        flex-direction: column;
    }

    .portal-footer {
        grid-template-columns: 1fr;
        padding: 32px 20px 24px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .updates-track,
    .portal-fade-enter-active,
    .portal-fade-leave-active,
    .portal-slide-enter-active,
    .portal-slide-leave-active {
        transition: none;
    }

    .demo-progress i,
    .work-list-track,
    .partner-track {
        animation: none;
    }
}

:global(html.dark) {
    .portal-page {
        --portal-bg: #0f172a;
        --portal-surface: #1e293b;
        --portal-surface-muted: #334155;
        --portal-text: #f8fafc;
        --portal-text-regular: #cbd5e1;
        --portal-text-muted: #94a3b8;
        --portal-border: #475569;
        --portal-primary: #3b82f6;
        --portal-primary-hover: #60a5fa;
        --portal-primary-weak: #1e3a8a;
        --portal-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .portal-header {
        background: var(--portal-surface);
    }

    .portal-header.is-scrolled {
        background: color-mix(in srgb, var(--portal-surface) 90%, transparent);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    }

    .partner-marquee {
        background: var(--portal-surface);
    }

    .portal-footer {
        background: #0b0f19;
    }
}
</style>
