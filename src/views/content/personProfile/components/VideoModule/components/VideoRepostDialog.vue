<template>
    <el-dialog v-model="dialogVisible" append-to-body destroy-on-close width="520px" class="repost-dialog" @closed="handleClosed">
        <template #header>
            <div class="repost-dialog-title">转发内容</div>
        </template>
        <div class="repost-dialog-body">
            <el-input
                ref="repostInputRef"
                :model-value="content"
                type="textarea"
                :rows="8"
                placeholder="写点什么吧..."
                maxlength="2000"
                show-word-limit
                resize="none"
                class="custom-textarea"
                @update:modelValue="emit('update:content', String($event ?? ''))"
            />
        </div>
        <template #footer>
            <div class="repost-dialog-footer">
                <el-button text @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :disabled="!canSubmit" @click="emit('submit')">转发</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    content: { type: String, default: '' },
    canSubmit: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'update:content', 'submit'])

const repostInputRef = ref<{ focus?: () => void } | null>(null)

const dialogVisible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const focusInput = () => {
    repostInputRef.value?.focus?.()
}

const handleClosed = () => {
    emit('update:content', '')
}

watch(
    () => props.modelValue,
    visible => {
        if (visible) {
            nextTick(() => focusInput())
        }
    }
)

defineExpose({ focusInput })
</script>

<style scoped lang="scss">
.repost-dialog {
    .repost-dialog-title {
        position: relative;
        display: inline-flex;
        align-items: center;
        padding-left: 12px;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            width: 4px;
            height: 18px;
            border-radius: 999px;
            background: var(--el-color-primary);
            transform: translateY(-50%);
        }
    }

    :deep(.el-dialog) {
        background: var(--el-bg-color-overlay);
        border-radius: 12px;
    }

    :deep(.el-dialog__header) {
        margin: 0;
        padding: 20px;
        border-bottom: 1px solid var(--el-border-color);
    }

    :deep(.el-dialog__title) {
        color: var(--el-text-color-primary);
        font-size: 16px;
    }

    :deep(.el-dialog__body) {
        padding: 20px;
    }

    :deep(.el-dialog__footer) {
        padding: 20px;
        border-top: 1px solid var(--el-border-color);
    }

    :deep(.el-button--text) {
        color: var(--el-text-color-secondary);

        &:hover {
            color: var(--el-text-color-primary);
        }
    }
}
</style>
