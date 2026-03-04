<template>
    <div class="edit-section">
        <div class="section-header">
            <div class="title-group">
                <h2>发布新动态</h2>
                <p>分享生活，记录精彩瞬间</p>
            </div>
            <el-button link type="primary" @click="emit('reset')" class="reset-btn">
                <Icon icon="mdi:refresh" class="mr-1" />
                重置内容
            </el-button>
        </div>

        <el-card shadow="never" class="form-card">
            <el-form ref="formRef" :model="props.form" :rules="props.rules" label-position="top" class="post-form">
                <el-form-item label="选择发布类型" prop="postType" class="type-form-item">
                    <div class="type-grid">
                        <div
                            v-for="type in typeOptions"
                            :key="type.label"
                            class="type-card"
                            :class="{ active: props.form.postType === type.label }"
                            @click="emit('change-post-type', type.label)"
                        >
                            <div class="icon-box">
                                <Icon :icon="type.icon" />
                            </div>
                            <div class="info-box">
                                <span class="type-name">{{ type.text }}</span>
                                <span class="type-desc">{{ type.desc }}</span>
                            </div>
                            <transition name="check-scale">
                                <div class="check-mark" v-if="props.form.postType === type.label">
                                    <Icon icon="mdi:check-circle" />
                                </div>
                            </transition>
                        </div>
                    </div>
                    <el-radio-group v-model="props.form.postType" v-show="false"></el-radio-group>
                </el-form-item>

                <el-form-item v-if="!isBatchVideoMode" label="正文内容" prop="content" class="highlight-label">
                    <div class="input-wrapper">
                        <el-input
                            v-model="props.form.content"
                            type="textarea"
                            :rows="8"
                            placeholder="写点什么吧..."
                            maxlength="2000"
                            show-word-limit
                            resize="none"
                            @input="emit('content-input')"
                            class="custom-textarea"
                        />
                    </div>
                </el-form-item>

                <transition name="el-zoom-in-top">
                    <el-form-item
                        v-if="props.form.postType !== POST_TYPE.TEXT"
                        :label="props.form.postType === POST_TYPE.IMAGE ? '上传图片' : '上传视频'"
                        prop="files"
                        class="highlight-label"
                    >
                        <div
                            class="upload-container"
                            :class="{
                                'image-mode': props.form.postType === POST_TYPE.IMAGE,
                                'video-mode': props.form.postType === POST_TYPE.VIDEO
                            }"
                        >
                            <template v-if="props.form.postType === POST_TYPE.IMAGE">
                                <ImageUpload
                                    ref="imageUploadRef"
                                    v-model="imageUrlsModel"
                                    :limit="9"
                                    :drag="true"
                                    :upload-drag="false"
                                    :sort-assist-mode="true"
                                    :file-size="10"
                                    :file-type="['jpg', 'jpeg', 'png', 'gif']"
                                    :is-show-tip="false"
                                    oss-type="posts"
                                    :oss-post-type="POST_TYPE.IMAGE"
                                    class="custom-upload image-upload"
                                    @uploading-change="handleImageUploadingChange"
                                />
                            </template>

                            <template v-else>
                                <FileUpload
                                    ref="videoUploadRef"
                                    v-model="videoUrlsModel"
                                    :limit="1"
                                    :hide-when-reach-limit="true"
                                    :file-size="0"
                                    :file-type="['mp4', 'mov']"
                                    :is-show-tip="false"
                                    oss-type="posts"
                                    :oss-post-type="POST_TYPE.VIDEO"
                                    :sortable="false"
                                    class="custom-upload video-upload"
                                    @uploading-change="handleVideoUploadingChange"
                                />
                                <div class="video-cover-picker" v-if="hasSingleVideoUploaded">
                                    <div class="cover-picker-header">
                                        <span class="cover-picker-title">视频封面</span>
                                        <el-button link type="primary" :disabled="capturingCover || !videoCoverSourceUrl" @click="captureCurrentFrame">
                                            {{ selectedCoverFile ? '重新截取当前帧' : '使用当前帧作为封面' }}
                                        </el-button>
                                    </div>
                                    <video
                                        ref="videoCoverRef"
                                        :src="videoCoverSourceUrl"
                                        class="cover-picker-video"
                                        controls
                                        preload="metadata"
                                        controlslist="nodownload noplaybackrate"
                                        disablepictureinpicture
                                        @contextmenu.prevent
                                    ></video>
                                    <div class="cover-picked" v-if="selectedCoverPreviewUrl">
                                        <img :src="selectedCoverPreviewUrl" alt="封面预览" class="cover-thumb" />
                                        <div class="cover-picked-meta">
                                            <span>已选择该帧作为封面</span>
                                            <el-button link type="primary" @click="clearSelectedCover">取消封面</el-button>
                                        </div>
                                    </div>
                                </div>
                                <div class="video-cover-batch-tip" v-else-if="hasVideoUploaded">已选择多个视频，发布时将为每条视频自动生成封面</div>
                            </template>
                        </div>
                    </el-form-item>
                </transition>

                <el-form-item v-if="isBatchVideoMode" label="逐条填写正文" class="highlight-label video-batch-form-item">
                    <div class="video-batch-editor">
                        <div
                            v-for="item in videoBatchItems"
                            :key="item.key"
                            class="video-batch-item"
                            :class="{
                                'is-error': videoBatchErrorSet.has(item.index) || videoBatchTagErrorSet.has(item.index),
                                'is-active': item.index === safeBatchPreviewIndex
                            }"
                            @click="setBatchPreviewIndex(item.index)"
                        >
                            <div class="video-batch-item-header">
                                <span class="video-batch-index">视频 {{ item.index + 1 }}</span>
                                <div class="video-batch-head-right">
                                    <span class="video-batch-name">{{ item.name }}</span>
                                    <el-tag v-if="item.index === safeBatchPreviewIndex" size="small" type="primary" effect="dark" class="status-tag"
                                        >预览中</el-tag
                                    >
                                </div>
                            </div>
                            <el-input
                                :model-value="videoBatchContentsModel[item.index] || ''"
                                type="textarea"
                                :rows="4"
                                maxlength="2000"
                                show-word-limit
                                resize="none"
                                placeholder="请输入该视频对应的正文内容..."
                                class="video-batch-textarea"
                                @update:model-value="onVideoBatchContentChange(item.index, $event)"
                            />
                            <div v-if="videoBatchErrorSet.has(item.index)" class="video-batch-error-text">请填写该视频的正文内容</div>
                            <div class="video-batch-tags" :class="{ 'is-error': videoBatchTagErrorSet.has(item.index) }">
                                <el-select
                                    :model-value="getVideoBatchTagIds(item.index)"
                                    multiple
                                    filterable
                                    placeholder="请选择该视频的话题标签"
                                    style="width: 100%"
                                    clearable
                                    :loading="props.interestLoading"
                                    class="video-batch-tag-select"
                                    popper-class="custom-select-popper custom-select-popper--batch"
                                    @update:model-value="onVideoBatchTagChange(item.index, $event)"
                                >
                                    <template #prefix>
                                        <Icon icon="mdi:pound" />
                                    </template>
                                    <template v-for="cate in props.interestTree" :key="`${item.index}-${cate.id}`">
                                        <el-option-group v-if="cate.children?.length" :label="cate.name">
                                            <el-option v-for="child in cate.children" :key="`${item.index}-${child.id}`" :label="child.name" :value="child.id">
                                                <span class="option-tag-pill" :style="resolveOptionTagStyle(child, 'batch')">
                                                    {{ child.name }}
                                                </span>
                                            </el-option>
                                        </el-option-group>
                                    </template>
                                </el-select>
                                <div v-if="videoBatchTagErrorSet.has(item.index)" class="video-batch-error-text">请为该视频选择至少一个标签</div>
                            </div>
                        </div>
                    </div>
                </el-form-item>

                <el-form-item v-if="!isBatchVideoMode" label="添加话题标签" prop="tagStr">
                    <el-select
                        v-model="selectedTagIdsModel"
                        multiple
                        filterable
                        placeholder="请选择话题标签 (必选)"
                        style="width: 100%"
                        clearable
                        :loading="props.interestLoading"
                        class="custom-select"
                        popper-class="custom-select-popper custom-select-popper--normal"
                    >
                        <template #prefix>
                            <Icon icon="mdi:pound" />
                        </template>
                        <template v-for="cate in props.interestTree" :key="cate.id">
                            <el-option-group v-if="cate.children?.length" :label="cate.name">
                                <el-option v-for="child in cate.children" :key="child.id" :label="child.name" :value="child.id">
                                    <span class="option-tag-pill" :style="resolveOptionTagStyle(child, 'normal')">
                                        {{ child.name }}
                                    </span>
                                </el-option>
                            </el-option-group>
                        </template>
                    </el-select>
                </el-form-item>

                <div class="form-footer">
                    <el-button
                        type="primary"
                        size="large"
                        :loading="props.submitting"
                        :disabled="props.submitting || isUploading"
                        @click="emit('submit')"
                        class="submit-btn"
                    >
                        <Icon icon="mdi:send-outline" class="mr-2 text-[18px]" />
                        {{ props.submitting ? '发布中...' : '立即发布' }}
                    </el-button>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { POST_TYPE } from '@/utils/enum'
import { getImgUrl } from '@/utils/img'
import { resolveOptionTagStyle } from '@/utils/content/tagOptionStyle'

interface PostFormState {
    postType: string
    content: string
    tagStr: string
}

interface TypeOption {
    label: string
    icon: string
    text: string
    desc: string
}

const props = defineProps<{
    form: PostFormState
    rules: FormRules
    imageUrls: string
    videoUrls: string
    videoBatchContents: string[]
    videoBatchErrorIndexes: number[]
    videoBatchTagIds: Array<Array<number | string>>
    videoBatchTagErrorIndexes: number[]
    batchPreviewIndex: number
    selectedTagIds: Array<number | string>
    interestTree: any[]
    interestLoading: boolean
    submitting: boolean
}>()

const emit = defineEmits<{
    (e: 'update:imageUrls', value: string): void
    (e: 'update:videoUrls', value: string): void
    (e: 'update:videoBatchContents', value: string[]): void
    (e: 'update:videoBatchTagIds', value: Array<Array<number | string>>): void
    (e: 'update:batchPreviewIndex', value: number): void
    (e: 'update:selectedTagIds', value: Array<number | string>): void
    (e: 'video-cover-change', value: string): void
    (e: 'change-post-type', value: string): void
    (e: 'content-input'): void
    (e: 'submit'): void
    (e: 'reset'): void
}>()

const typeOptions: TypeOption[] = [
    { label: POST_TYPE.TEXT, icon: 'mdi:format-text', text: '纯文字', desc: '记录心情与想法' },
    { label: POST_TYPE.IMAGE, icon: 'mdi:image-outline', text: '图文', desc: '分享美好图片' },
    { label: POST_TYPE.VIDEO, icon: 'mdi:video-outline', text: '视频', desc: '记录动态影像' }
]

const { proxy } = getCurrentInstance() || {}
const formRef = ref<FormInstance>()
const imageUploadRef = shallowRef<any>()
const videoUploadRef = shallowRef<any>()
const imageUploading = ref(false)
const videoUploading = ref(false)
const videoCoverRef = ref<HTMLVideoElement>()
const videoCoverSourceUrl = ref('')
const selectedCoverFile = ref<File | null>(null)
const selectedCoverPreviewUrl = ref('')
const capturingCover = ref(false)
let videoCoverObjectUrl = ''
let selectedCoverPreviewObjectUrl = ''

const imageUrlsModel = computed({
    get: () => props.imageUrls,
    set: value => emit('update:imageUrls', value)
})

const videoUrlsModel = computed({
    get: () => props.videoUrls,
    set: value => emit('update:videoUrls', value)
})

const selectedTagIdsModel = computed({
    get: () => props.selectedTagIds,
    set: value => emit('update:selectedTagIds', value)
})

const videoBatchContentsModel = computed({
    get: () => (Array.isArray(props.videoBatchContents) ? props.videoBatchContents : []),
    set: value => emit('update:videoBatchContents', Array.isArray(value) ? value : [])
})

const videoBatchTagIdsModel = computed({
    get: () => (Array.isArray(props.videoBatchTagIds) ? props.videoBatchTagIds : []),
    set: value => emit('update:videoBatchTagIds', Array.isArray(value) ? value : [])
})

const videoUrlList = computed(() => parseVideoUrlList(props.videoUrls))
const imageMediaCount = computed(() => parseVideoUrlList(props.imageUrls).length)
const isBatchVideoMode = computed(() => props.form.postType === POST_TYPE.VIDEO && videoUrlList.value.length > 1)
const videoBatchErrorSet = computed(() => new Set((props.videoBatchErrorIndexes || []).map(index => Number(index))))
const videoBatchTagErrorSet = computed(() => new Set((props.videoBatchTagErrorIndexes || []).map(index => Number(index))))
const safeBatchPreviewIndex = computed(() => {
    const maxIndex = Math.max(videoUrlList.value.length - 1, 0)
    const raw = Number(props.batchPreviewIndex || 0)
    if (!Number.isFinite(raw)) return 0
    if (raw < 0) return 0
    if (raw > maxIndex) return maxIndex
    return raw
})

const hasVideoUploaded = computed(() => {
    return videoUrlList.value.length > 0
})

const hasSingleVideoUploaded = computed(() => videoUrlList.value.length === 1)

const videoBatchItems = computed(() =>
    videoUrlList.value.map((url, index) => ({
        key: `${index}-${url}`,
        index,
        name: resolveVideoDisplayName(url, index)
    }))
)

const isUploading = computed(() => imageUploading.value || videoUploading.value)

function parseVideoUrlList(value: unknown): string[] {
    const text = String(value || '').trim()
    if (!text) return []
    return text
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
}

function resolveVideoNameFromUrl(url: string): string {
    const clean = String(url || '')
        .split('?')[0]
        .split('#')[0]
    const raw = clean.slice(clean.lastIndexOf('/') + 1)
    if (!raw) return ''
    try {
        return decodeURIComponent(raw)
    } catch {
        return raw
    }
}

function resolveVideoDisplayName(url: string, index: number): string {
    const rawFile = getVideoRawFiles()[index]
    if (rawFile instanceof File && String(rawFile.name || '').trim()) return rawFile.name
    const nameFromUrl = resolveVideoNameFromUrl(url)
    if (nameFromUrl) return nameFromUrl
    return `视频 ${index + 1}`
}

function updateVideoBatchContent(index: number, value: string): void {
    const next = [...videoBatchContentsModel.value]
    next[index] = String(value || '')
    videoBatchContentsModel.value = next
}

function onVideoBatchContentChange(index: number, value: string | number | null | undefined): void {
    updateVideoBatchContent(index, String(value || ''))
}

function getVideoBatchTagIds(index: number): Array<number | string> {
    const value = videoBatchTagIdsModel.value[index]
    if (!Array.isArray(value)) return []
    return value
}

function updateVideoBatchTagIds(index: number, value: Array<number | string>): void {
    const next = [...videoBatchTagIdsModel.value]
    next[index] = Array.isArray(value) ? value : []
    videoBatchTagIdsModel.value = next
}

function onVideoBatchTagChange(index: number, value: unknown): void {
    updateVideoBatchTagIds(index, Array.isArray(value) ? (value as Array<number | string>) : [])
}

function setBatchPreviewIndex(index: number): void {
    emit('update:batchPreviewIndex', Math.max(0, Number(index) || 0))
}

const revokeVideoCoverSourceObjectUrl = () => {
    if (!videoCoverObjectUrl) return
    URL.revokeObjectURL(videoCoverObjectUrl)
    videoCoverObjectUrl = ''
}

const revokeSelectedCoverPreviewObjectUrl = () => {
    if (!selectedCoverPreviewObjectUrl) return
    URL.revokeObjectURL(selectedCoverPreviewObjectUrl)
    selectedCoverPreviewObjectUrl = ''
}

const clearSelectedCover = () => {
    selectedCoverFile.value = null
    selectedCoverPreviewUrl.value = ''
    revokeSelectedCoverPreviewObjectUrl()
}

const syncVideoCoverSource = () => {
    revokeVideoCoverSourceObjectUrl()
    if (!hasSingleVideoUploaded.value) {
        videoCoverSourceUrl.value = ''
        return
    }
    const rawFile = getVideoRawFiles()[0]
    if (rawFile instanceof File) {
        videoCoverObjectUrl = URL.createObjectURL(rawFile)
        videoCoverSourceUrl.value = videoCoverObjectUrl
        return
    }

    const firstVideoUrl = videoUrlList.value[0] || ''
    videoCoverSourceUrl.value = firstVideoUrl ? getImgUrl(firstVideoUrl) : ''
}

watch(
    () => [props.form.postType, String(props.videoUrls || '')] as const,
    async ([nextPostType, nextVideoUrls], prevValues) => {
        const [prevPostType, prevVideoUrls] = prevValues || ['', '']
        if (nextPostType !== POST_TYPE.VIDEO) {
            clearSelectedCover()
            videoCoverSourceUrl.value = ''
            revokeVideoCoverSourceObjectUrl()
            return
        }

        if (nextPostType !== prevPostType || nextVideoUrls !== prevVideoUrls) {
            clearSelectedCover()
            await nextTick()
            syncVideoCoverSource()
        }
    },
    { immediate: true }
)

watch(
    () => selectedCoverPreviewUrl.value,
    value => {
        emit('video-cover-change', String(value || ''))
    },
    { immediate: true }
)

function handleImageUploadingChange(value: boolean) {
    imageUploading.value = Boolean(value)
}

function handleVideoUploadingChange(value: boolean) {
    videoUploading.value = Boolean(value)
}

async function captureCurrentFrame() {
    const video = videoCoverRef.value
    if (!video || !videoCoverSourceUrl.value) {
        proxy?.$modal?.msgWarning?.('请先上传视频')
        return
    }
    if (video.readyState < 2) {
        proxy?.$modal?.msgWarning?.('视频加载中，请稍后再试')
        return
    }

    capturingCover.value = true
    try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 720
        canvas.height = video.videoHeight || 1280
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('无法创建封面画布')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                value => {
                    if (!value) {
                        reject(new Error('封面生成失败'))
                        return
                    }
                    resolve(value)
                },
                'image/jpeg',
                0.92
            )
        })

        const coverFile = new File([blob], `video-cover-${Date.now()}.jpg`, { type: 'image/jpeg' })
        selectedCoverFile.value = coverFile
        revokeSelectedCoverPreviewObjectUrl()
        selectedCoverPreviewObjectUrl = URL.createObjectURL(coverFile)
        selectedCoverPreviewUrl.value = selectedCoverPreviewObjectUrl
        proxy?.$modal?.msgSuccess?.('已选择当前帧作为封面')
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('封面截取失败，请重试')
    } finally {
        capturingCover.value = false
    }
}

async function validateForm(): Promise<boolean> {
    if (!formRef.value) return false
    const result = await formRef.value.validate().catch(() => false)
    return Boolean(result)
}

function validateField(field: string): void {
    formRef.value?.validateField(field as any)
}

function clearValidate(fields?: string | string[]): void {
    formRef.value?.clearValidate(fields as any)
}

function resetFields(): void {
    formRef.value?.resetFields()
}

function clearUploaders(): void {
    imageUploadRef.value?.clear?.()
    videoUploadRef.value?.clear?.()
    imageUploading.value = false
    videoUploading.value = false
    clearSelectedCover()
    videoCoverSourceUrl.value = ''
    revokeVideoCoverSourceObjectUrl()
}

function getVideoRawFiles(): File[] {
    return (videoUploadRef.value?.getRawFiles?.() || []) as File[]
}

function getVideoCoverFile(): File | null {
    return selectedCoverFile.value
}

function isAnyUploading(): boolean {
    return isUploading.value
}

onBeforeUnmount(() => {
    revokeVideoCoverSourceObjectUrl()
    revokeSelectedCoverPreviewObjectUrl()
})

defineExpose({
    validateForm,
    validateField,
    clearValidate,
    resetFields,
    clearUploaders,
    getVideoRawFiles,
    getVideoCoverFile,
    isUploading: isAnyUploading
})
</script>

<style lang="scss" scoped>
.edit-section {
    max-width: 800px;
    margin: 0 auto;
    overflow-x: hidden;

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 24px;
        padding: 0 4px;

        .title-group {
            h2 {
                font-size: 26px;
                background: linear-gradient(135deg, var(--el-text-color-primary) 0%, var(--el-text-color-regular) 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0 0 6px 0;
                font-weight: 800;
                letter-spacing: -0.5px;
            }
            p {
                color: var(--el-text-color-secondary);
                margin: 0;
                font-size: 14px;
                opacity: 0.8;
            }
        }

        .reset-btn {
            font-weight: 500;
            color: var(--el-text-color-regular);
            transition: all 0.2s;
            font-size: 13px;

            &:hover {
                color: var(--el-color-primary);
            }
        }
    }
}

.form-card {
    border-radius: 20px;
    border: 1px solid var(--el-border-color-lighter);
    background: color-mix(in srgb, var(--el-bg-color-overlay) 88%, transparent);
    backdrop-filter: blur(20px);
    box-shadow:
        0 4px 6px -1px color-mix(in srgb, var(--el-color-black) 2%, transparent),
        0 2px 4px -1px color-mix(in srgb, var(--el-color-black) 2%, transparent),
        0 20px 40px -8px color-mix(in srgb, var(--el-color-black) 4%, transparent);
    overflow: visible;

    :deep(.el-card__body) {
        padding: 40px;
    }
}

.post-form {
    :deep(.el-form-item__label) {
        font-weight: 600;
        font-size: 14px;
        color: var(--el-text-color-primary);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
    }

    .highlight-label {
        :deep(.el-form-item__label) {
            font-size: 15px;
        }
    }
}

.type-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    width: 100%;

    .type-card {
        border-radius: 16px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 10px;
        background: var(--el-fill-color-light);
        border: 2px solid transparent;
        overflow: hidden;

        &:hover {
            background: var(--el-fill-color);
            transform: translateY(-2px);
        }

        &.active {
            background: var(--el-color-primary-light-9);
            border-color: var(--el-color-primary);
            box-shadow: 0 8px 16px rgba(var(--el-color-primary-rgb), 0.15);

            .icon-box {
                background: var(--el-color-primary);
                color: var(--el-color-white);
                transform: scale(1.1);
                box-shadow: 0 4px 10px rgba(var(--el-color-primary-rgb), 0.3);
            }

            .type-name {
                color: var(--el-color-primary);
            }
        }

        .icon-box {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            background: var(--el-bg-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: var(--el-text-color-regular);
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-black) 4%, transparent);
        }

        .info-box {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .type-name {
                font-size: 15px;
                font-weight: 700;
                color: var(--el-text-color-primary);
            }

            .type-desc {
                font-size: 12px;
                color: var(--el-text-color-placeholder);
            }
        }

        .check-mark {
            position: absolute;
            top: 8px;
            right: 8px;
            color: var(--el-color-primary);
            font-size: 18px;
        }
    }
}

.check-scale-enter-active,
.check-scale-leave-active {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.check-scale-enter-from,
.check-scale-leave-to {
    opacity: 0;
    transform: scale(0);
}

.custom-textarea {
    :deep(.el-textarea__inner) {
        border-radius: 16px;
        padding: 20px;
        font-size: 15px;
        line-height: 1.6;
        border: none;
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
        box-shadow: inset 0 2px 4px color-mix(in srgb, var(--el-color-black) 2%, transparent);
        transition: all 0.3s;

        &::placeholder {
            color: var(--el-text-color-placeholder);
        }

        &:hover {
            background-color: var(--el-fill-color);
        }

        &:focus {
            background-color: var(--el-bg-color);
            box-shadow:
                0 0 0 2px var(--el-color-primary),
                0 4px 12px rgba(var(--el-color-primary-rgb), 0.1);
        }
    }

    :deep(.el-input__count) {
        background: transparent;
        font-size: 12px;
        bottom: 12px;
        right: 16px;
        opacity: 0.6;
    }
}

.post-form :deep(.el-form-item.is-error .custom-textarea .el-textarea__inner),
.post-form :deep(.el-form-item.is-error .custom-textarea .el-textarea__inner:focus) {
    box-shadow:
        0 0 0 2px var(--el-color-danger),
        0 4px 12px rgba(var(--el-color-danger-rgb), 0.1);
    background-color: var(--el-bg-color);
}

.upload-container {
    width: 100%;
    padding: 20px;
    border: 2px dashed var(--el-border-color);
    border-radius: 16px;
    background: var(--el-fill-color-lighter);
    transition: all 0.3s ease;
    text-align: center;

    &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-fill-color-light);
    }

    &.image-mode {
        background: radial-gradient(circle at center, var(--el-fill-color-light) 0%, transparent 100%);
    }

    &.video-mode {
        background: radial-gradient(circle at center, rgba(var(--el-color-primary-rgb), 0.02) 0%, transparent 100%);
    }
}

.post-form :deep(.el-form-item.is-error .upload-container) {
    border-color: var(--el-color-danger);
    background-color: var(--el-color-danger-light-9);
}

.image-upload {
    :deep(.el-upload--picture-card) {
        width: 110px;
        height: 110px;
        border-radius: 16px;
        border: none;
        background: var(--el-bg-color-overlay);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 5%, transparent);
        transition: all 0.2s;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.15);
            color: var(--el-color-primary);
        }
    }

    :deep(.el-upload-list--picture-card .el-upload-list__item) {
        width: 110px;
        height: 110px;
        border-radius: 16px;
        border: none;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 8%, transparent);
    }
}

.video-upload {
    :deep(.upload-file-uploader .el-upload-dragger) {
        height: 200px;
        border: none;
        border-radius: 16px;
        background: var(--el-bg-color-overlay);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 4%, transparent);
        display: flex;
        flex-direction: column;
        justify-content: center;
        transition: all 0.3s;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(var(--el-color-primary-rgb), 0.15);
            background: var(--el-color-primary-light-9);
        }

        .el-icon--upload {
            font-size: 56px;
            color: var(--el-color-primary);
            margin-bottom: 12px;
            filter: drop-shadow(0 4px 6px rgba(var(--el-color-primary-rgb), 0.2));
        }

        .el-upload__text {
            font-size: 15px;
            color: var(--el-text-color-regular);
            em {
                color: var(--el-color-primary);
                font-style: normal;
                font-weight: 600;
            }
        }
    }

    :deep(.upload-file-list .file-item) {
        border-radius: 12px;
        background: var(--el-bg-color-overlay);
        border: 1px solid var(--el-border-color-lighter);
        box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-black) 2%, transparent);
    }
}

.video-cover-picker {
    margin-top: 16px;
    border-radius: 16px;
    padding: 16px;
    background: var(--el-bg-color-overlay);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-black) 4%, transparent);
    border: 1px solid var(--el-border-color-lighter);

    .cover-picker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .cover-picker-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--el-text-color-primary);
        }
    }

    .cover-picker-video {
        width: 100%;
        max-height: 260px;
        border-radius: 12px;
        background: var(--el-color-black);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-black) 10%, transparent);
    }

    .cover-picked {
        margin-top: 16px;
        padding: 12px;
        background: var(--el-fill-color-lighter);
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 16px;

        .cover-thumb {
            width: 90px;
            height: 90px;
            border-radius: 10px;
            object-fit: cover;
            border: 2px solid var(--el-bg-color-overlay);
            box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 10%, transparent);
        }

        .cover-picked-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            font-size: 13px;
            color: var(--el-text-color-regular);
        }
    }
}

.video-cover-batch-tip {
    margin-top: 16px;
    padding: 12px 16px;
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning-dark-2);
    border-radius: 12px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
        content: '';
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
    }
}

.video-batch-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.video-batch-item {
    border-radius: 16px;
    padding: 20px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 20px;
        bottom: 20px;
        width: 4px;
        background: var(--el-color-primary);
        border-radius: 0 4px 4px 0;
        opacity: 0;
        transition: opacity 0.3s;
    }

    &:hover {
        border-color: var(--el-border-color);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-black) 5%, transparent);
    }

    &.is-active {
        background: var(--el-bg-color-overlay);
        border-color: var(--el-color-primary-light-5);
        box-shadow: 0 8px 24px rgba(var(--el-color-primary-rgb), 0.08);

        &::before {
            opacity: 1;
        }
    }

    &.is-error {
        border-color: var(--el-color-danger-light-5);
        background: var(--el-color-danger-light-9);
    }
}

.video-batch-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .video-batch-index {
        font-size: 13px;
        font-weight: 700;
        color: var(--el-text-color-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .video-batch-head-right {
        display: flex;
        align-items: center;
        gap: 10px;

        .video-batch-name {
            font-size: 13px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .status-tag {
            border-radius: 6px;
            font-weight: 600;
        }
    }
}

.video-batch-textarea {
    :deep(.el-textarea__inner) {
        border-radius: 12px;
        background-color: var(--el-fill-color-light);
        border: 1px solid transparent;
        transition: all 0.2s;

        &:focus {
            background-color: var(--el-bg-color-overlay);
            box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
        }
    }
}

.video-batch-tags {
    margin-top: 12px;
}

.custom-select {
    :deep(.el-select__wrapper) {
        border-radius: 12px;
        padding: 8px 16px;
        min-height: 44px;
        background-color: var(--el-fill-color-light);
        box-shadow: none;
        transition: all 0.2s;

        &:hover {
            background-color: var(--el-fill-color);
        }

        &.is-focused {
            background-color: var(--el-bg-color-overlay);
            box-shadow: 0 0 0 2px var(--el-color-primary);
        }
    }

    :deep(.el-select__prefix) {
        color: var(--el-text-color-placeholder);
        font-size: 18px;
    }

    :deep(.el-tag) {
        border-radius: 6px;
        background-color: var(--el-bg-color-overlay);
        border-color: var(--el-border-color-lighter);
        color: var(--el-text-color-primary);
        box-shadow: 0 1px 2px color-mix(in srgb, var(--el-color-black) 5%, transparent);
    }
}

.video-batch-tag-select {
    :deep(.el-select__wrapper) {
        border-radius: 12px;
        padding: 8px 16px;
        min-height: 44px;
        background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-fill-color-light));
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
        transition: all 0.2s;

        &:hover {
            background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-fill-color));
        }

        &.is-focused {
            background-color: var(--el-bg-color-overlay);
            box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
        }
    }

    :deep(.el-select__prefix) {
        color: color-mix(in srgb, var(--el-color-primary) 72%, var(--el-text-color-secondary));
        font-size: 18px;
    }

    :deep(.el-tag) {
        border-radius: 6px;
        background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color-overlay));
        border-color: color-mix(in srgb, var(--el-color-primary) 40%, var(--el-border-color));
        color: var(--el-color-primary);
        box-shadow: none;
    }
}

:deep(.custom-select-popper) {
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 12px 32px color-mix(in srgb, var(--el-color-black) 12%, transparent);
    border: 1px solid var(--el-border-color-lighter);

    .el-select-group__wrap {
        padding-bottom: 8px;

        &:not(:last-of-type) {
            padding-bottom: 12px;
            border-bottom: 1px dashed var(--el-border-color-lighter);
        }
    }

    .el-select-group__title {
        font-size: 12px;
        font-weight: 700;
        color: var(--el-text-color-placeholder);
        padding: 8px 12px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }

    .el-select-dropdown__item {
        height: auto;
        min-height: 44px;
        padding: 6px 8px;
        border-radius: 0;
        margin: 2px 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        background-color: transparent;

        .option-tag-pill {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            padding: 5px 12px;
            border-radius: 0 !important;
            background: var(--tag-pill-bg, var(--el-fill-color-light));
            color: var(--tag-pill-text, var(--el-text-color-regular));
            border: 1px solid var(--tag-pill-border, transparent);
            font-size: 13px;
            font-weight: 500;
            line-height: 1.2;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        &:hover,
        &.hover {
            background-color: var(--el-fill-color-light);

            .option-tag-pill {
                background: var(--tag-pill-bg-hover, var(--el-color-primary-light-9));
                color: var(--tag-pill-text-hover, var(--el-color-primary));
                border-color: var(--tag-pill-border-hover, transparent);
                transform: translateX(2px);
            }
        }

        &.is-selected {
            background-color: transparent;

            .option-tag-pill {
                background: var(--tag-pill-bg-selected, var(--el-color-primary));
                color: var(--tag-pill-text-selected, var(--el-color-white));
                border-color: var(--tag-pill-border-selected, var(--el-color-primary));
                box-shadow: 0 3px 10px rgba(var(--el-color-primary-rgb), 0.22);
            }

            &::after {
                display: none;
            }
        }
    }
}

:deep(.custom-select-popper--batch) {
    .el-select-dropdown__item {
        .option-tag-pill {
            border: 1px dashed var(--el-border-color);
            background-color: transparent;
        }

        &:hover,
        &.hover {
            .option-tag-pill {
                border-style: solid;
                border-color: var(--el-color-primary-light-5);
                background-color: var(--el-color-primary-light-9);
            }
        }

        &.is-selected {
            .option-tag-pill {
                border-style: solid;
                border-color: var(--el-color-primary);
                background-color: var(--el-color-primary);
                color: var(--el-color-white);
            }
        }
    }
}

.post-form :deep(.el-form-item.is-error .custom-select .el-select__wrapper),
.post-form :deep(.el-form-item.is-error .custom-select .el-select__wrapper:hover),
.post-form :deep(.el-form-item.is-error .custom-select .el-select__wrapper.is-focused) {
    box-shadow: 0 0 0 2px var(--el-color-danger);
    background-color: var(--el-bg-color-overlay);
}

.video-batch-tags.is-error .video-batch-tag-select {
    :deep(.el-select__wrapper),
    :deep(.el-select__wrapper:hover),
    :deep(.el-select__wrapper.is-focused) {
        box-shadow: 0 0 0 2px var(--el-color-danger);
        background-color: var(--el-bg-color-overlay);
    }
}

:global(html.dark) .edit-section {
    .form-card {
        border-color: var(--el-border-color);
        box-shadow:
            0 8px 20px -10px color-mix(in srgb, var(--el-color-black) 70%, transparent),
            0 20px 40px -24px color-mix(in srgb, var(--el-color-black) 78%, transparent);
    }

    .type-grid .type-card {
        background: var(--el-fill-color-dark);
        border-color: color-mix(in srgb, var(--el-border-color) 70%, transparent);

        &:hover {
            background: var(--el-fill-color-darker);
        }

        &.active {
            background: color-mix(in srgb, var(--el-color-primary) 20%, var(--el-fill-color-dark));
            border-color: color-mix(in srgb, var(--el-color-primary) 80%, var(--el-border-color));
            box-shadow: 0 10px 22px -8px color-mix(in srgb, var(--el-color-primary) 45%, transparent);

            .type-name {
                color: var(--el-color-primary-light-3);
            }
        }
    }

    .custom-textarea :deep(.el-textarea__inner),
    .upload-container,
    .video-cover-picker,
    .video-batch-item,
    .video-batch-textarea :deep(.el-textarea__inner),
    .image-upload :deep(.el-upload--picture-card),
    .video-upload :deep(.upload-file-uploader .el-upload-dragger),
    .video-upload :deep(.upload-file-list .file-item) {
        background-color: var(--el-fill-color-dark);
    }

    .custom-textarea :deep(.el-textarea__inner:hover),
    .upload-container:hover,
    .video-batch-textarea :deep(.el-textarea__inner:focus) {
        background-color: var(--el-fill-color-darker);
    }

    .video-upload :deep(.upload-file-uploader .el-upload-dragger:hover) {
        background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-fill-color-darker));
    }

    .custom-select :deep(.el-select__wrapper) {
        background-color: var(--el-fill-color-dark);
        box-shadow: none;
    }

    .custom-select :deep(.el-select__wrapper:hover),
    .custom-select :deep(.el-select__wrapper.is-focused) {
        background-color: var(--el-fill-color-darker);
    }

    .video-batch-tag-select :deep(.el-select__wrapper) {
        background: color-mix(in srgb, var(--el-color-primary) 16%, var(--el-fill-color-dark));
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 50%, transparent);
    }

    .video-batch-tag-select :deep(.el-select__wrapper:hover),
    .video-batch-tag-select :deep(.el-select__wrapper.is-focused) {
        background: color-mix(in srgb, var(--el-color-primary) 22%, var(--el-fill-color-darker));
    }

    .video-batch-tag-select :deep(.el-tag) {
        background: color-mix(in srgb, var(--el-color-primary) 18%, var(--el-fill-color-darker));
        border-color: color-mix(in srgb, var(--el-color-primary) 56%, var(--el-border-color));
        color: var(--el-color-primary-light-3);
    }

    .video-cover-batch-tip {
        background: color-mix(in srgb, var(--el-color-warning) 18%, transparent);
        color: var(--el-color-warning-light-3);
    }

    :deep(.custom-select-popper) {
        .el-select-dropdown__item {
            .option-tag-pill {
                background-color: var(--el-fill-color-dark);
            }
            &:hover,
            &.hover {
                background-color: var(--el-fill-color-darker);
                .option-tag-pill {
                    background-color: color-mix(in srgb, var(--el-color-primary) 15%, var(--el-fill-color-dark));
                }
            }
            &.is-selected {
                .option-tag-pill {
                    background-color: var(--el-color-primary);
                    color: #ffffff;
                }
            }
        }
    }
}

.form-footer {
    margin-top: 40px;
    display: flex;
    justify-content: flex-end;

    .submit-btn {
        height: 52px;
        padding: 0 48px;
        border-radius: 26px;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.5px;
        background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
        border: none;
        box-shadow: 0 10px 20px -5px rgba(var(--el-color-primary-rgb), 0.4);
        transition: all 0.3s;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 24px -5px rgba(var(--el-color-primary-rgb), 0.5);
        }

        &:active {
            transform: translateY(0);
        }

        &.is-disabled {
            background: var(--el-button-disabled-bg-color);
            box-shadow: none;
        }
    }
}

@media screen and (max-width: 992px) {
    .type-grid {
        grid-template-columns: 1fr;

        .type-card {
            flex-direction: row;
            text-align: left;
            padding: 12px;

            .info-box {
                align-items: flex-start;
            }
        }
    }

    .form-card :deep(.el-card__body) {
        padding: 24px;
    }
}
</style>
