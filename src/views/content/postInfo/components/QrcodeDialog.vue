<template>
    <el-dialog v-model="visible" width="360px" :show-close="false" class="modern-qrcode-dialog" align-center destroy-on-close>
        <div class="dialog-content-wrapper">
            <div class="close-btn-wrapper" @click="visible = false">
                <Icon icon="mdi:close" class="close-icon" />
            </div>

            <div class="dialog-header">
                <el-tooltip :content="title || '扫码分享'" placement="top">
                    <h3 class="title">{{ title || '扫码分享' }}</h3>
                </el-tooltip>
                <p v-if="description" class="description">{{ description }}</p>
            </div>

            <div class="qr-container">
                <div class="qr-card">
                    <Vue3NextQrcode ref="qrcodeRef" :text="text" :size="220" :margin="10" color-dark="#0f172a" color-light="#ffffff" error-level="H" />
                </div>
            </div>

            <div class="dialog-footer">
                <el-button type="primary" class="download-btn" :disabled="!text" @click="handleDownload">
                    <Icon icon="mdi:download" class="btn-icon" />
                    <span>保存到本地</span>
                </el-button>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Vue3NextQrcode } from 'vue3-next-qrcode'
import type { QRCodeInst } from 'vue3-next-qrcode'

const props = defineProps<{
    modelValue: boolean
    text: string
    title?: string
    description?: string
    fileName?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const qrcodeRef = ref<QRCodeInst | null>(null)

const normalizeFileName = (name?: string) => {
    const base = String(name || '').trim()
    if (!base) return ''
    return base.toLowerCase().endsWith('.png') ? base : `${base}.png`
}

const handleDownload = async () => {
    const instance = qrcodeRef.value
    if (!instance) return
    try {
        const name = normalizeFileName(props.fileName) || `qrcode-${Date.now()}.png`
        instance.downloadQRCode(name)
    } catch (error) {
        console.error(error)
    }
}
</script>

<style scoped lang="scss">
:deep(.modern-qrcode-dialog) {
    border-radius: 24px;
    background: var(--el-bg-color);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    padding: 0;

    .el-dialog__header {
        display: none;
    }

    .el-dialog__body {
        padding: 0;
    }
}

.dialog-content-wrapper {
    position: relative;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 40%);
}

.close-btn-wrapper {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--el-fill-color-blank);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;

    .close-icon {
        font-size: 18px;
        color: var(--el-text-color-regular);
        transition: color 0.2s;
    }

    &:hover {
        background: var(--el-fill-color-light);
        transform: scale(1.1);

        .close-icon {
            color: var(--el-text-color-primary);
        }
    }
}

.dialog-header {
    width: 100%;
    text-align: center;
    margin-bottom: 24px;
    padding: 0 36px;
    box-sizing: border-box;

    .title {
        max-width: 100%;
        font-size: 18px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        margin: 0 0 6px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .description {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin: 0;
        line-height: 1.5;
        word-break: break-word;
    }
}

.qr-container,
.dialog-footer {
    width: 100%;
}

.qr-container {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
}

.qr-card {
    padding: 12px;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--el-border-color-lighter);
    position: relative;

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 20px;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.02);
        pointer-events: none;
    }
}

.download-btn {
    width: 100%;
    height: 44px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.25);
    border: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(var(--el-color-primary-rgb), 0.35);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 4px 10px rgba(var(--el-color-primary-rgb), 0.2);
    }

    .btn-icon {
        font-size: 20px;
    }
}

:global(html.dark) .dialog-content-wrapper {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color)) 0%, var(--el-bg-color) 40%);
}

:global(html.dark) .close-btn-wrapper {
    background: var(--el-fill-color-darker);
    border: 1px solid var(--el-border-color-lighter);
}
</style>
