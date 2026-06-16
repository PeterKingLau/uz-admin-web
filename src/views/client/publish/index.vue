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

        <main v-else class="page-main">
            <div class="main-inner">
                <aside class="left-sidebar">
                    <div class="sidebar-sticky-container">
                        <nav class="sidebar-nav">
                            <button
                                v-for="item in sideNavItems"
                                :key="item.key"
                                class="nav-item"
                                :class="{ active: item.key === 'publish' }"
                                @click="handleSideNavClick(item.key)"
                            >
                                <Icon :icon="item.icon" class="nav-icon" />
                                <span class="nav-label">{{ item.label }}</span>
                            </button>
                        </nav>

                        <div class="sidebar-footer">
                            <div class="tips-card">
                                <h3 class="tips-title">创作指南</h3>
                                <ul class="tips-list">
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:movie-open-plus-outline" />
                                        </div>
                                        <span>支持发布图文、视频和文字动态，记录你的职场时刻</span>
                                    </li>
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:pound" />
                                        </div>
                                        <span>添加准确的话题标签，让更多同圈层用户看到你的内容</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>

                <section class="content-area">
                    <div class="publish-workspace">
                        <div class="publish-status-bar" aria-label="发布检查">
                            <div v-for="item in publishStatusItems" :key="item.label" class="publish-status-item">
                                <span>{{ item.label }}</span>
                                <strong :class="{ ready: item.ready }">{{ item.value }}</strong>
                            </div>
                        </div>

                        <div class="publish-editor-shell">
                            <ClientPostEditorPanel
                                ref="editorRef"
                                :form="form"
                                :rules="rules"
                                v-model:image-urls="imageUrls"
                                v-model:video-urls="videoUrls"
                                v-model:video-batch-contents="videoBatchContents"
                                v-model:video-batch-tag-ids="videoBatchTagIds"
                                v-model:batch-preview-index="batchPreviewIndex"
                                v-model:selected-tag-ids="selectedTagIds"
                                :video-batch-error-indexes="videoBatchErrorIndexes"
                                :video-batch-tag-error-indexes="videoBatchTagErrorIndexes"
                                :interest-tree="interestTree"
                                :interest-loading="interestLoading"
                                :submitting="submitting"
                                @video-cover-change="handleVideoCoverChange"
                                @change-post-type="handleTypeChange"
                                @content-input="handleContentInput"
                                @submit="handleSubmit"
                                @reset="handleReset"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientPublish' })
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import brandLogo from '@/assets/logo/logo.png'
import { addPost } from '@/api/content/post'
import { getInterestAll } from '@/api/content/interest'
import { getNewVersion, parseNewVersion, type VersionItem } from '@/api/content/version'
import ClientHeader from '@/views/client/components/ClientHeader.vue'
import ClientPostEditorPanel from '@/views/client/publish/components/ClientPostEditorPanel.vue'
import PublishAppDownloadPrompt from '@/views/client/publish/components/PublishAppDownloadPrompt.vue'
import useSettingsStore from '@/store/modules/settings'
import { POST_TYPE } from '@/utils/enum'
import { markContentListRefreshNeeded } from '@/utils/content/refreshSignal'
import { getImgUrl } from '@/utils/img'

interface PostEditorExpose {
    validateForm: () => Promise<boolean>
    validateField: (field: string) => void
    clearValidate: (fields?: string | string[]) => void
    resetFields: () => void
    clearUploaders: () => void
    getVideoRawFiles: () => File[]
    getVideoCoverFile: () => File | null
    isUploading: () => boolean
}

const router = useRouter()
const settingsStore = useSettingsStore()
const { proxy } = getCurrentInstance() || {}

const sideNavItems = [
    { key: 'discover', label: '发现', icon: 'mdi:compass-outline' },
    { key: 'publish', label: '发布', icon: 'mdi:plus-box-outline' },
    { key: 'profile', label: '主页', icon: 'mdi:account-circle-outline' }
]

const initialForm = {
    postType: POST_TYPE.TEXT,
    content: '',
    tagStr: ''
}

const form = reactive({ ...initialForm })
const editorRef = ref<PostEditorExpose>()
const imageUrls = ref('')
const videoUrls = ref('')
const videoBatchContents = ref<string[]>([])
const videoBatchErrorIndexes = ref<number[]>([])
const videoBatchTagIds = ref<Array<Array<number | string>>>([])
const videoBatchTagErrorIndexes = ref<number[]>([])
const batchPreviewIndex = ref(0)
const videoCoverPreviewUrl = ref('')
const submitting = ref(false)
const interestTree = ref<any[]>([])
const interestLoading = ref(false)
const selectedTagIds = ref<Array<number | string>>([])
const suppressTagValidate = ref(false)
const videoAutoDescription = ref('')
const isVideoContentAutoFilled = ref(false)
const isMobileViewport = ref(false)
const latestAppVersion = ref<VersionItem | null>(null)
const latestAppVersionLoading = ref(false)
const MOBILE_PUBLISH_QUERY = '(max-width: 768px)'
let mobileMediaQuery: MediaQueryList | null = null

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
const isBatchVideoMode = computed(() => form.postType === POST_TYPE.VIDEO && videoMediaUrls.value.length > 1)
const currentMediaUrls = computed(() => {
    if (form.postType === POST_TYPE.IMAGE) return imageMediaUrls.value
    if (form.postType === POST_TYPE.VIDEO) return videoMediaUrls.value
    return []
})
const showMobileDownloadPrompt = computed(() => isMobileViewport.value)
const appDownloadUrl = computed(() => {
    const rawUrl = String(latestAppVersion.value?.downloadUrl || '').trim()
    return rawUrl ? getImgUrl(rawUrl) : ''
})
const currentPostTypeText = computed(() => {
    if (form.postType === POST_TYPE.IMAGE) return '图文内容'
    if (form.postType === POST_TYPE.VIDEO) return isBatchVideoMode.value ? '批量视频' : '视频内容'
    return '文字内容'
})
const contentLength = computed(() => String(form.content || '').trim().length)
const batchContentDoneCount = computed(() => videoBatchContents.value.filter(item => String(item || '').trim()).length)
const batchTopicDoneCount = computed(() => videoBatchTagIds.value.filter(ids => Array.isArray(ids) && ids.length > 0).length)
const topicCount = computed(() => (isBatchVideoMode.value ? batchTopicDoneCount.value : selectedTagIds.value.length))
const publishStatusItems = computed(() => {
    const mediaCount = currentMediaUrls.value.length
    const batchTotal = videoMediaUrls.value.length
    const contentValue = isBatchVideoMode.value
        ? `${batchContentDoneCount.value}/${batchTotal || 0}`
        : contentLength.value
          ? `${contentLength.value} 字`
          : '未填写'
    const mediaValue = form.postType === POST_TYPE.TEXT ? '无需素材' : mediaCount ? `${mediaCount} 个` : '未上传'
    const topicValue = isBatchVideoMode.value ? `${batchTopicDoneCount.value}/${batchTotal || 0}` : topicCount.value ? `${topicCount.value} 个` : '未选择'

    return [
        { label: '类型', value: currentPostTypeText.value, ready: true },
        {
            label: '正文',
            value: contentValue,
            ready: isBatchVideoMode.value ? batchTotal > 0 && batchContentDoneCount.value === batchTotal : contentLength.value > 0
        },
        { label: '素材', value: mediaValue, ready: form.postType === POST_TYPE.TEXT || mediaCount > 0 },
        { label: '话题', value: topicValue, ready: topicCount.value > 0 }
    ]
})

const getBaseName = (name: string) => name.replace(/\.[^/.]+$/, '').trim()
const getBaseNameFromMediaUrl = (url: string) => {
    const clean = String(url || '')
        .split('?')[0]
        .split('#')[0]
    const rawName = clean.slice(clean.lastIndexOf('/') + 1)
    if (!rawName) return ''
    try {
        return getBaseName(decodeURIComponent(rawName).replace(/^\d+_\d+_/, ''))
    } catch {
        return getBaseName(rawName.replace(/^\d+_\d+_/, ''))
    }
}

const getVideoTitleFromRawFile = (): string => {
    const rawFiles = editorRef.value?.getVideoRawFiles() || []
    const firstFile = rawFiles.find(file => file instanceof File)
    return firstFile ? getBaseName(firstFile.name || '') : ''
}

const resolveVideoAutoDescription = (urls: string[]): string => {
    const fromFileName = getVideoTitleFromRawFile()
    if (fromFileName) return fromFileName
    const firstUrl = String(urls?.[0] || '').trim()
    if (!firstUrl) return ''
    return getBaseNameFromMediaUrl(firstUrl)
}

const buildVideoQueueMap = <T,>(urls: string[], values: T[]) => {
    const map = new Map<string, T[]>()
    urls.forEach((url, index) => {
        const key = String(url || '').trim()
        if (!key) return
        const queue = map.get(key) || []
        queue.push(values[index])
        map.set(key, queue)
    })
    return map
}

const takeVideoFromQueue = <T,>(map: Map<string, T[]>, url: string): T | undefined => {
    const key = String(url || '').trim()
    if (!key) return undefined
    const queue = map.get(key)
    if (!queue?.length) return undefined
    return queue.shift()
}

const syncVideoBatchContents = (nextUrls: string[], prevUrls: string[] = []) => {
    if (nextUrls.length <= 1) {
        if (videoBatchContents.value.length) videoBatchContents.value = []
        if (videoBatchErrorIndexes.value.length) videoBatchErrorIndexes.value = []
        if (videoBatchTagIds.value.length) videoBatchTagIds.value = []
        if (videoBatchTagErrorIndexes.value.length) videoBatchTagErrorIndexes.value = []
        return
    }

    const sourceUrls = prevUrls.length ? prevUrls : nextUrls
    const contentQueueMap = buildVideoQueueMap(
        sourceUrls,
        videoBatchContents.value.map(item => String(item || ''))
    )
    const tagQueueMap = buildVideoQueueMap(
        sourceUrls,
        videoBatchTagIds.value.map(ids => (Array.isArray(ids) ? [...ids] : []))
    )
    const nextContentList = nextUrls.map((url, index) => {
        const matched = takeVideoFromQueue(contentQueueMap, url)
        if (matched !== undefined) return matched
        if (!prevUrls.length) return String(videoBatchContents.value[index] || '')
        return ''
    })
    const nextTagList = nextUrls.map((url, index) => {
        const matched = takeVideoFromQueue(tagQueueMap, url)
        if (matched !== undefined) return Array.isArray(matched) ? matched : []
        if (!prevUrls.length) {
            const byIndex = videoBatchTagIds.value[index]
            return Array.isArray(byIndex) ? [...byIndex] : []
        }
        return []
    })
    videoBatchContents.value = nextContentList
    videoBatchTagIds.value = nextTagList
    videoBatchErrorIndexes.value = videoBatchErrorIndexes.value.filter(index => index >= 0 && index < nextContentList.length)
    videoBatchTagErrorIndexes.value = videoBatchTagErrorIndexes.value.filter(index => index >= 0 && index < nextTagList.length)
}

const buildSubmitContent = (): string => {
    const manualContent = String(form.content || '').trim()
    if (manualContent) return manualContent
    if (form.postType === POST_TYPE.VIDEO) return videoAutoDescription.value.trim()
    return ''
}

const rules: FormRules = {
    postType: [{ required: true, message: '请选择发布类型', trigger: 'change' }],
    tagStr: [
        {
            validator: (_rule, value, callback) => {
                if (isBatchVideoMode.value) callback()
                else if (!String(value || '').trim()) callback(new Error('请至少选择一个话题标签'))
                else callback()
            },
            trigger: 'change'
        }
    ],
    content: [
        {
            validator: (_rule, value, callback) => {
                if (form.postType === POST_TYPE.TEXT && !String(value || '').trim()) callback(new Error('纯文字模式下正文不能为空'))
                else callback()
            },
            trigger: ['blur', 'change']
        }
    ],
    files: [
        {
            validator: (_rule, _value, callback) => {
                if (form.postType !== POST_TYPE.TEXT && !currentMediaUrls.value.length) callback(new Error('请上传素材文件'))
                else callback()
            },
            trigger: 'change'
        }
    ]
}

const goDiscover = () => {
    router.push('/discover')
}

const handleSideNavClick = (key: string) => {
    if (key === 'discover') router.push('/discover')
    if (key === 'profile') router.push('/profile')
}

const handleTypeChange = async (nextType: string) => {
    form.postType = nextType
    imageUrls.value = ''
    videoUrls.value = ''
    videoBatchContents.value = []
    videoBatchErrorIndexes.value = []
    videoBatchTagIds.value = []
    videoBatchTagErrorIndexes.value = []
    batchPreviewIndex.value = 0
    videoCoverPreviewUrl.value = ''
    editorRef.value?.clearUploaders()
    videoAutoDescription.value = ''
    isVideoContentAutoFilled.value = false
    await nextTick()
    editorRef.value?.clearValidate()
}

const handleVideoCoverChange = (url: string) => {
    videoCoverPreviewUrl.value = String(url || '')
}

watch(
    () => selectedTagIds.value.slice(),
    ids => {
        if (isBatchVideoMode.value) return
        const nextTagStr = ids.join(',')
        if (form.tagStr === nextTagStr) return
        form.tagStr = nextTagStr
        if (suppressTagValidate.value) return
        nextTick(() => editorRef.value?.validateField('tagStr'))
    }
)

watch(
    () => currentMediaUrls.value.length,
    len => {
        if (form.postType === POST_TYPE.TEXT) return
        if (len > 0) nextTick(() => editorRef.value?.clearValidate(['files']))
        else nextTick(() => editorRef.value?.validateField('files'))
    }
)

watch(
    () => videoUrls.value,
    (nextVal, prevVal) => {
        if (form.postType !== POST_TYPE.VIDEO) return

        const nextList = normalizeMediaUrls(nextVal)
        const prevList = normalizeMediaUrls(prevVal)
        const previousAutoDescription = videoAutoDescription.value
        syncVideoBatchContents(nextList, prevList)
        if (nextList.length <= 1) batchPreviewIndex.value = 0
        else if (batchPreviewIndex.value >= nextList.length) batchPreviewIndex.value = nextList.length - 1
        const nextAutoDescription = nextList.length > 1 ? '' : resolveVideoAutoDescription(nextList)
        videoAutoDescription.value = nextAutoDescription

        if (nextList.length <= 1) {
            const currentContent = String(form.content || '').trim()
            const previousAuto = previousAutoDescription.trim()
            const shouldAutoFill = !currentContent || isVideoContentAutoFilled.value || currentContent === previousAuto
            if (shouldAutoFill) {
                form.content = nextAutoDescription.trim()
                isVideoContentAutoFilled.value = Boolean(nextAutoDescription.trim())
            }
        } else {
            isVideoContentAutoFilled.value = false
        }

        if (!nextList.length) {
            videoBatchErrorIndexes.value = []
            videoBatchTagErrorIndexes.value = []
            nextTick(() => editorRef.value?.clearValidate(['content']))
        }
    }
)

watch(
    () => videoBatchContents.value.slice(),
    list => {
        if (!videoBatchErrorIndexes.value.length) return
        const nextErrors = videoBatchErrorIndexes.value.filter(index => !String(list[index] || '').trim())
        if (nextErrors.length !== videoBatchErrorIndexes.value.length) videoBatchErrorIndexes.value = nextErrors
    }
)

watch(
    () => videoBatchTagIds.value.map(ids => (Array.isArray(ids) ? ids.join(',') : '')).join('|'),
    () => {
        if (!videoBatchTagErrorIndexes.value.length) return
        const nextErrors = videoBatchTagErrorIndexes.value.filter(index => {
            const ids = videoBatchTagIds.value[index]
            return !Array.isArray(ids) || ids.length === 0
        })
        if (nextErrors.length !== videoBatchTagErrorIndexes.value.length) videoBatchTagErrorIndexes.value = nextErrors
    }
)

watch(showMobileDownloadPrompt, value => {
    if (value) {
        void loadLatestAppVersion()
    } else if (!interestTree.value.length) {
        void loadInterest()
    }
})

const loadInterest = async () => {
    interestLoading.value = true
    try {
        const res = await getInterestAll()
        interestTree.value = (res as any)?.data || res || []
    } finally {
        interestLoading.value = false
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
        if (!silent) {
            proxy?.$modal?.msgError?.('获取最新版本失败，请稍后重试')
        }
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

const handleContentInput = () => {
    if (form.postType === POST_TYPE.VIDEO && !isBatchVideoMode.value) {
        isVideoContentAutoFilled.value = String(form.content || '').trim() === videoAutoDescription.value.trim()
    }
    if (form.postType === POST_TYPE.TEXT) nextTick(() => editorRef.value?.validateField('content'))
    else nextTick(() => editorRef.value?.clearValidate(['content']))
}

const resolveSubmitErrorMessage = (error: unknown, fallback = '发布失败，请重试') => {
    const message = String((error as any)?.message || '').trim()
    if (!message) return fallback
    if (message.toLowerCase().includes('timeout')) return '请求超时，请稍后重试'
    return message
}

const handleSubmit = async () => {
    if (editorRef.value?.isUploading?.()) {
        proxy?.$modal?.msgWarning?.('素材上传中，请稍后再发布')
        return
    }

    const ok = (await editorRef.value?.validateForm()) ?? false
    if (!ok) return

    const mediaUrls = currentMediaUrls.value
    if (form.postType !== POST_TYPE.TEXT && mediaUrls.length === 0) {
        proxy?.$modal?.msgError(form.postType === POST_TYPE.IMAGE ? '请至少上传一张图片' : '请上传视频')
        return
    }

    const isBatchVideoPost = form.postType === POST_TYPE.VIDEO && mediaUrls.length > 1
    const batchContents = mediaUrls.map((_, index) => String(videoBatchContents.value[index] || '').trim())
    const batchTagStrList = mediaUrls.map((_, index) => {
        const ids = videoBatchTagIds.value[index]
        if (!Array.isArray(ids)) return ''
        return ids
            .map(id => String(id || '').trim())
            .filter(Boolean)
            .join(',')
    })

    const emptyContentIndexes = isBatchVideoPost
        ? batchContents
              .map((content, index) => ({ content, index }))
              .filter(item => !item.content)
              .map(item => item.index)
        : []
    const emptyTagIndexes = isBatchVideoPost
        ? batchTagStrList
              .map((tagStr, index) => ({ tagStr, index }))
              .filter(item => !item.tagStr)
              .map(item => item.index)
        : []

    if (emptyContentIndexes.length > 0 || emptyTagIndexes.length > 0) {
        videoBatchErrorIndexes.value = emptyContentIndexes
        videoBatchTagErrorIndexes.value = emptyTagIndexes
        if (emptyContentIndexes.length > 0) {
            const previewIndexes = emptyContentIndexes.slice(0, 6).map(index => index + 1)
            const suffix = emptyContentIndexes.length > 6 ? ' 等' : ''
            proxy?.$modal?.msgError(`请填写第 ${previewIndexes.join('、')} 条视频的正文${suffix}`)
        } else {
            const previewIndexes = emptyTagIndexes.slice(0, 6).map(index => index + 1)
            const suffix = emptyTagIndexes.length > 6 ? ' 等' : ''
            proxy?.$modal?.msgError(`请为第 ${previewIndexes.join('、')} 条视频选择标签${suffix}`)
        }
        return
    }

    videoBatchErrorIndexes.value = []
    videoBatchTagErrorIndexes.value = []

    try {
        await proxy?.$modal?.confirm(isBatchVideoPost ? `确认批量发布这 ${mediaUrls.length} 条视频动态吗？` : '确认发布这条内容吗？')
    } catch {
        return
    }

    submitting.value = true
    try {
        const videoFiles = form.postType === POST_TYPE.VIDEO ? editorRef.value?.getVideoRawFiles() || [] : []

        if (isBatchVideoPost) {
            let successCount = 0
            const failedIndexes: number[] = []
            let firstErrorMessage = ''

            for (let index = 0; index < mediaUrls.length; index += 1) {
                const mediaUrl = String(mediaUrls[index] || '').trim()
                if (!mediaUrl) {
                    failedIndexes.push(index + 1)
                    continue
                }

                const currentFile = videoFiles[index]
                const files = currentFile instanceof File ? [currentFile] : []

                try {
                    await addPost({
                        postType: form.postType,
                        content: batchContents[index],
                        mediaUrls: [mediaUrl],
                        files,
                        coverFile: null,
                        originalPostId: 0,
                        tags: batchTagStrList[index],
                        circleId: '',
                        isQuestion: '0'
                    })
                    successCount += 1
                } catch (error) {
                    if (!firstErrorMessage) firstErrorMessage = resolveSubmitErrorMessage(error)
                    console.error(error)
                    failedIndexes.push(index + 1)
                }
            }

            if (!failedIndexes.length) {
                markContentListRefreshNeeded()
                proxy?.$modal?.msgSuccess?.(`批量发布成功，共 ${successCount} 条`)
                await handleReset()
                return
            }

            if (successCount > 0) {
                markContentListRefreshNeeded()
                proxy?.$modal?.msgWarning?.(`批量发布完成：成功 ${successCount} 条，失败 ${failedIndexes.length} 条（第 ${failedIndexes.join('、')} 条）`)
                return
            }

            proxy?.$modal?.msgError?.(firstErrorMessage || '批量发布失败，请重试')
            return
        }

        const videoCoverFile = form.postType === POST_TYPE.VIDEO ? editorRef.value?.getVideoCoverFile?.() || null : null
        await addPost({
            postType: form.postType,
            content: buildSubmitContent(),
            mediaUrls,
            files: videoFiles,
            coverFile: videoCoverFile,
            originalPostId: 0,
            tags: form.tagStr,
            circleId: '',
            isQuestion: '0'
        })

        markContentListRefreshNeeded()
        proxy?.$modal?.msgSuccess?.('发布成功')
        await handleReset()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.(resolveSubmitErrorMessage(error))
    } finally {
        submitting.value = false
    }
}

const handleReset = async () => {
    suppressTagValidate.value = true
    imageUrls.value = ''
    videoUrls.value = ''
    videoBatchContents.value = []
    videoBatchErrorIndexes.value = []
    videoBatchTagIds.value = []
    videoBatchTagErrorIndexes.value = []
    batchPreviewIndex.value = 0
    videoCoverPreviewUrl.value = ''
    editorRef.value?.clearUploaders()
    selectedTagIds.value = []
    videoAutoDescription.value = ''
    isVideoContentAutoFilled.value = false

    editorRef.value?.resetFields()
    Object.assign(form, initialForm)

    await nextTick()
    editorRef.value?.clearValidate()

    await nextTick()
    suppressTagValidate.value = false
}

onMounted(() => {
    settingsStore.setTitle('测吧')
    document.title = '测吧'
    bindMobileViewport()
    if (showMobileDownloadPrompt.value) {
        void loadLatestAppVersion()
    } else {
        void loadInterest()
    }
})

onBeforeUnmount(() => {
    unbindMobileViewport()
    submitting.value = false
})
</script>

<style lang="scss" scoped>
.client-publish-page {
    --header-height: 64px;
    --sidebar-width: 244px;
    --layout-gap: 32px;
    --content-max-width: 1760px;
    --page-x: 32px;

    min-height: 100vh;
    background-color: var(--bg-color);
    font-family:
        'PingFang SC',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        'Helvetica Neue',
        Arial,
        sans-serif;
    color: var(--text-main);
}

.page-main {
    padding-top: calc(var(--header-height) + 24px);
    padding-bottom: 40px;
    display: flex;
    justify-content: center;
}

.main-inner {
    width: 100%;
    max-width: var(--content-max-width);
    padding: 0 var(--page-x);
    display: flex;
    align-items: flex-start;
    gap: var(--layout-gap);
}

.left-sidebar {
    width: var(--sidebar-width);
    flex-shrink: 0;
    background: transparent;
    padding: 0;
    margin-bottom: 0;
    border: 0;
    border-left: 0;
    border-radius: 0;
    line-height: normal;
    font-size: inherit;
    color: inherit;
}

.sidebar-sticky-container {
    position: fixed;
    left: max(var(--page-x), calc((100vw - var(--content-max-width)) / 2 + var(--page-x)));
    top: calc(var(--header-height) + 24px);
    width: var(--sidebar-width);
    max-height: calc(100vh - var(--header-height) - var(--layout-gap) - 32px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
    overflow-y: auto;
    scrollbar-width: none;
}

.sidebar-nav,
.tips-card {
    background: transparent;
    border-radius: 0;
    border: 0;
    box-shadow: none;
}

.sidebar-nav {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 48px;
    padding: 0 18px;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: var(--text-regular);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    transition:
        background-color var(--app-motion-fast),
        color var(--app-motion-fast);
}

.nav-item:hover {
    background: var(--bg-color);
    color: var(--text-main);
}

.nav-item.active {
    background: var(--client-active-bg);
    color: var(--client-active-text);
    font-weight: 700;
}

.nav-item.active .nav-icon {
    color: var(--client-active-text);
}

.nav-icon {
    font-size: 22px;
}

.sidebar-footer {
    display: none;
}

.tips-card {
    padding: 24px;
}

.tips-title {
    margin: 0 0 16px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-main);
}

.tips-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tips-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 13px;
    color: var(--text-regular);
    line-height: 1.6;
}

.icon-wrapper {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.icon-wrapper svg {
    font-size: 14px;
    color: var(--text-minor);
}

.content-area {
    flex: 1;
    min-width: 0;
}

.publish-workspace {
    flex-direction: column;
    display: flex;
    gap: 18px;
    max-width: 1120px;
}

.publish-status-bar {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    border-bottom: 1px solid var(--client-border-soft);
}

.publish-status-item {
    min-width: 0;
    padding: 0 18px 16px;
    border-left: 1px solid var(--client-border-soft);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.publish-status-item:first-child {
    padding-left: 0;
    border-left: 0;
}

.publish-status-item span {
    color: var(--text-minor);
    font-size: 12px;
    line-height: 1.2;
}

.publish-status-item strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-regular);
    font-size: 14px;
    font-weight: 700;
}

.publish-status-item strong.ready {
    color: var(--client-active-text);
}

.publish-editor-shell {
    min-height: calc(100vh - var(--header-height) - 110px);
}

@media screen and (max-width: 1024px) {
    .main-inner {
        flex-direction: column;
    }

    .left-sidebar {
        width: 100%;
    }

    .sidebar-sticky-container {
        position: relative;
        left: auto;
        top: 0;
        width: auto;
        max-height: none;
        flex-direction: row;
        align-items: stretch;
        overflow: visible;
    }

    .sidebar-nav {
        flex: 1;
        flex-direction: row;
        justify-content: center;
        padding: 0;
    }

    .nav-item {
        flex: 1;
        justify-content: center;
    }

    .sidebar-footer {
        display: none;
    }

    .publish-editor-shell {
        min-height: auto;
    }
}

@media screen and (max-width: 768px) {
    .client-publish-page {
        --layout-gap: 16px;
        --header-height: 56px;
        --page-x: 16px;
    }

    .main-inner {
        padding: 0 var(--page-x);
    }

    .nav-item {
        padding: 10px;
        font-size: 15px;
    }

    .publish-status-bar {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        row-gap: 14px;
    }

    .publish-status-item {
        padding: 0 12px 12px;
    }

    .publish-status-item:nth-child(odd) {
        padding-left: 0;
        border-left: 0;
    }
}
</style>
