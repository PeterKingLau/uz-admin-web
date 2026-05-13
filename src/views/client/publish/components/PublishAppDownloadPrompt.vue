<template>
    <section class="publish-download-prompt">
        <div class="prompt-card">
            <div class="prompt-brand">
                <img :src="brandLogo" alt="" />
                <div>
                    <h1>请下载职场吧 App 发布内容</h1>
                    <p>移动端发布、素材上传与内容管理已在 App 内提供更完整的操作体验。</p>
                </div>
            </div>

            <div class="prompt-visual" aria-hidden="true">
                <div class="phone-shell">
                    <div class="phone-top"></div>
                    <div class="phone-feed">
                        <span></span>
                        <strong></strong>
                        <i></i>
                        <i></i>
                    </div>
                </div>
                <div class="visual-chip chip-primary">内容发布</div>
                <div class="visual-chip chip-secondary">作品管理</div>
            </div>

            <div class="qr-panel">
                <div v-if="downloadUrl" ref="qrCodeRef" class="qr-code" aria-label="App 下载二维码"></div>
                <VarResult v-else class="qr-empty" :type="loading ? 'info' : 'error'" :title="loading ? '正在获取下载地址' : '下载地址暂不可用'" />
                <p>{{ versionLabel }}</p>
            </div>

            <div class="prompt-actions">
                <VarButton v-if="downloadUrl" block type="primary" class="prompt-primary-button" @click="handleDownload">立即下载 App</VarButton>
                <VarButton v-else block type="primary" class="prompt-primary-button" :loading="loading" @click="$emit('retry')">重新获取</VarButton>
                <VarButton block outline type="primary" class="prompt-outline-button" @click="$emit('goDiscover')">先浏览内容</VarButton>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import QRCodeStyling from 'qr-code-styling'
import VarButton from '@varlet/ui/es/button'
import VarResult from '@varlet/ui/es/result'
import '@varlet/ui/es/button/style'
import '@varlet/ui/es/result/style'

defineOptions({ name: 'PublishAppDownloadPrompt' })

const props = defineProps<{
    brandLogo: string
    downloadUrl: string
    versionName?: string
    loading?: boolean
}>()

defineEmits<{
    retry: []
    goDiscover: []
}>()

const qrCodeRef = ref<HTMLElement | null>(null)
let qrCode: QRCodeStyling | null = null
const QR_CODE_SIZE = 176

async function renderQrCode() {
    await nextTick()
    const container = qrCodeRef.value
    if (!container || !props.downloadUrl) return

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
            imageSize: 0.18,
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

watch(
    () => [props.downloadUrl, props.brandLogo],
    () => {
        void renderQrCode()
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    qrCodeRef.value?.replaceChildren()
    qrCode = null
})

function handleDownload() {
    if (!props.downloadUrl) return
    window.location.href = props.downloadUrl
}

const versionLabel = computed(() => {
    const version = String(props.versionName || '').trim()
    return version ? `当前版本 v${version}` : '扫码获取最新版本'
})
</script>

<style scoped lang="scss">
.publish-download-prompt {
    min-height: calc(100vh - 56px);
    padding: 76px 18px 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
        radial-gradient(circle at 50% 0, rgba(37, 99, 235, 0.1), transparent 34%),
        linear-gradient(180deg, #f8fafc 0%, #eef3f8 100%);
}

.prompt-card {
    width: min(100%, 430px);
    padding: 24px;
    border: 1px solid rgba(226, 232, 240, 0.92);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.09);
}

.prompt-brand {
    display: flex;
    align-items: flex-start;
    gap: 14px;
}

.prompt-brand img {
    width: 44px;
    height: 44px;
    border-radius: 12px;
}

.prompt-brand h1 {
    margin: 0;
    color: #0f172a;
    font-size: 23px;
    line-height: 1.35;
    font-weight: 700;
}

.prompt-brand p {
    margin: 10px 0 0;
    color: #52627a;
    font-size: 14px;
    line-height: 1.7;
}

.prompt-visual {
    position: relative;
    height: 170px;
    margin-top: 24px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background:
        linear-gradient(135deg, rgba(37, 99, 235, 0.08), transparent 44%),
        linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
}

.phone-shell {
    position: absolute;
    right: 34px;
    top: 22px;
    width: 118px;
    height: 160px;
    padding: 14px 12px;
    border: 7px solid #1f2937;
    border-radius: 24px;
    background: #ffffff;
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
    transform: rotate(6deg);
}

.phone-top {
    width: 34px;
    height: 5px;
    margin: 0 auto 14px;
    border-radius: 999px;
    background: #111827;
}

.phone-feed {
    display: grid;
    gap: 9px;
}

.phone-feed span,
.phone-feed strong,
.phone-feed i {
    display: block;
    border-radius: 8px;
}

.phone-feed span {
    height: 42px;
    background: linear-gradient(135deg, #bfdbfe, #dbeafe);
}

.phone-feed strong {
    height: 10px;
    width: 72%;
    background: #cbd5e1;
}

.phone-feed i {
    height: 22px;
    background: #eef2f7;
}

.visual-chip {
    position: absolute;
    left: 22px;
    padding: 10px 12px;
    border-radius: 12px;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
}

.chip-primary {
    top: 38px;
    background: #dbeafe;
}

.chip-secondary {
    bottom: 36px;
    background: #dcfce7;
}

.qr-panel {
    margin-top: 22px;
    display: grid;
    justify-items: center;
}

.qr-code {
    width: 204px;
    height: 204px;
    padding: 14px;
    border: 1px solid #dbe3ec;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.07);
}

.qr-empty {
    width: 204px;
    min-height: 204px;
    padding: 8px;
    border: 1px solid #dbe3ec;
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.07);
}

.qr-panel p {
    margin: 12px 0 0;
    color: #64748b;
    font-size: 13px;
}

.prompt-actions {
    margin-top: 24px;
    display: grid;
    gap: 12px;
}

.prompt-primary-button,
.prompt-outline-button {
    min-height: 44px;
    border-radius: 999px;
}

.prompt-primary-button {
    background: #2563eb;
}

.prompt-outline-button {
    color: #2563eb;
    background: #ffffff;
}
</style>
