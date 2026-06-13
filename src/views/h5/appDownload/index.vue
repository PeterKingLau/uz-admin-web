<template>
    <main class="h5-app-download-page">
        <header class="app-download-header">
            <button type="button" class="header-brand" @click="goPortal">
                <img :src="brandLogo" alt="" />
                <span>{{ t('appDownload.brandName') }}</span>
            </button>
            <div class="header-actions">
                <LocaleSwitcher compact />
                <span v-if="isIosDevice" class="header-status">{{ t('appDownload.headerIos') }}</span>
                <a v-else-if="availableDownloadUrl" class="header-download" :href="availableDownloadUrl">{{ t('appDownload.headerDownload') }}</a>
                <button v-else type="button" class="header-download" :disabled="loading" @click="loadLatestAppVersion()">
                    {{ loading ? t('appDownload.headerLoading') : t('appDownload.headerFetch') }}
                </button>
            </div>
        </header>

        <section class="download-hero">
            <p class="hero-kicker">{{ t('appDownload.kicker') }}</p>
            <h1>{{ t('appDownload.title') }}</h1>
            <p class="hero-desc">{{ t('appDownload.description') }}</p>
        </section>

        <section class="visual-carousel" :aria-label="t('appDownload.ariaCarousel')">
            <VarSwipe class="app-swipe" :autoplay="3600" :duration="420" indicator-color="#2563eb" indicator>
                <VarSwipeItem v-for="slide in carouselSlides" :key="slide.titleKey">
                    <article class="slide-card">
                        <img :src="slide.image" :alt="t(slide.titleKey)" />
                        <div class="slide-caption">
                            <span>{{ t(slide.labelKey) }}</span>
                            <strong>{{ t(slide.titleKey) }}</strong>
                        </div>
                    </article>
                </VarSwipeItem>
            </VarSwipe>
        </section>

        <section class="download-panel">
            <div v-if="isIosDevice" class="ios-panel">
                <Icon icon="mdi:apple-ios" />
                <h2>{{ t('appDownload.iosTitle') }}</h2>
                <p>{{ t('appDownload.iosDesc') }}</p>
            </div>
            <div v-else class="qr-area">
                <div v-if="availableDownloadUrl" ref="qrCodeRef" class="qr-code" :aria-label="t('appDownload.ariaQr')"></div>
                <VarResult
                    v-else
                    class="qr-empty"
                    :type="loading ? 'info' : 'error'"
                    :title="loading ? t('appDownload.emptyLoading') : t('appDownload.emptyUnavailable')"
                />
            </div>
            <div v-if="!isIosDevice" class="download-info">
                <h2>{{ t('appDownload.downloadTitle') }}</h2>
                <p>{{ versionLabel }}</p>
            </div>
            <div class="action-area">
                <VarButton v-if="availableDownloadUrl" block type="primary" class="h5-primary-button" @click="downloadCurrentApp">{{
                    t('appDownload.downloadAndroid')
                }}</VarButton>
                <VarButton v-else-if="!isIosDevice" block type="primary" class="h5-primary-button" :loading="loading" @click="loadLatestAppVersion()">{{
                    t('appDownload.retry')
                }}</VarButton>
                <VarButton block outline type="primary" class="h5-outline-button" @click="goPortal">{{ t('appDownload.backPortal') }}</VarButton>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import VarButton from '@varlet/ui/es/button'
import VarResult from '@varlet/ui/es/result'
import Snackbar from '@varlet/ui/es/snackbar'
import VarSwipe from '@varlet/ui/es/swipe'
import VarSwipeItem from '@varlet/ui/es/swipe-item'
import '@varlet/ui/es/button/style'
import '@varlet/ui/es/result/style'
import '@varlet/ui/es/snackbar/style'
import '@varlet/ui/es/swipe/style'
import '@varlet/ui/es/swipe-item/style'
import QRCodeStyling from 'qr-code-styling'
import brandLogo from '@/assets/logo/logo.png'
import LocaleSwitcher from '@/components/LocaleSwitcher/index.vue'
import slideContent from '@/assets/images/app-download-slide-content.jpg'
import slideActivity from '@/assets/images/app-download-slide-activity.jpg'
import slideCreator from '@/assets/images/app-download-slide-creator.jpg'
import slideDashboard from '@/assets/images/app-download-slide-dashboard.jpg'
import { getNewVersion, parseNewVersion, type VersionItem } from '@/api/content/version'
import { getImgUrl } from '@/utils/img'
import { useRouteLocale } from '@/locales/useRouteLocale'

defineOptions({ name: 'ViewsH5AppDownload' })

const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const { locale } = useRouteLocale()
const latestAppVersion = ref<VersionItem | null>(null)
const loading = ref(false)
const isIosDevice = ref(false)
const qrCodeRef = ref<HTMLElement | null>(null)
let qrCode: QRCodeStyling | null = null
const QR_CODE_SIZE = 156

const carouselSlides = [
    { labelKey: 'appDownload.slides.contentLabel', titleKey: 'appDownload.slides.contentTitle', image: slideContent },
    { labelKey: 'appDownload.slides.activityLabel', titleKey: 'appDownload.slides.activityTitle', image: slideActivity },
    { labelKey: 'appDownload.slides.creatorLabel', titleKey: 'appDownload.slides.creatorTitle', image: slideCreator },
    { labelKey: 'appDownload.slides.dashboardLabel', titleKey: 'appDownload.slides.dashboardTitle', image: slideDashboard }
]

const downloadUrl = computed(() => {
    const rawUrl = String(latestAppVersion.value?.downloadUrl || '').trim()
    return rawUrl ? getImgUrl(rawUrl) : ''
})
const availableDownloadUrl = computed(() => (isIosDevice.value ? '' : downloadUrl.value))

const versionLabel = computed(() => {
    const version = String(latestAppVersion.value?.versionName || '').trim()
    return version ? t('appDownload.currentVersion', { version }) : t('appDownload.latestVersionPending')
})

async function renderQrCode() {
    await nextTick()
    const container = qrCodeRef.value
    if (!container || !availableDownloadUrl.value) return

    container.replaceChildren()
    qrCode = new QRCodeStyling({
        width: QR_CODE_SIZE,
        height: QR_CODE_SIZE,
        type: 'svg',
        data: availableDownloadUrl.value,
        image: brandLogo,
        qrOptions: {
            errorCorrectionLevel: 'H'
        },
        imageOptions: {
            imageSize: 0.15,
            margin: 6,
            hideBackgroundDots: true,
            crossOrigin: 'anonymous'
        },
        dotsOptions: {
            color: '#0f172a',
            type: 'rounded'
        },
        backgroundOptions: {
            color: '#ffffff'
        },
        cornersSquareOptions: {
            color: '#0f172a',
            type: 'extra-rounded'
        },
        cornersDotOptions: {
            color: '#0f172a',
            type: 'dot'
        }
    })
    qrCode.append(container)
}

async function loadLatestAppVersion(showError = true) {
    if (loading.value) return
    loading.value = true
    try {
        const response = await getNewVersion()
        latestAppVersion.value = parseNewVersion(response)
        if (!downloadUrl.value && showError) {
            Snackbar.warning(t('appDownload.toastUnavailable'))
        }
    } catch (error) {
        console.error(error)
        if (showError) {
            Snackbar.error(t('appDownload.toastFailed'))
        }
    } finally {
        loading.value = false
    }
}

function goPortal() {
    router.replace({ path: '/portal', query: { lang: locale.value } })
}

function downloadCurrentApp() {
    if (!availableDownloadUrl.value) return
    window.location.href = availableDownloadUrl.value
}

watch(downloadUrl, () => {
    void renderQrCode()
})

watch(
    () => locale.value,
    () => {
        document.title = t('appDownload.pageTitle')
    }
)

onMounted(() => {
    document.title = t('appDownload.pageTitle')
    const userAgent = window.navigator.userAgent || ''
    isIosDevice.value = /iPhone|iPad|iPod/i.test(userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    if (!isIosDevice.value) {
        void loadLatestAppVersion(false)
    }
})

onBeforeUnmount(() => {
    qrCodeRef.value?.replaceChildren()
    qrCode = null
})
</script>

<style scoped lang="scss">
.h5-app-download-page {
    min-height: 100vh;
    min-height: 100dvh;
    padding: calc(env(safe-area-inset-top) + 72px) 16px calc(env(safe-area-inset-bottom) + 24px);
    background: radial-gradient(circle at 50% 0, rgba(37, 99, 235, 0.1), transparent 38%), linear-gradient(180deg, #f8fafc 0%, #eef3f8 100%);
}

.app-download-header {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 10;
    height: calc(env(safe-area-inset-top) + 58px);
    padding: env(safe-area-inset-top) 16px 0;
    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(10px);
}

.header-brand {
    min-width: 0;
    padding: 0;
    border: 0;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    background: transparent;
    color: #0f172a;
    font-size: 17px;
    font-weight: 700;
}

.header-brand img {
    width: 34px;
    height: 34px;
    border-radius: 9px;
}

.header-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.header-download {
    height: 34px;
    padding: 0 14px;
    border: 1px solid #2563eb;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #2563eb;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
}

.header-status {
    height: 34px;
    padding: 0 12px;
    border: 1px solid #dbe4f0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
}

button.header-download:disabled {
    opacity: 0.72;
}

.download-hero {
    text-align: center;
}

.hero-kicker {
    margin: 0;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
}

.download-hero h1 {
    margin: 10px 0 0;
    color: #0f172a;
    font-size: 27px;
    line-height: 1.28;
    font-weight: 700;
}

.hero-desc {
    max-width: 320px;
    margin: 12px auto 0;
    color: #52627a;
    font-size: 14px;
    line-height: 1.72;
}

.visual-carousel {
    margin-top: 22px;
}

.app-swipe {
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.1);
}

.slide-card {
    position: relative;
    height: 230px;
    overflow: hidden;
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 22px;
    background: #ffffff;
}

.slide-card img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center;
}

.slide-card::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: 42%;
    background: linear-gradient(0deg, rgba(15, 23, 42, 0.48), transparent);
}

.slide-caption {
    position: absolute;
    right: 16px;
    bottom: 18px;
    left: 16px;
    z-index: 1;
    display: grid;
    gap: 5px;
    color: #ffffff;
}

.slide-caption span {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.86;
}

.slide-caption strong {
    font-size: 18px;
    line-height: 1.3;
}

.download-panel {
    margin-top: 18px;
    padding: 18px;
    border: 1px solid rgba(226, 232, 240, 0.94);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.qr-area {
    min-height: 172px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ios-panel {
    min-height: 172px;
    padding: 22px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    text-align: center;
}

.ios-panel svg {
    width: 34px;
    height: 34px;
    color: #64748b;
}

.ios-panel h2 {
    margin: 12px 0 0;
    color: #0f172a;
    font-size: 18px;
    line-height: 1.35;
}

.ios-panel p {
    max-width: 260px;
    margin: 8px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.65;
}

.qr-code {
    width: 172px;
    height: 172px;
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.qr-empty {
    width: 100%;
    padding: 0;
}

.download-info {
    margin-top: 12px;
    text-align: center;
}

.download-info h2 {
    margin: 0;
    color: #0f172a;
    font-size: 18px;
    line-height: 1.35;
}

.download-info p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
}

.action-area {
    margin-top: 18px;
    display: grid;
    gap: 10px;
}

:deep(.var-swipe__indicators) {
    bottom: 10px;
}

:deep(.var-swipe__indicator) {
    background: rgba(255, 255, 255, 0.78);
    opacity: 1;
}

.h5-primary-button,
.h5-outline-button {
    min-height: 44px;
    border-radius: 999px;
}

.h5-primary-button {
    background: #2563eb;
}

.h5-outline-button {
    color: #2563eb;
    background: #ffffff;
}

@media screen and (max-width: 360px) {
    .header-actions {
        gap: 6px;
    }

    .slide-card {
        height: 206px;
    }

    .download-hero h1 {
        font-size: 24px;
    }
}
</style>
