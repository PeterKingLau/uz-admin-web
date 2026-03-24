<template>
    <div ref="rootRef" class="glass-upload-container">
        <transition-group v-if="showSortAssistList" class="image-sort-assist-list" name="list-fade" tag="ul">
            <li v-for="(file, index) in fileList" :key="file.uid || `${file.rawUrl || file.url || file.name}-${index}`" class="image-sort-assist-item">
                <div class="assist-item-main" :class="{ 'no-thumb': !props.showAssistThumbnail }">
                    <img v-if="props.showAssistThumbnail" class="assist-item-thumb" :src="file.url" :alt="file.name" />
                    <div class="assist-item-meta">
                        <span class="assist-item-order">
                            <span class="order-label">第</span>
                            <span class="order-value">{{ index + 1 }}</span>
                            <span class="order-label">张</span>
                        </span>
                        <span class="assist-item-name">{{ resolveImageDisplayName(file) }}</span>
                    </div>
                </div>
                <div class="assist-item-actions">
                    <el-button v-if="props.previewable && props.showAssistPreviewAction" type="primary" link @click.stop="handlePictureCardPreview(file)"
                        >预览</el-button
                    >
                    <el-button v-if="showDeleteAction" type="danger" link @click.stop="removeFile(file)">删除</el-button>
                    <span v-if="showSortAction" class="image-sort-assist-handle" title="拖拽排序">
                        <Icon icon="mdi:drag" />
                    </span>
                </div>
            </li>
        </transition-group>

        <div class="upload-wrapper" :class="{ 'is-disabled': disabled }">
            <el-upload
                ref="imageUploadRef"
                multiple
                :disabled="disabled"
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
                :class="{ 'hide-trigger': fileList.length >= limit, 'assist-list-only': showSortAssistList }"
                class="glass-uploader"
                :drag="uploadDrag"
            >
                <template v-if="isPictureCardMode" #file="{ file }">
                    <img class="el-upload-list__item-thumbnail" :src="file.url" :alt="file.name" />
                    <span v-if="!sortAssistMode" class="el-upload-list__item-actions">
                        <span v-if="props.previewable" class="el-upload-list__item-preview" @click.stop="handlePictureCardPreview(file)">
                            <Icon icon="mdi:eye-outline" />
                        </span>
                        <span v-if="showDeleteAction" class="el-upload-list__item-delete" @click.stop="removeFile(file)">
                            <Icon icon="mdi:delete-outline" />
                        </span>
                        <span v-if="showSortAction && !sortAssistMode" class="el-upload-list__item-drag upload-drag-handle" title="拖拽排序">
                            <Icon icon="mdi:drag" />
                        </span>
                    </span>
                </template>

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
import { uploadFilesToOssSettled } from '@/api/content/post'
import Sortable from 'sortablejs'
import { ElImageViewer } from 'element-plus'
import { ref, computed, watch, getCurrentInstance, onBeforeUnmount, onMounted, nextTick } from 'vue'

const props = defineProps({
    modelValue: [String, Object, Array],
    action: { type: String, default: '/common/upload' },
    ossType: { type: String, default: '' },
    ossPostType: { type: String, default: '2' },
    data: { type: Object },
    limit: { type: Number, default: 5 },
    showFileList: { type: Boolean, default: true },
    listType: { type: String, default: 'picture-card' },
    fileSize: { type: Number, default: 10 },
    fileType: { type: Array, default: () => ['png', 'jpg', 'jpeg'] },
    isShowTip: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    drag: { type: Boolean, default: true },
    uploadDrag: { type: Boolean, default: true },
    sortable: { type: Boolean, default: true },
    previewable: { type: Boolean, default: true },
    removable: { type: Boolean, default: true },
    showSortHandle: { type: Boolean, default: true },
    sortAssistMode: { type: Boolean, default: false },
    showAssistThumbnail: { type: Boolean, default: true },
    showAssistPreviewAction: { type: Boolean, default: true },
    sortAssistListMinLength: { type: Number, default: 2 }
})

const { proxy } = getCurrentInstance()
const emit = defineEmits(['update:modelValue', 'uploading-change'])
const rootRef = ref()
const imageUploadRef = ref()
const number = ref(0)
const uploadList = ref([])
const baseUrl = import.meta.env.VITE_APP_FILE_BASE_URL || ''
const uploadImgUrl = ref(import.meta.env.VITE_APP_BASE_API + props.action)
const headers = ref({ Authorization: 'Bearer ' + getToken() })
const fileList = ref([])
const successfulUploadKeys = new Set()
const failedUploadKeys = new Set()
const showImageViewer = ref(false)
const previewSrcList = ref([])
const initialIndex = ref(0)
const uploadingCount = ref(0)
const pendingOssRequestQueue = []
let ossQueueScheduled = false
let ossQueueRunning = false
let ossQueueTimer = null
let sortableInstance = null
let sortableContainerEl = null

const accept = computed(() => {
    if (props.fileType?.length) {
        return props.fileType.map(type => (String(type).startsWith('.') ? String(type) : `.${type}`)).join(',')
    }
    return 'image/*'
})
const useOssUpload = computed(() => Boolean(String(props.ossType || '').trim()))
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize))
const isUploading = computed(() => uploadingCount.value > 0)
const isPictureCardMode = computed(() => props.listType === 'picture-card' && props.showFileList)
const showDeleteAction = computed(() => isPictureCardMode.value && props.removable && !props.disabled)
const enableSort = computed(
    () => isPictureCardMode.value && props.sortable && props.drag && props.showSortHandle && !props.disabled && fileList.value.length > 1
)
const showSortAction = computed(() => enableSort.value)
const sortAssistMode = computed(() => Boolean(props.sortAssistMode) && showSortAction.value)
const sortAssistListMinLength = computed(() => {
    const value = Number(props.sortAssistListMinLength)
    if (!Number.isFinite(value) || value < 1) return 1
    return Math.floor(value)
})
const showSortAssistList = computed(() => Boolean(props.sortAssistMode) && fileList.value.length >= sortAssistListMinLength.value)

function firstNonEmptyString(...values) {
    for (const value of values) {
        const normalized = String(value ?? '').trim()
        if (normalized) return normalized
    }
    return ''
}

function parseStructuredModelValue(val) {
    if (typeof val !== 'string') return val
    const trimmed = val.trim()
    if (!trimmed) return trimmed
    const isJsonLike =
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}'))
    if (!isJsonLike) return val
    try {
        return JSON.parse(trimmed)
    } catch {
        return val
    }
}

function normalizeModelValueToList(val) {
    if (!val) return []
    const parsedValue = parseStructuredModelValue(val)
    const list =
        Array.isArray(parsedValue) ? parsedValue : typeof parsedValue === 'string' ? String(parsedValue).split(',') : [parsedValue]
    return list.map(item => createFileListItem(item))
}

function syncFileListFromModelValue(val) {
    const nextList = normalizeModelValueToList(val)
    if (toListSignature(nextList) === toListSignature(fileList.value)) return
    fileList.value = nextList
}

watch(
    isUploading,
    value => {
        emit('uploading-change', value)
        if (!value) {
            syncFileListFromModelValue(props.modelValue)
        }
    },
    { immediate: true }
)

function toListSignature(list) {
    return list
        .map(item => String(item?.rawUrl || item?.url || item?.name || ''))
        .filter(Boolean)
        .join(',')
}

function normalizeUploadUrl(url) {
    const raw = String(url || '').trim()
    if (!raw) return ''
    return baseUrl ? raw.replace(baseUrl, '') : raw
}

function resolveUploadFileKey(file, fallbackValue = '') {
    const uid = file?.uid ?? file?.raw?.uid
    if (uid !== undefined && uid !== null && String(uid).trim()) {
        return `uid:${String(uid).trim()}`
    }

    const rawFile = file?.raw instanceof File ? file.raw : file instanceof File ? file : null
    if (rawFile) {
        const signature = [rawFile.name, rawFile.size, rawFile.lastModified].map(value => String(value ?? '').trim()).join(':')
        if (signature.replace(/:/g, '')) return `file:${signature}`
    }

    const fallback = String(file?.name || file?.url || fallbackValue || '').trim()
    return fallback ? `name:${fallback}` : ''
}

function resolveUploadOrder(file) {
    const uploadFiles = imageUploadRef.value?.uploadFiles
    if (!Array.isArray(uploadFiles) || !uploadFiles.length) return 0
    const targetKey = resolveUploadFileKey(file)
    if (!targetKey) return 0
    const index = uploadFiles.findIndex(item => resolveUploadFileKey(item) === targetKey)
    return index >= 0 ? index + 1 : 0
}

function resolveUploadTargetLabel(file) {
    const displayName = resolveImageDisplayName(file)
    if (displayName) return `图片“${displayName}”`
    const order = resolveUploadOrder(file)
    if (order > 0) return `第${order}张图片`
    return '图片'
}

function resolveUploadErrorMessage(error, file, serverMessage = '') {
    const targetLabel = resolveUploadTargetLabel(file)
    const normalizedServerMessage = String(serverMessage || '').trim()
    if (normalizedServerMessage) {
        return `${targetLabel}上传失败：${normalizedServerMessage}`
    }

    const message = String(error?.message || '').toLowerCase()
    if (error?.code === 'ECONNABORTED' || message.includes('timeout')) {
        return `${targetLabel}上传超时，请检查网络或压缩文件后重试`
    }
    return `${targetLabel}上传失败，请重试`
}

function resetUploadProgressState() {
    uploadList.value = []
    number.value = 0
    successfulUploadKeys.clear()
    failedUploadKeys.clear()
}

function getSettledUploadCount() {
    return uploadList.value.length + failedUploadKeys.size
}

function resolveDisplayUrl(rawUrl) {
    const raw = String(rawUrl || '').trim()
    if (!raw) return ''
    if (isExternal(raw)) return raw
    return getImgUrl(raw)
}

function createFileListItem(item) {
    const fallbackUid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    if (typeof item === 'string') {
        const rawUrl = normalizeUploadUrl(item)
        return {
            uid: fallbackUid,
            name: rawUrl || String(item || ''),
            rawUrl,
            url: resolveDisplayUrl(rawUrl || item)
        }
    }

    const source = item && typeof item === 'object' ? { ...item } : { name: String(item || ''), url: String(item || '') }
    const rawSource = firstNonEmptyString(
        source.rawUrl,
        source.url,
        source.fileUrl,
        source.fileURL,
        source.image,
        source.imageUrl,
        source.avatar,
        source.avatarUrl,
        source.src,
        source.path,
        source.filePath,
        source.name
    )
    const rawUrl = normalizeUploadUrl(rawSource)
    return {
        ...source,
        uid: source.uid || fallbackUid,
        name: String(source.name || rawUrl || rawSource || ''),
        rawUrl,
        url: resolveDisplayUrl(rawUrl || rawSource)
    }
}

function resolveImageDisplayName(file) {
    const explicitName = String(file?.originalName || file?.displayName || file?.name || '').trim()
    if (explicitName && !explicitName.includes('/')) return explicitName
    const raw = String(file?.rawUrl || file?.url || file?.name || '').trim()
    if (!raw) return '图片'
    const clean = raw.split('?')[0].split('#')[0]
    const filename = clean.slice(clean.lastIndexOf('/') + 1)
    if (!filename) return raw
    try {
        return decodeURIComponent(filename)
    } catch {
        return filename
    }
}

function resolveQueueFiles() {
    const uploadFiles = imageUploadRef.value?.uploadFiles
    if (!Array.isArray(uploadFiles)) return []
    return uploadFiles.filter(item => {
        const status = String(item?.status || '')
        if (status === 'ready' || status === 'uploading') return true
        if (!status && item?.raw instanceof File) return true
        return false
    })
}

const runOssRequestQueue = async () => {
    if (ossQueueRunning) return
    ossQueueRunning = true
    try {
        while (pendingOssRequestQueue.length) {
            const batch = pendingOssRequestQueue.splice(0, pendingOssRequestQueue.length)
            const files = batch.map(item => item.file).filter(file => file instanceof File)
            if (!files.length) {
                batch.forEach(item => item.options?.onError?.(new Error('invalid file')))
                continue
            }

            uploadingCount.value += files.length
            try {
                const queueFiles = resolveQueueFiles()
                const credentialFileCount = Math.max(files.length, queueFiles.length)
                const uploadResults = await uploadFilesToOssSettled(props.ossPostType || '2', files, props.ossType, credentialFileCount)

                batch.forEach((item, index) => {
                    const result = uploadResults[index]
                    if (result?.success) {
                        const url = String(result.url || '').trim()
                        if (!url) {
                            item.options?.onError?.(new Error(`empty upload url at index ${index}`))
                            return
                        }
                        item.options?.onSuccess?.({ code: 200, fileName: url }, item.file)
                        return
                    }
                    item.options?.onError?.(result?.error || new Error(`upload failed at index ${index}`))
                })
            } finally {
                uploadingCount.value = Math.max(0, uploadingCount.value - files.length)
            }
        }
    } finally {
        ossQueueRunning = false
    }
}

const scheduleOssRequestQueue = () => {
    if (ossQueueScheduled) return
    ossQueueScheduled = true
    ossQueueTimer = setTimeout(() => {
        ossQueueTimer = null
        ossQueueScheduled = false
        runOssRequestQueue()
    }, 0)
}

function handleOssUploadRequest(options) {
    const rawFile = options?.file
    if (!(rawFile instanceof File)) {
        options?.onError?.(new Error('invalid file'))
        return
    }
    pendingOssRequestQueue.push({ options, file: rawFile })
    scheduleOssRequestQueue()
}

watch(
    () => props.modelValue,
    val => {
        if (isUploading.value) return
        syncFileListFromModelValue(val)
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
    const uploadKey = resolveUploadFileKey(file)
    if (uploadKey) {
        successfulUploadKeys.delete(uploadKey)
        failedUploadKeys.delete(uploadKey)
    }
    return true
}

function handleExceed() {
    proxy.$modal.msgError(`最多允许上传 ${props.limit} 张图片!`)
}

function handleUploadSuccess(res, file) {
    const response = res && typeof res === 'object' ? res : {}
    const responseCode = Number(response.code)
    const rawFileName = String(response.fileName || response.url || '').trim()
    const isSuccess = responseCode === 200 || Boolean(rawFileName)
    const uploadKey = resolveUploadFileKey(file, rawFileName)

    if (isSuccess) {
        if (uploadKey && successfulUploadKeys.has(uploadKey)) {
            uploadedSuccessfully()
            return
        }
        if (uploadKey) {
            successfulUploadKeys.add(uploadKey)
            failedUploadKeys.delete(uploadKey)
        }
        const rawFile = file?.raw instanceof File ? file.raw : file instanceof File ? file : null
        uploadList.value.push(
            createFileListItem({
                name: String(rawFile?.name || file?.name || rawFileName || ''),
                originalName: String(rawFile?.name || file?.name || ''),
                rawUrl: rawFileName,
                url: rawFileName
            })
        )
        uploadedSuccessfully()
    } else {
        if (uploadKey && successfulUploadKeys.has(uploadKey)) {
            uploadedSuccessfully()
            return
        }
        if (uploadKey) failedUploadKeys.add(uploadKey)
        proxy.$modal.msgError(resolveUploadErrorMessage(undefined, file, response.msg))
        imageUploadRef.value?.handleRemove?.(file)
        uploadedSuccessfully()
    }
}

function handleDelete(file) {
    removeFile(file)
    return false
}

function removeFile(file) {
    const index = fileList.value.findIndex(item => {
        if (item?.uid && file?.uid) return String(item.uid) === String(file.uid)
        const itemKey = String(item?.rawUrl || item?.url || item?.name || '')
        const fileKey = String(file?.rawUrl || file?.url || file?.name || '')
        return itemKey && itemKey === fileKey
    })
    if (index < 0) return
    fileList.value.splice(index, 1)
    emit('update:modelValue', listToString(fileList.value))
}

function uploadedSuccessfully() {
    if (number.value > 0 && getSettledUploadCount() >= number.value) {
        fileList.value = fileList.value.filter(f => f.url !== undefined).concat(uploadList.value)
        resetUploadProgressState()
        emit('update:modelValue', listToString(fileList.value))
    }
}

function handleUploadError(error, file) {
    const uploadKey = resolveUploadFileKey(file)
    if (uploadKey) {
        if (successfulUploadKeys.has(uploadKey) || failedUploadKeys.has(uploadKey)) return
        failedUploadKeys.add(uploadKey)
    }
    proxy.$modal.msgError(resolveUploadErrorMessage(error, file))
    uploadedSuccessfully()
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
        const current = list[i]
        const rawUrl = String(current?.rawUrl || current?.url || '')
        if (rawUrl && rawUrl.indexOf('blob:') !== 0) {
            const cleaned = normalizeUploadUrl(rawUrl)
            strs += cleaned + separator
        }
    }
    return strs != '' ? strs.substr(0, strs.length - 1) : ''
}

function open() {
    const input = imageUploadRef.value?.$el?.querySelector('input[type="file"]')
    input?.click()
}

function clear() {
    pendingOssRequestQueue.length = 0
    if (ossQueueTimer) {
        clearTimeout(ossQueueTimer)
        ossQueueTimer = null
    }
    ossQueueScheduled = false
    resetUploadProgressState()
    fileList.value = []
    emit('update:modelValue', '')
}

function resolveSortableContainer() {
    return rootRef.value?.querySelector('.el-upload-list--picture-card')
}

function resolveSortAssistContainer() {
    return rootRef.value?.querySelector('.image-sort-assist-list')
}

function destroySortable() {
    if (!sortableInstance) return
    sortableInstance.destroy()
    sortableInstance = null
    sortableContainerEl = null
}

function initSortable() {
    if (!enableSort.value) return

    const useSortAssistList = sortAssistMode.value
    const container = useSortAssistList ? resolveSortAssistContainer() : resolveSortableContainer()
    if (!container) return
    if (sortableInstance && sortableContainerEl === container) return
    if (sortableInstance) destroySortable()

    sortableContainerEl = container

    const sortableOptions = {
        ghostClass: 'sortable-ghost',
        animation: useSortAssistList ? 180 : 250,
        handle: useSortAssistList ? '.image-sort-assist-handle' : '.upload-drag-handle',
        forceFallback: true,
        fallbackTolerance: 3,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        draggable: useSortAssistList ? '.image-sort-assist-item' : '.el-upload-list__item',
        filter: useSortAssistList ? undefined : '.el-upload--picture-card',
        onEnd: evt => {
            const oldIndex = evt.oldDraggableIndex ?? evt.oldIndex
            const newIndex = evt.newDraggableIndex ?? evt.newIndex
            if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return

            const list = [...fileList.value]
            const movedItem = list.splice(oldIndex, 1)[0]
            if (!movedItem) return

            list.splice(newIndex, 0, movedItem)
            fileList.value = list
            emit('update:modelValue', listToString(list))
        }
    }

    sortableInstance = Sortable.create(container, sortableOptions)
}

defineExpose({ open, clear, isUploading })

watch(
    () => [props.drag, props.sortable, props.showSortHandle, props.disabled, props.listType, props.showFileList, props.sortAssistMode, fileList.value.length],
    async ([dragEnabled, sortableEnabled, showSortHandle, disabled, listType, showFileList]) => {
        await nextTick()
        if (!dragEnabled || !sortableEnabled || !showSortHandle || disabled || listType !== 'picture-card' || !showFileList || fileList.value.length <= 1) {
            destroySortable()
            return
        }
        initSortable()
    },
    { immediate: true }
)

onMounted(async () => {
    await nextTick()
    initSortable()
})

onBeforeUnmount(() => {
    destroySortable()
})
</script>

<style scoped lang="scss">
.glass-upload-container {
    --glass-bg: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-white));
    --glass-border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 86%, transparent);
    --hover-bg: color-mix(in srgb, var(--el-color-primary-light-9) 52%, var(--el-color-white));
    --text-primary: var(--el-text-color-primary);
    --text-secondary: var(--el-text-color-secondary);
    --radius: 14px;
    --item-size: clamp(92px, 12vw, 116px);
    --grid-gap: 12px;

    width: 100%;
    padding: clamp(14px, 2.2vw, 20px);
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-fill-color-lighter) 82%, var(--el-color-white)),
        color-mix(in srgb, var(--el-fill-color-light) 58%, var(--el-color-white))
    );
    border-radius: var(--radius);
    border: 1px solid color-mix(in srgb, var(--el-border-color-light) 80%, transparent);
    box-shadow:
        0 2px 10px color-mix(in srgb, var(--el-color-black) 6%, transparent),
        0 1px 2px color-mix(in srgb, var(--el-color-black) 4%, transparent);
}

.upload-wrapper {
    position: relative;
    border-radius: var(--radius);

    &.is-disabled {
        opacity: 0.55;
        pointer-events: none;
        filter: grayscale(80%);
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
    &.assist-list-only {
        :deep(.el-upload-list--picture-card .el-upload-list__item) {
            display: none !important;
        }
    }

    :deep(.el-upload-list--picture-card) {
        display: flex;
        flex-wrap: wrap;
        gap: var(--grid-gap);
        margin: 0;

        .el-upload-list__item {
            width: var(--item-size);
            height: var(--item-size);
            margin: 0;
            border: var(--glass-border);
            border-radius: var(--radius);
            background: var(--glass-bg);
            backdrop-filter: blur(3px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            display: block;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 18px color-mix(in srgb, var(--el-color-black) 10%, transparent);
                border-color: color-mix(in srgb, var(--el-color-primary) 36%, var(--el-border-color));
            }

            .el-upload-list__item-thumbnail {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: var(--radius);
            }

            .upload-drag-handle * {
                pointer-events: none;
            }

            .el-upload-list__item-actions {
                position: absolute;
                inset: 0;
                z-index: 2;
                background: color-mix(in srgb, var(--el-color-black) 45%, transparent);
                backdrop-filter: blur(4px);
                border-radius: var(--radius);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s ease;

                span {
                    cursor: pointer;
                    color: #fff;
                    font-size: 18px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    background: color-mix(in srgb, var(--el-color-white) 18%, transparent);

                    &:hover {
                        background: var(--el-color-primary);
                        transform: scale(1.06);
                        box-shadow: 0 4px 10px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
                    }

                    &.el-upload-list__item-delete:hover {
                        background: var(--el-color-danger);
                        box-shadow: 0 4px 10px color-mix(in srgb, var(--el-color-danger) 30%, transparent);
                    }

                    &.el-upload-list__item-drag {
                        cursor: grab;
                    }

                    &.el-upload-list__item-drag:active {
                        cursor: grabbing;
                    }
                }
            }

            &:hover {
                .el-upload-list__item-actions {
                    opacity: 1;
                    pointer-events: auto;
                }
            }
        }
    }

    :deep(.el-upload--picture-card) {
        width: var(--item-size);
        height: var(--item-size);
        line-height: normal;
        border: 2px dashed color-mix(in srgb, var(--el-border-color) 64%, transparent);
        border-radius: var(--radius);
        background: var(--glass-bg);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        margin-bottom: var(--grid-gap);

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

    :deep(.el-list-enter-active),
    :deep(.el-list-leave-active),
    :deep(.el-list-move) {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    :deep(.el-list-leave-active) {
        position: absolute !important;
        opacity: 0;
        transform: scale(0.8);
        pointer-events: none;
        z-index: 0;
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
        transition:
            transform 0.25s ease,
            color 0.25s ease;
    }

    .text-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.5;

        .main-text {
            font-size: 14px;
            color: var(--text-primary);
            font-weight: 600;
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
    margin-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .info-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-white));
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 999px;
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

.image-sort-assist-list {
    margin: 0 0 14px;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.image-sort-assist-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-white));
    transition: all 0.2s ease;

    &:hover {
        border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color-lighter));
        box-shadow: 0 4px 10px color-mix(in srgb, var(--el-color-black) 6%, transparent);
    }
}

.assist-item-main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;

    &.no-thumb {
        gap: 0;
    }
}

.assist-item-thumb {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid var(--el-border-color-lighter);
}

.assist-item-meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.assist-item-order {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, var(--el-border-color-lighter));
    background: color-mix(in srgb, var(--el-color-primary-light-9) 62%, var(--el-color-white));
    color: var(--el-color-primary);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
}

.assist-item-order .order-label {
    opacity: 0.82;
}

.assist-item-order .order-value {
    min-width: 16px;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
}

.assist-item-name {
    min-width: 0;
    max-width: 320px;
    font-size: 13px;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.assist-item-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.image-sort-assist-handle {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    cursor: grab;
    transition: all 0.2s ease;

    &:hover {
        color: #fff;
        background: var(--el-color-primary);
    }

    &:active {
        cursor: grabbing;
    }

    * {
        pointer-events: none;
    }
}

.list-fade-enter-active,
.list-fade-leave-active {
    transition: all 0.25s ease;
}

.list-fade-enter-from,
.list-fade-leave-to {
    opacity: 0;
    transform: translateY(6px);
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

@media screen and (max-width: 768px) {
    .glass-upload-container {
        --item-size: 92px;
        --grid-gap: 10px;
        padding: 12px;
    }
}

:global(html.dark) .glass-upload-container {
    --glass-bg: color-mix(in srgb, var(--el-fill-color-dark) 88%, var(--el-bg-color));
    --hover-bg: color-mix(in srgb, var(--el-color-primary) 16%, var(--el-fill-color-dark));
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
