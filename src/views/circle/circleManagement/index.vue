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
                        <div class="step-indicator">
                            <div class="step-item active">
                                <span class="step-num">1</span>
                                <span class="step-label">基础信息</span>
                            </div>
                            <div class="step-line"></div>
                            <div class="step-item">
                                <span class="step-num">2</span>
                                <span class="step-label">提交审核</span>
                            </div>
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
                                        placeholder="简要介绍圈子的主题、规则或愿景..."
                                        class="custom-textarea"
                                    />
                                </el-form-item>

                                <el-form-item label="封面图片" prop="coverUrl">
                                    <div class="upload-wrapper">
                                        <div class="upload-box" v-if="!form.coverUrl">
                                            <el-upload
                                                class="avatar-uploader"
                                                action="#"
                                                :show-file-list="false"
                                                :auto-upload="false"
                                                :on-change="handleFileChange"
                                                accept="image/*"
                                            >
                                                <div class="upload-placeholder">
                                                    <div class="icon-bg">
                                                        <Icon icon="mdi:cloud-upload-outline" />
                                                    </div>
                                                    <div class="upload-text">点击或拖拽上传封面</div>
                                                    <div class="upload-hint">建议尺寸 800x450，支持 JPG/PNG/WebP</div>
                                                </div>
                                            </el-upload>
                                        </div>

                                        <div class="upload-preview" v-else>
                                            <el-image :src="form.coverUrl" fit="cover" class="uploaded-img" />
                                            <div class="preview-actions">
                                                <el-button type="danger" circle @click="form.coverUrl = ''">
                                                    <Icon icon="mdi:delete-outline" />
                                                </el-button>
                                            </div>
                                        </div>
                                    </div>
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
                                            <el-image v-if="form.coverUrl" :src="form.coverUrl" fit="cover" class="mockup-img" />
                                            <div v-else class="mockup-img-placeholder">
                                                <Icon icon="mdi:image-outline" />
                                            </div>
                                            <div class="mockup-overlay"></div>
                                        </div>
                                        <div class="mockup-body">
                                            <div class="mockup-title">{{ form.name || '圈子名称' }}</div>
                                            <div class="mockup-meta">
                                                <div class="meta-item"><Icon icon="mdi:account-group-outline" /> 1.2k 成员</div>
                                                <div class="meta-item"><Icon icon="mdi:message-text-outline" /> 328 动态</div>
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
import { Icon } from '@iconify/vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { createCircle, type CreateCirclePayload } from '@/api/content/circleManagement'

const { proxy } = getCurrentInstance() || {}

const initialForm = () => ({
    name: '',
    description: '',
    coverUrl: ''
})

const form = reactive<CreateCirclePayload>(initialForm())
const formRef = ref<FormInstance>()
const submitting = ref(false)

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

// 模拟文件上传改变，实际项目中请对接 ImageUpload 组件或 upload 逻辑
const handleFileChange = (uploadFile: UploadFile) => {
    if (uploadFile.raw) {
        form.coverUrl = URL.createObjectURL(uploadFile.raw)
    }
}

const handleReset = () => {
    formRef.value?.clearValidate()
    Object.assign(form, initialForm())
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

    .step-indicator {
        display: flex;
        align-items: center;
        gap: 12px;

        .step-item {
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0.5;
            transition: opacity 0.3s;

            &.active {
                opacity: 1;

                .step-num {
                    background-color: var(--el-color-primary);
                    color: white;
                    border-color: var(--el-color-primary);
                }

                .step-label {
                    color: var(--el-text-color-primary);
                    font-weight: 600;
                }
            }

            .step-num {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 1px solid var(--el-text-color-secondary);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
            }

            .step-label {
                font-size: 14px;
            }
        }

        .step-line {
            width: 40px;
            height: 1px;
            background-color: var(--el-border-color);
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

.upload-wrapper {
    width: 100%;
}

.upload-box {
    width: 100%;

    :deep(.el-upload) {
        width: 100%;
        display: block;
    }

    .upload-placeholder {
        width: 100%;
        height: 200px;
        border: 2px dashed var(--el-border-color);
        border-radius: 12px;
        background-color: var(--el-fill-color-lighter);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
            border-color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);

            .icon-bg {
                transform: scale(1.1);
                background-color: var(--el-color-white);
                color: var(--el-color-primary);
            }
        }

        .icon-bg {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: var(--el-fill-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: var(--el-text-color-secondary);
            margin-bottom: 12px;
            transition: all 0.3s;
        }

        .upload-text {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-regular);
            margin-bottom: 4px;
        }

        .upload-hint {
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }
    }
}

.upload-preview {
    position: relative;
    width: 100%;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);

    .uploaded-img {
        width: 100%;
        height: 100%;
    }

    .preview-actions {
        position: absolute;
        top: 10px;
        right: 10px;
        display: none;
    }

    &:hover .preview-actions {
        display: block;
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
        background: #fff;
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
        color: #333;
        margin-top: 20px;

        .iconify {
            font-size: 20px;
        }
    }

    .mockup-cover {
        height: 160px;
        background-color: #f5f7fa;
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
            color: #dcdfe6;
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
            color: #303133;
            margin-bottom: 8px;
            margin-top: -30px;
            position: relative;
            z-index: 2;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
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
                color: #909399;
            }
        }

        .mockup-desc {
            font-size: 13px;
            color: #606266;
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
