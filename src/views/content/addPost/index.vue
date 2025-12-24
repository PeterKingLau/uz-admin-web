<template>
    <div class="app-container">
        <el-row :gutter="20" class="content-row">
            <el-col :xs="24" :sm="24" :md="14" :lg="15" :xl="16">
                <el-card shadow="never" class="edit-card">
                    <template #header>
                        <div class="card-header">
                            <span class="header-title">发布新内容</span>
                            <span class="header-tip">请填写以下信息并上传素材</span>
                        </div>
                    </template>

                    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="post-form">
                        <el-form-item label="内容类型" prop="postType">
                            <el-radio-group v-model="form.postType" @change="handleTypeChange" class="type-radio-group">
                                <el-radio-button :label="POST_TYPE.TEXT">
                                    <Icon icon="mdi:format-text" />
                                    <span>纯文字</span>
                                </el-radio-button>
                                <el-radio-button :label="POST_TYPE.IMAGE">
                                    <Icon icon="mdi:image" />
                                    <span>图文</span>
                                </el-radio-button>
                                <el-radio-button :label="POST_TYPE.VIDEO">
                                    <Icon icon="mdi:video" />
                                    <span>视频</span>
                                </el-radio-button>
                            </el-radio-group>
                        </el-form-item>

                        <el-form-item label="正文内容" prop="content">
                            <el-input
                                v-model="form.content"
                                type="textarea"
                                :rows="8"
                                placeholder="请输入这一刻的想法..."
                                maxlength="2000"
                                show-word-limit
                                @input="handleContentInput"
                            />
                        </el-form-item>

                        <el-form-item
                            v-if="form.postType !== POST_TYPE.TEXT"
                            :label="form.postType === POST_TYPE.IMAGE ? '图片上传 (最多9张)' : '视频上传'"
                            prop="files"
                        >
                            <el-upload
                                ref="uploadRef"
                                v-model:file-list="fileList"
                                :auto-upload="false"
                                :multiple="form.postType === POST_TYPE.IMAGE"
                                :limit="form.postType === POST_TYPE.IMAGE ? 9 : 1"
                                :accept="uploadAccept"
                                :on-exceed="handleExceed"
                                :on-change="handleFileChange"
                                :before-upload="beforeUpload"
                                list-type="picture-card"
                                :class="{ 'hide-upload-btn': uploadLimitReached }"
                            >
                                <el-icon><Icon icon="mdi:plus" /></el-icon>

                                <template #file="{ file }">
                                    <div class="uploaded-file-wrapper">
                                        <img v-if="form.postType === POST_TYPE.IMAGE" class="el-upload-list__item-thumbnail" :src="file.url" alt="" />

                                        <video
                                            v-else-if="form.postType === POST_TYPE.VIDEO"
                                            class="el-upload-list__item-thumbnail video-thumbnail"
                                            :src="file.url"
                                            muted
                                            preload="metadata"
                                        ></video>

                                        <span class="el-upload-list__item-actions">
                                            <span class="el-upload-list__item-delete" @click="handleRemove(file)">
                                                <Icon icon="mdi:delete" />
                                            </span>
                                        </span>
                                    </div>
                                </template>
                            </el-upload>
                            <div class="upload-tip">
                                {{ form.postType === POST_TYPE.IMAGE ? '建议尺寸 1:1 或 4:3，支持 JPG/PNG' : '支持 MP4 格式，建议时长不超过 1 分钟' }}
                            </div>
                        </el-form-item>

                        <el-form-item label="关联标签" prop="tagStr">
                            <el-select
                                v-model="selectedTagIds"
                                multiple
                                filterable
                                placeholder="选择话题标签（可搜索）"
                                style="width: 100%"
                                clearable
                                :loading="interestLoading"
                                class="tag-select"
                            >
                                <template v-for="cate in interestTree" :key="cate.id">
                                    <el-option-group v-if="cate.children?.length" :label="cate.name">
                                        <el-option v-for="child in cate.children" :key="child.id" :label="child.name" :value="child.id" class="tag-option-item">
                                            <el-tag :type="getTagType(child.id)" effect="plain" round>{{ child.name }}</el-tag>
                                        </el-option>
                                    </el-option-group>
                                </template>
                            </el-select>
                        </el-form-item>

                        <div class="form-actions">
                            <el-button @click="handleReset"> <Icon icon="mdi:refresh" class="btn-icon" /> 重 置 </el-button>
                            <el-button type="primary" :loading="submitting" @click="handleSubmit">
                                <Icon icon="mdi:send" class="btn-icon" /> 发布内容
                            </el-button>
                        </div>
                    </el-form>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="24" :md="10" :lg="9" :xl="8">
                <div class="preview-wrapper">
                    <div class="preview-label">实时效果预览</div>
                    <div class="mobile-mockup">
                        <div class="mobile-status-bar">
                            <span>{{ currentTime }}</span>
                            <div class="mobile-icons">
                                <Icon icon="mdi:signal" />
                                <Icon icon="mdi:wifi" />
                                <Icon icon="mdi:battery-70" />
                            </div>
                        </div>
                        <div class="mobile-header">
                            <Icon icon="mdi:chevron-left" class="header-icon" />
                            <span>动态详情</span>
                            <Icon icon="mdi:dots-horizontal" class="header-icon" />
                        </div>

                        <div class="mobile-body">
                            <div class="preview-user-info">
                                <el-avatar :size="40" :src="userAvatar" />
                                <div class="user-meta">
                                    <div class="user-name">{{ userNickName }}</div>
                                    <div class="post-time">刚刚发布</div>
                                </div>
                            </div>

                            <div class="preview-content">
                                <div v-if="form.content" class="text-content">{{ form.content }}</div>
                                <div v-else class="text-placeholder">在此处预览正文内容...</div>
                            </div>

                            <div class="preview-media" :class="{ 'single-mode': previewMediaList.length === 1 }">
                                <template v-if="form.postType === POST_TYPE.IMAGE">
                                    <div
                                        v-for="(url, index) in previewMediaList"
                                        :key="index"
                                        class="preview-img-item"
                                        :style="{ backgroundImage: `url(${url})` }"
                                    ></div>
                                </template>

                                <template v-if="form.postType === POST_TYPE.VIDEO && previewMediaList.length">
                                    <video :src="previewMediaList[0]" controls class="preview-video"></video>
                                </template>
                            </div>

                            <div class="preview-tags" v-if="selectedTagNames.length">
                                <el-tag
                                    v-for="(tag, index) in selectedTagNames"
                                    :key="index"
                                    :type="getTagType(tag.id)"
                                    effect="plain"
                                    round
                                    size="small"
                                    class="preview-tag-item"
                                >
                                    #{{ tag.name }}
                                </el-tag>
                            </div>
                        </div>

                        <div class="mobile-footer">
                            <div class="footer-input">说点什么...</div>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup name="ContentPost" lang="ts">
import { ref, reactive, computed, onMounted, watch, getCurrentInstance, onBeforeUnmount, nextTick } from 'vue'
import type { UploadUserFile, UploadFile, UploadFiles } from 'element-plus'
import { addPost } from '@/api/content/post'
import { POST_TYPE } from '@/utils/enum'
import { getInterestAll } from '@/api/content/interest'
import useUserStore from '@/store/modules/user'
import { Icon } from '@iconify/vue'

const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()

const form = reactive({
    postType: POST_TYPE.TEXT,
    content: '',
    tagStr: ''
})

const fileList = ref<UploadUserFile[]>([])
const uploadRef = ref()
const submitting = ref(false)
const previewMediaList = ref<string[]>([])
const interestTree = ref<any[]>([])
const interestLoading = ref(false)
const selectedTagIds = ref<number[]>([])

const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const updateTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    currentTime.value = `${hours}:${minutes}`
}

const userAvatar = computed(() => {
    return userStore.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
})

const userNickName = computed(() => {
    return userStore.nickName || userStore.name || '未设置昵称'
})

const uploadAccept = computed(() => {
    if (form.postType === POST_TYPE.IMAGE) return '.jpg,.jpeg,.png,.gif'
    if (form.postType === POST_TYPE.VIDEO) return '.mp4,.mov'
    return ''
})

const uploadLimitReached = computed(() => {
    if (form.postType === POST_TYPE.IMAGE) return fileList.value.length >= 9
    if (form.postType === POST_TYPE.VIDEO) return fileList.value.length >= 1
    return false
})

const selectedTagNames = computed(() => {
    const tags: { id: number; name: string }[] = []
    const idSet = new Set(selectedTagIds.value)
    interestTree.value.forEach((cate: any) => {
        cate.children?.forEach((child: any) => {
            if (idSet.has(child.id)) tags.push({ id: child.id, name: child.name })
        })
    })
    return tags
})

const rules = {
    postType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
    content: [
        {
            validator: (rule: any, value: string, callback: any) => {
                if (form.postType === POST_TYPE.TEXT && (!value || !value.trim())) {
                    callback(new Error('纯文字模式下，正文不能为空'))
                } else {
                    callback()
                }
            },
            trigger: ['blur', 'change']
        }
    ],
    files: [
        {
            validator: (rule: any, value: any, callback: any) => {
                if (form.postType !== POST_TYPE.TEXT && !fileList.value.length) {
                    callback(new Error('请上传素材文件'))
                } else {
                    callback()
                }
            },
            trigger: 'change'
        }
    ]
}

const formRef = ref()

const updatePreviewMedia = () => {
    previewMediaList.value.forEach(url => URL.revokeObjectURL(url))
    previewMediaList.value = []
    if (form.postType === POST_TYPE.TEXT) return
    fileList.value.forEach(file => {
        if (file.raw) {
            const url = URL.createObjectURL(file.raw)
            previewMediaList.value.push(url)
        }
    })
}

const handleFileChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    setTimeout(() => updatePreviewMedia(), 0)
    if (form.postType !== POST_TYPE.TEXT) formRef.value?.validateField('files')
}

const handleRemove = (file: UploadFile) => {
    uploadRef.value?.handleRemove(file)
    setTimeout(() => updatePreviewMedia(), 0)
}

const handleTypeChange = () => {
    fileList.value = []
    previewMediaList.value = []
    formRef.value?.clearValidate()
}

watch(
    () => selectedTagIds.value,
    ids => {
        form.tagStr = ids.join(',')
    },
    { deep: true }
)

onMounted(() => {
    loadInterest()

    updateTime()
    timer = setInterval(updateTime, 1000)
})

onBeforeUnmount(() => {
    previewMediaList.value.forEach(url => URL.revokeObjectURL(url))
    if (timer) clearInterval(timer)
})

async function loadInterest() {
    interestLoading.value = true
    try {
        const res = await getInterestAll()
        interestTree.value = res.data || res || []
    } finally {
        interestLoading.value = false
    }
}

function handleExceed() {
    proxy?.$modal?.msgWarning(form.postType === POST_TYPE.IMAGE ? '最多上传 9 张图片' : '仅支持 1 个视频')
}

function beforeUpload(file: File) {
    return true
}

function handleContentInput() {
    if (form.postType === POST_TYPE.TEXT) formRef.value?.validateField('content')
}

function handleSubmit() {
    if (!formRef.value) return
    if (form.postType !== POST_TYPE.TEXT && fileList.value.length === 0) {
        proxy?.$modal?.msgError(form.postType === POST_TYPE.IMAGE ? '请至少上传一张图片' : '请上传视频')
        return
    }

    formRef.value.validate(async (valid: boolean) => {
        if (!valid) return
        try {
            await proxy?.$modal?.confirm('确认发布该内容吗？')
            submitting.value = true
            const files = form.postType !== POST_TYPE.TEXT ? (fileList.value.map(f => f.raw).filter(Boolean) as File[]) : []
            await addPost({
                postType: form.postType,
                content: form.content?.trim() || '',
                tagStr: form.tagStr,
                files
            })
            proxy?.$modal?.msgSuccess('发布成功')
            handleReset()
        } catch (e) {
            console.error(e)
        } finally {
            submitting.value = false
        }
    })
}

function handleReset() {
    form.postType = POST_TYPE.TEXT
    form.content = ''
    form.tagStr = ''
    selectedTagIds.value = []
    fileList.value = []
    previewMediaList.value = []
    nextTick(() => {
        formRef.value?.clearValidate()
    })
}

const getTagType = (id: number) => {
    const types = ['info', 'success', 'warning', 'danger', 'primary']
    return types[id % types.length]
}
</script>

<style lang="scss" scoped>
.app-container {
    padding: 20px;
    background-color: #f5f7fa;
    min-height: calc(100vh - 84px);
}

.content-row {
    max-width: 1400px;
    margin: 0 auto;
}

.edit-card {
    border-radius: 8px;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

    .card-header {
        display: flex;
        flex-direction: column;

        .header-title {
            font-size: 18px;
            font-weight: 600;
            color: #303133;
        }
        .header-tip {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
        }
    }
}

.post-form {
    padding: 10px 0;

    .upload-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 8px;
        line-height: 1.4;
    }
}

.type-radio-group {
    :deep(.el-radio-button__inner) {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 20px;

        svg {
            margin-right: 6px;
            font-size: 16px;
        }
    }
}

.tag-select {
    .tag-option-item {
        display: flex;
        align-items: center;
    }
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;

    .el-button {
        padding: 10px 24px;
        display: flex;
        align-items: center;

        .btn-icon {
            margin-right: 6px;
            font-size: 16px;
        }
    }
}

.hide-upload-btn {
    :deep(.el-upload--picture-card) {
        display: none;
    }
}

.uploaded-file-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;

    img,
    video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .el-upload-list__item-actions {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        cursor: default;
        text-align: center;
        color: #fff;
        opacity: 0;
        font-size: 20px;
        background-color: var(--el-overlay-color-lighter);
        transition: opacity var(--el-transition-duration);
        display: flex;
        justify-content: center;
        align-items: center;

        &:hover {
            opacity: 1;
        }

        .el-upload-list__item-delete {
            position: static;
            font-size: inherit;
            color: inherit;
            cursor: pointer;
            &:hover {
                color: var(--el-color-primary);
            }
        }
    }
}

.preview-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: sticky;
    top: 20px;
}

.preview-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 12px;
    font-weight: 500;
}

.mobile-mockup {
    width: 375px;
    height: 720px;
    background: #fff;
    border-radius: 30px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    border: 8px solid #333;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.mobile-status-bar {
    height: 40px;
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    font-size: 12px;
    font-weight: 600;
    z-index: 10;

    .mobile-icons {
        display: flex;
        gap: 6px;
        align-items: center;
        font-size: 14px;
    }
}

.mobile-header {
    height: 44px;
    border-bottom: 1px solid #f2f2f2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    font-size: 16px;
    font-weight: 600;
    background: #fff;

    .header-icon {
        font-size: 20px;
        color: #333;
    }
}

.mobile-body {
    flex: 1;
    overflow-y: auto;
    background: #fff;
    padding: 16px;

    &::-webkit-scrollbar {
        display: none;
    }
}

.preview-user-info {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .user-meta {
        margin-left: 10px;
        .user-name {
            font-size: 14px;
            font-weight: 600;
            color: #333;
        }
        .post-time {
            font-size: 11px;
            color: #999;
            margin-top: 2px;
        }
    }
}

.preview-content {
    margin-bottom: 12px;

    .text-content {
        font-size: 15px;
        line-height: 1.6;
        color: #333;
        white-space: pre-wrap;
    }

    .text-placeholder {
        font-size: 14px;
        color: #dcdfe6;
        font-style: italic;
    }
}

.preview-media {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin-bottom: 12px;

    &.single-mode {
        grid-template-columns: 1fr;

        .preview-img-item {
            padding-bottom: 60%;
            border-radius: 8px;
        }
        .preview-video {
            width: 100%;
            border-radius: 8px;
        }
    }

    .preview-img-item {
        width: 100%;
        padding-bottom: 100%;
        background-size: cover;
        background-position: center;
        background-color: #f5f5f5;
        border-radius: 4px;
    }

    .preview-video {
        width: 100%;
        max-height: 300px;
        background: #000;
    }
}

.preview-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .preview-tag-item {
        margin-right: 4px;
        margin-bottom: 4px;
    }
}

.mobile-footer {
    height: 50px;
    border-top: 1px solid #f2f2f2;
    background: #fff;
    padding: 0 16px;
    display: flex;
    align-items: center;

    .footer-input {
        flex: 1;
        height: 32px;
        background: #f5f7fa;
        border-radius: 16px;
        line-height: 32px;
        padding-left: 12px;
        font-size: 12px;
        color: #999;
    }
}

@media screen and (max-width: 992px) {
    .mobile-mockup {
        width: 100%;
        max-width: 375px;
        height: 600px;
    }
}
</style>
