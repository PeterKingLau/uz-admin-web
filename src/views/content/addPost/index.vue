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
                        <el-button link type="primary" @click="handleReset()" class="reset-btn">
                            <Icon icon="mdi:refresh" class="mr-1" />
                            重置内容
                        </el-button>
                    </div>

                    <el-card shadow="never" class="form-card">
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
                                        <transition name="check-scale">
                                            <div class="check-mark" v-if="form.postType === type.label">
                                                <Icon icon="mdi:check-circle" />
                                            </div>
                                        </transition>
                                    </div>
                                </div>
                                <el-radio-group v-model="form.postType" v-show="false"></el-radio-group>
                            </el-form-item>

                            <el-form-item label="正文内容" prop="content" class="highlight-label">
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

                            <transition name="el-zoom-in-top">
                                <el-form-item
                                    v-if="form.postType !== POST_TYPE.TEXT"
                                    :label="form.postType === POST_TYPE.IMAGE ? '上传图片' : '上传视频'"
                                    prop="files"
                                    class="highlight-label"
                                >
                                    <div
                                        class="upload-container"
                                        :class="{
                                            'image-mode': form.postType === POST_TYPE.IMAGE,
                                            'video-mode': form.postType === POST_TYPE.VIDEO
                                        }"
                                    >
                                        <template v-if="form.postType === POST_TYPE.IMAGE">
                                            <ImageUpload
                                                ref="imageUploadRef"
                                                v-model="imageUrls"
                                                :limit="9"
                                                :file-size="5"
                                                :file-type="['jpg', 'jpeg', 'png', 'gif']"
                                                :is-show-tip="false"
                                                oss-type="posts"
                                                :oss-post-type="POST_TYPE.IMAGE"
                                                class="custom-upload image-upload"
                                            />
                                            <div class="upload-hint">
                                                <div class="hint-item">
                                                    <Icon icon="mdi:image-multiple-outline" />
                                                    <span>支持 JPG / PNG / GIF，最多 9 张，单张不超过 5MB</span>
                                                </div>
                                                <div class="hint-item">
                                                    <Icon icon="mdi:swap-horizontal-bold" />
                                                    <span>可拖拽调整顺序，发布后将按当前顺序展示</span>
                                                </div>
                                            </div>
                                        </template>

                                        <template v-else>
                                            <FileUpload
                                                ref="videoUploadRef"
                                                v-model="videoUrls"
                                                :limit="1"
                                                :file-size="0"
                                                :file-type="['mp4', 'mov']"
                                                :is-show-tip="false"
                                                oss-type="posts"
                                                :oss-post-type="POST_TYPE.VIDEO"
                                                class="custom-upload video-upload"
                                            />
                                            <div class="upload-hint">
                                                <div class="hint-item">
                                                    <Icon icon="mdi:video-outline" />
                                                    <span>支持 MP4 / MOV，仅可上传 1 个视频</span>
                                                </div>
                                                <div class="hint-item">
                                                    <Icon icon="mdi:clock-outline" />
                                                    <span>建议时长控制在 60 秒以内，画质不低于 720P</span>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                </el-form-item>
                            </transition>

                            <el-form-item label="添加话题标签" prop="tagStr">
                                <el-select
                                    v-model="selectedTagIds"
                                    multiple
                                    filterable
                                    placeholder="请选择话题标签 (必选)"
                                    style="width: 100%"
                                    clearable
                                    :loading="interestLoading"
                                    class="custom-select"
                                    popper-class="custom-select-popper"
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
                                    <Icon icon="mdi:send-outline" class="mr-2 text-[18px]" />
                                    {{ submitting ? '发布中...' : '立即发布' }}
                                </el-button>
                            </div>
                        </el-form>
                    </el-card>
                </div>
            </el-col>

            <el-col :xs="24" :sm="24" :md="10" :lg="9" :xl="8">
                <div class="preview-sticky-wrapper">
                    <div class="preview-header">
                        <div class="header-left">
                            <Icon icon="mdi:cellphone" class="header-icon" />
                            <span class="label">实时预览</span>
                        </div>
                        <el-tag size="small" type="info" effect="plain">{{ currentTime }}</el-tag>
                    </div>

                    <div class="mobile-frame">
                        <div class="notch">
                            <div class="camera"></div>
                            <div class="speaker"></div>
                        </div>
                        <div class="side-btn volume-up"></div>
                        <div class="side-btn volume-down"></div>
                        <div class="side-btn power"></div>

                        <div class="screen-content">
                            <div class="status-bar">
                                <span class="time">{{ currentTime }}</span>
                                <div class="status-icons">
                                    <Icon icon="mdi:signal-cellular-3" />
                                    <Icon icon="mdi:wifi" />
                                    <Icon icon="mdi:battery-80" />
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
                                <transition name="media-slide">
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
                                        </el-carousel>

                                        <div v-else-if="form.postType === POST_TYPE.VIDEO" class="video-preview">
                                            <video :src="previewMediaList[0]" controls></video>
                                        </div>

                                        <div class="indicator-dots" v-if="form.postType === POST_TYPE.IMAGE && previewMediaList.length > 1">
                                            <span v-for="(_, i) in previewMediaList" :key="i" class="dot" :class="{ active: i === 0 }"></span>
                                        </div>
                                    </div>
                                </transition>

                                <div class="content-body">
                                    <transition name="fade">
                                        <h1 class="post-title" v-if="form.content">
                                            {{ form.content.slice(0, 20) }}{{ form.content.length > 20 ? '...' : '' }}
                                        </h1>
                                    </transition>

                                    <p class="post-text" :class="{ placeholder: !form.content }">
                                        {{ form.content || '填写正文内容，记录当下的想法...' }}
                                    </p>

                                    <transition name="tags-slide">
                                        <div class="tags-row" v-if="selectedTagNames.length">
                                            <span v-for="(tag, index) in selectedTagNames" :key="index" class="hash-tag"> #{{ tag.name }} </span>
                                        </div>
                                    </transition>

                                    <div class="meta-row">
                                        <span class="date">刚刚</span>
                                        <span class="location">
                                            <Icon icon="mdi:map-marker-outline" class="location-icon" />
                                            四川 · 成都
                                        </span>
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
                                <div class="input-fake">
                                    <Icon icon="mdi:emoticon-outline" class="emoji-icon" />
                                    <span>说点什么...</span>
                                </div>
                                <div class="action-icons">
                                    <div class="icon-item">
                                        <Icon icon="mdi:heart-outline" />
                                        <span class="count">0</span>
                                    </div>
                                    <div class="icon-item">
                                        <Icon icon="mdi:star-outline" />
                                        <span class="count">0</span>
                                    </div>
                                    <div class="icon-item">
                                        <Icon icon="mdi:comment-outline" />
                                        <span class="count">0</span>
                                    </div>
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
import { ref, reactive, computed, onMounted, watch, getCurrentInstance, onBeforeUnmount, nextTick, shallowRef } from 'vue'
import type { FormInstance } from 'element-plus'
import { addPost } from '@/api/content/post'
import { POST_TYPE } from '@/utils/enum'
import { getInterestAll } from '@/api/content/interest'
import useUserStore from '@/store/modules/user'
import defaultAvatar from '@/assets/images/default-avatar.svg'
import { getImgUrl } from '@/utils/img'

const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()

const initialForm = {
    postType: POST_TYPE.TEXT,
    content: '',
    tagStr: ''
}

const form = reactive({ ...initialForm })

const formRef = ref<FormInstance>()
const imageUploadRef = shallowRef<any>()
const videoUploadRef = shallowRef<any>()
const imageUrls = ref('')
const videoUrls = ref('')
const submitting = ref(false)
const interestTree = ref<any[]>([])
const interestLoading = ref(false)
const selectedTagIds = ref<number[]>([])
const suppressTagValidate = ref(false)
const autoFilledContent = ref<string | null>(null)

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

const normalizeMediaUrls = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map(item => (typeof item === 'string' ? item : String((item as any)?.url || (item as any)?.name || '')))
            .map(item => item.trim())
            .filter(Boolean)
    }
    const text = String(value || '').trim()
    if (!text) return []
    return text
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
}

const imageMediaUrls = computed(() => normalizeMediaUrls(imageUrls.value))
const videoMediaUrls = computed(() => normalizeMediaUrls(videoUrls.value))
const currentMediaUrls = computed(() => {
    if (form.postType === POST_TYPE.IMAGE) return imageMediaUrls.value
    if (form.postType === POST_TYPE.VIDEO) return videoMediaUrls.value
    return []
})
const previewMediaList = computed(() => currentMediaUrls.value.map(url => getImgUrl(url)))

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

const getBaseName = (name: string) => name.replace(/\.[^/.]+$/, '').trim()
const getBaseNameFromMediaUrl = (url: string) => {
    const clean = String(url || '')
        .split('?')[0]
        .split('#')[0]
    const rawName = clean.slice(clean.lastIndexOf('/') + 1)
    if (!rawName) return ''
    let decoded = rawName
    try {
        decoded = decodeURIComponent(rawName)
    } catch {
        decoded = rawName
    }
    const normalized = decoded.replace(/^\d+_\d+_/, '')
    return getBaseName(normalized)
}

const appendVideoTitleToContent = (title: string) => {
    const t = (title || '').trim()
    if (!t) return
    if (form.content && form.content.trim()) return

    form.content = t
    autoFilledContent.value = t
    nextTick(() => formRef.value?.validateField('content'))
}

const rules = {
    postType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
    tagStr: [{ required: true, message: '请至少选择一个话题标签', trigger: 'change' }],
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
                if (form.postType !== POST_TYPE.TEXT && !currentMediaUrls.value.length) callback(new Error('请上传素材文件'))
                else callback()
            },
            trigger: 'change'
        }
    ]
}

const handleTypeChange = async () => {
    imageUrls.value = ''
    videoUrls.value = ''
    imageUploadRef.value?.clear?.()
    videoUploadRef.value?.clear?.()
    autoFilledContent.value = null
    await nextTick()
    formRef.value?.clearValidate()
}

watch(
    () => selectedTagIds.value.slice(),
    ids => {
        const nextTagStr = ids.join(',')
        if (form.tagStr === nextTagStr) return
        form.tagStr = nextTagStr
        if (suppressTagValidate.value) return
        nextTick(() => formRef.value?.validateField('tagStr'))
    }
)

watch(
    () => currentMediaUrls.value.length,
    len => {
        if (form.postType === POST_TYPE.TEXT) return
        if (len > 0) nextTick(() => formRef.value?.clearValidate(['files']))
        else nextTick(() => formRef.value?.validateField('files'))
    }
)

watch(
    () => videoUrls.value,
    (nextVal, prevVal) => {
        if (form.postType !== POST_TYPE.VIDEO) return

        const nextList = normalizeMediaUrls(nextVal)
        const prevSet = new Set(normalizeMediaUrls(prevVal))
        const addedUrl = nextList.find(item => !prevSet.has(item))
        if (addedUrl) {
            const baseName = getBaseNameFromMediaUrl(addedUrl)
            if (baseName) appendVideoTitleToContent(baseName)
        }

        if (!nextList.length) {
            if (autoFilledContent.value && form.content === autoFilledContent.value) {
                form.content = ''
            }
            autoFilledContent.value = null
            nextTick(() => formRef.value?.validateField('content'))
        }
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
    if (autoFilledContent.value && form.content.trim() !== autoFilledContent.value) {
        autoFilledContent.value = null
    }
    if (form.postType === POST_TYPE.TEXT) nextTick(() => formRef.value?.validateField('content'))
    else nextTick(() => formRef.value?.clearValidate(['content']))
}

async function handleSubmit() {
    if (!formRef.value) return

    const ok = await formRef.value.validate().catch(() => false)
    if (!ok) return

    const mediaUrls = currentMediaUrls.value
    if (form.postType !== POST_TYPE.TEXT && mediaUrls.length === 0) {
        proxy?.$modal?.msgError(form.postType === POST_TYPE.IMAGE ? '请至少上传一张图片' : '请上传视频')
        return
    }

    try {
        await proxy?.$modal?.confirm('确认发布该内容吗？')
    } catch {
        return
    }

    submitting.value = true
    try {
        const videoFiles = form.postType === POST_TYPE.VIDEO ? videoUploadRef.value?.getRawFiles?.() || [] : []
        await addPost({
            postType: form.postType,
            content: form.content?.trim() || '',
            mediaUrls,
            files: videoFiles,
            originalPostId: 0,
            tags: form.tagStr,
            circleId: '',
            isQuestion: '0'
        })
        proxy?.$modal?.msgSuccess('发布成功')
        await handleReset()
    } catch (e) {
        console.error(e)
    } finally {
        submitting.value = false
    }
}

async function handleReset() {
    suppressTagValidate.value = true
    imageUrls.value = ''
    videoUrls.value = ''
    imageUploadRef.value?.clear?.()
    videoUploadRef.value?.clear?.()
    selectedTagIds.value = []
    autoFilledContent.value = null

    if (formRef.value?.resetFields) {
        formRef.value.resetFields()
    }

    Object.assign(form, initialForm)

    await nextTick()
    formRef.value?.clearValidate()

    await nextTick()
    suppressTagValidate.value = false
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
        margin-bottom: 28px;

        .title-group {
            h2 {
                font-size: 28px;
                color: var(--el-text-color-primary);
                margin: 0 0 10px 0;
                font-weight: 700;
                letter-spacing: -0.5px;
            }
            p {
                color: var(--el-text-color-secondary);
                margin: 0;
                font-size: 14px;
            }
        }

        .reset-btn {
            font-weight: 500;
            transition: all 0.2s;

            &:hover {
                transform: translateY(-1px);
            }
        }
    }
}

.form-card {
    border-radius: 20px;
    border: none;
    background: var(--el-bg-color);
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.05),
        0 1px 3px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: box-shadow 0.3s;

    &:hover {
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.08),
            0 2px 6px rgba(0, 0, 0, 0.12);
    }

    :deep(.el-card__body) {
        padding: 36px;
    }
}

.post-form {
    :deep(.el-form-item__label) {
        font-weight: 600;
        font-size: 15px;
        color: var(--el-text-color-primary);
        margin-bottom: 12px;
    }

    .highlight-label {
        :deep(.el-form-item__label) {
            position: relative;
            padding-left: 16px;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 20px;
                background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-3));
                border-radius: 2px;
                box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.3);
            }
        }
    }
}

.type-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 8px;

    .type-card {
        border: 2px solid var(--el-border-color-lighter);
        border-radius: 14px;
        padding: 18px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        display: flex;
        align-items: center;
        gap: 14px;
        background: var(--el-fill-color-blank);

        &::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.05), transparent);
            opacity: 0;
            transition: opacity 0.25s;
        }

        &:hover {
            border-color: var(--el-color-primary-light-5);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.12);

            &::before {
                opacity: 1;
            }

            .icon-box {
                transform: scale(1.05);
            }
        }

        &:active {
            transform: translateY(0);
        }

        &.active {
            border-color: var(--el-color-primary);
            background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.08), rgba(var(--el-color-primary-rgb), 0.03));
            box-shadow:
                0 4px 12px rgba(var(--el-color-primary-rgb), 0.15),
                0 0 0 1px rgba(var(--el-color-primary-rgb), 0.1) inset;

            &::before {
                opacity: 0;
            }

            .icon-box {
                background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
                color: var(--el-color-white);
                box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.35);
            }

            .type-name {
                color: var(--el-color-primary);
                font-weight: 700;
            }
        }

        .icon-box {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: var(--el-fill-color-light);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            color: var(--el-text-color-regular);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            flex-shrink: 0;
        }

        .info-box {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;

            .type-name {
                font-size: 15px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                transition: color 0.25s;
            }

            .type-desc {
                font-size: 12px;
                color: var(--el-text-color-secondary);
                line-height: 1.3;
            }
        }

        .check-mark {
            position: absolute;
            top: 10px;
            right: 10px;
            color: var(--el-color-primary);
            font-size: 18px;
            filter: drop-shadow(0 2px 4px rgba(var(--el-color-primary-rgb), 0.3));
        }
    }
}

.check-scale-enter-active,
.check-scale-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.check-scale-enter-from {
    opacity: 0;
    transform: scale(0);
}

.check-scale-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

.custom-textarea {
    :deep(.el-textarea__inner) {
        border-radius: 14px;
        padding: 18px;
        font-size: 15px;
        line-height: 1.7;
        border: 2px solid var(--el-border-color-lighter);
        background-color: var(--el-fill-color-blank);
        color: var(--el-text-color-primary);
        box-shadow: none;
        transition: all 0.3s;

        &::placeholder {
            color: var(--el-text-color-placeholder);
        }

        &:hover {
            border-color: var(--el-border-color);
            background-color: var(--el-bg-color);
        }

        &:focus {
            background-color: var(--el-bg-color);
            border-color: var(--el-color-primary);
            box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);
        }
    }

    :deep(.el-input__count) {
        background: transparent;
        font-size: 12px;
    }
}

.upload-container {
    width: 100%;
    padding: 16px;
    border: 2px solid var(--el-border-color-lighter);
    border-radius: 14px;
    background: var(--el-fill-color-blank);
    transition: all 0.25s ease;

    &.image-mode {
        background: linear-gradient(180deg, rgba(var(--el-color-primary-rgb), 0.03), transparent);
    }

    &.video-mode {
        background: linear-gradient(180deg, rgba(var(--el-color-primary-rgb), 0.04), rgba(var(--el-color-primary-rgb), 0.01));
    }
}

.custom-upload {
    width: 100%;
}

.image-upload {
    :deep(.el-upload--picture-card) {
        width: 120px;
        height: 120px;
        border-radius: 12px;
        border: 2px dashed var(--el-border-color);
        background: var(--el-fill-color-lighter);
        transition: all 0.2s ease;

        &:hover {
            border-color: var(--el-color-primary);
            background: rgba(var(--el-color-primary-rgb), 0.06);
            transform: translateY(-1px);
        }
    }

    :deep(.el-upload-list--picture-card .el-upload-list__item) {
        width: 120px;
        height: 120px;
        border-radius: 12px;
        margin: 0 10px 10px 0;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
    }
}

.video-upload {
    :deep(.upload-file-uploader .el-upload) {
        width: 100%;
    }

    :deep(.upload-file-uploader .el-upload-dragger) {
        height: 190px;
        border: 2px dashed rgba(var(--el-color-primary-rgb), 0.32);
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.05), rgba(var(--el-color-primary-rgb), 0.02));
        transition: all 0.2s ease;

        &:hover {
            border-color: var(--el-color-primary);
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(var(--el-color-primary-rgb), 0.12);
        }

        .el-icon--upload {
            color: var(--el-color-primary);
        }

        .el-upload__text {
            font-size: 14px;
        }
    }

    :deep(.upload-file-list) {
        margin-top: 12px;
    }

    :deep(.upload-file-list .file-item) {
        border-radius: 10px;
        border: 1px solid var(--el-border-color-lighter);
        background: var(--el-fill-color-blank);
    }
}

.upload-hint {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    display: flex;
    flex-direction: column;
    gap: 6px;

    .hint-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 13px;
        line-height: 1.45;
        color: var(--el-text-color-secondary);

        .iconify {
            font-size: 16px;
            color: var(--el-color-primary);
            margin-top: 1px;
            flex-shrink: 0;
        }
    }
}

.custom-select {
    :deep(.el-select__wrapper) {
        border-radius: 14px;
        padding: 12px 16px;
        border: 2px solid var(--el-border-color-lighter);
        box-shadow: none;
        transition: all 0.3s;

        &:hover {
            border-color: var(--el-border-color);
        }

        &.is-focused {
            border-color: var(--el-color-primary);
            box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);
        }
    }

    :deep(.el-select__prefix) {
        color: var(--el-color-primary);
        font-size: 18px;
    }

    :deep(.el-tag) {
        border-radius: 8px;
        padding: 4px 10px;
        font-weight: 500;
    }
}

:deep(.custom-select-popper) {
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border: 1px solid var(--el-border-color-light);

    .el-select-dropdown__item {
        border-radius: 8px;
        margin: 2px 8px;
        padding: 10px 12px;
        transition: all 0.2s;

        &:hover {
            background: rgba(var(--el-color-primary-rgb), 0.08);
        }

        &.is-selected {
            background: rgba(var(--el-color-primary-rgb), 0.12);
            color: var(--el-color-primary);
            font-weight: 600;
        }
    }

    .el-select-group__title {
        font-weight: 600;
        color: var(--el-text-color-primary);
        padding: 10px 16px;
    }
}

.hash-symbol {
    color: var(--el-color-primary);
    font-weight: 600;
    margin-right: 4px;
}

.form-footer {
    margin-top: 48px;
    display: flex;
    justify-content: flex-end;

    .submit-btn {
        padding: 14px 42px;
        border-radius: 14px;
        font-weight: 600;
        font-size: 16px;
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
        border: none;
        box-shadow:
            0 6px 16px rgba(var(--el-color-primary-rgb), 0.3),
            0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            transform: translateY(-2px);
            box-shadow:
                0 10px 24px rgba(var(--el-color-primary-rgb), 0.35),
                0 4px 10px rgba(var(--el-color-primary-rgb), 0.25);
        }

        &:active {
            transform: translateY(0);
        }

        &.is-loading {
            opacity: 0.8;
        }
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
    margin-bottom: 20px;

    .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .header-icon {
            font-size: 20px;
            color: var(--el-color-primary);
        }

        .label {
            font-weight: 600;
            color: var(--el-text-color-primary);
            font-size: 16px;
        }
    }
}

.mobile-frame {
    width: 320px;
    height: 650px;
    background: var(--el-bg-color);
    border-radius: 46px;
    box-shadow:
        0 0 0 2px var(--el-border-color-light),
        0 0 0 10px #1f1f1f,
        0 0 0 12px #0a0a0a,
        0 24px 48px rgba(0, 0, 0, 0.45),
        0 12px 24px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    z-index: 1;
    transition: all 0.3s;

    .notch {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 130px;
        height: 32px;
        background: #0a0a0a;
        border-radius: 0 0 18px 18px;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 20px;

        .camera {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
        }

        .speaker {
            width: 50px;
            height: 5px;
            border-radius: 3px;
            background: #1a1a1a;
        }
    }

    .side-btn {
        position: absolute;
        background: #1f1f1f;
        border: 1px solid #0a0a0a;
    }

    .volume-up {
        width: 3px;
        height: 45px;
        left: -12px;
        top: 125px;
        border-radius: 2px 0 0 2px;
    }

    .volume-down {
        width: 3px;
        height: 45px;
        left: -12px;
        top: 180px;
        border-radius: 2px 0 0 2px;
    }

    .power {
        width: 3px;
        height: 70px;
        right: -12px;
        top: 155px;
        border-radius: 0 2px 2px 0;
    }
}

.screen-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
    transition: all 0.3s;
}

.status-bar {
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 24px 10px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.3px;

    .time {
        color: var(--el-text-color-primary);
    }

    .status-icons {
        display: flex;
        gap: 7px;
        color: var(--el-text-color-primary);
    }
}

.app-nav {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    .nav-icon {
        font-size: 26px;
        color: inherit;
        cursor: pointer;
        transition: all 0.2s;

        &:active {
            opacity: 0.6;
        }
    }

    .user-brief {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
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

    :deep(.el-carousel__arrow) {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);

        &:hover {
            background: rgba(0, 0, 0, 0.7);
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
        background: var(--el-fill-color-darker);
    }

    .indicator-dots {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 7px;
        z-index: 5;

        .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transition: all 0.3s;

            &.active {
                background: var(--el-color-white);
                width: 22px;
                border-radius: 4px;
            }
        }
    }
}

.media-slide-enter-active,
.media-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.media-slide-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.media-slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

.content-body {
    padding: 18px;

    .post-title {
        font-size: 19px;
        font-weight: 700;
        margin: 0 0 10px;
        line-height: 1.4;
        color: var(--el-text-color-primary);
        letter-spacing: -0.2px;
    }

    .post-text {
        font-size: 15px;
        line-height: 1.7;
        color: inherit;
        white-space: pre-wrap;
        margin: 0 0 14px;

        &.placeholder {
            color: var(--el-text-color-placeholder);
            font-style: italic;
        }
    }

    .tags-row {
        margin-bottom: 14px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .hash-tag {
            color: var(--el-color-primary);
            font-size: 14px;
            font-weight: 600;
            padding: 4px 10px;
            background: rgba(var(--el-color-primary-rgb), 0.08);
            border-radius: 8px;
            transition: all 0.2s;

            &:hover {
                background: rgba(var(--el-color-primary-rgb), 0.12);
            }
        }
    }

    .meta-row {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .location {
            display: flex;
            align-items: center;
            gap: 4px;

            .location-icon {
                font-size: 14px;
            }
        }
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}

.tags-slide-enter-active,
.tags-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tags-slide-enter-from {
    opacity: 0;
    transform: translateX(-10px);
}

.tags-slide-leave-to {
    opacity: 0;
    transform: translateX(10px);
}

.mock-divider {
    margin: 10px 0;
    border-color: var(--el-border-color-extra-light);
}

.mock-comments {
    padding: 0 18px 24px;

    .comment-count {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 18px;
        font-weight: 600;
    }

    .empty-comment {
        height: 110px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-placeholder);
        font-size: 14px;
        gap: 10px;

        .iconify {
            font-size: 36px;
            opacity: 0.6;
        }
    }
}

.app-tabbar {
    height: 54px;
    border-top: 1px solid var(--el-border-color-extra-light);
    display: flex;
    align-items: center;
    padding: 0 18px;
    background: var(--el-bg-color);
    transition: all 0.3s;
    gap: 14px;

    .input-fake {
        flex: 1;
        height: 36px;
        background: var(--el-fill-color);
        border-radius: 18px;
        padding: 0 16px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;

        .emoji-icon {
            font-size: 18px;
            color: var(--el-text-color-placeholder);
        }

        &:active {
            background: var(--el-fill-color-dark);
        }
    }

    .action-icons {
        display: flex;
        gap: 18px;
        color: inherit;
        font-size: 24px;

        .icon-item {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            transition: all 0.2s;

            .count {
                font-size: 13px;
                font-weight: 600;
            }

            &:active {
                opacity: 0.6;
                transform: scale(0.95);
            }
        }
    }
}

@media screen and (max-width: 992px) {
    .type-grid {
        grid-template-columns: 1fr;
    }

    .preview-sticky-wrapper {
        position: static;
        margin-top: 40px;
    }

    .form-card :deep(.el-card__body) {
        padding: 24px;
    }
}
</style>
