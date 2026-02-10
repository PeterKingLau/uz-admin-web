<template>
    <div class="app-container">
        <el-row :gutter="40" class="content-row">
            <el-col :xs="24" :sm="24" :md="14" :lg="15" :xl="16">
                <PostEditorPanel
                    ref="editorRef"
                    :form="form"
                    :rules="rules"
                    v-model:image-urls="imageUrls"
                    v-model:video-urls="videoUrls"
                    v-model:selected-tag-ids="selectedTagIds"
                    :interest-tree="interestTree"
                    :interest-loading="interestLoading"
                    :submitting="submitting"
                    @video-cover-change="handleVideoCoverChange"
                    @change-post-type="handleTypeChange"
                    @content-input="handleContentInput"
                    @submit="handleSubmit"
                    @reset="handleReset"
                />
            </el-col>

            <el-col :xs="24" :sm="24" :md="10" :lg="9" :xl="8">
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
                />
            </el-col>
        </el-row>
    </div>
</template>

<script setup name="ContentPost" lang="ts">
import { ref, reactive, computed, onMounted, watch, getCurrentInstance, onBeforeUnmount, nextTick } from 'vue'
import { addPost } from '@/api/content/post'
import { POST_TYPE } from '@/utils/enum'
import { getInterestAll } from '@/api/content/interest'
import useUserStore from '@/store/modules/user'
import defaultAvatar from '@/assets/images/default-avatar.svg'
import { getImgUrl } from '@/utils/img'
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
const videoCoverPreviewUrl = ref('')
const submitting = ref(false)
const interestTree = ref<any[]>([])
const interestLoading = ref(false)
const selectedTagIds = ref<Array<number | string>>([])
const suppressTagValidate = ref(false)
const videoAutoDescription = ref('')

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
const currentMediaUrls = computed(() => {
    if (form.postType === POST_TYPE.IMAGE) return imageMediaUrls.value
    if (form.postType === POST_TYPE.VIDEO) return videoMediaUrls.value
    return []
})
const previewMediaList = computed(() => currentMediaUrls.value.map(url => getImgUrl(url)))
const previewVideoCoverUrl = computed(() => (form.postType === POST_TYPE.VIDEO ? videoCoverPreviewUrl.value : ''))

const selectedTagNames = computed(() => {
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

const videoDisplayContent = computed(() => {
    const title = videoAutoDescription.value.trim()
    return title ? `视频：${title}` : ''
})

const previewContent = computed(() => {
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

const handleTypeChange = async (nextType: string) => {
    form.postType = nextType
    imageUrls.value = ''
    videoUrls.value = ''
    videoCoverPreviewUrl.value = ''
    editorRef.value?.clearUploaders()
    videoAutoDescription.value = ''
    await nextTick()
    editorRef.value?.clearValidate()
}

const handleVideoCoverChange = (url: string) => {
    videoCoverPreviewUrl.value = String(url || '')
}

watch(
    () => selectedTagIds.value.slice(),
    ids => {
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
    nextVal => {
        if (form.postType !== POST_TYPE.VIDEO) return

        const nextList = normalizeMediaUrls(nextVal)
        videoAutoDescription.value = resolveVideoAutoDescription(nextList)

        if (!nextList.length) {
            nextTick(() => editorRef.value?.validateField('content'))
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
    if (form.postType === POST_TYPE.TEXT) nextTick(() => editorRef.value?.validateField('content'))
    else nextTick(() => editorRef.value?.clearValidate(['content']))
}

async function handleSubmit() {
    const ok = (await editorRef.value?.validateForm()) ?? false
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
        const videoFiles = form.postType === POST_TYPE.VIDEO ? editorRef.value?.getVideoRawFiles() || [] : []
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
    videoCoverPreviewUrl.value = ''
    editorRef.value?.clearUploaders()
    selectedTagIds.value = []
    videoAutoDescription.value = ''

    editorRef.value?.resetFields()
    Object.assign(form, initialForm)

    await nextTick()
    editorRef.value?.clearValidate()

    await nextTick()
    suppressTagValidate.value = false
}
</script>

<style lang="scss" scoped>
.content-row {
    max-width: 1440px;
    margin: 0 auto;
}
</style>
