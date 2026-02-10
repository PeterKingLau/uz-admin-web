<template>
    <div class="upload-file">
        <div v-if="!disabled || !hideWhenDisabled" class="upload-file-uploader-wrap">
            <el-upload
                multiple
                :action="uploadFileUrl"
                :http-request="useOssUpload ? handleOssUploadRequest : undefined"
                :before-upload="handleBeforeUpload"
                :file-list="fileList"
                :data="data"
                :limit="limit"
                :on-error="handleUploadError"
                :on-exceed="handleExceed"
                :on-success="handleUploadSuccess"
                :show-file-list="false"
                :headers="headers"
                class="upload-file-uploader"
                ref="fileUpload"
                :disabled="disabled || isUploading"
                :drag="drag"
            >
                <slot name="trigger">
                    <div class="upload-trigger-content">
                        <el-icon class="el-icon--upload"><Icon icon="ep:upload-filled" /></el-icon>
                        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
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

        <div class="custom-upload-tip" v-if="showTip && !disabled">
            <div class="tip-icon">
                <Icon icon="mdi:information-slab-circle-outline" width="18" />
            </div>
            <div class="tip-content">
                <span>请上传</span>
                <template v-if="fileSize">
                    大小不超过<span class="highlight">{{ fileSize }}MB</span>
                </template>
                <template v-if="fileType">
                    格式为<span class="highlight">{{ fileType.join('/') }}</span>
                </template>
                的文件
            </div>
        </div>

        <transition-group v-if="showList" ref="uploadFileList" class="upload-file-list" name="list-fade" tag="ul">
            <li v-for="(file, index) in fileList" :key="file.uid" class="file-item">
                <div class="file-info">
                    <div class="file-icon">
                        <Icon icon="mdi:file-document-outline" width="20" />
                    </div>
                    <div class="file-details">
                        <el-link :href="resolveFileUrl(file.url)" underline="never" target="_blank" class="file-name" :title="getFileName(file.name)">
                            {{ getFileName(file.name) }}
                        </el-link>
                    </div>
                </div>

                <div class="file-actions" v-if="!disabled">
                    <el-button type="danger" link @click="handleDelete(index)">
                        <template #icon>
                            <Icon icon="mdi:delete-outline" />
                        </template>
                        删除
                    </el-button>
                    <div class="drag-handle" v-if="drag">
                        <Icon icon="mdi:drag" />
                    </div>
                </div>
            </li>
        </transition-group>
    </div>
</template>

<script setup>
import { getToken } from '@/utils/auth'
import { getImgUrl } from '@/utils/img'
import { uploadFilesToOss } from '@/api/content/post'
import Sortable from 'sortablejs'

const props = defineProps({
    modelValue: [String, Object, Array],
    action: {
        type: String,
        default: '/common/upload'
    },
    ossType: {
        type: String,
        default: ''
    },
    ossPostType: {
        type: String,
        default: ''
    },
    data: {
        type: Object
    },
    limit: {
        type: Number,
        default: 5
    },
    showList: {
        type: Boolean,
        default: true
    },
    hideWhenDisabled: {
        type: Boolean,
        default: true
    },
    fileSize: {
        type: Number,
        default: 5
    },
    fileType: {
        type: Array,
        default: () => ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf']
    },
    isShowTip: {
        type: Boolean,
        default: true
    },
    disabled: {
        type: Boolean,
        default: false
    },
    drag: {
        type: Boolean,
        default: true
    }
})

const { proxy } = getCurrentInstance()
const emit = defineEmits(['update:modelValue', 'uploading-change'])
const number = ref(0)
const uploadList = ref([])
const baseUrl = import.meta.env.VITE_APP_FILE_BASE_URL || ''
const uploadFileUrl = ref(import.meta.env.VITE_APP_BASE_API + props.action)
const headers = ref({ Authorization: 'Bearer ' + getToken() })
const fileList = ref([])
const rawFileMap = new Map()
const uploadingCount = ref(0)
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize))
const useOssUpload = computed(() => Boolean(String(props.ossType || '').trim()))
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
        .map(item => normalizeUploadUrl(item?.url || item?.name || ''))
        .filter(Boolean)
        .join(',')

const normalizeUploadUrl = url => {
    const raw = String(url || '').trim()
    if (!raw) return ''
    return baseUrl ? raw.replace(baseUrl, '') : raw
}

const resolveOssPostType = () => {
    const explicit = String(props.ossPostType || '').trim()
    if (explicit) return explicit
    const lowerTypes = Array.isArray(props.fileType) ? props.fileType.map(type => String(type).toLowerCase()) : []
    const videoExtSet = new Set(['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'm4v', 'webm'])
    const hasVideoType = lowerTypes.some(type => videoExtSet.has(type))
    return hasVideoType ? '3' : '2'
}

async function handleOssUploadRequest(options) {
    const rawFile = options?.file
    if (!(rawFile instanceof File)) {
        options?.onError?.(new Error('invalid file'))
        return
    }

    uploadingCount.value++
    try {
        const uploaded = await uploadFilesToOss(resolveOssPostType(), [rawFile], props.ossType)
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
            let temp = 1
            const list = Array.isArray(val) ? val : String(props.modelValue).split(',')
            const nextList = list.map(item => {
                if (typeof item === 'string') {
                    return { name: item, url: item, uid: new Date().getTime() + temp++ }
                }
                const normalizedItem = item && typeof item === 'object' ? { ...item } : { name: String(item || ''), url: String(item || '') }
                normalizedItem.uid = normalizedItem.uid || new Date().getTime() + temp++
                return normalizedItem
            })
            if (toListSignature(nextList) === toListSignature(fileList.value)) return
            fileList.value = nextList
        } else {
            if (!fileList.value.length) return
            fileList.value = []
            rawFileMap.clear()
            return []
        }
    },
    { immediate: true }
)

function handleBeforeUpload(file) {
    if (props.fileType.length) {
        const fileName = file.name.split('.')
        const fileExt = (fileName[fileName.length - 1] || '').toLowerCase()
        const isTypeOk = props.fileType.some(type => String(type).toLowerCase() === fileExt)
        if (!isTypeOk) {
            proxy.$modal.msgError(`文件格式不正确，请上传${props.fileType.join('/')}格式文件!`)
            return false
        }
    }
    if (file.name.includes(',')) {
        proxy.$modal.msgError('文件名不正确，不能包含英文逗号!')
        return false
    }
    if (props.fileSize) {
        const isLt = file.size / 1024 / 1024 < props.fileSize
        if (!isLt) {
            proxy.$modal.msgError(`上传文件大小不能超过 ${props.fileSize} MB!`)
            return false
        }
    }
    number.value++
    return true
}

function handleExceed() {
    proxy.$modal.msgError(`上传文件数量不能超过 ${props.limit} 个!`)
}

function handleUploadError(err) {
    proxy.$modal.msgError('上传文件失败')
    if (number.value > 0) number.value--
}

function handleUploadSuccess(res, file) {
    if (res.code === 200) {
        const normalizedUrl = normalizeUploadUrl(res.fileName)
        const rawFile = file?.raw instanceof File ? file.raw : file instanceof File ? file : null
        if (normalizedUrl && rawFile) {
            rawFileMap.set(normalizedUrl, rawFile)
        }
        uploadList.value.push({ name: res.fileName, url: res.fileName })
        uploadedSuccessfully()
    } else {
        number.value--
        proxy.$modal.msgError(res.msg)
        proxy.$refs.fileUpload.handleRemove(file)
        uploadedSuccessfully()
    }
}

function handleDelete(index) {
    const target = fileList.value[index]
    const normalizedUrl = normalizeUploadUrl(target?.url || target?.name)
    if (normalizedUrl) {
        rawFileMap.delete(normalizedUrl)
    }
    fileList.value.splice(index, 1)
    emit('update:modelValue', listToString(fileList.value))
}

function uploadedSuccessfully() {
    if (number.value > 0 && uploadList.value.length === number.value) {
        fileList.value = fileList.value.filter(f => f.url !== undefined).concat(uploadList.value)
        uploadList.value = []
        number.value = 0
        emit('update:modelValue', listToString(fileList.value))
    }
}

function getFileName(name) {
    if (name.lastIndexOf('/') > -1) {
        return name.slice(name.lastIndexOf('/') + 1)
    } else {
        return name
    }
}

function listToString(list, separator) {
    let strs = ''
    separator = separator || ','
    for (let i in list) {
        if (list[i].url) {
            const rawUrl = String(list[i].url || '')
            const cleaned = baseUrl ? rawUrl.replace(baseUrl, '') : rawUrl
            strs += cleaned + separator
        }
    }
    return strs != '' ? strs.substr(0, strs.length - 1) : ''
}

function resolveFileUrl(url) {
    if (!url) return ''
    if (/^https?:\/\//.test(url) || String(url).startsWith('blob:')) return url
    return getImgUrl(String(url))
}

function open() {
    const input = proxy?.$refs?.fileUpload?.$el?.querySelector('input[type="file"]')
    input?.click()
}

function clear() {
    uploadList.value = []
    number.value = 0
    fileList.value = []
    rawFileMap.clear()
    emit('update:modelValue', '')
}

function getRawFiles() {
    return fileList.value
        .map(item => {
            const normalizedUrl = normalizeUploadUrl(item?.url || item?.name)
            if (!normalizedUrl) return null
            return rawFileMap.get(normalizedUrl) || null
        })
        .filter(file => file instanceof File)
}

defineExpose({ open, clear, getRawFiles, isUploading })

onMounted(() => {
    if (props.drag && !props.disabled) {
        nextTick(() => {
            const element = proxy.$refs.uploadFileList?.$el || proxy.$refs.uploadFileList
            if (element) {
                Sortable.create(element, {
                    handle: '.drag-handle',
                    ghostClass: 'sortable-ghost',
                    animation: 150,
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
.upload-file {
    width: 100%;
}

.upload-file-uploader-wrap {
    position: relative;
}

.upload-loading-mask {
    position: absolute;
    inset: 0;
    z-index: 12;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--el-color-white) 72%, transparent);
    backdrop-filter: blur(1px);
    pointer-events: all;

    .loading-icon {
        font-size: 22px;
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

.upload-file-uploader {
    :deep(.el-upload-dragger) {
        width: 100%;
        height: 160px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 1px dashed var(--el-border-color);
        border-radius: 8px;
        transition: var(--el-transition-duration);
        background-color: var(--el-fill-color-blank);

        &:hover {
            border-color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
        }

        .el-icon--upload {
            font-size: 48px;
            color: var(--el-text-color-placeholder);
            margin-bottom: 8px;
            transition: color 0.3s;
        }

        .el-upload__text {
            color: var(--el-text-color-regular);
            font-size: 14px;
            em {
                color: var(--el-color-primary);
                font-style: normal;
                font-weight: 600;
            }
        }
    }

    :deep(.el-upload-dragger:hover .el-icon--upload) {
        color: var(--el-color-primary);
    }
}

.custom-upload-tip {
    margin-top: 12px;
    padding: 10px 16px;
    background-color: var(--el-color-primary-light-9);
    border-left: 4px solid var(--el-color-primary);
    border-radius: 4px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    transition: all 0.3s;

    .tip-icon {
        color: var(--el-color-primary);
        display: flex;
        align-items: center;
        height: 20px;
    }

    .tip-content {
        font-size: 13px;
        line-height: 20px;
        color: var(--el-text-color-regular);
        flex: 1;

        .highlight {
            color: var(--el-color-danger);
            font-weight: 600;
            margin: 0 4px;
            background-color: rgba(255, 255, 255, 0.5);
            padding: 0 4px;
            border-radius: 2px;
        }
    }
}

.upload-file-list {
    margin-top: 16px;
    padding: 0;
    list-style: none;

    .file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        margin-bottom: 8px;
        background-color: var(--el-fill-color-blank);
        border: 1px solid var(--el-border-color-light);
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
            background-color: var(--el-fill-color-light);
            border-color: var(--el-color-primary-light-5);
            transform: translateY(-2px);
            box-shadow: var(--el-box-shadow-light);
        }

        .file-info {
            display: flex;
            align-items: center;
            flex: 1;
            min-width: 0;

            .file-icon {
                font-size: 20px;
                color: var(--el-text-color-secondary);
                margin-right: 12px;
                display: flex;
                align-items: center;
            }

            .file-details {
                flex: 1;
                overflow: hidden;

                .file-name {
                    font-size: 14px;
                    color: var(--el-text-color-primary);
                    font-weight: 500;
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;

                    &:hover {
                        color: var(--el-color-primary);
                        text-decoration: underline;
                    }
                }
            }
        }

        .file-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 16px;

            .drag-handle {
                cursor: grab;
                color: var(--el-text-color-placeholder);
                font-size: 18px;
                display: flex;
                align-items: center;
                padding: 4px;
                border-radius: 4px;
                transition: background 0.2s;

                &:active {
                    cursor: grabbing;
                }

                &:hover {
                    color: var(--el-color-primary);
                    background-color: var(--el-fill-color-darker);
                }
            }
        }
    }
}

.sortable-ghost {
    opacity: 0.6;
    background: var(--el-color-primary-light-8) !important;
    border: 1px dashed var(--el-color-primary) !important;
}

.list-fade-enter-active,
.list-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}
.list-fade-enter-from,
.list-fade-leave-to {
    opacity: 0;
    transform: translateX(10px);
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
