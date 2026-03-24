<template>
    <CreatePageShell title="发布内容" subtitle="编辑正文、素材与标签，实时查看移动端展示效果">
        <template #primary>
            <PostEditorPanel
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
        </template>

        <template #secondary>
            <PostPreviewPanel
                :current-time="currentTime"
                :user-avatar="userAvatar"
                :user-nick-name="userNickName"
                :post-type="form.postType"
                :preview-media-list="previewMediaList"
                :preview-video-cover-url="previewVideoCoverUrl"
                :preview-content="previewContent"
                :preview-content-title="previewContentTitle"
                :preview-content-placeholder="previewContentPlaceholder"
                :selected-tag-names="selectedTagNames"
                :batch-preview-enabled="isBatchVideoMode"
                :batch-preview-index="safeBatchPreviewIndex"
                :batch-preview-total="videoMediaUrls.length"
            />
        </template>
    </CreatePageShell>
</template>

<script setup name="ContentPost" lang="ts">
import { ref, reactive, computed, onMounted, watch, getCurrentInstance, onBeforeUnmount, nextTick } from 'vue'
import { addPost } from '@/api/content/post'
import { POST_TYPE } from '@/utils/enum'
import { getInterestAll } from '@/api/content/interest'
import useUserStore from '@/store/modules/user'
import defaultAvatar from '@/assets/images/default-avatar.svg'
import { getImgUrl } from '@/utils/img'
import { markContentListRefreshNeeded } from '@/utils/content/refreshSignal'
import { logSubmitError, resolveSubmitErrorMessage } from '@/utils/submitError'
import CreatePageShell from '@/components/CreatePageShell/index.vue'
import PostEditorPanel from './components/PostEditorPanel.vue'
import PostPreviewPanel from './components/PostPreviewPanel.vue'

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

const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()

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

const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const updateTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    currentTime.value = `${hours}:${minutes}`
}

const userAvatar = computed(() => userStore.avatar || defaultAvatar)
const userNickName = computed(() => userStore.nickName || userStore.name || '未设置昵称')

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
const safeBatchPreviewIndex = computed(() => {
    const maxIndex = Math.max(videoMediaUrls.value.length - 1, 0)
    const raw = Number(batchPreviewIndex.value || 0)
    if (!Number.isFinite(raw)) return 0
    if (raw < 0) return 0
    if (raw > maxIndex) return maxIndex
    return raw
})
const currentMediaUrls = computed(() => {
    if (form.postType === POST_TYPE.IMAGE) return imageMediaUrls.value
    if (form.postType === POST_TYPE.VIDEO) return videoMediaUrls.value
    return []
})
const previewMediaList = computed(() => {
    if (isBatchVideoMode.value) {
        const current = String(videoMediaUrls.value[safeBatchPreviewIndex.value] || '').trim()
        return current ? [getImgUrl(current)] : []
    }
    return currentMediaUrls.value.map(url => getImgUrl(url))
})
const previewVideoCoverUrl = computed(() => (form.postType === POST_TYPE.VIDEO ? videoCoverPreviewUrl.value : ''))

const selectedTagNames = computed(() => {
    if (isBatchVideoMode.value) {
        const ids = videoBatchTagIds.value[safeBatchPreviewIndex.value] || []
        const idSet = new Set((Array.isArray(ids) ? ids : []).map(id => String(id)))
        const tags: { id: number | string; name: string }[] = []
        interestTree.value.forEach((cate: any) => {
            cate.children?.forEach((child: any) => {
                if (idSet.has(String(child.id))) tags.push({ id: child.id, name: child.name })
            })
        })
        return tags
    }
    const tags: { id: number | string; name: string }[] = []
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

const videoDisplayContent = computed(() => {
    const title = videoAutoDescription.value.trim()
    return title || ''
})

const syncSingleVideoContentDisplay = (nextAutoDescription: string, previousAutoDescription: string) => {
    const nextAutoContent = nextAutoDescription.trim()
    const previousAutoContent = previousAutoDescription.trim()
    const currentContent = String(form.content || '').trim()
    const shouldAutoFill = !currentContent || isVideoContentAutoFilled.value || currentContent === previousAutoContent

    if (!shouldAutoFill) return

    form.content = nextAutoContent
    isVideoContentAutoFilled.value = Boolean(nextAutoContent)
}

const previewContent = computed(() => {
    if (isBatchVideoMode.value) {
        const content = String(videoBatchContents.value[safeBatchPreviewIndex.value] || '').trim()
        return content
    }
    const manualContent = String(form.content || '').trim()
    if (manualContent) return manualContent
    if (form.postType === POST_TYPE.VIDEO) return videoDisplayContent.value
    return ''
})

const previewContentTitle = computed(() => {
    const content = previewContent.value
    if (!content) return ''
    return content.length > 20 ? `${content.slice(0, 20)}...` : content
})

const previewContentPlaceholder = computed(() => {
    if (form.postType === POST_TYPE.VIDEO) {
        if (isBatchVideoMode.value) {
            return `当前预览第 ${safeBatchPreviewIndex.value + 1} 条视频，请在左侧对应卡片填写正文和标签`
        }
        return '上传视频后将自动展示视频相关文案，也可自行编辑正文...'
    }
    return '填写正文内容，记录当下的想法...'
})

const buildSubmitContent = (): string => {
    const manualContent = String(form.content || '').trim()
    if (manualContent) return manualContent
    if (form.postType === POST_TYPE.VIDEO) return videoDisplayContent.value
    return ''
}

const rules = {
    postType: [{ required: true, message: '请选择发布类型', trigger: 'change' }],
    tagStr: [
        {
            validator: (rule: any, value: string, callback: any) => {
                if (isBatchVideoMode.value) callback()
                else if (!String(value || '').trim()) callback(new Error('请至少选择一个话题标签'))
                else callback()
            },
            trigger: 'change'
        }
    ],
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

        // 单视频模式下自动把视频名写入正文（仅正文展示，不影响上传文件参数）
        if (nextList.length <= 1) {
            syncSingleVideoContentDisplay(nextAutoDescription, previousAutoDescription)
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
        if (nextErrors.length !== videoBatchErrorIndexes.value.length) {
            videoBatchErrorIndexes.value = nextErrors
        }
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
        if (nextErrors.length !== videoBatchTagErrorIndexes.value.length) {
            videoBatchTagErrorIndexes.value = nextErrors
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
    if (form.postType === POST_TYPE.VIDEO && !isBatchVideoMode.value) {
        isVideoContentAutoFilled.value = String(form.content || '').trim() === videoDisplayContent.value
    }
    if (form.postType === POST_TYPE.TEXT) nextTick(() => editorRef.value?.validateField('content'))
    else nextTick(() => editorRef.value?.clearValidate(['content']))
}

async function handleSubmit() {
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

    if (isBatchVideoPost) {
        videoBatchErrorIndexes.value = []
        videoBatchTagErrorIndexes.value = []
    } else {
        if (videoBatchErrorIndexes.value.length) videoBatchErrorIndexes.value = []
        if (videoBatchTagErrorIndexes.value.length) videoBatchTagErrorIndexes.value = []
    }

    try {
        await proxy?.$modal?.confirm(isBatchVideoPost ? `确认批量发布这 ${mediaUrls.length} 条视频动态吗？` : '确认发布该内容吗？')
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
                    logSubmitError(error)
                    if (!firstErrorMessage) firstErrorMessage = resolveSubmitErrorMessage(error)
                    failedIndexes.push(index + 1)
                }
            }

            if (!failedIndexes.length) {
                markContentListRefreshNeeded()
                proxy?.$modal?.msgSuccess(`批量发布成功，共 ${successCount} 条`)
                await handleReset()
                return
            }

            if (successCount > 0) {
                markContentListRefreshNeeded()
                proxy?.$modal?.msgWarning?.(`批量发布完成：成功 ${successCount} 条，失败 ${failedIndexes.length} 条（第 ${failedIndexes.join('、')} 条）`)
                return
            }

            proxy?.$modal?.msgError(firstErrorMessage || '批量发布失败，请重试')
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
        proxy?.$modal?.msgSuccess('发布成功')
        await handleReset()
    } catch (e) {
        logSubmitError(e)
        proxy?.$modal?.msgError(resolveSubmitErrorMessage(e))
    } finally {
        submitting.value = false
    }
}

async function handleReset() {
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
</script>

<style lang="scss" scoped></style>
