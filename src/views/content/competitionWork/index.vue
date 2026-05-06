<template>
    <div class="app-container system-crud-page content-competition-work">
        <div class="competition-context">
            <div class="context-main">
                <Icon icon="mdi:trophy-outline" class="context-icon" />
                <div>
                    <div class="context-title">{{ currentCompetitionTitle || '赛事作品管理' }}</div>
                    <div class="context-desc">
                        <template v-if="currentCompetitionId">管理当前赛事下的参赛作品、媒体内容与上下架状态。</template>
                        <template v-else>请从赛事管理列表进入对应赛事的作品管理。</template>
                    </div>
                </div>
            </div>
            <el-button @click="goCompetitionList" class="action-btn">
                <Icon icon="ep:back" class="btn-icon" />
                返回赛事管理
            </el-button>
        </div>

        <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" class="search-form">
            <el-form-item label="作者名" prop="authorName">
                <el-input v-model="queryParams.authorName" placeholder="请输入作者名" clearable style="width: 180px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="作品名" prop="workName">
                <el-input v-model="queryParams.workName" placeholder="请输入作品名" clearable style="width: 200px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 150px">
                    <el-option label="正常" value="1" />
                    <el-option label="下架" value="0" />
                </el-select>
            </el-form-item>
            <el-form-item class="form-actions">
                <el-button type="primary" @click="handleQuery" class="action-btn">
                    <Icon icon="ep:search" class="btn-icon" />
                    查询
                </el-button>
                <el-button @click="resetQuery" class="action-btn">
                    <Icon icon="ep:refresh" class="btn-icon" />
                    重置
                </el-button>
            </el-form-item>
        </el-form>

        <div class="table-wrapper">
            <div class="table-toolbar">
                <div class="left-tools">
                    <el-button
                        type="primary"
                        :disabled="!currentCompetitionId"
                        @click="handleAdd"
                        class="tool-btn"
                        v-hasPermi="['content:competitionWork:add']"
                    >
                        <Icon icon="ep:plus" class="btn-icon" />
                        新增作品
                    </el-button>
                    <el-button type="danger" :disabled="multiple" @click="handleDelete()" class="tool-btn" v-hasPermi="['content:competitionWork:remove']">
                        <Icon icon="ep:delete" class="btn-icon" />
                        批量删除
                    </el-button>
                </div>
                <div class="right-tools">
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
                </div>
            </div>

            <el-table v-loading="loading" :data="workList" @selection-change="handleSelectionChange" class="modern-table" :row-key="resolveId">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="作者名" prop="authorName" min-width="120" show-overflow-tooltip />
                <el-table-column label="作品名" prop="workName" min-width="160" show-overflow-tooltip />
                <el-table-column label="作品描述" prop="workDescription" min-width="220" show-overflow-tooltip />
                <el-table-column label="媒体类型" prop="mediaType" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag :type="resolveMediaType(row).type" effect="plain">{{ resolveMediaType(row).label }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="媒体预览" align="center" width="120">
                    <template #default="{ row }">
                        <el-image
                            v-if="String(row.mediaType) === '1' && row.mediaUrl"
                            :src="resolveMediaUrl(row.mediaUrl)"
                            :preview-src-list="[resolveMediaUrl(row.mediaUrl)]"
                            preview-teleported
                            fit="cover"
                            class="media-thumb"
                        />
                        <el-button v-else-if="String(row.mediaType) === '2' && row.mediaUrl" link type="primary" @click="previewVideo(row.mediaUrl)"
                            >视频预览</el-button
                        >
                        <span v-else class="image-placeholder">暂无</span>
                    </template>
                </el-table-column>
                <el-table-column label="封面图" align="center" width="110">
                    <template #default="{ row }">
                        <el-image
                            v-if="row.coverUrl"
                            :src="resolveMediaUrl(row.coverUrl)"
                            :preview-src-list="[resolveMediaUrl(row.coverUrl)]"
                            preview-teleported
                            fit="cover"
                            class="media-thumb"
                        />
                        <span v-else class="image-placeholder">暂无</span>
                    </template>
                </el-table-column>
                <el-table-column label="票数" align="center" width="90">
                    <template #default="{ row }">{{ resolveNullableNumber(row.voteCount ?? row.votes) }}</template>
                </el-table-column>
                <el-table-column label="排名" align="center" width="90">
                    <template #default="{ row }">{{ resolveNullableNumber(row.rank ?? row.ranking) }}</template>
                </el-table-column>
                <el-table-column label="状态" prop="status" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag :type="resolveStatus(row).type" effect="light">{{ resolveStatus(row).label }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" align="center" width="170">
                    <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="220" fixed="right">
                    <template #default="{ row }">
                        <div class="text-action-group">
                            <el-button link type="primary" @click="handleDetail(row)" class="op-text-btn">
                                <Icon icon="ep:view" class="btn-icon" />
                                详情
                            </el-button>
                            <el-button link type="primary" @click="handleUpdate(row)" class="op-text-btn" v-hasPermi="['content:competitionWork:edit']">
                                <Icon icon="ep:edit" class="btn-icon" />
                                编辑
                            </el-button>
                            <el-button link type="danger" @click="handleDelete(row)" class="op-text-btn" v-hasPermi="['content:competitionWork:remove']">
                                <Icon icon="ep:delete" class="btn-icon" />
                                删除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </div>

        <CompetitionWorkFormDialog ref="workDialogRef" @success="getList" />

        <el-dialog v-model="videoPreviewVisible" title="视频预览" width="720px" append-to-body class="modern-dialog">
            <video v-if="videoPreviewUrl" :src="resolveMediaUrl(videoPreviewUrl)" controls class="video-preview"></video>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ContentCompetitionWork' })
import { computed, getCurrentInstance, reactive, ref, toRefs, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { COMPETITION_WORK_RETURN_PATH_KEY } from '@/router/constants'
import { parseTime } from '@/utils/utils'
import {
    delCompetitionWork,
    getCompetition,
    listCompetitionWork,
    parseCompetitionDetail,
    parseCompetitionWorkRows,
    parseCompetitionWorkTotal,
    type CompetitionItem,
    type CompetitionWorkItem
} from '@/api/content/competition'
import CompetitionWorkFormDialog from './components/CompetitionWorkFormDialog.vue'

type WorkDialogExpose = {
    openAdd: (competitionId?: string | number) => void
    openEdit: (row: CompetitionWorkItem) => void
    openDetail: (row: CompetitionWorkItem) => void
}

const { proxy } = getCurrentInstance() as any
const route = useRoute()
const router = useRouter()
const queryRef = ref<FormInstance>()
const workDialogRef = ref<WorkDialogExpose>()
const workList = ref<CompetitionWorkItem[]>([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref<Array<string | number>>([])
const multiple = ref(true)
const total = ref(0)
const videoPreviewVisible = ref(false)
const videoPreviewUrl = ref('')
const competitionInfo = ref<CompetitionItem | null>(null)
const fileBaseUrl = String(import.meta.env.VITE_APP_FILE_BASE_URL || '').trim()

const data = reactive({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        competitionId: resolveRouteCompetitionId(),
        authorName: undefined as string | undefined,
        workName: undefined as string | undefined,
        status: undefined as string | undefined
    }
})

const { queryParams } = toRefs(data)
const currentCompetitionId = computed(() => String(queryParams.value.competitionId ?? '').trim())
const currentCompetitionTitle = computed(() => resolveCompetitionTitle(competitionInfo.value))

function resolveRouteCompetitionId() {
    const value = route.params.competitionId
    const raw = Array.isArray(value) ? value[0] : value
    const text = String(raw ?? '').trim()
    return text || undefined
}

function resolveCompetitionTitle(row?: CompetitionItem | null): string {
    return String(row?.title || row?.name || '').trim()
}

function loadCompetition() {
    const competitionId = currentCompetitionId.value
    if (!competitionId) {
        competitionInfo.value = null
        return
    }
    getCompetition(competitionId)
        .then(response => {
            competitionInfo.value = parseCompetitionDetail(response)
        })
        .catch(() => {
            competitionInfo.value = null
        })
}

function resolveId(row: CompetitionWorkItem): string | number {
    return row.id ?? row.workId ?? ''
}

function resolveMediaType(row: CompetitionWorkItem) {
    return String(row.mediaType) === '2' ? { label: '视频', type: 'warning' } : { label: '图片', type: 'success' }
}

function resolveStatus(row: CompetitionWorkItem) {
    return String(row.status) === '0' ? { label: '下架', type: 'info' } : { label: '正常', type: 'success' }
}

function resolveNullableNumber(value: unknown) {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : '-'
}

function formatTime(value?: string) {
    return value ? parseTime(value) : '-'
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

function buildListParams() {
    const competitionIdText = String(queryParams.value.competitionId ?? '').trim()
    const competitionId = Number(competitionIdText)
    return {
        pageNum: queryParams.value.pageNum,
        pageSize: queryParams.value.pageSize,
        ...(competitionIdText && Number.isFinite(competitionId) ? { competitionId } : {}),
        ...(String(queryParams.value.authorName || '').trim() ? { authorName: String(queryParams.value.authorName).trim() } : {}),
        ...(String(queryParams.value.workName || '').trim() ? { workName: String(queryParams.value.workName).trim() } : {}),
        ...(String(queryParams.value.status || '').trim() ? { status: String(queryParams.value.status).trim() } : {})
    }
}

function getList() {
    if (!currentCompetitionId.value) {
        workList.value = []
        total.value = 0
        return
    }
    loading.value = true
    listCompetitionWork(buildListParams())
        .then(response => {
            const rows = parseCompetitionWorkRows(response)
            workList.value = rows
            total.value = parseCompetitionWorkTotal(response, rows)
        })
        .catch(error => {
            workList.value = []
            total.value = 0
            proxy?.$modal?.msgError?.(error?.message || '作品列表查询失败')
        })
        .finally(() => {
            loading.value = false
        })
}

function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
}

function resetQuery() {
    queryRef.value?.resetFields()
    queryParams.value.competitionId = currentCompetitionId.value
    handleQuery()
}

function handleSelectionChange(selection: CompetitionWorkItem[]) {
    ids.value = selection.map(item => resolveId(item)).filter(Boolean)
    multiple.value = selection.length === 0
}

function handleAdd() {
    workDialogRef.value?.openAdd(currentCompetitionId.value)
}

function handleDetail(row: CompetitionWorkItem) {
    workDialogRef.value?.openDetail(row)
}

function handleUpdate(row: CompetitionWorkItem) {
    workDialogRef.value?.openEdit(row)
}

function handleDelete(row?: CompetitionWorkItem) {
    const targetIds = row ? [resolveId(row)].filter(Boolean) : ids.value
    if (!targetIds.length) return
    proxy?.$modal
        ?.confirm?.(`是否确认删除作品编号为 "${targetIds.join(',')}" 的数据项？`)
        .then(() => delCompetitionWork(targetIds))
        .then(() => {
            const removedCount = targetIds.length
            if (workList.value.length <= removedCount && queryParams.value.pageNum > 1) {
                queryParams.value.pageNum -= 1
            }
            getList()
            proxy?.$modal?.msgSuccess?.('删除成功')
        })
        .catch(() => {})
}

function previewVideo(url?: string) {
    videoPreviewUrl.value = String(url || '')
    videoPreviewVisible.value = Boolean(videoPreviewUrl.value)
}

function resolveRouteText(value: unknown): string {
    const raw = Array.isArray(value) ? value[0] : value
    return String(raw ?? '').trim()
}

function getReturnPathStorageKey(competitionId?: string) {
    return competitionId ? `${COMPETITION_WORK_RETURN_PATH_KEY}:${competitionId}` : COMPETITION_WORK_RETURN_PATH_KEY
}

function getStoredReturnPath(): string {
    if (typeof window === 'undefined') return ''
    return (
        window.sessionStorage.getItem(getReturnPathStorageKey(currentCompetitionId.value)) ||
        window.sessionStorage.getItem(COMPETITION_WORK_RETURN_PATH_KEY) ||
        ''
    )
}

function rememberReturnPath() {
    if (typeof window === 'undefined') return
    const returnPath = resolveRouteText(route.query.returnPath)
    if (!returnPath) return
    window.sessionStorage.setItem(COMPETITION_WORK_RETURN_PATH_KEY, returnPath)
    if (currentCompetitionId.value) {
        window.sessionStorage.setItem(getReturnPathStorageKey(currentCompetitionId.value), returnPath)
    }
}

function goCompetitionList() {
    const returnPath = resolveRouteText(route.query.returnPath)
    const storedReturnPath = getStoredReturnPath()
    const activeMenu = resolveRouteText((route.meta as { activeMenu?: unknown }).activeMenu)
    const targetPath = returnPath || storedReturnPath || activeMenu

    if (targetPath) {
        proxy?.$tab?.closeOpenPage?.({ path: targetPath }) || router.push(targetPath)
        return
    }

    proxy?.$tab?.closePage?.() || router.back()
}

watch(
    () => route.params.competitionId,
    () => {
        queryParams.value.competitionId = resolveRouteCompetitionId()
        queryParams.value.pageNum = 1
        rememberReturnPath()
        loadCompetition()
        getList()
    }
)

rememberReturnPath()
loadCompetition()
getList()
</script>

<style scoped lang="scss">
@use '@/assets/styles/crud-page.scss' as *;

.content-competition-work {
    .competition-context {
        margin-bottom: 16px;
        padding: 16px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 12px;
        background: var(--el-bg-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .context-main {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .context-icon {
        width: 36px;
        height: 36px;
        padding: 8px;
        border-radius: 10px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        flex-shrink: 0;
    }

    .context-title {
        color: var(--el-text-color-primary);
        font-size: 16px;
        font-weight: 700;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .context-desc {
        margin-top: 3px;
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }

    .media-thumb {
        width: 56px;
        height: 40px;
        border-radius: 6px;
        display: block;
        margin: 0 auto;
        background: var(--el-fill-color-light);
    }

    .image-placeholder {
        color: var(--el-text-color-placeholder);
        font-size: 12px;
    }

    .video-preview {
        width: 100%;
        max-height: 420px;
        display: block;
        background: #000;
        border-radius: 8px;
    }
}
</style>
