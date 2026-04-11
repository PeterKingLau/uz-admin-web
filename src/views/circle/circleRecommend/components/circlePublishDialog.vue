<template>
    <el-dialog v-model="visible" width="720px" append-to-body destroy-on-close class="circle-publish-dialog" @closed="resetPublishForm">
        <template #header>
            <div class="dialog-header-title">发布到圈子</div>
        </template>

        <div class="publish-body">
            <el-form ref="publishFormRef" :model="publishForm" class="publish-form">
                <div class="publish-title">我的想法</div>

                <el-form-item class="content-form-item">
                    <el-input
                        v-model="publishForm.content"
                        type="textarea"
                        :rows="8"
                        maxlength="2000"
                        placeholder="分享你此刻的想法..."
                        resize="none"
                        class="content-textarea"
                    />
                </el-form-item>

                <div v-if="publishPreviewList.length > 0" class="media-preview-panel">
                    <div class="media-preview-head">
                        <div class="media-preview-title">
                            <Icon :icon="publishPostType === POST_TYPE.VIDEO ? 'mdi:video-outline' : 'mdi:image-multiple-outline'" />
                            <span>{{ publishPostType === POST_TYPE.VIDEO ? '视频预览' : '图片预览' }}</span>
                        </div>
                        <div class="media-preview-head-right">
                            <div v-if="canDragPreviewItem" class="media-preview-tip">
                                <Icon icon="mdi:drag" />
                                <span>拖拽排序，首张将作为封面</span>
                            </div>
                            <div class="media-preview-meta">
                                {{ publishPostType === POST_TYPE.VIDEO ? '1 个视频' : `${publishPreviewList.length} 张图片` }}
                            </div>
                        </div>
                    </div>

                    <div
                        class="file-preview-area"
                        :class="{ 'is-video': publishPostType === POST_TYPE.VIDEO, 'is-single-image': publishPreviewList.length === 1 }"
                    >
                        <div
                            v-for="(url, index) in publishPreviewList"
                            :key="`${url}-${index}`"
                            class="uploaded-file-wrapper"
                            :class="{
                                'is-draggable': canDragPreviewItem,
                                'is-dragging': dragSourceIndex === index,
                                'is-drop-target': dropTargetIndex === index && dragSourceIndex !== index
                            }"
                            :draggable="canDragPreviewItem"
                            @dragstart="handlePreviewDragStart(index, $event)"
                            @dragover.prevent="handlePreviewDragOver(index)"
                            @drop.prevent="handlePreviewDrop(index)"
                            @dragend="handlePreviewDragEnd"
                        >
                            <img v-if="publishPostType !== POST_TYPE.VIDEO" class="thumbnail" :src="url" alt="" />
                            <video v-else class="thumbnail video-thumbnail" :src="url" muted preload="metadata"></video>

                            <div v-if="publishPostType === POST_TYPE.IMAGE" class="image-badges">
                                <div v-if="index === 0" class="primary-badge">首图</div>
                                <div v-if="canDragPreviewItem" class="sort-handle" title="拖拽调整顺序">
                                    <Icon icon="mdi:drag" />
                                </div>
                            </div>

                            <div v-if="publishPostType === POST_TYPE.VIDEO" class="video-badge">
                                <Icon icon="mdi:play" />
                                <span>视频</span>
                            </div>

                            <div class="overlay">
                                <span class="delete-btn" @click.stop="handlePublishRemove(index)">
                                    <Icon icon="mdi:trash-can-outline" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </el-form>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <div class="toolbar-left">
                    <el-button link class="toolbar-btn" :disabled="mediaUploading" @click.stop="handleImageUploadTrigger">
                        <Icon icon="mdi:image-outline" />
                    </el-button>
                    <el-button link class="toolbar-btn" :disabled="mediaUploading" @click.stop="handleVideoUploadTrigger">
                        <Icon icon="mdi:video-outline" />
                    </el-button>
                    <input
                        ref="imageInputRef"
                        class="native-upload-input"
                        type="file"
                        accept=".png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif"
                        multiple
                        @change="handleImageFilesChange"
                    />
                    <input
                        ref="videoInputRef"
                        class="native-upload-input"
                        type="file"
                        accept=".mp4,.mov,video/mp4,video/quicktime"
                        @change="handleVideoFileChange"
                    />
                </div>

                <div class="toolbar-right">
                    <el-button @click="visible = false">取消</el-button>
                    <el-button type="primary" :loading="publishSubmitting || mediaUploading" :disabled="mediaUploading || !canPublish" @click="submitPublish">
                        发布
                    </el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts" name="CirclePublishDialog">
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { addPost, uploadFilesToOss } from '@/api/content/post'
import { POST_TYPE } from '@/utils/enum'
import { getImgUrl } from '@/utils/img'
import { logSubmitError, resolveSubmitErrorMessage } from '@/utils/submitError'

const props = defineProps<{
    modelValue: boolean
    circleId?: string | number
}>()

const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'published'): void
}>()

const { proxy } = getCurrentInstance() || {}

const visible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const IMAGE_LIMIT = 9
const IMAGE_MAX_SIZE_MB = 10
const CIRCLE_OSS_TYPE = 'circles'
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif']
const VIDEO_EXTENSIONS = ['mp4', 'mov']

const publishSubmitting = ref(false)
const mediaUploading = ref(false)
const publishFormRef = ref<FormInstance>()
const imageInputRef = ref<HTMLInputElement>()
const videoInputRef = ref<HTMLInputElement>()
const publishForm = reactive({
    content: ''
})

const imageUrls = ref('')
const videoUrls = ref('')
const dragSourceIndex = ref<number | null>(null)
const dropTargetIndex = ref<number | null>(null)

const parseMediaUrls = (value: string | string[]) => {
    if (!value) return []
    const list = Array.isArray(value) ? value : value.split(',')
    return list.map(item => String(item).trim()).filter(Boolean)
}

const resolveMediaUrl = (url: string) => {
    if (!url) return ''
    if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
    if (proxy?.$imgUrl) return proxy.$imgUrl(url)
    return getImgUrl(url)
}

const imageUrlList = computed(() => parseMediaUrls(imageUrls.value))
const videoUrlList = computed(() => parseMediaUrls(videoUrls.value))

const publishPostType = computed(() => {
    if (videoUrlList.value.length > 0) return POST_TYPE.VIDEO
    if (imageUrlList.value.length > 0) return POST_TYPE.IMAGE
    return POST_TYPE.TEXT
})

const publishPreviewList = computed(() => {
    const list = publishPostType.value === POST_TYPE.VIDEO ? videoUrlList.value : imageUrlList.value
    return list.map(resolveMediaUrl)
})

const canPublish = computed(() => Boolean(publishForm.content?.trim()))
const canDragPreviewItem = computed(() => publishPostType.value === POST_TYPE.IMAGE && imageUrlList.value.length > 1)

const clearImageUpload = () => {
    imageUrls.value = ''
    resetDragState()
}

const clearVideoUpload = () => {
    videoUrls.value = ''
    resetDragState()
}

const resetInputValue = (inputRef: { value?: HTMLInputElement }) => {
    if (inputRef.value) {
        inputRef.value.value = ''
    }
}

const resetDragState = () => {
    dragSourceIndex.value = null
    dropTargetIndex.value = null
}

const handleImageUploadTrigger = () => {
    if (mediaUploading.value) return
    imageInputRef.value?.click()
}

const handleVideoUploadTrigger = () => {
    if (mediaUploading.value) return
    videoInputRef.value?.click()
}

const getExtension = (fileName: string) => {
    const index = fileName.lastIndexOf('.')
    if (index < 0) return ''
    return fileName.slice(index + 1).toLowerCase()
}

const handleImageFilesChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const selectedFiles = Array.from(target.files || [])
    if (!selectedFiles.length) return

    const remaining = IMAGE_LIMIT - imageUrlList.value.length
    if (remaining <= 0) {
        proxy?.$modal?.msgWarning?.(`You can upload up to ${IMAGE_LIMIT} images`)
        resetInputValue(imageInputRef)
        return
    }

    const uploadQueue = selectedFiles.slice(0, remaining).filter(file => {
        const ext = getExtension(file.name)
        if (!IMAGE_EXTENSIONS.includes(ext)) {
            proxy?.$modal?.msgWarning?.(`Image format must be ${IMAGE_EXTENSIONS.join('/')}`)
            return false
        }
        if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
            proxy?.$modal?.msgWarning?.(`Image size must be <= ${IMAGE_MAX_SIZE_MB}MB`)
            return false
        }
        return true
    })

    if (!uploadQueue.length) {
        resetInputValue(imageInputRef)
        return
    }

    if (videoUrlList.value.length > 0) {
        clearVideoUpload()
    }

    mediaUploading.value = true
    try {
        const uploaded = await uploadFilesToOss(POST_TYPE.IMAGE, uploadQueue, CIRCLE_OSS_TYPE)
        const merged = [...imageUrlList.value, ...uploaded.map(item => String(item).trim()).filter(Boolean)]
        imageUrls.value = merged.slice(0, IMAGE_LIMIT).join(',')
        resetDragState()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('Image upload failed')
    } finally {
        mediaUploading.value = false
        resetInputValue(imageInputRef)
    }
}

const handleVideoFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = (target.files || [])[0]
    if (!file) return

    const ext = getExtension(file.name)
    if (!VIDEO_EXTENSIONS.includes(ext)) {
        proxy?.$modal?.msgWarning?.(`Video format must be ${VIDEO_EXTENSIONS.join('/')}`)
        resetInputValue(videoInputRef)
        return
    }

    if (imageUrlList.value.length > 0) {
        clearImageUpload()
    }

    mediaUploading.value = true
    try {
        const uploaded = await uploadFilesToOss(POST_TYPE.VIDEO, [file], CIRCLE_OSS_TYPE)
        videoUrls.value = String(uploaded?.[0] || '').trim()
        resetDragState()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('Video upload failed')
    } finally {
        mediaUploading.value = false
        resetInputValue(videoInputRef)
    }
}

const reorderImageUrls = (fromIndex: number, toIndex: number) => {
    const nextList = imageUrlList.value.slice()
    const [moved] = nextList.splice(fromIndex, 1)
    nextList.splice(toIndex, 0, moved)
    imageUrls.value = nextList.join(',')
}

const handlePreviewDragStart = (index: number, event: DragEvent) => {
    if (!canDragPreviewItem.value) return
    dragSourceIndex.value = index
    dropTargetIndex.value = index
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(index))
    }
}

const handlePreviewDragOver = (index: number) => {
    if (!canDragPreviewItem.value || dragSourceIndex.value == null) return
    dropTargetIndex.value = index
}

const handlePreviewDrop = (index: number) => {
    if (!canDragPreviewItem.value || dragSourceIndex.value == null) return
    const fromIndex = dragSourceIndex.value
    if (fromIndex !== index) {
        reorderImageUrls(fromIndex, index)
    }
    resetDragState()
}

const handlePreviewDragEnd = () => {
    resetDragState()
}

const handlePublishRemove = (index: number) => {
    if (publishPostType.value === POST_TYPE.VIDEO) {
        clearVideoUpload()
        return
    }
    const nextList = imageUrlList.value.slice()
    nextList.splice(index, 1)
    imageUrls.value = nextList.join(',')
    resetDragState()
}

const resetPublishForm = async () => {
    publishForm.content = ''
    clearImageUpload()
    clearVideoUpload()
    resetInputValue(imageInputRef)
    resetInputValue(videoInputRef)
}

const submitPublish = async () => {
    if (!publishFormRef.value || publishSubmitting.value || mediaUploading.value) return

    if (!imageUrlList.value.length && !videoUrlList.value.length && !publishForm.content.trim()) {
        proxy?.$modal?.msgWarning?.('请填写内容或上传图片/视频')
        return
    }

    publishSubmitting.value = true
    try {
        const postType = publishPostType.value
        const mediaUrls = postType === POST_TYPE.IMAGE ? imageUrls.value : postType === POST_TYPE.VIDEO ? videoUrls.value : ''

        await addPost({
            postType,
            content: publishForm.content?.trim() || '',
            tagStr: '',
            mediaUrls,
            circleId: props.circleId
        })
        proxy?.$modal?.msgSuccess?.('发布成功')
        visible.value = false
        await resetPublishForm()
        emit('published')
    } catch (error) {
        logSubmitError(error)
        proxy?.$modal?.msgError?.(resolveSubmitErrorMessage(error, '发布失败'))
    } finally {
        publishSubmitting.value = false
    }
}
</script>

<style scoped lang="scss">
:deep(.el-dialog.circle-publish-dialog) {
    border-radius: 16px;
    overflow: hidden;
    background-color: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 20px 48px color-mix(in srgb, var(--el-color-black) 12%, transparent);

    .el-dialog__header {
        padding: 18px 24px 16px;
        margin-right: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .el-dialog__body {
        padding: 0;
        background-color: var(--el-bg-color-overlay);
    }

    .el-dialog__footer {
        padding: 14px 24px;
        border-top: 1px solid var(--el-border-color-lighter);
        background-color: var(--el-bg-color-overlay);
    }

    .el-dialog__headerbtn {
        top: 18px;
        right: 20px;
    }

    .el-dialog__close {
        color: var(--el-text-color-secondary);

        &:hover {
            color: var(--el-text-color-primary);
        }
    }
}

:global(body.el-popup-parent--hidden) {
    width: 100% !important;
}

.dialog-header-title {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-height: 18px;
    padding-left: 12px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.2;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        width: 4px;
        height: 16px;
        border-radius: 999px;
        background: linear-gradient(180deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
        transform: translateY(-50%);
    }
}

.publish-body {
    padding: 20px 24px 16px;
}

:deep(.publish-form) {
    .el-form-item {
        margin-bottom: 0;
    }

    .el-form-item__content {
        line-height: normal;
    }
}

.publish-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    font-size: 18px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.2;

    &::before {
        content: '';
        width: 4px;
        height: 18px;
        border-radius: 2px;
        background: var(--el-color-primary);
        flex-shrink: 0;
    }
}

.content-form-item {
    margin-bottom: 12px;
}

.content-textarea {
    :deep(.el-textarea__inner) {
        min-height: 220px !important;
        padding: 20px 22px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 14px;
        background-color: var(--el-fill-color-lighter);
        font-size: 15px;
        line-height: 1.6;
        color: var(--el-text-color-primary);
        box-shadow: none !important;
        transition:
            border-color 0.2s ease,
            background-color 0.2s ease,
            box-shadow 0.2s ease;

        &:hover {
            border-color: var(--el-border-color);
            background-color: var(--el-fill-color-light);
        }

        &:focus {
            border-color: var(--el-color-primary);
            background-color: var(--el-bg-color);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 16%, transparent) !important;
        }

        &::placeholder {
            color: var(--el-text-color-secondary);
        }
    }
}

.media-preview-panel {
    margin-top: 8px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-light) 72%, transparent) 0%, transparent 100%), var(--el-bg-color);
}

.media-preview-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.media-preview-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .iconify {
        font-size: 18px;
        color: var(--el-color-primary);
    }
}

.media-preview-head-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
}

.media-preview-tip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-fill-color-light));
    color: var(--el-color-primary);
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
}

.media-preview-meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.file-preview-area {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;

    &.is-video {
        grid-template-columns: 1fr;
    }

    &.is-single-image {
        grid-template-columns: minmax(0, 1fr);
    }
}

.uploaded-file-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
    box-shadow: 0 6px 18px color-mix(in srgb, var(--el-color-black) 6%, transparent);
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease,
        opacity 0.2s ease;

    .file-preview-area.is-video & {
        aspect-ratio: 16 / 9;
    }

    .file-preview-area.is-single-image & {
        aspect-ratio: 4 / 3;
    }

    &.is-draggable {
        cursor: grab;
    }

    &.is-draggable:active {
        cursor: grabbing;
    }

    &.is-dragging {
        opacity: 0.55;
        transform: scale(0.98);
    }

    &.is-drop-target {
        border-color: var(--el-color-primary);
        box-shadow:
            0 0 0 2px color-mix(in srgb, var(--el-color-primary) 22%, transparent),
            0 10px 24px color-mix(in srgb, var(--el-color-black) 10%, transparent);
    }

    .thumbnail {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
    }

    .video-thumbnail {
        background-color: var(--el-bg-color-overlay);
    }

    .image-badges {
        position: absolute;
        left: 10px;
        right: 10px;
        top: 10px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        z-index: 2;
        pointer-events: none;
    }

    .primary-badge,
    .sort-handle,
    .video-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        backdrop-filter: blur(6px);
        font-size: 12px;
        font-weight: 600;
    }

    .primary-badge {
        background: color-mix(in srgb, var(--el-color-primary) 78%, transparent);
        color: var(--el-color-white);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    }

    .sort-handle {
        margin-left: auto;
        background: color-mix(in srgb, var(--el-color-black) 46%, transparent);
        color: var(--el-color-white);
    }

    .video-badge {
        position: absolute;
        left: 10px;
        bottom: 10px;
        background: color-mix(in srgb, var(--el-color-black) 50%, transparent);
        color: var(--el-color-white);
        z-index: 2;
    }

    .overlay {
        position: absolute;
        inset: 0;
        background-color: color-mix(in srgb, var(--el-color-black) 36%, transparent);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.3s ease;
    }

    .delete-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
        transition: all 0.2s;

        &:hover {
            background-color: var(--el-color-danger);
            color: var(--el-color-white);
            transform: scale(1.08);
        }
    }

    &:hover {
        .thumbnail {
            transform: scale(1.05);
        }

        .overlay {
            opacity: 1;
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .toolbar-btn {
        width: 38px;
        height: 38px;
        padding: 0;
        border-radius: 10px;
        font-size: 20px;
        color: var(--el-text-color-regular);
        background-color: var(--el-fill-color-light);
        transition:
            color 0.2s ease,
            background-color 0.2s ease,
            transform 0.2s ease;

        &:hover {
            color: var(--el-color-primary);
            background-color: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-fill-color-light));
            transform: translateY(-1px);
        }

        .iconify {
            font-size: 20px;
        }
    }
}

.native-upload-input {
    display: none;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

@media (max-width: 768px) {
    .publish-body {
        padding: 16px;
    }

    :deep(.el-dialog.circle-publish-dialog) {
        width: min(720px, calc(100vw - 24px)) !important;

        .el-dialog__header,
        .el-dialog__footer {
            padding-left: 16px;
            padding-right: 16px;
        }
    }

    .dialog-footer {
        flex-wrap: wrap;
        justify-content: space-between;
    }

    .media-preview-head {
        flex-direction: column;
        align-items: stretch;
    }

    .media-preview-head-right {
        align-items: flex-start;
    }

    .file-preview-area {
        grid-template-columns: repeat(2, minmax(0, 1fr));

        &.is-video,
        &.is-single-image {
            grid-template-columns: 1fr;
        }
    }
}
</style>
