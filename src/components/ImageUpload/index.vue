<template>
    <div class="glass-upload-container">
        <div class="upload-wrapper" :class="{ 'is-disabled': disabled }">
            <el-upload
                ref="imageUpload"
                multiple
                :disabled="disabled || isUploading"
                :action="uploadImgUrl"
                :http-request="useOssUpload ? handleOssUploadRequest : undefined"
                :list-type="listType"
                :accept="accept"
                :on-success="handleUploadSuccess"
                :before-upload="handleBeforeUpload"
                :data="data"
                :limit="limit"
                :on-error="handleUploadError"
                :on-exceed="handleExceed"
                :before-remove="handleDelete"
                :show-file-list="showFileList"
                :headers="headers"
                :file-list="fileList"
                :on-preview="handlePictureCardPreview"
                :class="{ 'hide-trigger': fileList.length >= limit }"
                class="glass-uploader"
                drag
            >
                <slot name="trigger">
                    <div class="upload-trigger-content">
                        <div class="icon-box">
                            <Icon icon="ep:upload-filled" class="upload-icon" />
                        </div>
                        <div class="text-box">
                            <span class="main-text">点击或拖拽上传</span>
                            <span class="sub-text" v-if="limit">最多 {{ limit }} 张</span>
                        </div>
                    </div>
                </slot>
            </el-upload>

            <transition name="upload-mask-fade">
                <div v-if="isUploading" class="upload-loading-mask">
                    <Icon icon="mdi:loading" class="loading-icon" />
                    <span class="loading-text">上传中...</span>
                </div>
            </transition>
        </div>

        <div class="upload-info-bar" v-if="showTip && !disabled">
            <div class="info-item">
                <Icon icon="ep:info-filled" class="icon" />
                <span>格式: {{ fileType ? fileType.join('/') : 'Image' }}</span>
            </div>
            <div class="info-item" v-if="fileSize">
                <Icon icon="ep:warning-filled" class="icon" />
                <span>大小: ≤ {{ fileSize }}MB</span>
            </div>
        </div>

        <teleport to="body">
            <el-image-viewer
                v-if="showImageViewer"
                :url-list="previewSrcList"
                :initial-index="initialIndex"
                @close="closeImageViewer"
                class="glass-image-viewer"
            />
        </teleport>
    </div>
</template>

<script setup>
import { getToken } from '@/utils/auth'
import { getImgUrl } from '@/utils/img'
import { isExternal } from '@/utils/validate'
import { uploadFilesToOss } from '@/api/content/post'
import Sortable from 'sortablejs'
import { ElImageViewer } from 'element-plus'
import { ref, computed, watch, getCurrentInstance, onMounted, nextTick } from 'vue'

const props = defineProps({
    modelValue: [String, Object, Array],
    action: { type: String, default: '/common/upload' },
    ossType: { type: String, default: '' },
    ossPostType: { type: String, default: '2' },
    data: { type: Object },
    limit: { type: Number, default: 5 },
    showFileList: { type: Boolean, default: true },
    listType: { type: String, default: 'picture-card' },
    fileSize: { type: Number, default: 5 },
    fileType: { type: Array, default: () => ['png', 'jpg', 'jpeg'] },
    isShowTip: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    drag: { type: Boolean, default: true }
})

const { proxy } = getCurrentInstance()
const emit = defineEmits(['update:modelValue', 'uploading-change'])
const number = ref(0)
const uploadList = ref([])
const baseUrl = import.meta.env.VITE_APP_FILE_BASE_URL || ''
const uploadImgUrl = ref(import.meta.env.VITE_APP_BASE_API + props.action)
const headers = ref({ Authorization: 'Bearer ' + getToken() })
const fileList = ref([])
const showImageViewer = ref(false)
const previewSrcList = ref([])
const initialIndex = ref(0)
const uploadingCount = ref(0)

const accept = computed(() => {
    if (props.fileType?.length) {
        return props.fileType.map(type => (String(type).startsWith('.') ? String(type) : `.${type}`)).join(',')
    }
    return 'image/*'
})
const useOssUpload = computed(() => Boolean(String(props.ossType || '').trim()))
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize))
const isUploading = computed(() => uploadingCount.value > 0)

watch(
    isUploading,
    value => {
        emit('uploading-change', value)
    },
    { immediate: true }
)

const toListSignature = list =>
    list
        .map(item => String(item?.url || item?.name || ''))
        .filter(Boolean)
        .join(',')

async function handleOssUploadRequest(options) {
    const rawFile = options?.file
    if (!(rawFile instanceof File)) {
        options?.onError?.(new Error('invalid file'))
        return
    }
    uploadingCount.value++
    try {
        const uploaded = await uploadFilesToOss(props.ossPostType || '2', [rawFile], props.ossType)
        const url = String(uploaded?.[0] || '').trim()
        if (!url) throw new Error('empty upload url')
        options?.onSuccess?.({ code: 200, fileName: url }, rawFile)
    } catch (error) {
        options?.onError?.(error)
    } finally {
        if (uploadingCount.value > 0) uploadingCount.value--
    }
}

watch(
    () => props.modelValue,
    val => {
        if (val) {
            const list = Array.isArray(val) ? val : String(props.modelValue).split(',')
            const nextList = list.map(item => {
                if (typeof item === 'string') {
                    const resolved = isExternal(item) ? item : getImgUrl(item)
                    return { name: resolved, url: resolved }
                }
                return item && typeof item === 'object' ? { ...item } : { name: String(item || ''), url: String(item || '') }
            })
            if (toListSignature(nextList) === toListSignature(fileList.value)) return
            fileList.value = nextList
        } else {
            if (!fileList.value.length) return
            fileList.value = []
        }
    },
    { immediate: true }
)

function handleBeforeUpload(file) {
    let isImg = false
    if (props.fileType.length) {
        const types = props.fileType.map(type => String(type).toLowerCase())
        let fileExtension = ''
        if (file.name.lastIndexOf('.') > -1) {
            fileExtension = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
        }
        const mime = String(file.type || '').toLowerCase()
        isImg = types.some(type => {
            if (mime.indexOf(type) > -1) return true
            if (fileExtension && fileExtension.indexOf(type) > -1) return true
            return false
        })
    } else {
        isImg = file.type.indexOf('image') > -1
    }
    if (!isImg) {
        proxy.$modal.msgError(`格式错误，请上传 ${props.fileType.join('/')} 格式!`)
        return false
    }
    if (file.name.includes(',')) {
        proxy.$modal.msgError('文件名不能包含逗号!')
        return false
    }
    if (props.fileSize) {
        const isLt = file.size / 1024 / 1024 < props.fileSize
        if (!isLt) {
            proxy.$modal.msgError(`大小不能超过 ${props.fileSize} MB!`)
            return false
        }
    }
    number.value++
    return true
}

function handleExceed() {
    proxy.$modal.msgError(`最多允许上传 ${props.limit} 张图片!`)
}

function handleUploadSuccess(res, file) {
    if (res.code === 200) {
        uploadList.value.push({ name: res.fileName, url: res.fileName })
        uploadedSuccessfully()
    } else {
        number.value--
        proxy.$modal.msgError(res.msg)
        proxy.$refs.imageUpload.handleRemove(file)
        uploadedSuccessfully()
    }
}

function handleDelete(file) {
    const findex = fileList.value.map(f => f.name).indexOf(file.name)
    if (findex > -1 && uploadList.value.length === number.value) {
        fileList.value.splice(findex, 1)
        emit('update:modelValue', listToString(fileList.value))
        return false
    }
}

function uploadedSuccessfully() {
    if (number.value > 0 && uploadList.value.length === number.value) {
        fileList.value = fileList.value.filter(f => f.url !== undefined).concat(uploadList.value)
        uploadList.value = []
        number.value = 0
        emit('update:modelValue', listToString(fileList.value))
    }
}

function handleUploadError() {
    proxy.$modal.msgError('上传失败，请重试')
    if (number.value > 0) number.value--
}

function handlePictureCardPreview(file) {
    previewSrcList.value = fileList.value.map(f => f.url)
    initialIndex.value = fileList.value.findIndex(f => f.url === file.url)
    showImageViewer.value = true
}

function closeImageViewer() {
    showImageViewer.value = false
}

function listToString(list, separator) {
    let strs = ''
    separator = separator || ','
    for (let i in list) {
        if (undefined !== list[i].url && list[i].url.indexOf('blob:') !== 0) {
            const rawUrl = String(list[i].url || '')
            const cleaned = baseUrl ? rawUrl.replace(baseUrl, '') : rawUrl
            strs += cleaned + separator
        }
    }
    return strs != '' ? strs.substr(0, strs.length - 1) : ''
}

function open() {
    const input = proxy?.$refs?.imageUpload?.$el?.querySelector('input[type="file"]')
    input?.click()
}

function clear() {
    uploadList.value = []
    number.value = 0
    fileList.value = []
    emit('update:modelValue', '')
}

defineExpose({ open, clear, isUploading })

onMounted(() => {
    if (props.drag && !props.disabled) {
        nextTick(() => {
            const element = proxy.$refs.imageUpload?.$el?.querySelector('.el-upload-list')
            if (element) {
                Sortable.create(element, {
                    ghostClass: 'sortable-ghost',
                    animation: 200,
                    onEnd: evt => {
                        const movedItem = fileList.value.splice(evt.oldIndex, 1)[0]
                        fileList.value.splice(evt.newIndex, 0, movedItem)
                        emit('update:modelValue', listToString(fileList.value))
                    }
                })
            }
        })
    }
})
</script>

<style scoped lang="scss">
.glass-upload-container {
    --glass-bg: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-white));
    --glass-border: 1px solid var(--el-border-color-lighter);
    --hover-bg: color-mix(in srgb, var(--el-color-primary-light-9) 55%, var(--el-color-white));
    --text-primary: var(--el-text-color-primary);
    --text-secondary: var(--el-text-color-secondary);
    --radius: 16px;
    --item-size: 110px;

    width: 100%;
    padding: 20px;
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-fill-color-lighter) 78%, var(--el-color-white)),
        color-mix(in srgb, var(--el-fill-color-light) 60%, var(--el-color-white))
    );
    border-radius: var(--radius);
    border: 1px solid var(--el-border-color-light);
    box-shadow:
        0 2px 8px color-mix(in srgb, var(--el-color-black) 6%, transparent),
        0 1px 2px color-mix(in srgb, var(--el-color-black) 4%, transparent);
}

.upload-wrapper {
    position: relative;

    &.is-disabled {
        opacity: 0.5;
        pointer-events: none;
        filter: grayscale(100%);
    }
}

.upload-loading-mask {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--el-color-white) 68%, transparent);
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

.upload-mask-fade-enter-active,
.upload-mask-fade-leave-active {
    transition: opacity 0.2s ease;
}

.upload-mask-fade-enter-from,
.upload-mask-fade-leave-to {
    opacity: 0;
}

.glass-uploader {
    :deep(.el-upload-list--picture-card) {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(var(--item-size), 1fr));
        gap: 16px;
        margin: 0;

        .el-upload-list__item {
            width: 100%;
            height: 0;
            padding-bottom: 100%;
            margin: 0;
            border: var(--glass-border);
            border-radius: var(--radius);
            background: var(--glass-bg);
            backdrop-filter: blur(3px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;

            &:hover {
                transform: translateY(-4px) scale(1.02);
                box-shadow: 0 10px 22px color-mix(in srgb, var(--el-color-black) 10%, transparent);
                border-color: var(--el-border-color);
            }

            .el-upload-list__item-thumbnail {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: var(--radius);
            }

            .el-upload-list__item-actions {
                position: absolute;
                inset: 0;
                background: color-mix(in srgb, var(--el-color-black) 45%, transparent);
                backdrop-filter: blur(4px);
                border-radius: var(--radius);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                opacity: 0;
                transition: all 0.3s ease;

                &:hover {
                    opacity: 1;
                }

                span {
                    cursor: pointer;
                    color: var(--text-primary);
                    font-size: 20px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: color-mix(in srgb, var(--el-color-white) 18%, transparent);

                    &:hover {
                        background: var(--el-color-primary);
                        transform: scale(1.1);
                        box-shadow: 0 4px 10px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
                    }

                    &.el-upload-list__item-delete:hover {
                        background: var(--el-color-danger);
                        box-shadow: 0 4px 10px color-mix(in srgb, var(--el-color-danger) 30%, transparent);
                    }
                }
            }
        }
    }

    :deep(.el-upload--picture-card) {
        width: 100% !important;
        height: 0 !important;
        padding-bottom: 100% !important;
        line-height: normal;
        border: 2px dashed rgba(255, 255, 255, 0.3);
        border-radius: var(--radius);
        background: var(--glass-bg);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

        &:hover {
            border-color: var(--el-color-primary);
            background: var(--hover-bg);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 24%, transparent);

            .upload-trigger-content {
                .icon-box {
                    transform: scale(1.1) rotate(5deg);
                    color: var(--el-color-primary);
                }
                .main-text {
                    color: var(--el-color-primary);
                }
            }
        }
    }

    :deep(.el-upload-dragger) {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &.hide-trigger {
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
    gap: 12px;
    height: 100%;
    width: 100%;
    z-index: 1;

    .icon-box {
        font-size: 32px;
        color: var(--text-secondary);
        transition: all 0.3s ease;
    }

    .text-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.5;

        .main-text {
            font-size: 14px;
            color: var(--text-primary);
            font-weight: 500;
            transition: color 0.3s;
        }

        .sub-text {
            font-size: 12px;
            color: var(--text-secondary);
            opacity: 0.8;
        }
    }
}

.upload-info-bar {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .info-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-white));
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 20px;
        font-size: 12px;
        color: var(--text-secondary);
        backdrop-filter: blur(2px);
        transition: all 0.3s;

        &:hover {
            background: color-mix(in srgb, var(--el-color-primary-light-9) 45%, var(--el-color-white));
            border-color: color-mix(in srgb, var(--el-color-primary) 22%, var(--el-border-color-lighter));
            color: var(--text-primary);
        }

        .icon {
            font-size: 14px;
            color: var(--el-color-primary);
        }
    }
}

.sortable-ghost {
    opacity: 0.5;
    background: color-mix(in srgb, var(--el-color-primary-light-8) 65%, var(--el-color-white)) !important;
    border: 2px dashed var(--el-color-primary) !important;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 28%, transparent);

    img {
        opacity: 0;
    }
}
</style>

<style lang="scss">
.glass-image-viewer {
    .el-image-viewer__mask {
        background: rgba(10, 10, 15, 0.9);
        backdrop-filter: blur(20px);
    }

    .el-image-viewer__btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        backdrop-filter: blur(8px);
        transition: all 0.3s;

        &:hover {
            background: var(--el-color-primary);
            border-color: var(--el-color-primary);
            box-shadow: 0 0 15px var(--el-color-primary);
            transform: scale(1.1);
        }

        .el-icon {
            font-size: 20px;
        }
    }

    .el-image-viewer__close {
        top: 40px;
        right: 40px;
    }
}
</style>
