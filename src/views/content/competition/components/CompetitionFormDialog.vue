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
        <div class="competition-detail">
            <el-descriptions :column="2" border class="detail-descriptions">
                <el-descriptions-item label="赛事标题" :span="2">{{ formatDetailValue(form.title) }}</el-descriptions-item>
                <el-descriptions-item label="赛事状态">
                    <el-tag :type="resolveStatusType(form.status)" effect="plain">{{ resolveStatusLabel(form.status) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="是否启用">
                    <el-tag :type="form.isActive === '1' ? 'success' : 'info'" effect="light">
                        {{ form.isActive === '1' ? '启用' : '禁用' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="开始时间">{{ formatDetailTime(form.startTime) }}</el-descriptions-item>
                <el-descriptions-item label="结束时间">{{ formatDetailTime(form.endTime) }}</el-descriptions-item>
                <el-descriptions-item label="投票截止" :span="2">{{ formatDetailTime(form.voteDeadline) }}</el-descriptions-item>
                <el-descriptions-item label="主题照片" :span="2">
                    <el-image
                        v-if="form.themeImage"
                        :src="resolveThemeImageUrl(form.themeImage)"
                        :preview-src-list="[resolveThemeImageUrl(form.themeImage)]"
                        preview-teleported
                        fit="cover"
                        class="detail-image"
                    />
                    <span v-else class="detail-placeholder">暂无</span>
                </el-descriptions-item>
                <el-descriptions-item label="赛事描述" :span="2">
                    <div class="detail-block">{{ formatDetailValue(form.description) }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="创办单位名称" :span="2">
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

    <el-dialog v-else :title="dialogTitle" v-model="open" width="760px" append-to-body class="modern-dialog" destroy-on-close @closed="handleDialogClosed">
        <el-form ref="competitionRef" :model="form" :rules="rules" label-width="110px">
            <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                    <el-form-item label="赛事标题" prop="title">
                        <el-input v-model="form.title" placeholder="请输入赛事标题" maxlength="100" show-word-limit />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12" v-if="isEditMode || isDetailMode">
                    <el-form-item label="赛事状态" prop="status">
                        <el-select v-model="form.status" placeholder="请选择赛事状态" style="width: 100%">
                            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                    <el-form-item label="是否启用" prop="isActive">
                        <el-radio-group v-model="form.isActive">
                            <el-radio value="1">启用</el-radio>
                            <el-radio value="0">禁用</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                    <el-form-item label="开始时间" prop="startTime">
                        <AppDatePicker
                            v-model="form.startTime"
                            type="datetime"
                            value-format="YYYY-MM-DD HH:mm:ss"
                            placeholder="请选择开始时间"
                            style="width: 100%"
                        />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                    <el-form-item label="结束时间" prop="endTime">
                        <AppDatePicker
                            v-model="form.endTime"
                            type="datetime"
                            value-format="YYYY-MM-DD HH:mm:ss"
                            placeholder="请选择结束时间"
                            style="width: 100%"
                        />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                    <el-form-item label="投票截止" prop="voteDeadline">
                        <AppDatePicker
                            v-model="form.voteDeadline"
                            type="datetime"
                            value-format="YYYY-MM-DD HH:mm:ss"
                            placeholder="请选择投票截止时间"
                            style="width: 100%"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="主题照片" prop="themeImage">
                        <ImageUpload
                            v-model="form.themeImage"
                            :limit="1"
                            :is-show-tip="false"
                            :disabled="isDetailMode"
                            oss-type="competitions"
                            class="competition-cover-uploader"
                            :file-type="['png', 'jpg', 'jpeg', 'webp']"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="赛事描述" prop="description">
                        <el-input
                            v-model="form.description"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入赛事描述"
                            maxlength="2000"
                            show-word-limit
                            resize="none"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="创办单位名称" prop="remark">
                        <el-input v-model="form.remark" placeholder="请输入创办单位名称" maxlength="100" show-word-limit />
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
</template>

<script setup lang="ts">
defineOptions({ name: 'ContentCompetitionComponentsCompetitionFormDialog' })
import { computed, getCurrentInstance, reactive, ref, toRefs } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getImgUrl } from '@/utils/img'
import { parseTime } from '@/utils/utils'
import {
    addCompetition,
    getCompetition,
    parseCompetitionDetail,
    updateCompetition,
    type CompetitionForm,
    type CompetitionItem
} from '@/api/content/competition'
import ImageUpload from '@/components/ImageUpload/index.vue'

type DialogMode = 'add' | 'edit' | 'detail'

const emit = defineEmits<{
    (e: 'success'): void
}>()

const { proxy } = getCurrentInstance() as any
const competitionRef = ref<FormInstance>()
const open = ref(false)
const dialogMode = ref<DialogMode>('add')
const submitLoading = ref(false)
const detailLoading = ref(false)

const statusOptions = [
    { label: '未开始', value: '0', type: 'info' },
    { label: '进行中', value: '1', type: 'success' },
    { label: '已结束', value: '2', type: 'warning' }
] as const

const data = reactive({
    form: createDefaultForm()
})

const { form } = toRefs(data)

const isEditMode = computed(() => dialogMode.value === 'edit')
const isDetailMode = computed(() => dialogMode.value === 'detail')
const dialogTitle = computed(() => {
    if (dialogMode.value === 'edit') return '编辑赛事'
    if (dialogMode.value === 'detail') return '赛事详情'
    return '新增赛事'
})

const validateEndTime = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value || !form.value.startTime) {
        callback()
        return
    }
    if (new Date(value).getTime() < new Date(form.value.startTime).getTime()) {
        callback(new Error('结束时间不能早于开始时间'))
        return
    }
    callback()
}

const validateVoteDeadline = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value || !form.value.startTime) {
        callback()
        return
    }
    if (new Date(value).getTime() < new Date(form.value.startTime).getTime()) {
        callback(new Error('投票截止时间不能早于开始时间'))
        return
    }
    callback()
}

const rules: FormRules<CompetitionForm> = {
    title: [{ required: true, message: '赛事标题不能为空', trigger: 'blur' }],
    startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
    endTime: [
        { required: true, message: '结束时间不能为空', trigger: 'change' },
        { validator: validateEndTime, trigger: 'change' }
    ],
    voteDeadline: [
        { required: true, message: '投票截止时间不能为空', trigger: 'change' },
        { validator: validateVoteDeadline, trigger: 'change' }
    ],
    isActive: [{ required: true, message: '请选择是否启用', trigger: 'change' }]
}

function createDefaultForm(): CompetitionForm {
    return {
        id: undefined,
        remark: '',
        title: '',
        themeImage: '',
        description: '',
        startTime: '',
        endTime: '',
        voteDeadline: '',
        status: '0',
        isActive: '1'
    }
}

function normalizeActiveValue(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true'
}

function formatDetailValue(value: unknown): string {
    const text = String(value ?? '').trim()
    return text || '-'
}

function formatDetailTime(value: unknown): string {
    const text = String(value ?? '').trim()
    if (!text) return '-'
    return parseTime(text) || text
}

function resolveStatusLabel(value: unknown): string {
    return statusOptions.find(item => String(item.value) === String(value))?.label || '-'
}

function resolveStatusType(value: unknown) {
    return statusOptions.find(item => String(item.value) === String(value))?.type || 'info'
}

function resolveThemeImageUrl(value?: string) {
    return getImgUrl(String(value || ''))
}

function resolveId(row: CompetitionItem): string | number {
    return row.id ?? row.competitionId ?? ''
}

function normalizeFormPayload(source: CompetitionItem | CompetitionForm): CompetitionForm {
    return {
        ...createDefaultForm(),
        ...source,
        id: source.id ?? (source as CompetitionItem).competitionId,
        title: source.title || (source as CompetitionItem).name || '',
        status: String(source.status ?? '0'),
        isActive: normalizeActiveValue(source.isActive ?? (source as CompetitionItem).active) ? '1' : '0'
    }
}

function reset() {
    form.value = createDefaultForm()
    competitionRef.value?.clearValidate()
}

function openAdd() {
    reset()
    dialogMode.value = 'add'
    open.value = true
}

async function openWithDetail(row: CompetitionItem, mode: DialogMode) {
    const id = resolveId(row)
    if (!id || detailLoading.value) return
    detailLoading.value = true
    try {
        const response = await getCompetition(id)
        form.value = normalizeFormPayload(parseCompetitionDetail(response))
        dialogMode.value = mode
        open.value = true
    } finally {
        detailLoading.value = false
    }
}

function openEdit(row: CompetitionItem) {
    openWithDetail(row, 'edit')
}

function openDetail(row: CompetitionItem) {
    openWithDetail(row, 'detail')
}

function cancel() {
    open.value = false
}

function handleDialogClosed() {
    reset()
}

function submitForm() {
    if (submitLoading.value) return
    competitionRef.value?.validate(async valid => {
        if (!valid) return
        submitLoading.value = true
        try {
            const payload = { ...form.value }
            if (dialogMode.value === 'add') {
                delete payload.id
                delete payload.status
                await addCompetition(payload)
                proxy?.$modal?.msgSuccess?.('新增成功')
            } else {
                await updateCompetition(payload)
                proxy?.$modal?.msgSuccess?.('修改成功')
            }
            open.value = false
            emit('success')
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

.competition-detail {
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
}

.competition-cover-uploader {
    width: 100%;

    :deep(.glass-upload-container) {
        width: 100%;
    }

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

    :deep(.upload-info-bar) {
        display: none;
    }
}
</style>
