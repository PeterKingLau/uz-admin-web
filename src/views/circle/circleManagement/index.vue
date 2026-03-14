<template>
    <div class="page-container">
        <div class="main-content">
            <el-card class="creation-card" shadow="never">
                <template #header>
                    <div class="card-header">
                        <div class="header-text">
                            <h2 class="title">创建新圈子</h2>
                            <p class="subtitle">填写基本信息，开启你的社区之旅</p>
                        </div>
                    </div>
                </template>

                <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="main-form" size="large">
                    <el-row :gutter="60">
                        <el-col :xs="24" :lg="14">
                            <div class="form-section">
                                <el-form-item label="圈子名称" prop="name">
                                    <el-input v-model="form.name" placeholder="给圈子起个响亮的名字" maxlength="20" show-word-limit class="custom-input">
                                        <template #prefix>
                                            <Icon icon="mdi:format-title" class="input-icon" />
                                        </template>
                                    </el-input>
                                </el-form-item>

                                <el-form-item label="圈子简介" prop="description">
                                    <el-input
                                        v-model="form.description"
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
                                            v-model="form.coverUrl"
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
                                        <div v-if="coverUploading" class="cover-upload-loading">
                                            <Icon icon="mdi:loading" class="loading-icon" />
                                            <span class="loading-text">上传中...</span>
                                        </div>
                                    </div>
                                    <div class="cover-upload-tip">建议 1:1，支持 JPG/PNG/WebP，最大 10MB</div>
                                </el-form-item>
                            </div>
                        </el-col>

                        <el-col :xs="24" :lg="10">
                            <div class="preview-container">
                                <div class="preview-label"><Icon icon="mdi:cellphone" /> 实时预览</div>
                                <div class="device-mockup">
                                    <div class="device-notch"></div>
                                    <div class="mockup-screen">
                                        <div class="mockup-header">
                                            <Icon icon="mdi:chevron-left" />
                                            <span>详情</span>
                                            <Icon icon="mdi:dots-horizontal" />
                                        </div>
                                        <div class="mockup-cover">
                                            <el-image v-if="form.coverUrl" :src="coverPreviewUrl" fit="cover" class="mockup-img" />
                                            <div v-else class="mockup-img-placeholder">
                                                <Icon icon="mdi:image-outline" />
                                            </div>
                                            <div class="mockup-overlay"></div>
                                        </div>
                                        <div class="mockup-body">
                                            <div class="mockup-title">{{ form.name || '圈子名称' }}</div>
                                            <div class="mockup-meta">
                                                <div class="meta-item"><Icon icon="mdi:account-group-outline" /> {{ mockMemberCount }} 成员</div>
                                                <div class="meta-item"><Icon icon="mdi:message-text-outline" /> {{ mockPostCount }} 动态</div>
                                            </div>
                                            <div class="mockup-desc">
                                                {{ form.description || '这里将显示圈子的简介内容...' }}
                                            </div>
                                            <div class="mockup-btn">加入圈子</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </el-col>
                    </el-row>
                </el-form>

                <div class="form-footer">
                    <el-button size="large" @click="handleReset" class="btn-reset"> <Icon icon="mdi:refresh" class="btn-icon" /> 重置 </el-button>
                    <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit" class="btn-submit">
                        {{ submitting ? '提交中...' : '立即创建' }}
                        <Icon icon="mdi:arrow-right" class="btn-icon right" />
                    </el-button>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts" name="CircleManagementCreate">
import { ref, reactive, computed, getCurrentInstance } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { createCircle } from '@/api/content/circleManagement'
import type { CreateCirclePayload } from '@/api/content/circleManagement.types'
import { getImgUrl } from '@/utils/img'
import { formatMockNumber } from '@/utils/utils'

const { proxy } = getCurrentInstance() || {}

const initialForm = () => ({
    name: '',
    description: '',
    coverUrl: ''
})

const form = reactive<CreateCirclePayload>(initialForm())
const formRef = ref<FormInstance>()
const submitting = ref(false)
const coverUploading = ref(false)
const coverPreviewUrl = computed(() => getImgUrl(form.coverUrl || ''))
const mockMemberCount = ref(formatMockNumber(800, 5200))
const mockPostCount = ref(formatMockNumber(120, 980))

const rules: FormRules = {
    name: [
        { required: true, message: '请输入圈子名称', trigger: 'blur' },
        { min: 2, max: 20, message: '名称长度需在 2-20 个字符之间', trigger: 'blur' }
    ],
    description: [
        { required: true, message: '请填写圈子简介', trigger: 'blur' },
        { min: 5, max: 200, message: '简介长度需在 5-200 个字符之间', trigger: 'blur' }
    ],
    coverUrl: [{ required: true, message: '请上传封面图', trigger: 'change' }]
}

const handleReset = () => {
    formRef.value?.clearValidate()
    Object.assign(form, initialForm())
    coverUploading.value = false
}

const handleCoverUploadingChange = (value: boolean) => {
    coverUploading.value = Boolean(value)
}

const handleSubmit = async () => {
    const formEl = formRef.value
    if (!formEl || submitting.value) return

    try {
        await formEl.validate()
    } catch {
        return
    }

    submitting.value = true
    try {
        await createCircle({
            name: form.name.trim(),
            description: form.description.trim(),
            coverUrl: form.coverUrl.trim()
        })
        proxy?.$modal?.msgSuccess?.('圈子创建成功！')
        handleReset()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('创建失败，请稍后重试')
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped lang="scss">
.page-container {
    background-color: var(--el-bg-color-page);
    display: flex;
    justify-content: flex-start;
    box-sizing: border-box;
}

.main-content {
    width: 100%;
    max-width: none;
}

.creation-card {
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    background: var(--el-bg-color);
    width: 100%;

    :deep(.el-card__header) {
        padding: 30px 40px;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-card__body) {
        padding: 40px;
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-text {
        .title {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            line-height: 1.3;
        }

        .subtitle {
            margin: 8px 0 0;
            font-size: 14px;
            color: var(--el-text-color-secondary);
        }
    }
}

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

    .sub-text {
        font-size: 12px;
        color: var(--el-text-color-secondary);
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

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-left: 20px;
    border-left: 1px dashed var(--el-border-color);

    .preview-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
}

.device-mockup {
    width: 280px;
    height: 520px;
    background: #1a1a1a;
    border-radius: 36px;
    padding: 10px;
    position: relative;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);

    .device-notch {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 120px;
        height: 24px;
        background: #1a1a1a;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
        z-index: 10;
    }

    .mockup-screen {
        width: 100%;
        height: 100%;
        background: var(--el-bg-color);
        border-radius: 28px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .mockup-header {
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-top: 20px;
        z-index: 2;

        .iconify {
            font-size: 20px;
        }
    }

    .mockup-cover {
        height: 160px;
        background-color: var(--el-fill-color-light);
        position: relative;
        overflow: hidden;

        .mockup-img {
            width: 100%;
            height: 100%;
        }

        .mockup-img-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: var(--el-text-color-placeholder);
        }

        .mockup-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
        }
    }

    .mockup-body {
        padding: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;

        .mockup-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            margin-bottom: 8px;
            margin-top: -30px;
            position: relative;
            z-index: 2;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .mockup-meta {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;

            .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: var(--el-text-color-secondary);
            }
        }

        .mockup-desc {
            font-size: 13px;
            color: var(--el-text-color-regular);
            line-height: 1.5;
            margin-bottom: 20px;
            flex: 1;
            white-space: pre-wrap;
        }

        .mockup-btn {
            width: 100%;
            height: 36px;
            background: var(--el-color-primary);
            color: white;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 500;
        }
    }
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

@media screen and (max-width: 1200px) {
    .preview-container {
        border-left: none;
        padding-left: 0;
        margin-top: 40px;
        padding-top: 40px;
        border-top: 1px dashed var(--el-border-color);
    }
}
</style>
