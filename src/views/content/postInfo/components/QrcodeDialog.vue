<template>
    <el-dialog v-model="visible" width="360px" :lock-scroll="false" class="qrcode-dialog">
        <template #header>
            <div class="dialog-title">{{ title || '二维码' }}</div>
        </template>

        <div class="dialog-body">
            <Vue3NextQrcode ref="qrcodeRef" :text="text" :size="220" :margin="8" color-dark="#111827" color-light="#ffffff" />
            <div v-if="description" class="dialog-desc">{{ description }}</div>
        </div>

        <template #footer>
            <el-button @click="visible = false">关闭</el-button>
            <el-button type="primary" :disabled="!text" @click="handleDownload">下载二维码</el-button>
        </template>
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
.qrcode-dialog {
    :deep(.el-dialog__body) {
        padding: 16px 20px 10px;
    }
}

.dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.dialog-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.dialog-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    word-break: break-all;
}
</style>
