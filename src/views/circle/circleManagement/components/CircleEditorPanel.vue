<template>
    <el-form ref="formRef" :model="props.form" :rules="props.rules" label-position="top" class="main-form" size="large">
        <div class="form-section">
            <el-form-item label="圈子名称" prop="name">
                <el-input v-model="props.form.name" placeholder="给圈子起个响亮的名字" maxlength="20" show-word-limit class="custom-input">
                    <template #prefix>
                        <Icon icon="mdi:format-title" class="input-icon" />
                    </template>
                </el-input>
            </el-form-item>

            <el-form-item label="圈子简介" prop="description">
                <el-input
                    v-model="props.form.description"
                    type="textarea"
                    :rows="6"
                    maxlength="200"
                    show-word-limit
                    resize="none"
                    placeholder="简要介绍圈子的主题、规则或愿景..."
                    class="custom-textarea"
                />
            </el-form-item>

            <el-form-item label="封面图片" prop="coverUrl" class="cover-upload-item">
                <div class="cover-upload-box">
                    <ImageUpload
                        v-model="props.form.coverUrl"
                        :limit="1"
                        :file-size="10"
                        :file-type="['png', 'jpg', 'jpeg', 'webp']"
                        :is-show-tip="false"
                        oss-type="circles"
                        class="wide-cover-uploader"
                        @uploading-change="handleCoverUploadingChange"
                    >
                        <template #trigger>
                            <div class="placeholder-content">
                                <div class="icon-circle">
                                    <Icon icon="mdi:image-plus-outline" />
                                </div>
                                <div class="text-group">
                                    <span class="main-text">上传封面</span>
                                </div>
                            </div>
                        </template>
                    </ImageUpload>
                    <div v-if="props.coverUploading" class="cover-upload-loading">
                        <Icon icon="mdi:loading" class="loading-icon" />
                        <span class="loading-text">上传中...</span>
                    </div>
                </div>
                <div class="cover-upload-tip">建议 1:1，支持 JPG/PNG/WebP，最大 10MB</div>
            </el-form-item>
        </div>
    </el-form>

    <div class="form-footer">
        <el-button size="large" @click="emit('reset')" class="btn-reset"> <Icon icon="mdi:refresh" class="btn-icon" /> 重置 </el-button>
        <el-button type="primary" size="large" :loading="props.submitting" @click="emit('submit')" class="btn-submit">
            {{ props.submitting ? '提交中...' : '立即创建' }}
            <Icon icon="mdi:arrow-right" class="btn-icon right" />
        </el-button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CreateCirclePayload } from '@/api/content/circleManagement.types'

const props = defineProps<{
    form: CreateCirclePayload
    rules: FormRules
    submitting: boolean
    coverUploading: boolean
}>()

const emit = defineEmits<{
    (e: 'submit'): void
    (e: 'reset'): void
    (e: 'cover-uploading-change', value: boolean): void
}>()

const formRef = ref<FormInstance>()

const handleCoverUploadingChange = (value: boolean) => {
    emit('cover-uploading-change', Boolean(value))
}

const validate = async () => {
    const formEl = formRef.value
    if (!formEl) return false
    try {
        await formEl.validate()
        return true
    } catch {
        return false
    }
}

const clearValidate = () => {
    formRef.value?.clearValidate()
}

defineExpose({
    validate,
    clearValidate
})
</script>

<style scoped lang="scss">
.main-form {
    :deep(.el-form-item__label) {
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 10px;
    }
}

.input-icon {
    font-size: 18px;
    color: var(--el-text-color-placeholder);
}

.custom-input {
    :deep(.el-input__wrapper) {
        padding: 4px 12px;
        border-radius: 8px;
        background-color: var(--el-fill-color-blank);
        box-shadow: 0 0 0 1px var(--el-border-color) inset;
        transition: all 0.2s;

        &.is-focus {
            box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
            background-color: var(--el-bg-color);
        }
    }
}

.custom-textarea {
    :deep(.el-textarea__inner) {
        border-radius: 8px;
        padding: 12px;
        background-color: var(--el-fill-color-blank);
        box-shadow: 0 0 0 1px var(--el-border-color) inset;
        transition: all 0.2s;

        &:focus {
            box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
            background-color: var(--el-bg-color);
        }
    }
}

.cover-upload-item {
    margin-bottom: 0 !important;

    :deep(.el-form-item__content) {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
}

.cover-upload-box {
    width: 132px;
    height: 132px;
    position: relative;
}

.wide-cover-uploader {
    width: 132px;
    height: 132px;
    display: block;
    position: relative;
    border-radius: 16px;
    overflow: hidden;

    :deep(.glass-upload-container) {
        width: 100%;
        height: 100%;
        padding: 0;
        border-radius: 16px;
        overflow: hidden;
        background-color: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary-light-9));
        border: 2px dashed color-mix(in srgb, var(--el-border-color) 82%, var(--el-color-primary) 18%);
        box-shadow: none;
        transition: all 0.2s;
    }

    :deep(.upload-wrapper),
    :deep(.glass-uploader) {
        height: 100%;
    }

    :deep(.glass-uploader .el-upload-list--picture-card) {
        height: 100%;
        margin: 0;
        display: block;
    }

    :deep(.glass-uploader .el-upload-list--picture-card .el-upload-list__item) {
        width: 100%;
        height: 100%;
        padding-bottom: 0;
        margin: 0;
        border: none;
        border-radius: 14px;
        background: transparent;
    }

    :deep(.glass-uploader .el-upload--picture-card) {
        width: 100% !important;
        height: 100% !important;
        padding-bottom: 0 !important;
        border: none;
        border-radius: 14px;
        background: transparent;
    }

    :deep(.glass-uploader .el-upload-dragger) {
        position: static;
        width: 100%;
        height: 100%;
    }

    :deep(.el-upload-list__item-thumbnail) {
        object-fit: cover;
    }

    :deep(.upload-trigger-content) {
        gap: 12px;
    }

    &:hover {
        :deep(.glass-upload-container) {
            border-color: var(--el-color-primary);
            background-color: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-primary-light-8));
        }
    }
}

.cover-upload-loading {
    position: absolute;
    inset: 0;
    z-index: 4;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: color-mix(in srgb, var(--el-bg-color) 76%, transparent);
    backdrop-filter: blur(2px);
    pointer-events: all;

    .loading-icon {
        font-size: 24px;
        color: var(--el-color-primary);
        animation: spin 1s linear infinite;
    }

    .loading-text {
        font-size: 13px;
        color: var(--el-text-color-primary);
        font-weight: 600;
    }
}

.cover-upload-tip {
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
}

.placeholder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;
}

.icon-circle {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background-color: color-mix(in srgb, var(--el-bg-color) 86%, var(--el-fill-color));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: var(--el-text-color-secondary);
    transition: all 0.3s ease;
}

.text-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .main-text {
        font-size: 12px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        transition: color 0.3s;
    }
}

.wide-cover-uploader:hover {
    .icon-circle {
        background-color: var(--el-bg-color);
        color: var(--el-color-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
    }

    .main-text {
        color: var(--el-color-primary);
    }
}

:global(html.dark) .wide-cover-uploader :deep(.glass-upload-container) {
    background-color: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-fill-color));
    border-color: color-mix(in srgb, var(--el-border-color) 85%, var(--el-color-primary) 15%);
}

:global(html.dark) .wide-cover-uploader:hover :deep(.glass-upload-container) {
    background-color: color-mix(in srgb, var(--el-bg-color) 86%, var(--el-color-primary) 14%);
}

:global(html.dark) .icon-circle {
    background-color: color-mix(in srgb, var(--el-bg-color) 76%, var(--el-fill-color));
    color: var(--el-color-primary-light-5);
}

:global(html.dark) .cover-upload-loading {
    background: color-mix(in srgb, var(--el-bg-color) 68%, transparent);
}

.form-footer {
    padding-top: 32px;
    margin-top: 32px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: flex-end;
    gap: 16px;

    .btn-reset {
        padding: 12px 28px;

        .btn-icon {
            margin-right: 6px;
        }
    }

    .btn-submit {
        padding: 12px 40px;
        font-weight: 500;

        .btn-icon.right {
            margin-left: 6px;
        }
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
