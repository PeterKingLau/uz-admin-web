<template>
    <div class="component-upload-image">
        <el-upload
            multiple
            :disabled="disabled"
            :action="uploadImgUrl"
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :before-upload="handleBeforeUpload"
            :data="data"
            :limit="limit"
            :on-error="handleUploadError"
            :on-exceed="handleExceed"
            ref="imageUpload"
            :before-remove="handleDelete"
            :show-file-list="true"
            :headers="headers"
            :file-list="fileList"
            :on-preview="handlePictureCardPreview"
            :class="{ hide: fileList.length >= limit, 'is-disabled': disabled }"
        >
            <el-icon class="avatar-uploader-icon"><Icon icon="ep:plus" /></el-icon>
        </el-upload>

        <div class="custom-upload-tip" v-if="showTip && !disabled">
            <div class="tip-icon">
                <Icon icon="mdi:information-slab-circle-outline" width="18" />
            </div>
            <div class="tip-content">
                <span>请上传</span>
                <template v-if="fileSize">
                    大小不超过 <span class="highlight">{{ fileSize }}MB</span>
                </template>
                <template v-if="fileType">
                    格式为 <span class="highlight">{{ fileType.join('/') }}</span>
                </template>
                的文件
            </div>
        </div>

        <el-dialog v-model="dialogVisible" title="预览" width="800px" append-to-body class="custom-dialog">
            <img :src="dialogImageUrl" style="display: block; max-width: 100%; margin: 0 auto; border-radius: 4px" />
        </el-dialog>
    </div>
</template>

<script setup>
import { getToken } from '@/utils/auth'
import { isExternal } from '@/utils/validate'
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
    fileSize: {
        type: Number,
        default: 5
    },
    fileType: {
        type: Array,
        default: () => ['png', 'jpg', 'jpeg']
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
const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadImgUrl = ref(import.meta.env.VITE_APP_BASE_API + props.action)
const headers = ref({ Authorization: 'Bearer ' + getToken() })
const fileList = ref([])
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize))

watch(
    () => props.modelValue,
    val => {
        if (val) {
            const list = Array.isArray(val) ? val : props.modelValue.split(',')
            fileList.value = list.map(item => {
                if (typeof item === 'string') {
                    if (item.indexOf(baseUrl) === -1 && !isExternal(item)) {
                        item = { name: baseUrl + item, url: baseUrl + item }
                    } else {
                        item = { name: item, url: item }
                    }
                }
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
    let isImg = false
    if (props.fileType.length) {
        let fileExtension = ''
        if (file.name.lastIndexOf('.') > -1) {
            fileExtension = file.name.slice(file.name.lastIndexOf('.') + 1)
        }
        isImg = props.fileType.some(type => {
            if (file.type.indexOf(type) > -1) return true
            if (fileExtension && fileExtension.indexOf(type) > -1) return true
            return false
        })
    } else {
        isImg = file.type.indexOf('image') > -1
    }
    if (!isImg) {
        proxy.$modal.msgError(`文件格式不正确，请上传${props.fileType.join('/')}图片格式文件!`)
        return false
    }
    if (file.name.includes(',')) {
        proxy.$modal.msgError('文件名不正确，不能包含英文逗号!')
        return false
    }
    if (props.fileSize) {
        const isLt = file.size / 1024 / 1024 < props.fileSize
        if (!isLt) {
            proxy.$modal.msgError(`上传头像图片大小不能超过 ${props.fileSize} MB!`)
            return false
        }
    }
    proxy.$modal.loading('正在上传图片，请稍候...')
    number.value++
}

function handleExceed() {
    proxy.$modal.msgError(`上传文件数量不能超过 ${props.limit} 个!`)
}

function handleUploadSuccess(res, file) {
    if (res.code === 200) {
        uploadList.value.push({ name: res.fileName, url: res.fileName })
        uploadedSuccessfully()
    } else {
        number.value--
        proxy.$modal.closeLoading()
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
        proxy.$modal.closeLoading()
    }
}

function handleUploadError() {
    proxy.$modal.msgError('上传图片失败')
    proxy.$modal.closeLoading()
}

function handlePictureCardPreview(file) {
    dialogImageUrl.value = file.url
    dialogVisible.value = true
}

function listToString(list, separator) {
    let strs = ''
    separator = separator || ','
    for (let i in list) {
        if (undefined !== list[i].url && list[i].url.indexOf('blob:') !== 0) {
            strs += list[i].url.replace(baseUrl, '') + separator
        }
    }
    return strs != '' ? strs.substr(0, strs.length - 1) : ''
}

onMounted(() => {
    if (props.drag && !props.disabled) {
        nextTick(() => {
            const element = proxy.$refs.imageUpload?.$el?.querySelector('.el-upload-list')
            if (element) {
                Sortable.create(element, {
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
.component-upload-image {
    :deep(.el-upload--picture-card) {
        border-radius: 8px;
        border: 1px dashed var(--el-border-color);
        background-color: var(--el-fill-color-blank);
        transition: all 0.3s;
        width: 120px;
        height: 120px;
        line-height: 128px;

        &:hover {
            border-color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
        }
    }

    :deep(.el-upload-list--picture-card .el-upload-list__item) {
        border-radius: 8px;
        border: 1px solid var(--el-border-color-light);
        width: 120px;
        height: 120px;
        margin: 0 8px 8px 0;
        transition: all 0.3s;

        &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
    }

    :deep(.hide .el-upload--picture-card) {
        display: none;
    }

    :deep(.is-disabled .el-upload--picture-card) {
        display: none !important;
    }

    .avatar-uploader-icon {
        font-size: 24px;
        color: #8c939d;
        transition: color 0.3s;
    }

    :deep(.el-upload--picture-card:hover .avatar-uploader-icon) {
        color: var(--el-color-primary);
    }
}

.custom-upload-tip {
    margin-top: 10px;
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

.sortable-ghost {
    opacity: 0.6;
    background: var(--el-color-primary-light-8) !important;
    border: 1px dashed var(--el-color-primary) !important;
}
</style>
