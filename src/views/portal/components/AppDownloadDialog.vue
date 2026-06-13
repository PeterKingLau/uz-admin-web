<template>
    <Teleport to="body">
        <Transition name="app-download-fade">
            <div
                v-if="visible"
                class="app-download-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="app-download-title"
                @click.self="visible = false"
                @wheel.prevent
                @touchmove.prevent
            >
                <div class="app-download-panel">
                    <button type="button" class="dialog-close" :aria-label="ui.closeAriaLabel" @click="visible = false">
                        <Icon icon="mdi:close" />
                    </button>

                    <section class="download-info">
                        <div class="download-brand">
                            <img :src="brandLogo" alt="" />
                            <div>
                                <h3 id="app-download-title">{{ ui.title }}</h3>
                                <p>{{ ui.desc }}</p>
                            </div>
                        </div>

                        <div class="qr-row">
                            <div class="qr-card">
                                <div ref="qrCodeRef" class="qr-block" :aria-label="ui.qrAriaLabel"></div>
                            </div>
                        </div>

                        <div class="download-meta">
                            <span>{{ versionLabel }}</span>
                        </div>
                    </section>

                    <section class="download-visual" aria-hidden="true">
                        <img :src="downloadVisualImage" alt="" class="download-visual-image" />
                    </section>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import QRCodeStyling from 'qr-code-styling'
import downloadVisualImage from '@/assets/images/portal-app-download-visual.jpg'
import type { PortalUiText } from '../data'

defineOptions({ name: 'PortalAppDownloadDialog' })

const props = defineProps<{
    ui: PortalUiText['appDialog']
    modelValue: boolean
    brandLogo: string
    downloadUrl: string
    versionName?: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const visible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})
const qrCodeRef = ref<HTMLElement | null>(null)
let qrCode: QRCodeStyling | null = null
const QR_CODE_SIZE = 154
const SCROLL_KEYS = new Set([' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'])

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        visible.value = false
        return
    }
    if (SCROLL_KEYS.has(event.key)) {
        event.preventDefault()
    }
}

async function renderQrCode() {
    if (!visible.value || !props.downloadUrl) return
    await nextTick()
    const container = qrCodeRef.value
    if (!container) return

    container.replaceChildren()
    qrCode = new QRCodeStyling({
        width: QR_CODE_SIZE,
        height: QR_CODE_SIZE,
        type: 'svg',
        data: props.downloadUrl,
        image: props.brandLogo,
        qrOptions: {
            errorCorrectionLevel: 'H'
        },
        imageOptions: {
            imageSize: 0.22,
            margin: 5,
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

watch(visible, value => {
    if (typeof window === 'undefined') return
    if (value) {
        window.addEventListener('keydown', handleKeydown)
        void renderQrCode()
    } else {
        window.removeEventListener('keydown', handleKeydown)
    }
})

watch(
    () => [props.downloadUrl, props.brandLogo],
    () => {
        void renderQrCode()
    }
)

onBeforeUnmount(() => {
    qrCodeRef.value?.replaceChildren()
    qrCode = null
    if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeydown)
    }
})

const versionLabel = computed(() => {
    const version = String(props.versionName || '').trim()
    return version ? props.ui.currentVersion.replace('{version}', version) : props.ui.latestVersion
})
</script>

<style scoped lang="scss">
.app-download-overlay {
    --download-primary: #2563eb;
    --download-text: #0f172a;
    --download-muted: #52627a;

    position: fixed;
    inset: 0;
    z-index: 3000;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.42);
}

.app-download-panel {
    position: relative;
    min-height: 430px;
    width: min(820px, calc(100vw - 48px));
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    overflow: hidden;
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 24px 68px rgba(15, 23, 42, 0.24);
}

.app-download-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
        linear-gradient(104deg, #ffffff 0 39%, rgba(231, 252, 250, 0.92) 39% 100%), radial-gradient(circle at 76% 28%, rgba(37, 99, 235, 0.12), transparent 34%);
    pointer-events: none;
}

.dialog-close {
    position: absolute;
    top: 16px;
    right: 18px;
    z-index: 4;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.08);
    color: var(--download-text);
    cursor: pointer;
    transition:
        background-color 160ms ease,
        color 160ms ease;
}

.dialog-close:hover {
    background: rgba(15, 23, 42, 0.14);
}

.download-info,
.download-visual {
    position: relative;
    z-index: 1;
}

.download-info {
    padding: 86px 42px 42px 56px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.download-brand {
    display: flex;
    align-items: center;
    gap: 14px;
}

.download-brand img {
    width: 42px;
    height: 42px;
    border-radius: 10px;
}

.download-brand h3 {
    margin: 0;
    font-size: 24px;
    line-height: 1.2;
    color: var(--download-text);
}

.download-brand p {
    margin: 8px 0 0;
    color: var(--download-muted);
    font-size: 14px;
    line-height: 1.6;
}

.qr-row {
    margin-top: 26px;
    display: flex;
    gap: 20px;
}

.qr-card {
    width: 178px;
    display: grid;
    justify-items: center;
}

.qr-block {
    width: 178px;
    height: 178px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}

.qr-block :deep(svg) {
    display: block;
}

.download-meta {
    margin-top: 18px;
    display: flex;
    align-items: center;
    gap: 14px;
}

.download-meta span {
    color: var(--download-muted);
    font-size: 13px;
}

.download-visual {
    min-height: 430px;
    overflow: hidden;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
}

.download-visual-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center;
}

@media screen and (max-width: 768px) {
    .app-download-overlay {
        padding: 14px;
    }

    .app-download-panel {
        min-height: auto;
        width: 100%;
        grid-template-columns: 1fr;
    }

    .download-info {
        padding: 58px 24px 28px;
    }

    .download-visual {
        min-height: 240px;
    }
}

.app-download-fade-enter-active,
.app-download-fade-leave-active {
    transition: opacity 180ms ease;
}

.app-download-fade-enter-active .app-download-panel,
.app-download-fade-leave-active .app-download-panel {
    transition: transform 180ms ease;
}

.app-download-fade-enter-from,
.app-download-fade-leave-to {
    opacity: 0;
}

.app-download-fade-enter-from .app-download-panel,
.app-download-fade-leave-to .app-download-panel {
    transform: translateY(8px);
}
</style>
