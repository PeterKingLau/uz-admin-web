<template>
    <div class="app-container">
        <el-row :gutter="40" class="content-row">
            <el-col :xs="24" :sm="24" :md="14" :lg="15" :xl="16">
                <div class="edit-section">
                    <div class="section-header">
                        <div class="title-group">
                            <h2>发布新动态</h2>
                            <p>分享生活，记录精彩瞬间</p>
                        </div>
                                <el-button link type="primary" @click="handleReset(false)"> <Icon icon="mdi:refresh" class="mr-1" /> 重置内容 </el-button>
                    </div>

                    <el-card shadow="hover" class="form-card">
                        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="post-form">
                            <el-form-item label="选择发布类型" prop="postType" class="type-form-item">
                                <div class="type-grid">
                                    <div
                                        v-for="type in [
                                            { label: POST_TYPE.TEXT, icon: 'mdi:format-text', text: '纯文字', desc: '记录心情与想法' },
                                            { label: POST_TYPE.IMAGE, icon: 'mdi:image-outline', text: '图文', desc: '分享美好图片' },
                                            { label: POST_TYPE.VIDEO, icon: 'mdi:video-outline', text: '视频', desc: '记录动态影像' }
                                        ]"
                                        :key="type.label"
                                        class="type-card"
                                        :class="{ active: form.postType === type.label }"
                                        @click="
                                            () => {
                                                form.postType = type.label
                                                handleTypeChange()
                                            }
                                        "
                                    >
                                        <div class="icon-box">
                                            <Icon :icon="type.icon" />
                                        </div>
                                        <div class="info-box">
                                            <span class="type-name">{{ type.text }}</span>
                                            <span class="type-desc">{{ type.desc }}</span>
                                        </div>
                                        <div class="check-mark" v-if="form.postType === type.label">
                                            <Icon icon="mdi:check-circle" />
                                        </div>
                                    </div>
                                </div>
                                <el-radio-group v-model="form.postType" v-show="false"></el-radio-group>
                            </el-form-item>

                            <el-form-item label="正文内容" prop="content">
                                <div class="input-wrapper">
                                    <el-input
                                        v-model="form.content"
                                        type="textarea"
                                        :rows="8"
                                        placeholder="写点什么吧..."
                                        maxlength="2000"
                                        show-word-limit
                                        resize="none"
                                        @input="handleContentInput"
                                        class="custom-textarea"
                                    />
                                </div>
                            </el-form-item>

                            <transition name="el-fade-in">
                                <el-form-item
                                    v-if="form.postType !== POST_TYPE.TEXT"
                                    :label="form.postType === POST_TYPE.IMAGE ? '上传图片' : '上传视频'"
                                    prop="files"
                                >
                                    <div class="upload-container">
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
                                            class="custom-upload"
                                            :class="{ 'hide-upload-trigger': uploadLimitReached }"
                                        >
                                            <div class="upload-trigger-content">
                                                <div class="icon-wrapper">
                                                    <Icon icon="mdi:cloud-upload-outline" />
                                                </div>
                                                <div class="text-wrapper">
                                                    <span class="primary-text">点击或拖拽上传</span>
                                                    <span class="secondary-text">
                                                        {{
                                                            form.postType === POST_TYPE.IMAGE
                                                                ? '支持 JPG/PNG，最多9张，单张不超过 5MB'
                                                                : '支持 MP4/MOV，建议时长 1 分钟以内'
                                                        }}
                                                    </span>
                                                </div>
                                            </div>

                                            <template #file="{ file }">
                                                <div class="uploaded-file-wrapper">
                                                    <img v-if="form.postType === POST_TYPE.IMAGE" class="thumbnail" :src="file.url" alt="" />
                                                    <video
                                                        v-else-if="form.postType === POST_TYPE.VIDEO"
                                                        class="thumbnail video-thumbnail"
                                                        :src="file.url"
                                                        muted
                                                        preload="metadata"
                                                    ></video>
                                                    <div class="overlay">
                                                        <span class="delete-btn" @click.stop="handleRemove(file)">
                                                            <Icon icon="mdi:trash-can-outline" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </template>
                                        </el-upload>
                                    </div>
                                </el-form-item>
                            </transition>

                            <el-form-item label="添加话题" prop="tagStr">
                                <el-select
                                    v-model="selectedTagIds"
                                    multiple
                                    filterable
                                    placeholder="搜索或选择话题标签..."
                                    style="width: 100%"
                                    clearable
                                    :loading="interestLoading"
                                    class="custom-select"
                                    tag-type="primary"
                                >
                                    <template #prefix>
                                        <Icon icon="mdi:pound" />
                                    </template>
                                    <template v-for="cate in interestTree" :key="cate.id">
                                        <el-option-group v-if="cate.children?.length" :label="cate.name">
                                            <el-option v-for="child in cate.children" :key="child.id" :label="child.name" :value="child.id">
                                                <span class="hash-symbol">#</span> {{ child.name }}
                                            </el-option>
                                        </el-option-group>
                                    </template>
                                </el-select>
                            </el-form-item>

                            <div class="form-footer">
                                <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit" class="submit-btn">
                                    <Icon icon="mdi:send-outline" class="mr-2 text-[18px]" /> 立即发布
                                </el-button>
                            </div>
                        </el-form>
                    </el-card>
                </div>
            </el-col>

            <el-col :xs="24" :sm="24" :md="10" :lg="9" :xl="8">
                <div class="preview-sticky-wrapper">
                    <div class="preview-header">
                        <span class="label">实时预览</span>
                    </div>

                    <div class="mobile-frame">
                        <div class="notch"></div>
                        <div class="side-btn volume-up"></div>
                        <div class="side-btn volume-down"></div>
                        <div class="side-btn power"></div>

                        <div class="screen-content">
                            <div class="status-bar">
                                <span class="time">{{ currentTime }}</span>
                                <div class="status-icons">
                                    <Icon icon="mdi:signal-cellular-3" />
                                    <Icon icon="mdi:wifi" />
                                    <Icon icon="mdi:battery-70" />
                                </div>
                            </div>

                            <div class="app-nav">
                                <Icon icon="mdi:chevron-left" class="nav-icon" />
                                <div class="user-brief">
                                    <el-avatar :size="32" :src="userAvatar" />
                                    <span class="username">{{ userNickName }}</span>
                                </div>
                                <Icon icon="mdi:dots-horizontal" class="nav-icon" />
                            </div>

                            <div class="scroll-area">
                                <div class="media-area" v-if="form.postType !== POST_TYPE.TEXT && previewMediaList.length">
                                    <el-carousel
                                        v-if="form.postType === POST_TYPE.IMAGE"
                                        :autoplay="false"
                                        indicator-position="none"
                                        height="375px"
                                        arrow="always"
                                        class="media-carousel"
                                    >
                                        <el-carousel-item v-for="(url, index) in previewMediaList" :key="index">
                                            <div class="carousel-img" :style="{ backgroundImage: `url(${url})` }"></div>
                                        </el-carousel-item>
                                        <div class="indicator-dots" v-if="previewMediaList.length > 1">
                                            <span v-for="(_, i) in previewMediaList" :key="i" class="dot" :class="{ active: i === 0 }"></span>
                                        </div>
                                    </el-carousel>

                                    <div v-else-if="form.postType === POST_TYPE.VIDEO" class="video-preview">
                                        <video :src="previewMediaList[0]" controls></video>
                                    </div>
                                </div>

                                <div class="content-body">
                                    <h1 class="post-title" v-if="form.content">{{ form.content.slice(0, 20) }}{{ form.content.length > 20 ? '...' : '' }}</h1>
                                    <p class="post-text" :class="{ placeholder: !form.content }">
                                        {{ form.content || '填写正文内容，记录当下的想法...' }}
                                    </p>

                                    <div class="tags-row" v-if="selectedTagNames.length">
                                        <span v-for="(tag, index) in selectedTagNames" :key="index" class="hash-tag"> #{{ tag.name }} </span>
                                    </div>

                                    <div class="meta-row">
                                        <span class="date">刚刚</span>
                                        <span class="location">四川 · 成都</span>
                                    </div>
                                </div>

                                <el-divider class="mock-divider" />

                                <div class="mock-comments">
                                    <div class="comment-count">共 0 条评论</div>
                                    <div class="empty-comment">
                                        <Icon icon="mdi:sofa-outline" />
                                        <span>快来坐沙发~</span>
                                    </div>
                                </div>
                            </div>

                            <div class="app-tabbar">
                                <div class="input-fake">说点什么...</div>
                                <div class="action-icons">
                                    <div class="icon-item"><Icon icon="mdi:heart-outline" /><span class="count">0</span></div>
                                    <div class="icon-item"><Icon icon="mdi:star-outline" /><span class="count">0</span></div>
                                    <div class="icon-item"><Icon icon="mdi:comment-outline" /><span class="count">0</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup name="ContentPost" lang="ts">
import { ref, reactive, computed, onMounted, watch, getCurrentInstance, onBeforeUnmount, nextTick } from 'vue'
import type { UploadUserFile, UploadFile, UploadFiles, FormInstance } from 'element-plus'
import { addPost } from '@/api/content/post'
import { POST_TYPE } from '@/utils/enum'
import { getInterestAll } from '@/api/content/interest'
import useUserStore from '@/store/modules/user'
import { Icon } from '@iconify/vue'
import defaultAvatar from '@/assets/images/default-avatar.svg'

const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()

const initialForm = {
    postType: POST_TYPE.TEXT,
    content: '',
    tagStr: ''
}

const form = reactive({ ...initialForm })

const formRef = ref<FormInstance>()
const fileList = ref<UploadUserFile[]>([])
const uploadRef = ref<any>()
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
    return userStore.avatar || defaultAvatar
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
                if (form.postType === POST_TYPE.TEXT && (!value || !value.trim())) callback(new Error('纯文字模式下，正文不能为空'))
                else callback()
            },
            trigger: ['blur', 'change']
        }
    ],
    files: [
        {
            validator: (rule: any, value: any, callback: any) => {
                if (form.postType !== POST_TYPE.TEXT && !fileList.value.length) callback(new Error('请上传素材文件'))
                else callback()
            },
            trigger: 'change'
        }
    ]
}

const updatePreviewMedia = () => {
    previewMediaList.value.forEach(url => URL.revokeObjectURL(url))
    previewMediaList.value = []
    if (form.postType === POST_TYPE.TEXT) return
    fileList.value.forEach(file => {
        if (file.raw) previewMediaList.value.push(URL.createObjectURL(file.raw))
    })
}

const handleFileChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    setTimeout(() => updatePreviewMedia(), 0)
    if (form.postType !== POST_TYPE.TEXT) nextTick(() => formRef.value?.validateField('files'))
}

const handleRemove = (file: UploadFile) => {
    uploadRef.value?.handleRemove(file)
    setTimeout(() => updatePreviewMedia(), 0)
    nextTick(() => formRef.value?.validateField('files'))
}

const handleTypeChange = async () => {
    fileList.value = []
    uploadRef.value?.clearFiles?.()
    updatePreviewMedia()
    await nextTick()
    formRef.value?.clearValidate()
}

watch(
    () => selectedTagIds.value,
    ids => {
        form.tagStr = ids.join(',')
        nextTick(() => formRef.value?.clearValidate(['tagStr']))
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
        interestTree.value = (res as any).data || res || []
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
    if (form.postType === POST_TYPE.TEXT) nextTick(() => formRef.value?.validateField('content'))
    else nextTick(() => formRef.value?.clearValidate(['content']))
}

async function handleSubmit() {
    if (!formRef.value) return

    if (form.postType !== POST_TYPE.TEXT && fileList.value.length === 0) {
        proxy?.$modal?.msgError(form.postType === POST_TYPE.IMAGE ? '请至少上传一张图片' : '请上传视频')
        return
    }

    const ok = await formRef.value.validate().catch(() => false)
    if (!ok) return

    try {
        await proxy?.$modal?.confirm('确认发布该内容吗？')
    } catch {
        return
    }

    submitting.value = true
    try {
        const files = form.postType !== POST_TYPE.TEXT ? (fileList.value.map(f => f.raw).filter(Boolean) as File[]) : []
        await addPost({
            postType: form.postType,
            content: form.content?.trim() || '',
            tagStr: form.tagStr,
            files
        })
        proxy?.$modal?.msgSuccess('发布成功')
        await handleReset(true)
    } catch (e) {
        console.error(e)
    } finally {
        submitting.value = false
    }
}

async function handleReset(afterSubmit = false) {
    previewMediaList.value.forEach(url => URL.revokeObjectURL(url))
    previewMediaList.value = []
    fileList.value = []
    uploadRef.value?.clearFiles?.()
    selectedTagIds.value = []

    if (formRef.value?.resetFields) {
        formRef.value.resetFields()
    }

    Object.assign(form, initialForm)

    await nextTick()
    formRef.value?.clearValidate()

    await nextTick()
    updatePreviewMedia()
}
</script>

<style lang="scss" scoped>
.content-row {
    max-width: 1440px;
    margin: 0 auto;
}

.edit-section {
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 24px;

        .title-group {
            h2 {
                font-size: 24px;
                color: var(--el-text-color-primary);
                margin: 0 0 8px 0;
                font-weight: 700;
            }
            p {
                color: var(--el-text-color-secondary);
                margin: 0;
                font-size: 14px;
            }
        }
    }
}

.form-card {
    border-radius: 16px;
    border: 1px solid var(--el-border-color-light);
    box-shadow: var(--el-box-shadow-light);
    overflow: hidden;
    background-color: var(--el-bg-color-overlay);

    :deep(.el-card__body) {
        padding: 32px;
    }
}

.type-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 8px;

    .type-card {
        border: 2px solid var(--el-border-color);
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--el-bg-color);

        &:hover {
            border-color: var(--el-color-primary-light-5);
            background: var(--el-color-primary-light-9);
            html.dark & {
                background: var(--el-color-primary-light-9);
                background-color: rgba(64, 158, 255, 0.15);
            }
        }

        &.active {
            border-color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);

            html.dark & {
                background-color: rgba(64, 158, 255, 0.15);
            }

            .icon-box {
                background: var(--el-color-primary);
                color: #fff;
            }

            .type-name {
                color: var(--el-color-primary);
                font-weight: 700;
            }
        }

        .icon-box {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: var(--el-fill-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: var(--el-text-color-regular);
            transition: all 0.3s ease;
        }

        .info-box {
            display: flex;
            flex-direction: column;

            .type-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                margin-bottom: 2px;
            }

            .type-desc {
                font-size: 11px;
                color: var(--el-text-color-secondary);
            }
        }

        .check-mark {
            position: absolute;
            top: 8px;
            right: 8px;
            color: var(--el-color-primary);
            font-size: 16px;
        }
    }
}

.custom-textarea {
    :deep(.el-textarea__inner) {
        border-radius: 12px;
        padding: 16px;
        font-size: 15px;
        line-height: 1.6;
        border: 1px solid var(--el-border-color);
        background: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
        box-shadow: none;
        transition: all 0.3s;

        &:focus {
            background: var(--el-bg-color-overlay);
            border-color: var(--el-color-primary);
            box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        }
    }
}

.upload-container {
    width: 100%;
}

.custom-upload {
    :deep(.el-upload--picture-card) {
        width: 100%;
        height: auto;
        min-height: 140px;
        border: 2px dashed var(--el-border-color);
        border-radius: 12px;
        background-color: var(--el-fill-color-lighter);
        line-height: normal;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--el-transition-duration);
        margin: 0;

        &:hover {
            border-color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
            html.dark & {
                background-color: rgba(64, 158, 255, 0.1);
            }
        }
    }

    &.hide-upload-trigger {
        :deep(.el-upload--picture-card) {
            display: none;
        }
    }

    :deep(.el-upload-list--picture-card) {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 12px;
        margin-top: 16px;

        .el-upload-list__item {
            width: 100%;
            height: 100px;
            margin: 0;
            border: none;
            border-radius: 8px;
            overflow: hidden;
        }
    }
}

.upload-trigger-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 0;
    gap: 12px;
    width: 100%;

    .icon-wrapper {
        font-size: 40px;
        color: var(--el-text-color-secondary);
        transition: transform 0.3s;
    }

    .text-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        line-height: 1.5;

        .primary-text {
            font-size: 15px;
            font-weight: 500;
            color: var(--el-text-color-primary);
        }

        .secondary-text {
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }
    }
}

:deep(.el-upload--picture-card:hover) .icon-wrapper {
    color: var(--el-color-primary);
    transform: translateY(-4px);
}

.uploaded-file-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: #000;

    .thumbnail {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
    }

    &:hover .overlay {
        opacity: 1;
    }

    .delete-btn {
        color: #fff;
        font-size: 22px;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 0.2s;

        &:hover {
            background: rgba(255, 255, 255, 0.2);
            color: #f56c6c;
        }
    }
}

.form-footer {
    margin-top: 40px;
    display: flex;
    justify-content: flex-end;

    .submit-btn {
        padding: 12px 36px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        box-shadow: var(--el-box-shadow);

    }
}

.preview-sticky-wrapper {
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.preview-header {
    width: 320px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .label {
        font-weight: 600;
        color: var(--el-text-color-primary);
        font-size: 16px;
    }
}

.mobile-frame {
    width: 320px;
    height: 650px;
    background: #fff;
    border-radius: 44px;
    box-shadow:
        0 0 0 8px #2d2d2d,
        0 0 0 10px #4a4a4a,
        0 20px 40px rgba(0, 0, 0, 0.2);
    position: relative;
    overflow: hidden;
    z-index: 1;
    transition: background-color 0.3s;
}

html.dark .mobile-frame {
    background: #1a1a1a;
    box-shadow:
        0 0 0 8px #121212,
        0 0 0 9px #333,
        0 20px 40px rgba(0, 0, 0, 0.5);
}

.mobile-frame {
    .notch {
        position: absolute;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 30px;
        background: #000;
        border-radius: 15px;
        z-index: 20;
    }

    .side-btn {
        position: absolute;
        background: #2d2d2d;
        border-radius: 2px 0 0 2px;
    }
    .volume-up {
        width: 3px;
        height: 40px;
        left: -11px;
        top: 120px;
    }
    .volume-down {
        width: 3px;
        height: 40px;
        left: -11px;
        top: 170px;
    }
    .power {
        width: 3px;
        height: 60px;
        right: -11px;
        top: 150px;
        border-radius: 0 2px 2px 0;
    }
}

.screen-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
    color: #333;
    transition:
        background-color 0.3s,
        color 0.3s;
}

html.dark .screen-content {
    background: #121212;
    color: #e5eaf3;
}

.status-bar {
    height: 48px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 24px 8px;
    font-size: 12px;
    font-weight: 600;

    .status-icons {
        display: flex;
        gap: 6px;
    }
}

.app-nav {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;

    .nav-icon {
        font-size: 24px;
        color: inherit;
    }

    .user-brief {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
    }
}

.scroll-area {
    flex: 1;
    overflow-y: auto;
    &::-webkit-scrollbar {
        display: none;
    }
}

.media-area {
    width: 100%;
    background: #f8f8f8;
    position: relative;

    html.dark & {
        background: #000;
    }

    .carousel-img {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
    }

    :deep(.media-carousel) {
        background: #000;
    }

    :deep(.media-carousel .el-carousel__container) {
        background: #000;
    }

    html.dark & {
        :deep(.media-carousel),
        :deep(.media-carousel .el-carousel__container),
        .video-preview {
            background: #000;
        }
    }

    .video-preview video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
    }

    .video-preview {
        height: 375px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
    }

    .indicator-dots {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 6px;
        z-index: 5;

        .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            &.active {
                background: #fff;
            }
        }
    }
}

.content-body {
    padding: 16px;

    .post-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px;
        line-height: 1.4;
    }

    .post-text {
        font-size: 15px;
        line-height: 1.6;
        color: inherit;
        white-space: pre-wrap;
        margin: 0 0 12px;

        &.placeholder {
            color: #ccc;
            font-style: italic;
            html.dark & {
                color: #666;
            }
        }
    }

    .tags-row {
        margin-bottom: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .hash-tag {
            color: #13386c;
            font-size: 14px;
            html.dark & {
                color: #409eff;
            }
        }
    }

    .meta-row {
        font-size: 12px;
        color: #999;
        display: flex;
        justify-content: space-between;
        html.dark & {
            color: #666;
        }
    }
}

.mock-divider {
    margin: 8px 0;
    border-color: #f5f5f5;
    html.dark & {
        border-color: #333;
    }
}

.mock-comments {
    padding: 0 16px 20px;

    .comment-count {
        font-size: 13px;
        color: #666;
        margin-bottom: 16px;
    }

    .empty-comment {
        height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ccc;
        font-size: 13px;
        gap: 8px;
        html.dark & {
            color: #555;
        }

        .iconify {
            font-size: 32px;
        }
    }
}

.app-tabbar {
    height: 50px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: #fff;
    transition: all 0.3s;

    html.dark & {
        background: #121212;
        border-color: #333;
    }

    .input-fake {
        flex: 1;
        height: 34px;
        background: #f5f5f5;
        border-radius: 17px;
        padding-left: 16px;
        font-size: 13px;
        color: #999;
        line-height: 34px;
        margin-right: 16px;

        html.dark & {
            background: #2c2c2c;
            color: #666;
        }
    }

    .action-icons {
        display: flex;
        gap: 20px;
        color: inherit;
        font-size: 22px;

        .icon-item {
            display: flex;
            align-items: center;
            gap: 2px;
            .count {
                font-size: 12px;
            }
        }
    }
}

@media screen and (max-width: 992px) {
    .type-grid {
        grid-template-columns: 1fr;
    }
}
</style>
