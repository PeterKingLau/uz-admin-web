<template>
    <div class="client-publish-page">
        <ClientHeader :show-search="false" @brand-click="goDiscover" />

        <PublishAppDownloadPrompt
            v-if="showMobileDownloadPrompt"
            :brand-logo="brandLogo"
            :download-url="appDownloadUrl"
            :version-name="latestAppVersion?.versionName"
            :loading="latestAppVersionLoading"
            @retry="loadLatestAppVersion(false)"
            @go-discover="goDiscover"
        />

        <main v-else class="publish-main">
            <section class="composer-canvas" aria-label="内容发布">
                <input v-model="title" class="title-input" maxlength="80" type="text" placeholder="写下一个清晰的标题" />

                <textarea
                    v-model="content"
                    class="body-input"
                    maxlength="2000"
                    rows="8"
                    placeholder="分享你的观察、经验或一个正在发生的想法..."
                ></textarea>

                <div v-if="selectedTopics.length" class="topic-panel">
                    <div v-if="selectedTopics.length" class="topic-list">
                        <button v-for="tag in selectedTopics" :key="tag.id" type="button" class="topic-chip" @click="removeTopic(tag.id)">
                            <span># {{ tag.name }}</span>
                            <Icon icon="mdi:close" />
                        </button>
                    </div>
                </div>

                <div v-if="mediaList.length" class="media-grid">
                    <div v-for="item in mediaList" :key="item.id" class="media-thumb">
                        <img v-if="item.type === 'image'" :src="item.previewUrl" alt="" />
                        <video v-else :src="item.previewUrl" muted playsinline preload="metadata"></video>

                        <div v-if="item.type === 'video'" class="video-mark">
                            <Icon icon="mdi:play" />
                        </div>

                        <div v-if="item.status === 'uploading'" class="upload-mask">
                            <span class="upload-spinner"></span>
                        </div>

                        <button type="button" class="remove-media" aria-label="移除素材" @click="removeMedia(item.id)">
                            <Icon icon="mdi:close" />
                        </button>
                    </div>
                </div>

                <footer class="action-bar">
                    <div class="tool-group">
                        <el-popover
                            v-model:visible="topicPopoverVisible"
                            placement="top-start"
                            trigger="click"
                            :width="320"
                            :show-arrow="false"
                            popper-class="client-topic-popover"
                            @show="handleTopicPopoverShow"
                        >
                            <div class="topic-popover-panel">
                                <input v-model="topicSearch" class="topic-popover-search" type="text" maxlength="24" placeholder="搜索话题..." />

                                <div class="topic-category-tabs" role="tablist" aria-label="话题分类">
                                    <button
                                        v-for="category in topicCategoryTabs"
                                        :key="category.id"
                                        type="button"
                                        class="topic-category-tab"
                                        :class="{ active: activeTopicCategoryId === category.id }"
                                        @click="activeTopicCategoryId = category.id"
                                    >
                                        {{ category.name }}
                                    </button>
                                </div>

                                <div class="topic-tag-grid">
                                    <button v-for="tag in filteredTopicOptions" :key="tag.id" type="button" class="topic-option" @click="selectTopic(tag)">
                                        # {{ tag.name }}
                                    </button>
                                    <span v-if="topicLoading" class="topic-empty">话题加载中...</span>
                                    <span v-else-if="!filteredTopicOptions.length" class="topic-empty">暂无可选话题</span>
                                </div>
                            </div>
                            <template #reference>
                                <button type="button" class="tool-btn" :class="{ active: topicPopoverVisible }">
                                    <Icon icon="mdi:pound" />
                                    <span>话题</span>
                                </button>
                            </template>
                        </el-popover>
                        <button type="button" class="tool-btn" :disabled="!canChooseImage" @click="imageInputRef?.click()">
                            <Icon icon="mdi:image-outline" />
                            <span>图片</span>
                        </button>
                        <button type="button" class="tool-btn" :disabled="!canChooseVideo" @click="videoInputRef?.click()">
                            <Icon icon="mdi:video-outline" />
                            <span>视频</span>
                        </button>
                    </div>

                    <button type="button" class="publish-btn" :class="{ 'is-disabled': !canPublish }" :disabled="!canPublish" @click="handlePublish">
                        {{ submitButtonText }}
                    </button>
                </footer>
            </section>

            <input ref="imageInputRef" class="file-input" type="file" accept="image/*" multiple @change="handleImageSelect" />
            <input ref="videoInputRef" class="file-input" type="file" accept="video/*" @change="handleVideoSelect" />
        </main>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientPublish' })
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import brandLogo from '@/assets/logo/logo.png'
import { getInterestAll } from '@/api/content/interest'
import { addPost } from '@/api/content/post'
import { getNewVersion, parseNewVersion, type VersionItem } from '@/api/content/version'
import ClientHeader from '@/views/client/components/ClientHeader.vue'
import PublishAppDownloadPrompt from '@/views/client/publish/components/PublishAppDownloadPrompt.vue'
import useSettingsStore from '@/store/modules/settings'
import { POST_TYPE } from '@/utils/enum'
import { markContentListRefreshNeeded } from '@/utils/content/refreshSignal'
import { getImgUrl } from '@/utils/img'

type MediaType = 'image' | 'video'
type UploadStatus = 'uploading' | 'success'

interface MediaItem {
    id: string
    type: MediaType
    file: File
    name: string
    previewUrl: string
    status: UploadStatus
    url: string
    timer: ReturnType<typeof setTimeout> | null
}

interface TopicOption {
    id: number | string
    name: string
    categoryId: string
    categoryName?: string
}

interface TopicCategory {
    id: string
    name: string
}

const router = useRouter()
const settingsStore = useSettingsStore()
const { proxy } = getCurrentInstance() || {}

const title = ref('')
const content = ref('')
const topicSearch = ref('')
const topicOptions = ref<TopicOption[]>([])
const topicCategories = ref<TopicCategory[]>([])
const topicLoading = ref(false)
const selectedTopicIds = ref<Array<number | string>>([])
const topicPopoverVisible = ref(false)
const activeTopicCategoryId = ref('all')
const mediaList = ref<MediaItem[]>([])
const submitting = ref(false)
const imageInputRef = ref<HTMLInputElement | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)
const isMobileViewport = ref(false)
const latestAppVersion = ref<VersionItem | null>(null)
const latestAppVersionLoading = ref(false)
const MOBILE_PUBLISH_QUERY = '(max-width: 768px)'
let mobileMediaQuery: MediaQueryList | null = null

const hasImage = computed(() => mediaList.value.some(item => item.type === 'image'))
const hasVideo = computed(() => mediaList.value.some(item => item.type === 'video'))
const isUploading = computed(() => mediaList.value.some(item => item.status === 'uploading'))
const hasContent = computed(() => Boolean(title.value.trim() || content.value.trim()))
const postType = computed(() => {
    if (hasVideo.value) return POST_TYPE.VIDEO
    if (hasImage.value) return POST_TYPE.IMAGE
    return POST_TYPE.TEXT
})
const canChooseImage = computed(() => !hasVideo.value && mediaList.value.length < 9)
const canChooseVideo = computed(() => !hasImage.value && !hasVideo.value)
const canPublish = computed(() => hasContent.value && !isUploading.value && !submitting.value)
const submitButtonText = computed(() => {
    if (isUploading.value) return '处理中...'
    if (submitting.value) return '发布中...'
    return '发布'
})
const showMobileDownloadPrompt = computed(() => isMobileViewport.value)
const appDownloadUrl = computed(() => {
    const rawUrl = String(latestAppVersion.value?.downloadUrl || '').trim()
    return rawUrl ? getImgUrl(rawUrl) : ''
})
const selectedTopics = computed(() => {
    const selectedIds = new Set(selectedTopicIds.value.map(id => String(id)))
    return topicOptions.value.filter(item => selectedIds.has(String(item.id)))
})
const topicCategoryTabs = computed(() => [{ id: 'all', name: '全部' }, ...topicCategories.value])
const filteredTopicOptions = computed(() => {
    const selectedIds = new Set(selectedTopicIds.value.map(id => String(id)))
    const keyword = normalizeTopicKeyword(topicSearch.value)
    return topicOptions.value
        .filter(item => !selectedIds.has(String(item.id)))
        .filter(item => activeTopicCategoryId.value === 'all' || item.categoryId === activeTopicCategoryId.value)
        .filter(item => {
            if (!keyword) return true
            return normalizeTopicKeyword(item.name).includes(keyword)
        })
})

const goDiscover = () => {
    router.push('/discover')
}

const normalizeTopicKeyword = (value: unknown) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^#/, '')
        .replace(/\s+/g, '')

const normalizeTopicData = (source: unknown): { categories: TopicCategory[]; options: TopicOption[] } => {
    const groups = Array.isArray(source) ? source : []
    const categories: TopicCategory[] = []
    const options: TopicOption[] = []
    const seenCategories = new Set<string>()

    const pushCategory = (category: TopicCategory) => {
        if (!category.name || seenCategories.has(category.id)) return
        seenCategories.add(category.id)
        categories.push(category)
    }

    const walk = (node: any, fallbackCategory: TopicCategory, path: string) => {
        const children = Array.isArray(node?.children) ? node.children : []
        const id = node?.id
        const name = String(node?.name || node?.label || '').trim()
        const hasChildren = children.length > 0

        if (hasChildren) {
            const category = name
                ? {
                      id: String(id ?? `category-${path}`),
                      name
                  }
                : fallbackCategory
            if (name) pushCategory(category)
            children.forEach((child: any, index: number) => walk(child, category, `${path}-${index}`))
            return
        }

        if (id === undefined || id === null || !name) return
        options.push({
            id,
            name,
            categoryId: fallbackCategory.id,
            categoryName: fallbackCategory.name
        })
    }

    groups.forEach((group: any, index) => {
        walk(group, { id: 'uncategorized', name: '未分类' }, String(index))
    })

    const seen = new Set<string>()
    const uniqueOptions = options.filter(item => {
        const key = String(item.id)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
    const usedCategoryIds = new Set(uniqueOptions.map(item => item.categoryId))
    const visibleCategories = categories.filter(item => usedCategoryIds.has(item.id))
    if (usedCategoryIds.has('uncategorized') && !visibleCategories.some(item => item.id === 'uncategorized')) {
        visibleCategories.push({ id: 'uncategorized', name: '未分类' })
    }

    return {
        categories: visibleCategories,
        options: uniqueOptions
    }
}

async function loadTopicOptions() {
    if (topicLoading.value || topicOptions.value.length) return
    topicLoading.value = true
    try {
        const response = await getInterestAll()
        const topicData = normalizeTopicData((response as any)?.data || response || [])
        topicCategories.value = topicData.categories
        topicOptions.value = topicData.options
    } catch {
        proxy?.$modal?.msgError?.('话题加载失败，请稍后重试')
    } finally {
        topicLoading.value = false
    }
}

const handleTopicPopoverShow = () => {
    void loadTopicOptions()
}

const selectTopic = (topic: TopicOption) => {
    if (selectedTopicIds.value.some(id => String(id) === String(topic.id))) return
    selectedTopicIds.value = [...selectedTopicIds.value, topic.id]
    topicSearch.value = ''
}

const removeTopic = (id: number | string) => {
    selectedTopicIds.value = selectedTopicIds.value.filter(item => String(item) !== String(id))
}

const resetFileInput = (input: HTMLInputElement | null) => {
    if (input) input.value = ''
}

const createMockUrl = (file: File) => {
    const safeName = encodeURIComponent(file.name || `media-${Date.now()}`)
    return `/mock/oss/posts/${Date.now()}-${safeName}`
}

const createMediaItem = (file: File, type: MediaType): MediaItem => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const item: MediaItem = {
        id,
        type,
        file,
        name: file.name || (type === 'image' ? 'image' : 'video'),
        previewUrl: URL.createObjectURL(file),
        status: 'uploading',
        url: '',
        timer: null
    }

    item.timer = setTimeout(() => {
        const target = mediaList.value.find(media => media.id === id)
        if (!target) return
        target.status = 'success'
        target.url = createMockUrl(file)
        target.timer = null
    }, 2000)

    return item
}

const handleImageSelect = (event: Event) => {
    if (!canChooseImage.value) {
        proxy?.$modal?.msgWarning?.('已选择视频时不能再添加图片')
        resetFileInput(event.target as HTMLInputElement)
        return
    }

    const files = Array.from((event.target as HTMLInputElement).files || []).filter(file => file.type.startsWith('image/'))
    const restCount = Math.max(0, 9 - mediaList.value.length)
    const selected = files.slice(0, restCount)
    if (selected.length) {
        mediaList.value.push(...selected.map(file => createMediaItem(file, 'image')))
    }
    resetFileInput(event.target as HTMLInputElement)
}

const handleVideoSelect = (event: Event) => {
    if (!canChooseVideo.value) {
        proxy?.$modal?.msgWarning?.('图片和视频不能同时发布')
        resetFileInput(event.target as HTMLInputElement)
        return
    }

    const file = Array.from((event.target as HTMLInputElement).files || []).find(item => item.type.startsWith('video/'))
    if (file) mediaList.value.push(createMediaItem(file, 'video'))
    resetFileInput(event.target as HTMLInputElement)
}

const removeMedia = (id: string) => {
    const target = mediaList.value.find(item => item.id === id)
    if (!target) return
    if (target.timer) clearTimeout(target.timer)
    URL.revokeObjectURL(target.previewUrl)
    mediaList.value = mediaList.value.filter(item => item.id !== id)
}

const clearMedia = () => {
    mediaList.value.forEach(item => {
        if (item.timer) clearTimeout(item.timer)
        URL.revokeObjectURL(item.previewUrl)
    })
    mediaList.value = []
}

const resetComposer = () => {
    title.value = ''
    content.value = ''
    topicSearch.value = ''
    selectedTopicIds.value = []
    topicPopoverVisible.value = false
    activeTopicCategoryId.value = 'all'
    clearMedia()
}

const buildSubmitContent = () => [title.value.trim(), content.value.trim()].filter(Boolean).join('\n\n')

const resolveSubmitErrorMessage = (error: unknown) => {
    const message = String((error as any)?.message || '').trim()
    if (!message) return '发布失败，请稍后重试'
    if (message.toLowerCase().includes('timeout')) return '请求超时，请稍后重试'
    return message
}

const handlePublish = async () => {
    if (isUploading.value) return
    if (!hasContent.value) {
        proxy?.$modal?.msgWarning?.('请先写点内容')
        return
    }

    submitting.value = true
    try {
        await addPost({
            postType: postType.value,
            content: buildSubmitContent(),
            mediaUrls: mediaList.value.map(item => item.url).filter(Boolean),
            originalPostId: 0,
            tags: selectedTopicIds.value.join(','),
            circleId: '',
            isQuestion: '0'
        })
        markContentListRefreshNeeded()
        proxy?.$modal?.msgSuccess?.('发布成功')
        resetComposer()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.(resolveSubmitErrorMessage(error))
    } finally {
        submitting.value = false
    }
}

async function loadLatestAppVersion(silent = true) {
    if (latestAppVersionLoading.value) return
    latestAppVersionLoading.value = true
    try {
        const response = await getNewVersion()
        latestAppVersion.value = parseNewVersion(response)
        if (!appDownloadUrl.value && !silent) {
            proxy?.$modal?.msgWarning?.('最新版本下载地址暂不可用')
        }
    } catch (error) {
        console.error(error)
        if (!silent) proxy?.$modal?.msgError?.('获取最新版本失败，请稍后重试')
    } finally {
        latestAppVersionLoading.value = false
    }
}

function handleMobileViewportChange(event: MediaQueryListEvent) {
    isMobileViewport.value = event.matches
}

function bindMobileViewport() {
    if (typeof window === 'undefined') return
    mobileMediaQuery = window.matchMedia(MOBILE_PUBLISH_QUERY)
    isMobileViewport.value = mobileMediaQuery.matches
    if (typeof mobileMediaQuery.addEventListener === 'function') {
        mobileMediaQuery.addEventListener('change', handleMobileViewportChange)
    } else {
        mobileMediaQuery.addListener(handleMobileViewportChange)
    }
}

function unbindMobileViewport() {
    if (!mobileMediaQuery) return
    if (typeof mobileMediaQuery.removeEventListener === 'function') {
        mobileMediaQuery.removeEventListener('change', handleMobileViewportChange)
    } else {
        mobileMediaQuery.removeListener(handleMobileViewportChange)
    }
    mobileMediaQuery = null
}

onMounted(() => {
    settingsStore.setTitle('测吧')
    document.title = '测吧'
    bindMobileViewport()
    if (showMobileDownloadPrompt.value) void loadLatestAppVersion()
    else void loadTopicOptions()
})

onBeforeUnmount(() => {
    unbindMobileViewport()
    clearMedia()
    submitting.value = false
})
</script>

<style scoped lang="scss">
.client-publish-page {
    --header-height: 64px;
    --content-max-width: 1120px;
    --client-primary: var(--primary-color, #14b8a6);
    --client-primary-light: var(--primary-light, #ccfbf1);

    min-height: 100vh;
    background: var(--bg-color);
    color: var(--text-main);
    font-family:
        'PingFang SC',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        'Helvetica Neue',
        Arial,
        sans-serif;
}

.publish-main {
    min-height: 100vh;
    padding: calc(var(--header-height) + 40px) 24px 56px;
    display: flex;
    justify-content: center;
}

.composer-canvas {
    width: min(100%, 680px);
    min-height: 520px;
    padding: 40px 32px 24px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;
    overflow: hidden;
}

.title-input,
.body-input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #0f172a;
    font: inherit;
}

.title-input {
    margin-bottom: 12px;
    padding: 0;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.35;
}

.body-input {
    flex: 1;
    min-height: 220px;
    padding: 0 0 20px;
    resize: none;
    font-size: 15px;
    line-height: 1.7;
}

.title-input::placeholder,
.body-input::placeholder {
    color: #94a3b8;
}

.topic-panel {
    padding-bottom: 16px;
    display: grid;
    gap: 10px;
}

.topic-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.topic-chip {
    height: 28px;
    padding: 0 10px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #f8fafc;
    color: #475569;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
    transition:
        border-color 180ms ease,
        color 180ms ease;
}

.topic-chip:hover {
    border-color: var(--client-primary);
    color: var(--client-primary);
}

:global(.client-topic-popover.el-popper) {
    padding: 0 !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    background: #ffffff !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
    overflow: hidden;
}

.topic-popover-panel {
    padding: 14px;
    display: grid;
    gap: 12px;
    background: #ffffff;
    text-align: left;
}

.topic-popover-search {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    border: 0;
    border-radius: 6px;
    outline: 0;
    background: #f8fafc;
    color: #0f172a;
    font: inherit;
    font-size: 13px;
}

.topic-popover-search::placeholder {
    color: #94a3b8;
}

.topic-category-tabs {
    display: flex;
    align-items: center;
    gap: 14px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
}

.topic-category-tabs::-webkit-scrollbar {
    display: none;
}

.topic-category-tab {
    padding: 0;
    border: 0;
    background: transparent;
    color: #64748b;
    flex: 0 0 auto;
    font-size: 13px;
    line-height: 24px;
    cursor: pointer;
    transition:
        color 200ms ease,
        font-weight 200ms ease;
}

.topic-category-tab:hover,
.topic-category-tab.active {
    color: var(--client-primary);
    font-weight: 600;
}

.topic-tag-grid {
    max-height: 240px;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 8px;
    overflow-y: auto;
    scrollbar-color: #cbd5e1 transparent;
    scrollbar-width: thin;
}

.topic-tag-grid::-webkit-scrollbar {
    width: 4px;
}

.topic-tag-grid::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: #cbd5e1;
}

.topic-tag-grid::-webkit-scrollbar-track {
    background: transparent;
}

.topic-option {
    min-height: 30px;
    padding: 0 10px;
    border: 0;
    border-radius: 999px;
    background: #f1f5f9;
    color: #475569;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    font-size: 13px;
    cursor: pointer;
    transition:
        background-color 200ms ease,
        color 200ms ease;
}

.topic-option:hover {
    background: var(--client-primary-light);
    color: var(--client-primary);
}

.topic-empty {
    color: #94a3b8;
    font-size: 13px;
}

.media-grid {
    padding-bottom: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, 100px);
    gap: 10px;
    justify-content: flex-start;
}

.media-thumb {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 10px;
    overflow: hidden;
    background: #f1f5f9;
}

.media-thumb img,
.media-thumb video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
}

.video-mark {
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.28);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.upload-mask {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.36);
    display: flex;
    align-items: center;
    justify-content: center;
}

.upload-spinner {
    width: 22px;
    height: 22px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.remove-media {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 22px;
    height: 22px;
    border: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.28);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.action-bar {
    margin-top: auto;
    margin-right: -32px;
    margin-bottom: -24px;
    margin-left: -32px;
    min-height: 58px;
    padding: 10px 32px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.tool-group {
    display: flex;
    align-items: center;
    gap: 20px;
    min-width: 0;
}

.tool-btn {
    height: 34px;
    padding: 0 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    cursor: pointer;
    transition:
        background-color 200ms ease,
        color 200ms ease;
}

.tool-btn:hover:not(:disabled),
.tool-btn.active {
    background: var(--client-primary-light);
    color: var(--client-primary);
}

.tool-btn:disabled {
    cursor: not-allowed;
    color: #cbd5e1;
}

.publish-btn {
    height: 34px;
    min-width: 76px;
    padding: 0 16px;
    border: 0;
    border-radius: 999px;
    background: var(--client-primary);
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition:
        background-color 200ms ease,
        color 200ms ease;
}

.publish-btn:hover:not(:disabled) {
    background: #0f766e;
}

.publish-btn.is-disabled,
.publish-btn:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
}

.file-input {
    display: none;
}

@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
}

@media screen and (max-width: 768px) {
    .client-publish-page {
        --header-height: 56px;
    }

    .publish-main {
        padding: calc(var(--header-height) + 20px) 12px 32px;
    }

    .composer-canvas {
        padding: 28px 20px 20px;
    }

    .title-input {
        margin-bottom: 10px;
        padding: 0;
        font-size: 20px;
    }

    .body-input {
        padding: 0 0 18px;
    }

    .topic-panel,
    .media-grid {
        padding-left: 0;
        padding-right: 0;
    }

    .action-bar {
        margin-right: -20px;
        margin-bottom: -20px;
        margin-left: -20px;
        padding: 10px 20px;
    }

    .tool-group {
        gap: 14px;
    }

    .tool-btn span {
        display: none;
    }
}
</style>
