<template>
    <div class="client-editor-panel">
        <div class="editor-header">
            <div class="header-text">
                <h2>发布动态</h2>
                <p>分享你的职场见闻与生活点滴</p>
            </div>
            <button class="btn-clear" type="button" @click="emit('reset')">
                <Icon icon="mdi:refresh" />
                清空内容
            </button>
        </div>

        <div class="editor-body">
            <el-form ref="formRef" :model="props.form" :rules="props.rules" label-position="top" class="client-form">
                <el-form-item prop="postType" class="form-section">
                    <div class="section-label">内容类型</div>
                    <div class="type-selector">
                        <div
                            v-for="type in typeOptions"
                            :key="type.label"
                            class="type-item"
                            :class="{ active: props.form.postType === type.label }"
                            @click="emit('change-post-type', type.label)"
                        >
                            <Icon :icon="type.icon" class="type-icon" />
                            <span class="type-text">{{ type.text }}</span>
                            <div class="active-indicator" v-if="props.form.postType === type.label">
                                <Icon icon="mdi:check-circle" />
                            </div>
                        </div>
                    </div>
                    <el-radio-group v-model="props.form.postType" v-show="false"></el-radio-group>
                </el-form-item>

                <el-form-item v-if="!isBatchVideoMode" prop="content" class="form-section">
                    <div class="section-label">正文</div>
                    <div class="textarea-container">
                        <el-input
                            v-model="props.form.content"
                            type="textarea"
                            :rows="6"
                            placeholder="此刻你想分享什么..."
                            maxlength="2000"
                            show-word-limit
                            resize="none"
                            class="flat-textarea"
                            @input="emit('content-input')"
                        />
                    </div>
                </el-form-item>

                <transition name="el-fade-in">
                    <el-form-item v-if="props.form.postType !== POST_TYPE.TEXT" prop="files" class="form-section">
                        <div class="section-label">{{ props.form.postType === POST_TYPE.IMAGE ? '上传图片' : '上传视频' }}</div>
                        <div class="upload-zone">
                            <template v-if="props.form.postType === POST_TYPE.IMAGE">
                                <ImageUpload
                                    ref="imageUploadRef"
                                    v-model="imageUrlsModel"
                                    :limit="9"
                                    :drag="true"
                                    :upload-drag="false"
                                    :sort-assist-mode="true"
                                    :sort-assist-list-min-length="1"
                                    :show-assist-thumbnail="false"
                                    :show-assist-preview-action="false"
                                    :file-size="10"
                                    :file-type="['jpg', 'jpeg', 'png', 'gif']"
                                    :is-show-tip="false"
                                    oss-type="posts"
                                    :oss-post-type="POST_TYPE.IMAGE"
                                    class="flat-image-upload"
                                    @uploading-change="handleImageUploadingChange"
                                />
                                <div v-if="imagePreviewList.length" class="preview-gallery">
                                    <div class="gallery-head">
                                        <span class="gallery-title">预览</span>
                                        <span class="gallery-count">{{ imagePreviewList.length }} / 9</span>
                                    </div>
                                    <div class="gallery-grid" :class="{ single: imagePreviewList.length === 1 }">
                                        <el-image
                                            v-if="primaryImagePreview"
                                            :src="primaryImagePreview"
                                            :preview-src-list="imagePreviewList"
                                            :preview-teleported="true"
                                            :initial-index="0"
                                            fit="cover"
                                            class="hero-image"
                                        />
                                        <div v-if="secondaryImagePreviewList.length" class="side-images">
                                            <el-image
                                                v-for="(url, index) in secondaryImagePreviewList"
                                                :key="`${index}-${url}`"
                                                :src="url"
                                                :preview-src-list="imagePreviewList"
                                                :preview-teleported="true"
                                                :initial-index="index + 1"
                                                fit="cover"
                                                class="side-image"
                                            />
                                        </div>
                                    </div>
                                </div>
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
                                    class="flat-video-upload"
                                    @uploading-change="handleVideoUploadingChange"
                                />
                                <div class="video-cover-section" v-if="hasSingleVideoUploaded">
                                    <div class="cover-header">
                                        <span>设置封面</span>
                                        <button type="button" class="btn-text" :disabled="capturingCover || !videoCoverSourceUrl" @click="captureCurrentFrame">
                                            {{ selectedCoverFile ? '重新截取' : '截取当前帧' }}
                                        </button>
                                    </div>
                                    <video
                                        ref="videoCoverRef"
                                        :src="videoCoverSourceUrl"
                                        class="preview-video"
                                        controls
                                        preload="metadata"
                                        controlslist="nodownload noplaybackrate"
                                        disablepictureinpicture
                                        @contextmenu.prevent
                                    ></video>
                                    <div class="selected-cover" v-if="selectedCoverPreviewUrl">
                                        <img :src="selectedCoverPreviewUrl" alt="封面" />
                                        <div class="cover-info">
                                            <span>已生成封面图</span>
                                            <button type="button" class="btn-text danger" @click="clearSelectedCover">移除封面</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="batch-notice" v-else-if="hasVideoUploaded">已选择多个视频，系统将自动截取首帧作为封面</div>
                            </template>
                        </div>
                    </el-form-item>
                </transition>

                <el-form-item v-if="isBatchVideoMode" class="form-section">
                    <div class="section-label">批量填写</div>
                    <div class="batch-list">
                        <div
                            v-for="item in videoBatchItems"
                            :key="item.key"
                            class="batch-item"
                            :class="{
                                'has-error': videoBatchErrorSet.has(item.index) || videoBatchTagErrorSet.has(item.index),
                                'is-active': item.index === safeBatchPreviewIndex
                            }"
                            @click="setBatchPreviewIndex(item.index)"
                        >
                            <div class="batch-item-head">
                                <span class="batch-index">视频 {{ item.index + 1 }}</span>
                                <span class="batch-name">{{ item.name }}</span>
                            </div>
                            <el-input
                                :model-value="videoBatchContentsModel[item.index] || ''"
                                type="textarea"
                                :rows="3"
                                maxlength="2000"
                                show-word-limit
                                resize="none"
                                placeholder="输入描述..."
                                class="flat-textarea"
                                @update:model-value="onVideoBatchContentChange(item.index, $event)"
                            />
                            <div v-if="videoBatchErrorSet.has(item.index)" class="error-msg">请填写正文</div>
                            <div class="batch-tags">
                                <el-select
                                    :model-value="getVideoBatchTagIds(item.index)"
                                    multiple
                                    filterable
                                    :filter-method="resolveBatchTagFilterMethod(item.index)"
                                    :reserve-keyword="false"
                                    placeholder="选择话题"
                                    clearable
                                    :loading="props.interestLoading"
                                    class="flat-select"
                                    popper-class="flat-popper"
                                    @update:model-value="onVideoBatchTagChange(item.index, $event)"
                                    @visible-change="resolveBatchTagVisibleChange(item.index)"
                                >
                                    <template #prefix>
                                        <Icon icon="mdi:pound" />
                                    </template>
                                    <template v-for="cate in getFilteredBatchInterestTree(item.index)" :key="`${item.index}-${cate.id}`">
                                        <el-option-group v-if="cate.children?.length" :label="cate.name">
                                            <el-option v-for="child in cate.children" :key="`${item.index}-${child.id}`" :label="child.name" :value="child.id">
                                                <span class="tag-pill">{{ child.name }}</span>
                                            </el-option>
                                        </el-option-group>
                                    </template>
                                </el-select>
                                <div v-if="videoBatchTagErrorSet.has(item.index)" class="error-msg">请选择话题</div>
                            </div>
                        </div>
                    </div>
                </el-form-item>

                <el-form-item v-if="!isBatchVideoMode" prop="tagStr" class="form-section">
                    <div class="section-label">添加话题</div>
                    <el-cascader
                        ref="normalTagCascaderRef"
                        v-model="selectedTagIdsModel"
                        :options="normalTagCascaderOptions"
                        :props="normalTagCascaderProps"
                        filterable
                        :filter-method="handleNormalTagCascaderFilter"
                        placeholder="选择适合的话题标签"
                        clearable
                        :show-all-levels="false"
                        :loading="props.interestLoading"
                        class="flat-cascader"
                        popper-class="flat-popper"
                        @change="handleNormalTagCascaderChange"
                        @visible-change="handleNormalTagCascaderVisibleChange"
                    >
                        <template #prefix>
                            <Icon icon="mdi:pound" />
                        </template>
                        <template #default="{ data }">
                            <span class="tag-pill">{{ data?.name }}</span>
                        </template>
                    </el-cascader>
                </el-form-item>

                <div class="form-actions">
                    <button
                        type="button"
                        class="btn-submit"
                        :class="{ 'is-loading': props.submitting || isUploading }"
                        :disabled="props.submitting || isUploading"
                        @click="handleSubmitClick"
                    >
                        <Icon icon="mdi:send" v-if="!isUploading && !props.submitting" />
                        <Icon icon="mdi:loading" class="spin" v-else />
                        <span>{{ isUploading ? '正在上传...' : props.submitting ? '发布中...' : '发布动态' }}</span>
                    </button>
                </div>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsContentAddPostComponentsPostEditorPanel' })
import { computed, ref, shallowRef, watch, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import PinyinMatch from 'pinyin-match'
import FileUpload from '@/components/FileUpload/index.vue'
import ImageUpload from '@/components/ImageUpload/index.vue'
import { POST_TYPE } from '@/utils/enum'
import { getImgUrl } from '@/utils/img'

interface PostFormState {
    postType: string
    content: string
    tagStr: string
}

interface TypeOption {
    label: string
    icon: string
    text: string
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
    { label: POST_TYPE.TEXT, icon: 'mdi:format-text', text: '文字' },
    { label: POST_TYPE.IMAGE, icon: 'mdi:image-outline', text: '图文' },
    { label: POST_TYPE.VIDEO, icon: 'mdi:video-outline', text: '视频' }
]

const { proxy } = getCurrentInstance() || {}
const formRef = ref<FormInstance>()
const normalTagCascaderRef = ref<any>()
const normalTagCascaderVisible = ref(false)
const imageUploadRef = shallowRef<any>()
const videoUploadRef = shallowRef<any>()
const imageUploading = ref(false)
const videoUploading = ref(false)
const videoCoverRef = ref<HTMLVideoElement>()
const videoCoverSourceUrl = ref('')
const selectedCoverFile = ref<File | null>(null)
const selectedCoverPreviewUrl = ref('')
const capturingCover = ref(false)
const batchTagKeywordMap = ref<Record<number, string>>({})
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
    get: () => (Array.isArray(props.selectedTagIds) ? props.selectedTagIds : []),
    set: value => {
        const raw = Array.isArray(value) ? value : []
        const next = raw.filter(id => normalLeafIdSet.value.has(String(id)))
        emit('update:selectedTagIds', next)
    }
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
const imagePreviewList = computed(() =>
    parseVideoUrlList(props.imageUrls)
        .map(url => getImgUrl(url))
        .filter(Boolean)
)
const primaryImagePreview = computed(() => imagePreviewList.value[0] || '')
const secondaryImagePreviewList = computed(() => imagePreviewList.value.slice(1))
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
const normalInterestCategories = computed(() => {
    const source = Array.isArray(props.interestTree) ? props.interestTree : []
    return source.filter(group => Array.isArray(group?.children) && group.children.length)
})
const normalTagCascaderOptions = computed(() =>
    normalInterestCategories.value.map(group => ({
        ...group,
        children: (Array.isArray(group?.children) ? group.children : []).map((child: any) => ({ ...child }))
    }))
)
const normalTagCascaderProps = {
    multiple: true,
    emitPath: false,
    checkStrictly: true,
    checkOnClickNode: false,
    checkOnClickLeaf: true,
    disabled: (_data: any, node: any) => !node?.isLeaf,
    value: 'id',
    label: 'name',
    children: 'children'
} as const
const normalLeafIdSet = computed(() => {
    const set = new Set<string>()
    normalInterestCategories.value.forEach(group => {
        const children = Array.isArray(group?.children) ? group.children : []
        children.forEach((child: any) => {
            if (child?.id !== undefined && child?.id !== null) {
                set.add(String(child.id))
            }
        })
    })
    return set
})

function parseVideoUrlList(value: unknown): string[] {
    const text = String(value || '').trim()
    if (!text) return []
    return text
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
}

function normalizeTagKeyword(value: unknown): string {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
}

function matchInterestKeyword(name: unknown, keyword: unknown): boolean {
    const label = String(name || '').trim()
    if (!label) return false

    const rawKeyword = String(keyword || '').trim()
    if (!rawKeyword) return true

    const normalizedKeyword = normalizeTagKeyword(rawKeyword)
    const normalizedLabel = normalizeTagKeyword(label)
    if (normalizedLabel.includes(normalizedKeyword)) return true

    return Boolean(PinyinMatch.match(label, rawKeyword) || (normalizedKeyword !== rawKeyword ? PinyinMatch.match(label, normalizedKeyword) : false))
}

function filterInterestTree(keyword: unknown): any[] {
    const source = Array.isArray(props.interestTree) ? props.interestTree : []
    const rawKeyword = String(keyword || '').trim()
    if (!rawKeyword) return source

    return source
        .map(group => {
            const children = Array.isArray(group?.children) ? group.children : []
            if (matchInterestKeyword(group?.name, rawKeyword)) {
                return { ...group, children }
            }

            const matchedChildren = children.filter((child: any) => matchInterestKeyword(child?.name, rawKeyword))
            if (!matchedChildren.length) return null
            return { ...group, children: matchedChildren }
        })
        .filter(Boolean)
}

function handleNormalTagCascaderFilter(node: any, keyword: string): boolean {
    const rawKeyword = String(keyword || '').trim()
    if (!rawKeyword) return true
    const current = node?.data?.name ?? ''
    const parent = node?.parent?.data?.name ?? ''
    const fullPath = [parent, current].filter(Boolean).join(' ')
    return matchInterestKeyword(current, rawKeyword) || matchInterestKeyword(parent, rawKeyword) || matchInterestKeyword(fullPath, rawKeyword)
}

function clearNormalTagCascaderKeyword(): void {
    const cascader = normalTagCascaderRef.value as any
    if (!cascader) return

    const panelRef = cascader?.cascaderPanelRef || cascader?.panel
    if (typeof panelRef?.clearFilter === 'function') panelRef.clearFilter()
    if (typeof panelRef?.filter === 'function') panelRef.filter('')

    const searchInput = cascader?.$el?.querySelector?.('.el-cascader__search-input') as HTMLInputElement | null
    if (searchInput) {
        searchInput.value = ''
        searchInput.dispatchEvent(new Event('input', { bubbles: true }))
        searchInput.dispatchEvent(new Event('change', { bubbles: true }))
        return
    }

    const fallbackInput = cascader?.$el?.querySelector?.('.el-input__inner') as HTMLInputElement | null
    if (!fallbackInput) return
    fallbackInput.value = ''
    fallbackInput.dispatchEvent(new Event('input', { bubbles: true }))
    fallbackInput.dispatchEvent(new Event('change', { bubbles: true }))
}

function handleNormalTagCascaderChange(value?: Array<number | string>): void {
    const raw = Array.isArray(value) ? value : selectedTagIdsModel.value
    const next = raw.filter(id => normalLeafIdSet.value.has(String(id)))
    if (next.length !== selectedTagIdsModel.value.length || next.some((id, index) => String(id) !== String(selectedTagIdsModel.value[index]))) {
        selectedTagIdsModel.value = next
    }
    requestAnimationFrame(() => clearNormalTagCascaderKeyword())
}

function handleNormalTagCascaderVisibleChange(visible: boolean): void {
    normalTagCascaderVisible.value = visible
    if (!visible) {
        clearNormalTagCascaderKeyword()
        return
    }
    nextTick(() => clearNormalTagCascaderKeyword())
}

function handleBatchTagFilter(index: number, value: string): void {
    batchTagKeywordMap.value = {
        ...batchTagKeywordMap.value,
        [index]: String(value || '')
    }
}

function getFilteredBatchInterestTree(index: number): any[] {
    return filterInterestTree(batchTagKeywordMap.value[index] || '')
}

function resolveBatchTagFilterMethod(index: number): (value: string) => void {
    return (value: string) => handleBatchTagFilter(index, value)
}

function resolveBatchTagVisibleChange(index: number): (visible: boolean) => void {
    return (visible: boolean) => {
        if (!visible) handleBatchTagFilter(index, '')
    }
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

function handleSubmitClick() {
    if (props.submitting || isUploading.value) return
    emit('submit')
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
.client-editor-panel {
    background: var(--client-surface);
    border-radius: 0;
    min-height: 100%;
    width: 100%;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .header-text {
        h2 {
            margin: 0 0 4px 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-main);
        }
        p {
            margin: 0;
            font-size: 13px;
            color: var(--text-minor);
        }
    }

    .btn-clear {
        background: transparent;
        border: none;
        color: var(--text-minor);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 6px;
        transition:
            background-color var(--app-motion-fast),
            color var(--app-motion-fast);

        &:hover {
            background: var(--client-fill);
            color: var(--text-main);
        }
    }
}

.editor-body {
    width: 100%;
}

.client-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;

    :deep(.el-form-item) {
        margin-bottom: 0;
        width: 100%;
    }

    :deep(.el-form-item__content) {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        line-height: normal;
    }
}

.form-section {
    width: 100%;

    .section-label {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-main);
        margin-bottom: 12px;
        width: 100%;
    }
}

.type-selector {
    display: flex;
    gap: 16px;
    width: 100%;
}

.type-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 48px;
    background: var(--client-fill);
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    position: relative;
    transition:
        background-color var(--app-motion-fast),
        border-color var(--app-motion-fast);

    .type-icon {
        font-size: 20px;
        color: var(--text-regular);
    }

    .type-text {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-main);
    }

    &:hover {
        background: var(--client-fill-hover);
    }

    &.active {
        background: var(--client-primary-muted);
        border-color: var(--primary-color);

        .type-icon,
        .type-text {
            color: var(--client-primary-text);
        }
    }
}

.active-indicator {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--primary-color);
    font-size: 16px;
}

.textarea-container {
    width: 100%;
}

.flat-textarea {
    width: 100%;

    :deep(.el-textarea__inner) {
        background-color: var(--client-fill);
        border: 1px solid transparent;
        border-radius: 8px;
        padding: 12px;
        font-size: 14px;
        color: var(--text-main);
        box-shadow: none;
        transition:
            background-color var(--app-motion-fast),
            border-color var(--app-motion-fast),
            box-shadow var(--app-motion-fast);

        &:hover {
            background-color: var(--client-fill-hover);
        }

        &:focus {
            background-color: var(--client-surface);
            border-color: var(--primary-color);
            box-shadow: var(--client-field-focus-ring);
        }
    }

    :deep(.el-input__count) {
        background: transparent;
        color: var(--text-minor);
    }
}

.upload-zone {
    width: 100%;
    background: var(--client-surface);
    border: 1px dashed var(--client-border-strong);
    border-radius: 8px;
    padding: 16px;
    transition: border-color 0.2s;
    box-sizing: border-box;

    &:hover {
        border-color: var(--primary-color);
    }
}

.flat-image-upload {
    :deep(.el-upload--picture-card) {
        background: var(--client-fill);
        border: none;
        border-radius: 6px;
        width: 100px;
        height: 100px;

        &:hover {
            background: var(--client-fill-hover);
        }
    }

    :deep(.el-upload-list--picture-card .el-upload-list__item) {
        width: 100px;
        height: 100px;
        border-radius: 6px;
        border: none;
    }
}

.flat-video-upload {
    :deep(.upload-file-uploader .el-upload-dragger) {
        background: var(--client-fill);
        border: none;
        border-radius: 6px;
        padding: 32px 0;

        &:hover {
            background: var(--client-fill-hover);
        }
    }

    :deep(.upload-file-list .file-item) {
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background: var(--client-surface-soft);
    }
}

.preview-gallery {
    margin-top: 16px;
    border-top: 1px solid var(--border-color);
    padding-top: 16px;
    width: 100%;
}

.gallery-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 13px;

    .gallery-title {
        font-weight: 500;
        color: var(--text-main);
    }
    .gallery-count {
        color: var(--text-minor);
    }
}

.gallery-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 8px;

    &.single {
        grid-template-columns: 1fr;
    }
}

.hero-image {
    width: 100%;
    height: 240px;
    border-radius: 6px;
    background: var(--client-fill);
}

.side-images {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    align-content: start;
}

.side-image {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 6px;
    background: var(--client-fill);
}

.video-cover-section {
    margin-top: 16px;
    background: var(--client-surface-muted);
    border-radius: 8px;
    padding: 12px;
    width: 100%;
    box-sizing: border-box;

    .cover-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 13px;
        color: var(--text-main);
        font-weight: 500;
    }

    .btn-text {
        background: transparent;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
        padding: 0;

        &[disabled] {
            color: var(--client-disabled);
            cursor: not-allowed;
        }

        &.danger {
            color: var(--client-danger);
        }
    }

    .preview-video {
        width: 100%;
        max-height: 200px;
        background: var(--client-video-bg);
        border-radius: 6px;
    }
}

.selected-cover {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: var(--client-surface);
    border-radius: 6px;
    border: 1px solid var(--border-color);
    width: 100%;
    box-sizing: border-box;

    img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
    }

    .cover-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: var(--text-regular);
    }
}

.batch-notice {
    margin-top: 12px;
    padding: 10px 12px;
    background: var(--client-primary-muted);
    color: var(--client-primary-text);
    border-radius: 6px;
    font-size: 13px;
    width: 100%;
    box-sizing: border-box;
}

.batch-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.batch-item {
    background: var(--client-surface-muted);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    box-sizing: border-box;

    &.is-active {
        background: var(--client-surface);
        border-color: var(--primary-color);
    }

    &.has-error {
        border-color: var(--client-danger);
        background: var(--client-danger-bg);
    }
}

.batch-item-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;

    .batch-index {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-main);
    }
    .batch-name {
        font-size: 13px;
        color: var(--text-minor);
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.batch-tags {
    margin-top: 12px;
}

.error-msg {
    color: var(--client-danger);
    font-size: 12px;
    margin-top: 4px;
}

.flat-cascader,
.flat-select {
    width: 100%;

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
        background-color: var(--client-fill);
        border: 1px solid transparent;
        border-radius: 8px;
        box-shadow: none;
        transition:
            background-color var(--app-motion-fast),
            border-color var(--app-motion-fast),
            box-shadow var(--app-motion-fast);

        &:hover {
            background-color: var(--client-fill-hover);
        }

        &.is-focus,
        &.is-focused {
            background-color: var(--client-surface);
            border-color: var(--primary-color);
            box-shadow: var(--client-field-focus-ring);
        }
    }
}

.tag-pill {
    background: var(--client-fill);
    color: var(--text-regular);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.form-actions {
    margin-top: 32px;
    display: flex;
    justify-content: flex-end;
    width: 100%;

    .btn-submit {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: var(--client-submit-gradient);
        color: var(--client-primary-contrast);
        border: none;
        height: 44px;
        padding: 0 32px;
        border-radius: 22px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;

        &:hover {
            opacity: 0.9;
        }

        &.is-loading,
        &[disabled] {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .spin {
            animation: spin 1s linear infinite;
        }
    }
}

@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
}

:deep(.flat-popper) {
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: var(--client-shadow-soft);

    .el-select-dropdown__item.is-selected {
        color: var(--primary-color);
        font-weight: 600;
    }
}
</style>
