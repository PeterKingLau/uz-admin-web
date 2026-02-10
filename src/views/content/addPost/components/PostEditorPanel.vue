<template>
    <div class="edit-section">
        <div class="section-header">
            <div class="title-group">
                <h2>发布新动态</h2>
                <p>分享生活，记录精彩瞬间</p>
            </div>
            <el-button link type="primary" @click="emit('reset')" class="reset-btn">
                <Icon icon="mdi:refresh" class="mr-1" />
                重置内容
            </el-button>
        </div>

        <el-card shadow="never" class="form-card">
            <el-form ref="formRef" :model="props.form" :rules="props.rules" label-position="top" class="post-form">
                <el-form-item label="选择发布类型" prop="postType" class="type-form-item">
                    <div class="type-grid">
                        <div
                            v-for="type in typeOptions"
                            :key="type.label"
                            class="type-card"
                            :class="{ active: props.form.postType === type.label }"
                            @click="emit('change-post-type', type.label)"
                        >
                            <div class="icon-box">
                                <Icon :icon="type.icon" />
                            </div>
                            <div class="info-box">
                                <span class="type-name">{{ type.text }}</span>
                                <span class="type-desc">{{ type.desc }}</span>
                            </div>
                            <transition name="check-scale">
                                <div class="check-mark" v-if="props.form.postType === type.label">
                                    <Icon icon="mdi:check-circle" />
                                </div>
                            </transition>
                        </div>
                    </div>
                    <el-radio-group v-model="props.form.postType" v-show="false"></el-radio-group>
                </el-form-item>

                <el-form-item label="正文内容" prop="content" class="highlight-label">
                    <div class="input-wrapper">
                        <el-input
                            v-model="props.form.content"
                            type="textarea"
                            :rows="8"
                            placeholder="写点什么吧..."
                            maxlength="2000"
                            show-word-limit
                            resize="none"
                            @input="emit('content-input')"
                            class="custom-textarea"
                        />
                    </div>
                </el-form-item>

                <transition name="el-zoom-in-top">
                    <el-form-item
                        v-if="props.form.postType !== POST_TYPE.TEXT"
                        :label="props.form.postType === POST_TYPE.IMAGE ? '上传图片' : '上传视频'"
                        prop="files"
                        class="highlight-label"
                    >
                        <div
                            class="upload-container"
                            :class="{
                                'image-mode': props.form.postType === POST_TYPE.IMAGE,
                                'video-mode': props.form.postType === POST_TYPE.VIDEO
                            }"
                        >
                            <template v-if="props.form.postType === POST_TYPE.IMAGE">
                                <ImageUpload
                                    ref="imageUploadRef"
                                    v-model="imageUrlsModel"
                                    :limit="9"
                                    :file-size="5"
                                    :file-type="['jpg', 'jpeg', 'png', 'gif']"
                                    :is-show-tip="false"
                                    oss-type="posts"
                                    :oss-post-type="POST_TYPE.IMAGE"
                                    class="custom-upload image-upload"
                                    @uploading-change="handleImageUploadingChange"
                                />
                            </template>

                            <template v-else>
                                <FileUpload
                                    ref="videoUploadRef"
                                    v-model="videoUrlsModel"
                                    :limit="1"
                                    :file-size="0"
                                    :file-type="['mp4', 'mov']"
                                    :is-show-tip="false"
                                    oss-type="posts"
                                    :oss-post-type="POST_TYPE.VIDEO"
                                    class="custom-upload video-upload"
                                    :class="{ 'video-upload--locked': hasVideoUploaded }"
                                    @uploading-change="handleVideoUploadingChange"
                                />
                                <div class="video-cover-picker" v-if="hasVideoUploaded">
                                    <div class="cover-picker-header">
                                        <span class="cover-picker-title">视频封面</span>
                                        <el-button link type="primary" :disabled="capturingCover || !videoCoverSourceUrl" @click="captureCurrentFrame">
                                            {{ selectedCoverFile ? '重新截取当前帧' : '使用当前帧作为封面' }}
                                        </el-button>
                                    </div>
                                    <video
                                        ref="videoCoverRef"
                                        :src="videoCoverSourceUrl"
                                        class="cover-picker-video"
                                        controls
                                        preload="metadata"
                                        controlslist="nodownload noplaybackrate"
                                        disablepictureinpicture
                                        @contextmenu.prevent
                                    ></video>
                                    <div class="cover-picked" v-if="selectedCoverPreviewUrl">
                                        <img :src="selectedCoverPreviewUrl" alt="封面预览" class="cover-thumb" />
                                        <div class="cover-picked-meta">
                                            <span>已选择该帧作为封面</span>
                                            <el-button link type="primary" @click="clearSelectedCover">取消封面</el-button>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </el-form-item>
                </transition>

                <el-form-item label="添加话题标签" prop="tagStr">
                    <el-select
                        v-model="selectedTagIdsModel"
                        multiple
                        filterable
                        placeholder="请选择话题标签 (必选)"
                        style="width: 100%"
                        clearable
                        :loading="props.interestLoading"
                        class="custom-select"
                        popper-class="custom-select-popper"
                    >
                        <template #prefix>
                            <Icon icon="mdi:pound" />
                        </template>
                        <template v-for="cate in props.interestTree" :key="cate.id">
                            <el-option-group v-if="cate.children?.length" :label="cate.name">
                                <el-option v-for="child in cate.children" :key="child.id" :label="child.name" :value="child.id">
                                    <span class="hash-symbol">#</span> {{ child.name }}
                                </el-option>
                            </el-option-group>
                        </template>
                    </el-select>
                </el-form-item>

                <div class="form-footer">
                    <el-button
                        type="primary"
                        size="large"
                        :loading="props.submitting"
                        :disabled="props.submitting || isUploading"
                        @click="emit('submit')"
                        class="submit-btn"
                    >
                        <Icon icon="mdi:send-outline" class="mr-2 text-[18px]" />
                        {{ props.submitting ? '发布中...' : '立即发布' }}
                    </el-button>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { POST_TYPE } from '@/utils/enum'
import { getImgUrl } from '@/utils/img'

interface PostFormState {
    postType: string
    content: string
    tagStr: string
}

interface TypeOption {
    label: string
    icon: string
    text: string
    desc: string
}

const props = defineProps<{
    form: PostFormState
    rules: FormRules
    imageUrls: string
    videoUrls: string
    selectedTagIds: Array<number | string>
    interestTree: any[]
    interestLoading: boolean
    submitting: boolean
}>()

const emit = defineEmits<{
    (e: 'update:imageUrls', value: string): void
    (e: 'update:videoUrls', value: string): void
    (e: 'update:selectedTagIds', value: Array<number | string>): void
    (e: 'video-cover-change', value: string): void
    (e: 'change-post-type', value: string): void
    (e: 'content-input'): void
    (e: 'submit'): void
    (e: 'reset'): void
}>()

const typeOptions: TypeOption[] = [
    { label: POST_TYPE.TEXT, icon: 'mdi:format-text', text: '纯文字', desc: '记录心情与想法' },
    { label: POST_TYPE.IMAGE, icon: 'mdi:image-outline', text: '图文', desc: '分享美好图片' },
    { label: POST_TYPE.VIDEO, icon: 'mdi:video-outline', text: '视频', desc: '记录动态影像' }
]

const { proxy } = getCurrentInstance() || {}
const formRef = ref<FormInstance>()
const imageUploadRef = shallowRef<any>()
const videoUploadRef = shallowRef<any>()
const imageUploading = ref(false)
const videoUploading = ref(false)
const videoCoverRef = ref<HTMLVideoElement>()
const videoCoverSourceUrl = ref('')
const selectedCoverFile = ref<File | null>(null)
const selectedCoverPreviewUrl = ref('')
const capturingCover = ref(false)
let videoCoverObjectUrl = ''
let selectedCoverPreviewObjectUrl = ''

const imageUrlsModel = computed({
    get: () => props.imageUrls,
    set: value => emit('update:imageUrls', value)
})

const videoUrlsModel = computed({
    get: () => props.videoUrls,
    set: value => emit('update:videoUrls', value)
})

const selectedTagIdsModel = computed({
    get: () => props.selectedTagIds,
    set: value => emit('update:selectedTagIds', value)
})

const hasVideoUploaded = computed(() => {
    const value = String(props.videoUrls || '').trim()
    if (!value) return false
    return (
        value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean).length > 0
    )
})

const isUploading = computed(() => imageUploading.value || videoUploading.value)

const parseVideoUrlList = (value: unknown): string[] => {
    const text = String(value || '').trim()
    if (!text) return []
    return text
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
}

const revokeVideoCoverSourceObjectUrl = () => {
    if (!videoCoverObjectUrl) return
    URL.revokeObjectURL(videoCoverObjectUrl)
    videoCoverObjectUrl = ''
}

const revokeSelectedCoverPreviewObjectUrl = () => {
    if (!selectedCoverPreviewObjectUrl) return
    URL.revokeObjectURL(selectedCoverPreviewObjectUrl)
    selectedCoverPreviewObjectUrl = ''
}

const clearSelectedCover = () => {
    selectedCoverFile.value = null
    selectedCoverPreviewUrl.value = ''
    revokeSelectedCoverPreviewObjectUrl()
}

const syncVideoCoverSource = () => {
    revokeVideoCoverSourceObjectUrl()
    const rawFile = getVideoRawFiles()[0]
    if (rawFile instanceof File) {
        videoCoverObjectUrl = URL.createObjectURL(rawFile)
        videoCoverSourceUrl.value = videoCoverObjectUrl
        return
    }

    const firstVideoUrl = parseVideoUrlList(props.videoUrls)[0] || ''
    videoCoverSourceUrl.value = firstVideoUrl ? getImgUrl(firstVideoUrl) : ''
}

watch(
    () => [props.form.postType, String(props.videoUrls || '')] as const,
    async ([nextPostType, nextVideoUrls], prevValues) => {
        const [prevPostType, prevVideoUrls] = prevValues || ['', '']
        if (nextPostType !== POST_TYPE.VIDEO) {
            clearSelectedCover()
            videoCoverSourceUrl.value = ''
            revokeVideoCoverSourceObjectUrl()
            return
        }

        if (nextPostType !== prevPostType || nextVideoUrls !== prevVideoUrls) {
            clearSelectedCover()
            await nextTick()
            syncVideoCoverSource()
        }
    },
    { immediate: true }
)

watch(
    () => selectedCoverPreviewUrl.value,
    value => {
        emit('video-cover-change', String(value || ''))
    },
    { immediate: true }
)

function handleImageUploadingChange(value: boolean) {
    imageUploading.value = Boolean(value)
}

function handleVideoUploadingChange(value: boolean) {
    videoUploading.value = Boolean(value)
}

async function captureCurrentFrame() {
    const video = videoCoverRef.value
    if (!video || !videoCoverSourceUrl.value) {
        proxy?.$modal?.msgWarning?.('请先上传视频')
        return
    }
    if (video.readyState < 2) {
        proxy?.$modal?.msgWarning?.('视频加载中，请稍后再试')
        return
    }

    capturingCover.value = true
    try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 720
        canvas.height = video.videoHeight || 1280
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('无法创建封面画布')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                value => {
                    if (!value) {
                        reject(new Error('封面生成失败'))
                        return
                    }
                    resolve(value)
                },
                'image/jpeg',
                0.92
            )
        })

        const coverFile = new File([blob], `video-cover-${Date.now()}.jpg`, { type: 'image/jpeg' })
        selectedCoverFile.value = coverFile
        revokeSelectedCoverPreviewObjectUrl()
        selectedCoverPreviewObjectUrl = URL.createObjectURL(coverFile)
        selectedCoverPreviewUrl.value = selectedCoverPreviewObjectUrl
        proxy?.$modal?.msgSuccess?.('已选择当前帧作为封面')
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('封面截取失败，请重试')
    } finally {
        capturingCover.value = false
    }
}

async function validateForm(): Promise<boolean> {
    if (!formRef.value) return false
    const result = await formRef.value.validate().catch(() => false)
    return Boolean(result)
}

function validateField(field: string): void {
    formRef.value?.validateField(field as any)
}

function clearValidate(fields?: string | string[]): void {
    formRef.value?.clearValidate(fields as any)
}

function resetFields(): void {
    formRef.value?.resetFields()
}

function clearUploaders(): void {
    imageUploadRef.value?.clear?.()
    videoUploadRef.value?.clear?.()
    imageUploading.value = false
    videoUploading.value = false
    clearSelectedCover()
    videoCoverSourceUrl.value = ''
    revokeVideoCoverSourceObjectUrl()
}

function getVideoRawFiles(): File[] {
    return (videoUploadRef.value?.getRawFiles?.() || []) as File[]
}

function getVideoCoverFile(): File | null {
    return selectedCoverFile.value
}

function isAnyUploading(): boolean {
    return isUploading.value
}

onBeforeUnmount(() => {
    revokeVideoCoverSourceObjectUrl()
    revokeSelectedCoverPreviewObjectUrl()
})

defineExpose({
    validateForm,
    validateField,
    clearValidate,
    resetFields,
    clearUploaders,
    getVideoRawFiles,
    getVideoCoverFile,
    isUploading: isAnyUploading
})
</script>

<style lang="scss" scoped>
.edit-section {
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 28px;

        .title-group {
            h2 {
                font-size: 28px;
                color: var(--el-text-color-primary);
                margin: 0 0 10px 0;
                font-weight: 700;
                letter-spacing: -0.5px;
            }
            p {
                color: var(--el-text-color-secondary);
                margin: 0;
                font-size: 14px;
            }
        }

        .reset-btn {
            font-weight: 500;
            transition: all 0.2s;

            &:hover {
                transform: translateY(-1px);
            }
        }
    }
}

.form-card {
    border-radius: 20px;
    border: none;
    background: var(--el-bg-color);
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.05),
        0 1px 3px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: box-shadow 0.3s;

    &:hover {
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.08),
            0 2px 6px rgba(0, 0, 0, 0.12);
    }

    :deep(.el-card__body) {
        padding: 36px;
    }
}

.post-form {
    :deep(.el-form-item__label) {
        font-weight: 600;
        font-size: 15px;
        color: var(--el-text-color-primary);
        margin-bottom: 12px;
    }

    .highlight-label {
        :deep(.el-form-item__label) {
            position: relative;
            padding-left: 16px;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 20px;
                background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-3));
                border-radius: 2px;
                box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.3);
            }
        }
    }
}

.type-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 8px;

    .type-card {
        border: 2px solid var(--el-border-color-lighter);
        border-radius: 14px;
        padding: 18px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        display: flex;
        align-items: center;
        gap: 14px;
        background: var(--el-fill-color-blank);

        &::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.05), transparent);
            opacity: 0;
            transition: opacity 0.25s;
        }

        &:hover {
            border-color: var(--el-color-primary-light-5);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.12);

            &::before {
                opacity: 1;
            }

            .icon-box {
                transform: scale(1.05);
            }
        }

        &:active {
            transform: translateY(0);
        }

        &.active {
            border-color: var(--el-color-primary);
            background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.08), rgba(var(--el-color-primary-rgb), 0.03));
            box-shadow:
                0 4px 12px rgba(var(--el-color-primary-rgb), 0.15),
                0 0 0 1px rgba(var(--el-color-primary-rgb), 0.1) inset;

            &::before {
                opacity: 0;
            }

            .icon-box {
                background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
                color: var(--el-color-white);
                box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.35);
            }

            .type-name {
                color: var(--el-color-primary);
                font-weight: 700;
            }
        }

        .icon-box {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: var(--el-fill-color-light);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            color: var(--el-text-color-regular);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            flex-shrink: 0;
        }

        .info-box {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;

            .type-name {
                font-size: 15px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                transition: color 0.25s;
            }

            .type-desc {
                font-size: 12px;
                color: var(--el-text-color-secondary);
                line-height: 1.3;
            }
        }

        .check-mark {
            position: absolute;
            top: 10px;
            right: 10px;
            color: var(--el-color-primary);
            font-size: 18px;
            filter: drop-shadow(0 2px 4px rgba(var(--el-color-primary-rgb), 0.3));
        }
    }
}

.check-scale-enter-active,
.check-scale-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.check-scale-enter-from {
    opacity: 0;
    transform: scale(0);
}

.check-scale-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

.custom-textarea {
    :deep(.el-textarea__inner) {
        border-radius: 14px;
        padding: 18px;
        font-size: 15px;
        line-height: 1.7;
        border: 2px solid var(--el-border-color-lighter);
        background-color: var(--el-fill-color-blank);
        color: var(--el-text-color-primary);
        box-shadow: none;
        transition: all 0.3s;

        &::placeholder {
            color: var(--el-text-color-placeholder);
        }

        &:hover {
            border-color: var(--el-border-color);
            background-color: var(--el-bg-color);
        }

        &:focus {
            background-color: var(--el-bg-color);
            border-color: var(--el-color-primary);
            box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);
        }
    }

    :deep(.el-input__count) {
        background: transparent;
        font-size: 12px;
    }
}

/* 校验错误时统一使用 danger 语义色，避免与 hover/focus 的 primary 混色冲突 */
.post-form :deep(.el-form-item.is-error .custom-textarea .el-textarea__inner),
.post-form :deep(.el-form-item.is-error .custom-textarea .el-textarea__inner:hover),
.post-form :deep(.el-form-item.is-error .custom-textarea .el-textarea__inner:focus) {
    border-color: var(--el-color-danger);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 18%, transparent);
    background-color: var(--el-bg-color);
}

.upload-container {
    width: 100%;
    padding: 16px;
    border: 2px solid var(--el-border-color-lighter);
    border-radius: 14px;
    background: var(--el-fill-color-blank);
    transition: all 0.25s ease;

    &.image-mode {
        background: linear-gradient(180deg, rgba(var(--el-color-primary-rgb), 0.03), transparent);
    }

    &.video-mode {
        background: linear-gradient(180deg, rgba(var(--el-color-primary-rgb), 0.04), rgba(var(--el-color-primary-rgb), 0.01));
    }
}

.custom-upload {
    width: 100%;
}

.image-upload {
    :deep(.el-upload--picture-card) {
        width: 120px;
        height: 120px;
        border-radius: 12px;
        border: 2px dashed var(--el-border-color);
        background: var(--el-fill-color-lighter);
        transition: all 0.2s ease;

        &:hover {
            border-color: var(--el-color-primary);
            background: rgba(var(--el-color-primary-rgb), 0.06);
            transform: translateY(-1px);
        }
    }

    :deep(.el-upload-list--picture-card .el-upload-list__item) {
        width: 120px;
        height: 120px;
        border-radius: 12px;
        margin: 0 10px 10px 0;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
    }
}

.video-upload {
    &.video-upload--locked {
        :deep(.upload-file-uploader) {
            display: none;
        }
    }

    :deep(.upload-file-uploader .el-upload) {
        width: 100%;
    }

    :deep(.upload-file-uploader .el-upload-dragger) {
        height: 190px;
        border: 2px dashed rgba(var(--el-color-primary-rgb), 0.32);
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.05), rgba(var(--el-color-primary-rgb), 0.02));
        transition: all 0.2s ease;

        &:hover {
            border-color: var(--el-color-primary);
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(var(--el-color-primary-rgb), 0.12);
        }

        .el-icon--upload {
            color: var(--el-color-primary);
        }

        .el-upload__text {
            font-size: 14px;
        }
    }

    :deep(.upload-file-list) {
        margin-top: 12px;
    }

    :deep(.upload-file-list .file-item) {
        border-radius: 10px;
        border: 1px solid var(--el-border-color-lighter);
        background: var(--el-fill-color-blank);
    }
}

.video-cover-picker {
    margin-top: 14px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    padding: 12px;
    background: color-mix(in srgb, var(--el-fill-color-light) 65%, var(--el-color-white));

    .cover-picker-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        gap: 10px;
    }

    .cover-picker-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .cover-picker-video {
        width: 100%;
        max-height: 240px;
        border-radius: 10px;
        display: block;
        background: #000;
    }

    .cover-picked {
        margin-top: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .cover-thumb {
        width: 78px;
        height: 78px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid var(--el-border-color);
        flex-shrink: 0;
    }

    .cover-picked-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }
}

.custom-select {
    :deep(.el-select__wrapper) {
        border-radius: 14px;
        padding: 12px 16px;
        border: 2px solid var(--el-border-color-lighter);
        box-shadow: none;
        transition: all 0.3s;

        &:hover {
            border-color: var(--el-border-color);
        }

        &.is-focused {
            border-color: var(--el-color-primary);
            box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);
        }
    }

    :deep(.el-select__prefix) {
        color: var(--el-color-primary);
        font-size: 18px;
    }

    :deep(.el-tag) {
        border-radius: 8px;
        padding: 4px 10px;
        font-weight: 500;
    }
}

:deep(.custom-select-popper) {
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border: 1px solid var(--el-border-color-light);

    .el-select-dropdown__item {
        border-radius: 8px;
        margin: 2px 8px;
        padding: 10px 12px;
        transition: all 0.2s;

        &:hover {
            background: rgba(var(--el-color-primary-rgb), 0.08);
        }

        &.is-selected {
            background: rgba(var(--el-color-primary-rgb), 0.12);
            color: var(--el-color-primary);
            font-weight: 600;
        }
    }

    .el-select-group__title {
        font-weight: 600;
        color: var(--el-text-color-primary);
        padding: 10px 16px;
    }
}

.hash-symbol {
    color: var(--el-color-primary);
    font-weight: 600;
    margin-right: 4px;
}

.form-footer {
    margin-top: 48px;
    display: flex;
    justify-content: flex-end;

    .submit-btn {
        padding: 14px 42px;
        border-radius: 14px;
        font-weight: 600;
        font-size: 16px;
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
        border: none;
        box-shadow:
            0 6px 16px rgba(var(--el-color-primary-rgb), 0.3),
            0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            transform: translateY(-2px);
            box-shadow:
                0 10px 24px rgba(var(--el-color-primary-rgb), 0.35),
                0 4px 10px rgba(var(--el-color-primary-rgb), 0.25);
        }

        &:active {
            transform: translateY(0);
        }

        &.is-loading {
            opacity: 0.8;
        }
    }
}

@media screen and (max-width: 992px) {
    .type-grid {
        grid-template-columns: 1fr;
    }

    .form-card :deep(.el-card__body) {
        padding: 24px;
    }
}
</style>
