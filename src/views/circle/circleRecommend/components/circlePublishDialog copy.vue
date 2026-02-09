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

            <div v-if="publishPreviewList.length > 0" class="file-preview-area">
                <div v-for="(url, index) in publishPreviewList" :key="`${url}-${index}`" class="uploaded-file-wrapper">
                    <img v-if="publishPostType !== POST_TYPE.VIDEO" class="thumbnail" :src="url" alt="" />
                    <video v-else class="thumbnail video-thumbnail" :src="url" muted preload="metadata"></video>
                    <div class="overlay">
                        <span class="delete-btn" @click.stop="handlePublishRemove(index)">
                            <Icon icon="mdi:trash-can-outline" />
                        </span>
                    </div>
                </div>
            </div>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <div class="toolbar-left">
                    <ImageUpload
                        ref="publishImageUploadRef"
                        v-model="imageUrls"
                        :limit="9"
                        :file-size="5"
                        :file-type="['png', 'jpg', 'jpeg', 'gif']"
                        :is-show-tip="false"
                        :show-file-list="false"
                        list-type="text"
                        :disabled="publishPostType === POST_TYPE.VIDEO"
                    >
                        <template #trigger>
                            <el-button link class="toolbar-btn" :disabled="publishPostType === POST_TYPE.VIDEO">
                                <Icon icon="mdi:image-outline" />
                            </el-button>
                        </template>
                    </ImageUpload>
                    <FileUpload
                        ref="publishVideoUploadRef"
                        v-model="videoUrls"
                        :limit="1"
                        :file-size="0"
                        :file-type="['mp4', 'mov']"
                        oss-type="circles"
                        :is-show-tip="false"
                        :show-list="false"
                        :drag="false"
                        :hide-when-disabled="false"
                        :disabled="publishPostType === POST_TYPE.IMAGE"
                    >
                        <template #trigger>
                            <el-button link class="toolbar-btn" :disabled="publishPostType === POST_TYPE.IMAGE">
                                <Icon icon="mdi:video-outline" />
                            </el-button>
                        </template>
                    </FileUpload>
                </div>
                <div class="toolbar-right">
                    <el-button @click="visible = false">取消</el-button>
                    <el-button type="primary" :loading="publishSubmitting" @click="submitPublish">发布</el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts" name="CirclePublishDialog">
import { computed, reactive, ref, getCurrentInstance } from 'vue'
import type { FormInstance } from 'element-plus'
import { addPost } from '@/api/content/post'
import { POST_TYPE } from '@/utils/enum'
import { getImgUrl } from '@/utils/img'

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
const publishImageUploadRef = ref<any>()
const publishVideoUploadRef = ref<any>()
const publishForm = reactive({
    content: ''
})

const imageUrls = ref('')
const videoUrls = ref('')
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

const handlePublishRemove = (index: number) => {
    if (publishPostType.value === POST_TYPE.VIDEO) {
        videoUrls.value = ''
        return
    }
    const nextList = imageUrlList.value.slice()
    nextList.splice(index, 1)
    imageUrls.value = nextList.join(',')
}
const resetPublishForm = async () => {
    publishForm.content = ''
    imageUrls.value = ''
    videoUrls.value = ''
    publishImageUploadRef.value?.clear?.()
    publishVideoUploadRef.value?.clear?.()
}

const submitPublish = async () => {
    if (!publishFormRef.value || publishSubmitting.value) return

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

.file-preview-area {
    padding: 0 24px 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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

.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 4px;

    .toolbar-btn {
        padding: 8px;
        font-size: 20px;
        color: var(--el-text-color-regular);

        &:hover {
            color: var(--el-color-primary);
            background-color: transparent;
        }

        .iconify {
            font-size: 20px;
        }
    }

    :deep(.el-upload) {
        display: inline-block;

        .el-button {
            padding: 8px;
            font-size: 20px;
            color: var(--el-text-color-regular);

            &:hover {
                color: var(--el-color-primary);
                background-color: transparent;
            }

            &.is-disabled {
                color: var(--el-text-color-placeholder);
                cursor: not-allowed;

                &:hover {
                    color: var(--el-text-color-placeholder);
                }
            }

            .iconify {
                font-size: 20px;
            }
        }
    }
}

.toolbar-right {
    display: flex;
    align-items: center;
}
</style>
