<template>
    <el-dialog v-model="visible" width="720px" append-to-body destroy-on-close class="circle-publish-dialog" @closed="resetPublishForm">
        <el-form ref="publishFormRef" :model="publishForm">
            <el-form-item>
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

            <div
                class="upload-container"
                @dragenter.prevent.stop="onDragEnter"
                @dragover.prevent.stop="onDragOver"
                @dragleave.prevent.stop="onDragLeave"
                @drop.prevent.stop="onDrop"
                :class="{ 'is-dragging': isDragging }"
            >
                <el-upload
                    ref="uploadRef"
                    v-model:file-list="fileList"
                    :auto-upload="false"
                    :multiple="publishPostType !== POST_TYPE.VIDEO"
                    :limit="uploadLimit"
                    :accept="uploadAccept"
                    :on-exceed="handleExceed"
                    :on-change="handleFileChange"
                    :before-upload="beforeUpload"
                    list-type="picture-card"
                    class="custom-upload"
                    :class="{ 'hide-upload-trigger': uploadLimitReached, 'is-empty': fileList.length === 0 }"
                >
                    <div class="upload-trigger-content">
                        <div class="icon-wrapper">
                            <Icon :icon="fileList.length === 0 ? 'mdi:cloud-upload-outline' : 'mdi:plus'" />
                        </div>
                        <div class="text-wrapper" v-if="fileList.length === 0">
                            <span class="primary-text">点击或拖拽上传</span>
                            <span class="secondary-text">支持 JPG/PNG/GIF/WebP &amp; MP4/MOV，最多 9 张图片或 1 个视频</span>
                        </div>
                    </div>

                    <template #file="{ file }">
                        <div class="uploaded-file-wrapper">
                            <img v-if="publishPostType !== POST_TYPE.VIDEO" class="thumbnail" :src="file.url" alt="" />
                            <video v-else class="thumbnail video-thumbnail" :src="file.url" muted preload="metadata"></video>
                            <div class="overlay">
                                <span class="delete-btn" @click.stop="handleRemove(file)">
                                    <Icon icon="mdi:trash-can-outline" />
                                </span>
                            </div>
                        </div>
                    </template>
                </el-upload>

                <transition name="drag-fade">
                    <div v-if="isDragging" class="drag-overlay">
                        <Icon icon="mdi:cloud-upload" class="drag-icon" />
                        <span class="drag-text">松开上传文件</span>
                    </div>
                </transition>
            </div>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" :loading="publishSubmitting" @click="submitPublish">发布</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts" name="CirclePublishDialog">
import { computed, reactive, ref, getCurrentInstance, nextTick } from 'vue'
import type { FormInstance, UploadFile, UploadFiles } from 'element-plus'
import { addPost } from '@/api/content/post'
import { POST_TYPE } from '@/utils/enum'

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

const publishSubmitting = ref(false)
const publishFormRef = ref<FormInstance>()
const uploadRef = ref<any>()
const publishForm = reactive({
    content: ''
})

const fileList = ref<UploadFile[]>([])
const isDragging = ref(false)
const dragDepth = ref(0)
const tempUploadType = ref<'image' | 'video' | null>(null)
const pendingVideoCount = ref(0)

const publishPostType = computed(() => {
    const hasVideo = fileList.value.some(file => isVideoFile(file))
    if (hasVideo) return POST_TYPE.VIDEO
    if (fileList.value.length > 0) return POST_TYPE.IMAGE
    return POST_TYPE.TEXT
})

const uploadAccept = computed(() => {
    if (publishPostType.value === POST_TYPE.VIDEO) return '.mp4,.mov'
    if (publishPostType.value === POST_TYPE.IMAGE) return '.jpg,.jpeg,.png,.gif,.webp'
    return '.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov'
})

const uploadLimit = computed(() => (publishPostType.value === POST_TYPE.VIDEO ? 1 : 9))
const uploadLimitReached = computed(() => (publishPostType.value === POST_TYPE.VIDEO ? fileList.value.length >= 1 : fileList.value.length >= 9))

const isVideoFile = (file: UploadFile) => {
    const raw = file.raw as File | undefined
    if (raw?.type) return raw.type.startsWith('video/')
    const url = String(file.url || file.name || '').toLowerCase()
    return url.endsWith('.mp4') || url.endsWith('.mov')
}

const handleRemove = (file: UploadFile) => {
    if (file.url && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url)
    }
    uploadRef.value?.handleRemove?.(file)
}

const handleFileChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    if (uploadFile.raw && !uploadFile.url) {
        uploadFile.url = URL.createObjectURL(uploadFile.raw)
    }
    fileList.value = uploadFiles
    pendingVideoCount.value = 0
    if (fileList.value.length === 0) {
        tempUploadType.value = null
    }
}

const handleExceed = () => {
    proxy?.$modal?.msgWarning?.(publishPostType.value === POST_TYPE.VIDEO ? '仅支持 1 个视频' : '最多上传 9 张图片')
}

const beforeUpload = (file: File) => {
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
        proxy?.$modal?.msgError?.('仅支持图片或视频文件')
        return false
    }
    if (publishPostType.value === POST_TYPE.IMAGE && !isImage) {
        proxy?.$modal?.msgWarning?.('当前仅支持上传图片')
        return false
    }
    if (publishPostType.value === POST_TYPE.VIDEO && !isVideo) {
        proxy?.$modal?.msgWarning?.('当前仅支持上传视频')
        return false
    }
    if (publishPostType.value === POST_TYPE.TEXT) {
        if (!tempUploadType.value) tempUploadType.value = isVideo ? 'video' : 'image'
        if (tempUploadType.value === 'video' && !isVideo) {
            proxy?.$modal?.msgWarning?.('已选择视频，请勿混合图片')
            return false
        }
        if (tempUploadType.value === 'image' && !isImage) {
            proxy?.$modal?.msgWarning?.('已选择图片，请勿混合视频')
            return false
        }
        if (tempUploadType.value === 'video' && (fileList.value.length >= 1 || pendingVideoCount.value >= 1)) {
            proxy?.$modal?.msgWarning?.('仅支持 1 个视频')
            return false
        }
        if (tempUploadType.value === 'video' && isVideo) {
            pendingVideoCount.value += 1
        }
    }
    return true
}

const onDragEnter = () => {
    dragDepth.value += 1
    isDragging.value = true
}

const onDragOver = () => {
    isDragging.value = true
}

const onDragLeave = () => {
    dragDepth.value -= 1
    if (dragDepth.value <= 0) {
        dragDepth.value = 0
        isDragging.value = false
    }
}

const addFilesByDrop = async (files: File[]) => {
    const valid = files.filter(file => beforeUpload(file) !== false)
    if (!valid.length || !uploadRef.value) return
    const nextType = tempUploadType.value === 'video' ? POST_TYPE.VIDEO : publishPostType.value

    if (nextType === POST_TYPE.VIDEO) {
        const f = valid[0]
        uploadRef.value.clearFiles?.()
        uploadRef.value.handleStart?.(f)
        await nextTick()
        return
    }

    const remaining = Math.max(0, 9 - fileList.value.length)
    if (remaining <= 0) return
    valid.slice(0, remaining).forEach(f => uploadRef.value.handleStart?.(f))
    await nextTick()
}

const onDrop = async (e: DragEvent) => {
    dragDepth.value = 0
    isDragging.value = false
    pendingVideoCount.value = 0
    if (uploadLimitReached.value) return
    const dt = e.dataTransfer
    if (!dt) return
    const files = Array.from(dt.files || [])
    if (!files.length) return
    await addFilesByDrop(files)
}

const resetPublishForm = async () => {
    publishForm.content = ''
    fileList.value.forEach(file => {
        if (file.url && String(file.url).startsWith('blob:')) {
            URL.revokeObjectURL(String(file.url))
        }
    })
    fileList.value = []
    tempUploadType.value = null
    pendingVideoCount.value = 0
    uploadRef.value?.clearFiles?.()
}

const submitPublish = async () => {
    if (!publishFormRef.value || publishSubmitting.value) return

    if (!fileList.value.length && !publishForm.content.trim()) {
        proxy?.$modal?.msgWarning?.('请填写内容或上传图片/视频')
        return
    }

    publishSubmitting.value = true
    try {
        const postType = publishPostType.value
        const files =
            postType === POST_TYPE.TEXT
                ? []
                : fileList.value.reduce<File[]>((acc, file) => {
                      if (file.raw instanceof File) acc.push(file.raw)
                      return acc
                  }, [])

        await addPost({
            postType,
            content: publishForm.content?.trim() || '',
            tags: '',
            files,
            circleId: props.circleId,
            ossType: 'circles'
        })
        proxy?.$modal?.msgSuccess?.('发布成功')
        visible.value = false
        await resetPublishForm()
        emit('published')
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('发布失败')
    } finally {
        publishSubmitting.value = false
    }
}
</script>

<style scoped lang="scss">
:deep(.el-dialog.circle-publish-dialog) {
    border-radius: 12px;
    overflow: hidden;

    .el-dialog__header {
        display: none;
    }

    .el-dialog__body {
        padding: 0;
        background-color: var(--el-bg-color);
    }

    .el-dialog__footer {
        padding: 12px 24px;
        border-top: 1px solid var(--el-border-color-lighter);
        background-color: var(--el-bg-color);
    }
}

:global(body.el-popup-parent--hidden) {
    width: 100% !important;
}

:deep(.el-form) {
    .el-form-item {
        margin-bottom: 0;
    }

    .el-form-item__content {
        line-height: normal;
    }
}

.content-textarea {
    :deep(.el-textarea__inner) {
        padding: 24px;
        border: none;
        background-color: transparent;
        font-size: 15px;
        line-height: 1.6;
        color: var(--el-text-color-primary);
        box-shadow: none;

        &:focus {
            box-shadow: none;
        }

        &::placeholder {
            color: var(--el-text-color-secondary);
        }
    }
}

.uploaded-file-wrapper {
    position: relative;
    width: 108px;
    height: 108px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);

    .thumbnail {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
    }

    .video-thumbnail {
        background-color: var(--el-bg-color-overlay);
    }

    .overlay {
        position: absolute;
        inset: 0;
        background-color: var(--el-overlay-color-lighter);
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
            transform: scale(1.1);
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

.upload-container {
    padding: 0 24px 16px;
    width: 100%;
    position: relative;
    border-radius: 14px;
    transition: all 0.3s;

    &.is-dragging {
        &::before {
            content: '';
            position: absolute;
            inset: -4px;
            border: 3px dashed var(--el-color-primary);
            border-radius: 16px;
            background: rgba(var(--el-color-primary-rgb), 0.03);
            z-index: 1;
            pointer-events: none;
        }
    }
}

.drag-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.15), rgba(var(--el-color-primary-rgb), 0.08));
    backdrop-filter: blur(8px);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    pointer-events: none;

    .drag-icon {
        font-size: 48px;
        color: var(--el-color-primary);
    }

    .drag-text {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-color-primary);
    }
}

.drag-fade-enter-active,
.drag-fade-leave-active {
    transition: all 0.3s;
}

.drag-fade-enter-from,
.drag-fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

.custom-upload {
    width: 100%;
    display: inline-block;

    &.is-empty {
        :deep(.el-upload--picture-card) {
            width: 100%;
            height: 200px;
            border: 2px dashed var(--el-border-color-lighter);
            background: var(--el-fill-color-lighter);
            border-radius: 14px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &:hover {
                border-color: var(--el-color-primary);
                background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.05), rgba(var(--el-color-primary-rgb), 0.02));
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(var(--el-color-primary-rgb), 0.12);
            }
        }

        .upload-trigger-content {
            flex-direction: column;
            padding: 32px 0;
            gap: 14px;

            .icon-wrapper {
                font-size: 48px;
            }

            .primary-text {
                font-size: 16px;
                font-weight: 600;
            }

            .secondary-text {
                display: block;
            }
        }
    }

    &:not(.is-empty) {
        :deep(.el-upload--picture-card) {
            width: 116px;
            height: 116px;
            margin: 0 10px 10px 0;
            border: 2px dashed var(--el-border-color-lighter);
            border-radius: 12px;
            background: var(--el-fill-color-lighter);
            vertical-align: top;
            transition: all 0.25s;
            display: inline-flex;

            &:hover {
                border-color: var(--el-color-primary);
                color: var(--el-color-primary);
                transform: scale(1.02);
                box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
            }
        }

        .upload-trigger-content {
            padding: 0;
            justify-content: center;
            gap: 6px;

            .icon-wrapper {
                font-size: 28px;
                color: var(--el-text-color-secondary);
                transition: all 0.25s;
            }

            .primary-text {
                font-size: 13px;
                color: var(--el-text-color-regular);
                margin: 0;
                font-weight: 500;
            }

            .secondary-text {
                display: none;
            }
        }
    }

    :deep(.el-upload-list--picture-card) {
        display: inline;
        vertical-align: top;

        .el-upload-list__item {
            width: 116px;
            height: 116px;
            margin: 0 10px 10px 0;
            border-radius: 12px;
            border: none;
            overflow: hidden;
            display: inline-flex;
            vertical-align: top;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.25s;

            &:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
                z-index: 1;
            }
        }
    }

    &.hide-upload-trigger {
        :deep(.el-upload--picture-card) {
            display: none;
        }
    }
}

.upload-trigger-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    .icon-wrapper {
        color: var(--el-text-color-secondary);
        transition: transform 0.3s;
    }

    .text-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        line-height: 1.6;
        gap: 4px;

        .primary-text {
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

        .secondary-text {
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
}

.toolbar-right {
    display: flex;
    align-items: center;
}
</style>
