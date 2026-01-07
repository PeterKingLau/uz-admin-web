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
                                <template v-if="form.postType === POST_TYPE.IMAGE">
                                    <el-form-item label="上传图片" prop="files">
                                        <ImageUpload v-model="imageUrls" :limit="9" :file-size="5" :file-type="['png', 'jpg', 'jpeg', 'gif']" />
                                    </el-form-item>
                                </template>
                                <template v-else-if="form.postType === POST_TYPE.VIDEO">
                                    <el-form-item label="上传视频" prop="files">
                                        <FileUpload v-model="videoUrls" :limit="1" :file-size="0" :file-type="['mp4', 'mov']" />
                                    </el-form-item>
                                </template>
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
import type { FormInstance } from 'element-plus'
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
const imageUrls = ref('')
const videoUrls = ref('')
const submitting = ref(false)
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

const baseApi = import.meta.env.VITE_APP_BASE_API || ''

const parseMediaUrls = (value: string | string[]) => {
    if (!value) return []
    const list = Array.isArray(value) ? value : value.split(',')
    return list.map(item => String(item).trim()).filter(Boolean)
}

const resolveMediaUrl = (url: string) => {
    if (!url) return ''
    if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
    if (proxy?.$imgUrl) return proxy.$imgUrl(url)
    if (!baseApi) return url
    return url.startsWith(baseApi) ? url : `${baseApi}${url}`
}

const imageUrlList = computed(() => parseMediaUrls(imageUrls.value))
const videoUrlList = computed(() => parseMediaUrls(videoUrls.value))
const imagePreviewList = computed(() => imageUrlList.value.map(resolveMediaUrl))
const videoPreviewList = computed(() => videoUrlList.value.map(resolveMediaUrl))
const previewMediaList = computed(() => {
    if (form.postType === POST_TYPE.IMAGE) return imagePreviewList.value
    if (form.postType === POST_TYPE.VIDEO) return videoPreviewList.value
    return []
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
                if (form.postType === POST_TYPE.TEXT) {
                    callback()
                    return
                }
                const hasFiles = form.postType === POST_TYPE.IMAGE ? imageUrlList.value.length > 0 : videoUrlList.value.length > 0
                if (!hasFiles) callback(new Error('请上传素材文件'))
                else callback()
            },
            trigger: 'change'
        }
    ]
}

const handleTypeChange = async () => {
    imageUrls.value = ''
    videoUrls.value = ''
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

watch(
    () => imageUrls.value,
    () => {
        if (form.postType === POST_TYPE.IMAGE) nextTick(() => formRef.value?.validateField('files'))
    }
)

watch(
    () => videoUrls.value,
    () => {
        if (form.postType === POST_TYPE.VIDEO) nextTick(() => formRef.value?.validateField('files'))
    }
)

onMounted(() => {
    loadInterest()
    updateTime()
    timer = setInterval(updateTime, 1000)
})

onBeforeUnmount(() => {
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

function handleContentInput() {
    if (form.postType === POST_TYPE.TEXT) nextTick(() => formRef.value?.validateField('content'))
    else nextTick(() => formRef.value?.clearValidate(['content']))
}

async function handleSubmit() {
    if (!formRef.value) return

    if (form.postType === POST_TYPE.IMAGE && imageUrlList.value.length === 0) {
        proxy?.$modal?.msgError('请至少上传一张图片')
        return
    }
    if (form.postType === POST_TYPE.VIDEO && videoUrlList.value.length === 0) {
        proxy?.$modal?.msgError('请上传视频')
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
        const mediaUrls = form.postType === POST_TYPE.IMAGE ? imageUrls.value : form.postType === POST_TYPE.VIDEO ? videoUrls.value : ''
        await addPost({
            postType: form.postType,
            content: form.content?.trim() || '',
            tagStr: form.tagStr,
            mediaUrls
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
    imageUrls.value = ''
    videoUrls.value = ''
    selectedTagIds.value = []

    if (formRef.value?.resetFields) {
        formRef.value.resetFields()
    }

    Object.assign(form, initialForm)

    await nextTick()
    formRef.value?.clearValidate()
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
        background-color: var(--el-bg-color);

        &:hover {
            border-color: var(--el-color-primary-light-5);
            background-color: var(--el-fill-color-light);
        }

        &.active {
            border-color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);

            .icon-box {
                background: var(--el-color-primary);
                color: var(--el-color-white);
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
        background-color: var(--el-input-bg-color, var(--el-fill-color-blank));
        color: var(--el-text-color-primary);
        box-shadow: none;
        transition: all 0.3s;

        &::placeholder {
            color: var(--el-text-color-placeholder);
        }

        &:focus {
            background-color: var(--el-bg-color);
            border-color: var(--el-color-primary);
            box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        }
    }
}

.upload-container {
    width: 100%;
}

.custom-upload {
    width: 100%;
    display: inline-block;

    &.is-empty {
        :deep(.el-upload--picture-card) {
            width: 100%;
            height: 180px;
            border: 2px dashed var(--el-border-color);
            background-color: var(--el-fill-color-lighter);
            border-radius: 12px;
            transition: all 0.3s;

            &:hover {
                border-color: var(--el-color-primary);
                background-color: var(--el-color-primary-light-9);
            }
        }
        .upload-trigger-content {
            flex-direction: column;
            padding: 32px 0;
            gap: 12px;
            .icon-wrapper {
                font-size: 40px;
            }
            .primary-text {
                font-size: 15px;
            }
            .secondary-text {
                display: block;
            }
        }
    }

    &:not(.is-empty) {
        :deep(.el-upload--picture-card) {
            width: 110px;
            height: 110px;
            margin: 0 8px 8px 0;
            border: 1px dashed var(--el-border-color);
            border-radius: 8px;
            background-color: var(--el-fill-color-lighter);
            vertical-align: top;
            transition: all 0.3s;
            display: inline-flex;

            &:hover {
                border-color: var(--el-color-primary);
                color: var(--el-color-primary);
            }
        }

        .upload-trigger-content {
            padding: 0;
            justify-content: center;
            gap: 4px;

            .icon-wrapper {
                font-size: 24px;
                color: var(--el-text-color-secondary);
            }
            .primary-text {
                font-size: 12px;
                color: var(--el-text-color-regular);
                margin: 0;
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
            width: 110px;
            height: 110px;
            margin: 0 8px 8px 0;
            border-radius: 8px;
            border: none;
            overflow: hidden;
            display: inline-flex;
            vertical-align: top;
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
        line-height: 1.5;

        .primary-text {
            font-weight: 500;
            color: var(--el-text-color-primary);
        }

        .secondary-text {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            margin-top: 4px;
        }
    }
}

:deep(.el-upload--picture-card:hover) .icon-wrapper {
    color: var(--el-color-primary);
    transform: translateY(-2px);
}

.uploaded-file-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-dark);

    .thumbnail {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .overlay {
        position: absolute;
        inset: 0;
        background: var(--el-overlay-color-lighter);
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
        color: var(--el-color-white);
        font-size: 20px;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 0.2s;

        &:hover {
            background: var(--el-fill-color-light);
            color: var(--el-color-danger);
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
    background: var(--el-bg-color);
    border-radius: 44px;
    box-shadow:
        0 0 0 8px #1f1f1f,
        0 0 0 10px #000000,
        0 20px 40px rgba(0, 0, 0, 0.4);
    position: relative;
    overflow: hidden;
    z-index: 1;
    transition: background-color 0.3s;
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
        background: #1f1f1f;
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
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
    transition:
        background-color 0.3s,
        color 0.3s;
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
    background: var(--el-fill-color-dark);
    position: relative;

    .carousel-img {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
    }

    :deep(.media-carousel) {
        background: var(--el-fill-color-darker);
    }

    :deep(.media-carousel .el-carousel__container) {
        background: var(--el-fill-color-darker);
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
        background: var(--el-fill-color-darker);
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
            background: var(--el-fill-color);
            &.active {
                background: var(--el-color-white);
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
        color: var(--el-text-color-primary);
    }

    .post-text {
        font-size: 15px;
        line-height: 1.6;
        color: inherit;
        white-space: pre-wrap;
        margin: 0 0 12px;

        &.placeholder {
            color: var(--el-text-color-placeholder);
            font-style: italic;
        }
    }

    .tags-row {
        margin-bottom: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .hash-tag {
            color: var(--el-color-primary);
            font-size: 14px;
        }
    }

    .meta-row {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        display: flex;
        justify-content: space-between;
    }
}

.mock-divider {
    margin: 8px 0;
    border-color: var(--el-border-color-lighter);
}

.mock-comments {
    padding: 0 16px 20px;

    .comment-count {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-bottom: 16px;
    }

    .empty-comment {
        height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-placeholder);
        font-size: 13px;
        gap: 8px;

        .iconify {
            font-size: 32px;
        }
    }
}

.app-tabbar {
    height: 50px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: var(--el-bg-color);
    transition: all 0.3s;

    .input-fake {
        flex: 1;
        height: 34px;
        background: var(--el-fill-color);
        border-radius: 17px;
        padding-left: 16px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        line-height: 34px;
        margin-right: 16px;
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
