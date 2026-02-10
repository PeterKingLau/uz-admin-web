<template>
    <el-dialog v-model="visible" width="380px" :show-close="false" class="modern-qrcode-dialog" align-center destroy-on-close>
        <div class="dialog-content-wrapper">
            <div class="dialog-header">
                <span class="title">{{ title || '二维码分享' }}</span>
                <div class="close-icon" @click="visible = false">
                    <Icon icon="mdi:close" />
                </div>
            </div>

            <div class="qr-container">
                <div class="qr-card">
                    <Vue3NextQrcode ref="qrcodeRef" :text="text" :size="240" :margin="10" color-dark="#000000" color-light="#ffffff" error-level="H" />
                </div>
            </div>

            <div v-if="description" class="description-box">
                {{ description }}
            </div>

            <div class="dialog-footer">
                <el-button type="primary" class="download-btn" :disabled="!text" @click="handleDownload">
                    <Icon icon="mdi:download" class="btn-icon" />
                    <span>保存二维码图片</span>
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
    border-radius: 20px;
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
    padding: 16px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--el-bg-color);
}

.dialog-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    height: 32px;

    .title {
        font-size: 17px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .close-icon {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--el-text-color-regular);
        transition: all 0.2s;
        font-size: 18px;
        margin-right: -4px;

        &:hover {
            background: var(--el-fill-color);
            color: var(--el-text-color-primary);
        }
    }
}

.qr-container {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
}

.qr-card {
    padding: 10px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--el-border-color-lighter);
}

.description-box {
    font-size: 13px;
    color: var(--el-text-color-regular);
    text-align: center;
    line-height: 1.5;
    margin-bottom: 24px;
    max-width: 90%;
    opacity: 0.8;
}

.dialog-footer {
    width: 100%;
}

.download-btn {
    width: 100%;
    height: 44px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
    transition: all 0.2s;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
    }

    &:active {
        transform: translateY(0);
    }

    .btn-icon {
        font-size: 18px;
    }
}
</style>
