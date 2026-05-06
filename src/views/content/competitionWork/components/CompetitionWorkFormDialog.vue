<template>
    <el-drawer
        v-if="isDetailMode"
        :title="dialogTitle"
        v-model="open"
        size="720px"
        append-to-body
        class="modern-drawer"
        destroy-on-close
        @closed="handleDialogClosed"
    >
        <div class="work-detail">
            <el-descriptions :column="2" border class="detail-descriptions">
                <el-descriptions-item label="作品名称" :span="2">{{ formatDetailValue(form.workName) }}</el-descriptions-item>
                <el-descriptions-item label="作者名">{{ formatDetailValue(form.authorName) }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="resolveStatusType(form.status)" effect="light">{{ resolveStatusLabel(form.status) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="媒体类型">{{ resolveMediaTypeLabel(form.mediaType) }}</el-descriptions-item>
                <el-descriptions-item label="作品来源">当前赛事</el-descriptions-item>
                <el-descriptions-item :label="isVideoMedia ? '视频文件' : '作品图片'" :span="2">
                    <template v-if="isVideoMedia">
                        <div v-if="form.mediaUrl" class="detail-media-line">
                            <Icon icon="mdi:video-outline" class="detail-media-icon" />
                            <span class="detail-media-name">{{ resolveMediaDisplayName(form.mediaUrl) }}</span>
                            <el-button type="primary" link @click="previewVideo(form.mediaUrl)">预览视频</el-button>
                        </div>
                        <span v-else class="detail-placeholder">暂无</span>
                    </template>
                    <el-image
                        v-else-if="form.mediaUrl"
                        :src="resolveMediaUrl(form.mediaUrl)"
                        :preview-src-list="[resolveMediaUrl(form.mediaUrl)]"
                        preview-teleported
                        fit="cover"
                        class="detail-image"
                    />
                    <span v-else class="detail-placeholder">暂无</span>
                </el-descriptions-item>
                <el-descriptions-item v-if="isVideoMedia" label="视频封面" :span="2">
                    <el-image
                        v-if="form.coverUrl"
                        :src="resolveMediaUrl(form.coverUrl)"
                        :preview-src-list="[resolveMediaUrl(form.coverUrl)]"
                        preview-teleported
                        fit="cover"
                        class="detail-image"
                    />
                    <span v-else class="detail-placeholder">暂无</span>
                </el-descriptions-item>
                <el-descriptions-item label="作品描述" :span="2">
                    <div class="detail-block">{{ formatDetailValue(form.workDescription) }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">
                    <div class="detail-block">{{ formatDetailValue(form.remark) }}</div>
                </el-descriptions-item>
            </el-descriptions>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="cancel" class="dialog-btn">关闭</el-button>
            </div>
        </template>
    </el-drawer>

    <el-dialog v-else :title="dialogTitle" v-model="open" width="780px" append-to-body class="modern-dialog" destroy-on-close @closed="handleDialogClosed">
        <el-form ref="workRef" :model="form" :rules="rules" label-width="110px">
            <el-row :gutter="20">
                <el-col :xs="24" :md="12" v-if="isAddMode || isDetailMode">
                    <el-form-item label="赛事ID" prop="competitionId">
                        <el-input v-model="form.competitionId" placeholder="请输入赛事ID" />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                    <el-form-item label="作者名" prop="authorName">
                        <el-input v-model="form.authorName" placeholder="请输入作者名" maxlength="50" />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                    <el-form-item label="作品名" prop="workName">
                        <el-input v-model="form.workName" placeholder="请输入作品名" maxlength="100" show-word-limit />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                    <el-form-item label="媒体类型" prop="mediaType">
                        <el-radio-group v-model="form.mediaType">
                            <el-radio value="1">图片</el-radio>
                            <el-radio value="2">视频</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                    <el-form-item label="状态" prop="status">
                        <el-radio-group v-model="form.status">
                            <el-radio value="1">正常</el-radio>
                            <el-radio value="0">下架</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item :label="isVideoMedia ? '视频文件' : '作品图片'" prop="mediaUrl">
                        <template v-if="isVideoMedia">
                            <FileUpload
                                ref="videoUploadRef"
                                v-model="form.mediaUrl"
                                :limit="1"
                                :is-show-tip="false"
                                :hide-when-reach-limit="true"
                                oss-type="competition-works"
                                class="work-video-uploader"
                                :file-size="200"
                                :file-type="['mp4', 'mov', 'm4v', 'webm']"
                            />
                            <div v-if="form.mediaUrl" class="media-preview">
                                <Icon icon="mdi:video-outline" class="media-preview-icon" />
                                <span class="media-preview-name">{{ resolveMediaDisplayName(form.mediaUrl) }}</span>
                                <el-button type="primary" link @click="previewVideo(form.mediaUrl)">预览视频</el-button>
                            </div>
                        </template>
                        <ImageUpload
                            v-else
                            v-model="form.mediaUrl"
                            :limit="1"
                            :is-show-tip="false"
                            :disabled="isDetailMode"
                            oss-type="competition-works"
                            class="work-media-uploader"
                            :file-type="['png', 'jpg', 'jpeg', 'webp']"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="24" v-if="isVideoMedia">
                    <el-form-item label="视频封面" prop="coverUrl">
                        <div class="video-cover-panel">
                            <el-radio-group v-model="coverSourceMode" class="cover-source-group" @change="handleCoverSourceChange">
                                <el-radio-button value="auto">自动截取首帧</el-radio-button>
                                <el-radio-button value="manual">手动选择帧</el-radio-button>
                            </el-radio-group>

                            <div v-if="coverSourceMode === 'auto'" class="auto-cover-box">
                                <div class="auto-cover-main">
                                    <el-image
                                        v-if="form.coverUrl"
                                        :src="resolveMediaUrl(form.coverUrl)"
                                        :preview-src-list="[resolveMediaUrl(form.coverUrl)]"
                                        preview-teleported
                                        fit="cover"
                                        class="auto-cover-preview"
                                    />
                                    <div v-else class="auto-cover-empty">
                                        <Icon icon="mdi:image-auto-adjust" />
                                        <span>{{ isGeneratingCover ? '正在生成封面...' : '上传视频后自动生成封面' }}</span>
                                    </div>
                                    <el-button type="primary" plain :loading="isGeneratingCover" :disabled="!form.mediaUrl" @click="generateVideoCover(true)">
                                        重新截取
                                    </el-button>
                                </div>
                                <div class="form-tip">自动从视频首帧生成封面；如首帧不合适，可切换为手动选择帧。</div>
                            </div>

                            <div v-else class="manual-cover-box">
                                <video
                                    v-if="videoCoverSourceUrl"
                                    ref="videoCoverRef"
                                    :src="videoCoverSourceUrl"
                                    class="cover-picker-video"
                                    controls
                                    preload="metadata"
                                    controlslist="nodownload noplaybackrate"
                                    disablepictureinpicture
                                    @contextmenu.prevent
                                ></video>
                                <div v-else class="auto-cover-empty">
                                    <Icon icon="mdi:video-outline" />
                                    <span>上传视频后可选择封面帧</span>
                                </div>
                                <div class="manual-cover-actions">
                                    <el-button
                                        type="primary"
                                        plain
                                        :loading="isGeneratingCover"
                                        :disabled="!videoCoverSourceUrl"
                                        @click="captureCurrentFrame(true)"
                                    >
                                        {{ form.coverUrl ? '重新选择当前帧' : '使用当前帧作为封面' }}
                                    </el-button>
                                    <el-image
                                        v-if="form.coverUrl"
                                        :src="resolveMediaUrl(form.coverUrl)"
                                        :preview-src-list="[resolveMediaUrl(form.coverUrl)]"
                                        preview-teleported
                                        fit="cover"
                                        class="manual-cover-preview"
                                    />
                                </div>
                                <div class="form-tip">拖动视频到合适画面后，点击按钮将当前帧作为封面。</div>
                            </div>
                        </div>
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="作品描述" prop="workDescription">
                        <el-input
                            v-model="form.workDescription"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入作品描述"
                            maxlength="2000"
                            show-word-limit
                            resize="none"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="备注" prop="remark">
                        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="500" show-word-limit resize="none" />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="cancel" class="dialog-btn">取消</el-button>
                <el-button type="primary" :loading="submitLoading" @click="submitForm" class="dialog-btn">确定</el-button>
            </div>
        </template>
    </el-dialog>

    <el-dialog v-model="videoPreviewVisible" title="视频预览" width="720px" append-to-body class="modern-dialog">
        <video v-if="videoPreviewUrl" :src="resolveMediaUrl(videoPreviewUrl)" controls class="video-preview"></video>
    </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'ContentCompetitionWorkComponentsCompetitionWorkFormDialog' })
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, reactive, ref, shallowRef, toRefs, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { uploadFilesToOss } from '@/api/content/post'
import {
    addCompetitionWork,
    getCompetitionWork,
    parseCompetitionWorkDetail,
    updateCompetitionWork,
    type CompetitionWorkForm,
    type CompetitionWorkItem
} from '@/api/content/competition'
import FileUpload from '@/components/FileUpload/index.vue'
import ImageUpload from '@/components/ImageUpload/index.vue'
import { buildVideoCoverFile, normalizeStoragePath } from '@/utils/content/postMedia'

type DialogMode = 'add' | 'edit' | 'detail'

const emit = defineEmits<{
    (e: 'success'): void
}>()

const { proxy } = getCurrentInstance() as any
const workRef = ref<FormInstance>()
const videoUploadRef = shallowRef<any>()
const videoCoverRef = ref<HTMLVideoElement>()
const open = ref(false)
const dialogMode = ref<DialogMode>('add')
const submitLoading = ref(false)
const detailLoading = ref(false)
const videoPreviewVisible = ref(false)
const videoPreviewUrl = ref('')
const fileBaseUrl = String(import.meta.env.VITE_APP_FILE_BASE_URL || '').trim()
const coverSourceMode = ref<'auto' | 'manual'>('auto')
const isGeneratingCover = ref(false)
const autoCoverMediaUrl = ref('')
const videoCoverSourceUrl = ref('')
let videoCoverObjectUrl = ''

const data = reactive({
    form: createDefaultForm()
})

const { form } = toRefs(data)
const isAddMode = computed(() => dialogMode.value === 'add')
const isEditMode = computed(() => dialogMode.value === 'edit')
const isDetailMode = computed(() => dialogMode.value === 'detail')
const isVideoMedia = computed(() => String(form.value.mediaType) === '2')
const dialogTitle = computed(() => {
    if (dialogMode.value === 'edit') return '编辑作品'
    if (dialogMode.value === 'detail') return '作品详情'
    return '新增作品'
})

const rules: FormRules<CompetitionWorkForm> = {
    competitionId: [{ required: true, message: '赛事ID不能为空', trigger: 'blur' }],
    authorName: [{ required: true, message: '作者名不能为空', trigger: 'blur' }],
    workName: [{ required: true, message: '作品名不能为空', trigger: 'blur' }],
    mediaType: [{ required: true, message: '请选择媒体类型', trigger: 'change' }],
    mediaUrl: [{ required: true, message: '媒体地址不能为空', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const statusOptions = [
    { label: '正常', value: '1', type: 'success' },
    { label: '下架', value: '0', type: 'info' }
] as const

const mediaTypeOptions = [
    { label: '图片', value: '1' },
    { label: '视频', value: '2' }
] as const

function createDefaultForm(): CompetitionWorkForm {
    return {
        id: undefined,
        remark: '',
        competitionId: undefined,
        authorName: '',
        workName: '',
        workDescription: '',
        mediaUrl: '',
        mediaType: '1',
        coverUrl: '',
        status: '1'
    }
}

function resolveId(row: CompetitionWorkItem): string | number {
    return row.id ?? row.workId ?? ''
}

function normalizeFormPayload(source: CompetitionWorkItem | CompetitionWorkForm): CompetitionWorkForm {
    return {
        ...createDefaultForm(),
        ...source,
        id: source.id ?? (source as CompetitionWorkItem).workId,
        mediaType: String(source.mediaType ?? '1'),
        status: String(source.status ?? '1')
    }
}

function resolveMediaUrl(value?: string) {
    const raw = String(value || '').trim()
    if (!raw) return ''
    if (/^(https?:)?\/\//i.test(raw) || /^(blob|data|file):/i.test(raw)) {
        return raw.startsWith('//') ? `${window.location.protocol}${raw}` : raw
    }
    if (!fileBaseUrl) return raw
    return `${fileBaseUrl.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`
}

function resolveMediaDisplayName(value?: string): string {
    const raw = String(value || '').trim()
    if (!raw) return '视频文件'
    const clean = raw.split('?')[0].split('#')[0]
    const filename = clean.slice(clean.lastIndexOf('/') + 1)
    if (!filename) return '视频文件'
    try {
        return decodeURIComponent(filename)
    } catch {
        return filename
    }
}

function formatDetailValue(value: unknown): string {
    const text = String(value ?? '').trim()
    return text || '-'
}

function resolveStatusLabel(value: unknown): string {
    return statusOptions.find(item => String(item.value) === String(value))?.label || '-'
}

function resolveStatusType(value: unknown) {
    return statusOptions.find(item => String(item.value) === String(value))?.type || 'info'
}

function resolveMediaTypeLabel(value: unknown): string {
    return mediaTypeOptions.find(item => String(item.value) === String(value))?.label || '-'
}

function reset() {
    form.value = createDefaultForm()
    coverSourceMode.value = 'auto'
    isGeneratingCover.value = false
    autoCoverMediaUrl.value = ''
    videoCoverSourceUrl.value = ''
    revokeVideoCoverSourceObjectUrl()
    workRef.value?.clearValidate()
}

function openAdd(competitionId?: string | number) {
    reset()
    if (competitionId) form.value.competitionId = competitionId
    dialogMode.value = 'add'
    open.value = true
}

async function openWithDetail(row: CompetitionWorkItem, mode: DialogMode) {
    const id = resolveId(row)
    if (!id || detailLoading.value) return
    detailLoading.value = true
    try {
        const response = await getCompetitionWork(id)
        const nextForm = normalizeFormPayload(parseCompetitionWorkDetail(response))
        coverSourceMode.value = nextForm.coverUrl ? 'manual' : 'auto'
        autoCoverMediaUrl.value = ''
        form.value = nextForm
        await nextTick()
        syncVideoCoverSource()
        dialogMode.value = mode
        open.value = true
    } finally {
        detailLoading.value = false
    }
}

function openEdit(row: CompetitionWorkItem) {
    openWithDetail(row, 'edit')
}

function openDetail(row: CompetitionWorkItem) {
    openWithDetail(row, 'detail')
}

function cancel() {
    open.value = false
}

function handleDialogClosed() {
    reset()
}

function previewVideo(url?: string) {
    videoPreviewUrl.value = String(url || '')
    videoPreviewVisible.value = Boolean(videoPreviewUrl.value)
}

function getVideoRawFile(): File | null {
    const files = videoUploadRef.value?.getRawFiles?.()
    const file = Array.isArray(files) ? files[0] : null
    return file instanceof File ? file : null
}

function revokeVideoCoverSourceObjectUrl() {
    if (!videoCoverObjectUrl) return
    URL.revokeObjectURL(videoCoverObjectUrl)
    videoCoverObjectUrl = ''
}

function syncVideoCoverSource() {
    revokeVideoCoverSourceObjectUrl()
    const rawFile = getVideoRawFile()
    if (rawFile) {
        videoCoverObjectUrl = URL.createObjectURL(rawFile)
        videoCoverSourceUrl.value = videoCoverObjectUrl
        return
    }

    const mediaUrl = String(form.value.mediaUrl || '').trim()
    videoCoverSourceUrl.value = mediaUrl ? resolveMediaUrl(mediaUrl) : ''
}

async function uploadCoverFile(coverFile: File): Promise<string> {
    const uploaded = await uploadFilesToOss('2', [coverFile], 'competition-works')
    const coverUrl = normalizeStoragePath(String(uploaded?.[0] || '').trim())
    if (!coverUrl) throw new Error('视频封面上传失败')
    return coverUrl
}

async function generateVideoCover(force = false) {
    const mediaUrl = String(form.value.mediaUrl || '').trim()
    if (!mediaUrl || !isVideoMedia.value || isGeneratingCover.value) return
    if (!force && autoCoverMediaUrl.value === mediaUrl && form.value.coverUrl) return

    isGeneratingCover.value = true
    try {
        const coverFile = await buildVideoCoverFile({ file: getVideoRawFile() || undefined, mediaUrl })
        if (!coverFile) throw new Error('视频首帧生成失败')
        form.value.coverUrl = await uploadCoverFile(coverFile)
        autoCoverMediaUrl.value = mediaUrl
        workRef.value?.validateField('coverUrl').catch(() => {})
        if (force) proxy?.$modal?.msgSuccess?.('封面生成成功')
    } catch (error) {
        console.error(error)
        if (force) {
            proxy?.$modal?.msgError?.('自动截取封面失败，请切换为手动上传')
        }
    } finally {
        isGeneratingCover.value = false
    }
}

async function captureCurrentFrame(showMessage = true) {
    const video = videoCoverRef.value
    if (!video || !videoCoverSourceUrl.value) {
        if (showMessage) proxy?.$modal?.msgWarning?.('请先上传视频')
        return
    }
    if (video.readyState < 2) {
        if (showMessage) proxy?.$modal?.msgWarning?.('视频加载中，请稍后再试')
        return
    }

    isGeneratingCover.value = true
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
        form.value.coverUrl = await uploadCoverFile(coverFile)
        autoCoverMediaUrl.value = ''
        workRef.value?.validateField('coverUrl').catch(() => {})
        if (showMessage) proxy?.$modal?.msgSuccess?.('已选择当前帧作为封面')
    } catch (error) {
        console.error(error)
        if (showMessage) proxy?.$modal?.msgError?.('封面截取失败，请重试')
    } finally {
        isGeneratingCover.value = false
    }
}

function handleCoverSourceChange(value: string | number | boolean | undefined) {
    syncVideoCoverSource()
    if (value === 'auto') {
        generateVideoCover(true)
    }
}

function buildSubmitPayload(): CompetitionWorkForm {
    return {
        id: form.value.id,
        remark: form.value.remark,
        competitionId: form.value.competitionId,
        authorName: form.value.authorName,
        workName: form.value.workName,
        workDescription: form.value.workDescription,
        mediaUrl: form.value.mediaUrl,
        mediaType: form.value.mediaType,
        coverUrl: form.value.coverUrl,
        status: form.value.status
    }
}

function submitForm() {
    if (submitLoading.value) return
    workRef.value?.validate(async valid => {
        if (!valid) return
        submitLoading.value = true
        try {
            const payload = buildSubmitPayload()
            if (dialogMode.value === 'add') {
                delete payload.id
                await addCompetitionWork(payload)
                proxy?.$modal?.msgSuccess?.('新增成功')
            } else {
                delete payload.competitionId
                await updateCompetitionWork(payload)
                proxy?.$modal?.msgSuccess?.('修改成功')
            }
            open.value = false
            emit('success')
        } catch (error) {
            console.error(error)
            proxy?.$modal?.msgError?.(dialogMode.value === 'add' ? '新增失败' : '修改失败')
        } finally {
            submitLoading.value = false
        }
    })
}

defineExpose({
    openAdd,
    openEdit,
    openDetail
})

watch(
    () => [form.value.mediaType, form.value.mediaUrl] as const,
    async ([mediaType, mediaUrl], previous) => {
        const oldMediaUrl = previous?.[1]
        await nextTick()
        syncVideoCoverSource()
        if (String(mediaType) !== '2') return
        if (!mediaUrl || coverSourceMode.value !== 'auto') return
        if (String(mediaUrl) === String(oldMediaUrl || '') && form.value.coverUrl) return
        form.value.coverUrl = ''
        autoCoverMediaUrl.value = ''
        generateVideoCover(false)
    }
)

onBeforeUnmount(() => {
    revokeVideoCoverSourceObjectUrl()
})
</script>

<style scoped lang="scss">
.modern-dialog {
    :deep(.el-dialog__header) {
        padding: 20px 24px 16px;
        margin-right: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .el-dialog__title {
            font-size: 16px;
            font-weight: 600;
        }
    }

    :deep(.el-dialog__body) {
        padding: 24px;
    }

    :deep(.el-dialog__footer) {
        padding: 16px 24px;
        border-top: 1px solid var(--el-border-color-lighter);
    }
}

.modern-drawer {
    :deep(.el-drawer__header) {
        margin-bottom: 0;
        padding: 20px 24px 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        color: var(--el-text-color-primary);
        font-size: 16px;
        font-weight: 600;
    }

    :deep(.el-drawer__body) {
        padding: 24px;
    }

    :deep(.el-drawer__footer) {
        padding: 16px 24px;
        border-top: 1px solid var(--el-border-color-lighter);
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.dialog-btn {
    border-radius: 8px;
    padding: 8px 24px;
    font-weight: 500;
}

.work-detail {
    .detail-descriptions {
        :deep(.el-descriptions__label) {
            width: 110px;
            color: var(--el-text-color-secondary);
            font-weight: 600;
            background: var(--el-fill-color-lighter);
        }

        :deep(.el-descriptions__content) {
            color: var(--el-text-color-primary);
            line-height: 1.7;
        }
    }

    .detail-image {
        width: 148px;
        height: 96px;
        border-radius: 8px;
        display: block;
        background: var(--el-fill-color-light);
        border: 1px solid var(--el-border-color-lighter);
    }

    .detail-placeholder {
        color: var(--el-text-color-placeholder);
    }

    .detail-block {
        min-height: 24px;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .detail-media-line {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .detail-media-icon {
        color: var(--el-color-primary);
        font-size: 18px;
        flex-shrink: 0;
    }

    .detail-media-name {
        min-width: 0;
        flex: 1;
        color: var(--el-text-color-regular);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.work-video-uploader {
    width: 100%;

    :deep(.upload-file-uploader) {
        max-width: 420px;
    }

    :deep(.el-upload-dragger) {
        height: 112px;
    }

    :deep(.upload-file-list) {
        max-width: 420px;
    }
}

.work-media-uploader {
    width: 100%;

    :deep(.upload-wrapper) {
        width: 148px;
    }

    :deep(.el-upload--picture-card),
    :deep(.el-upload-list--picture-card .el-upload-list__item) {
        width: 148px;
        height: 96px;
        border-radius: 8px;
    }

    :deep(.upload-trigger-content) {
        min-height: 96px;
    }
}

.video-cover-panel {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.cover-source-group {
    display: flex;
    flex-wrap: wrap;
}

.auto-cover-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.manual-cover-box {
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.cover-picker-video {
    width: 100%;
    max-height: 260px;
    display: block;
    border-radius: 8px;
    background: #000;
    border: 1px solid var(--el-border-color-lighter);
}

.manual-cover-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.manual-cover-preview {
    width: 96px;
    height: 62px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
}

.auto-cover-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.auto-cover-preview,
.auto-cover-empty {
    width: 148px;
    height: 96px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
}

.auto-cover-empty {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-align: center;

    .iconify,
    svg {
        font-size: 24px;
        color: var(--el-color-primary);
    }
}

.form-tip {
    width: 100%;
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.media-preview {
    margin-top: 8px;
    max-width: 420px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
}

.media-preview-icon {
    color: var(--el-color-primary);
    font-size: 18px;
    flex-shrink: 0;
}

.media-preview-name {
    min-width: 0;
    flex: 1;
    color: var(--el-text-color-regular);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.video-preview {
    width: 100%;
    max-height: 420px;
    display: block;
    background: #000;
    border-radius: 8px;
}
</style>
