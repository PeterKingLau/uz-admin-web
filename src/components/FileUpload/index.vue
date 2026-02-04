<template>
    <div class="upload-file">
        <el-upload
            multiple
            :action="uploadFileUrl"
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
            :disabled="disabled"
            v-if="!disabled || !hideWhenDisabled"
            :drag="drag"
        >
            <slot name="trigger">
                <div class="upload-trigger-content">
                    <el-icon class="el-icon--upload"><Icon icon="ep:upload-filled" /></el-icon>
                    <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                </div>
            </slot>
        </el-upload>

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
                        <el-link :href="`${baseUrl}${file.url}`" :underline="false" target="_blank" class="file-name" :title="getFileName(file.name)">
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
import Sortable from 'sortablejs'

const props = defineProps({
    modelValue: [String, Object, Array],
    action: {
        type: String,
        default: '/common/upload'
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
const emit = defineEmits()
const number = ref(0)
const uploadList = ref([])
const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadFileUrl = ref(import.meta.env.VITE_APP_BASE_API + props.action)
const headers = ref({ Authorization: 'Bearer ' + getToken() })
const fileList = ref([])
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize))

watch(
    () => props.modelValue,
    val => {
        if (val) {
            let temp = 1
            const list = Array.isArray(val) ? val : props.modelValue.split(',')
            fileList.value = list.map(item => {
                if (typeof item === 'string') {
                    item = { name: item, url: item }
                }
                item.uid = item.uid || new Date().getTime() + temp++
                return item
            })
        } else {
            fileList.value = []
            return []
        }
    },
    { deep: true, immediate: true }
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
    proxy.$modal.loading('正在上传文件，请稍候...')
    number.value++
    return true
}

function handleExceed() {
    proxy.$modal.msgError(`上传文件数量不能超过 ${props.limit} 个`)
}

function handleUploadError(err) {
    proxy.$modal.msgError('上传文件失败')
    proxy.$modal.closeLoading()
}

function handleUploadSuccess(res, file) {
    if (res.code === 200) {
        uploadList.value.push({ name: res.fileName, url: res.fileName })
        uploadedSuccessfully()
    } else {
        number.value--
        proxy.$modal.closeLoading()
        proxy.$modal.msgError(res.msg)
        proxy.$refs.fileUpload.handleRemove(file)
        uploadedSuccessfully()
    }
}

function handleDelete(index) {
    fileList.value.splice(index, 1)
    emit('update:modelValue', listToString(fileList.value))
}

function uploadedSuccessfully() {
    if (number.value > 0 && uploadList.value.length === number.value) {
        fileList.value = fileList.value.filter(f => f.url !== undefined).concat(uploadList.value)
        uploadList.value = []
        number.value = 0
        emit('update:modelValue', listToString(fileList.value))
        proxy.$modal.closeLoading()
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
            strs += list[i].url + separator
        }
    }
    return strs != '' ? strs.substr(0, strs.length - 1) : ''
}

function open() {
    const input = proxy?.$refs?.fileUpload?.$el?.querySelector('input[type="file"]')
    input?.click()
}

function clear() {
    uploadList.value = []
    number.value = 0
    fileList.value = []
    emit('update:modelValue', '')
}

defineExpose({ open, clear })

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
</style>
