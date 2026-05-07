<template>
    <div class="app-container system-crud-page content-competition">
        <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" class="search-form">
            <el-form-item label="赛事标题" prop="title">
                <el-input v-model="queryParams.title" placeholder="请输入赛事标题" clearable style="width: 220px" @keyup.enter="handleQuery">
                    <template #prefix>
                        <Icon icon="mdi:magnify" />
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item label="赛事状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择赛事状态" clearable style="width: 180px">
                    <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="是否启用" prop="isActive">
                <el-select v-model="queryParams.isActive" placeholder="请选择" clearable style="width: 160px">
                    <el-option label="启用" value="1" />
                    <el-option label="禁用" value="0" />
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
                    <el-button type="primary" @click="handleAdd" class="tool-btn" v-hasPermi="['content:competition:add']">
                        <Icon icon="ep:plus" class="btn-icon" />
                        新增赛事
                    </el-button>
                    <el-button type="danger" :disabled="multiple" @click="handleDelete()" class="tool-btn" v-hasPermi="['content:competition:remove']">
                        <Icon icon="ep:delete" class="btn-icon" />
                        批量删除
                    </el-button>
                </div>
                <div class="right-tools">
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
                </div>
            </div>

            <el-table v-loading="loading" :data="competitionList" @selection-change="handleSelectionChange" class="modern-table" :row-key="resolveId">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="赛事ID" prop="id" align="center" width="90">
                    <template #default="{ row }">
                        <span>{{ resolveId(row) || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="赛事标题" prop="title" min-width="220" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span>{{ resolveTitle(row) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="主题图" prop="themeImage" align="center" width="110">
                    <template #default="{ row }">
                        <el-image
                            v-if="row.themeImage"
                            :src="resolveThemeImageUrl(row.themeImage)"
                            :preview-src-list="[resolveThemeImageUrl(row.themeImage)]"
                            preview-teleported
                            fit="cover"
                            class="theme-image"
                        />
                        <span v-else class="image-placeholder">暂无</span>
                    </template>
                </el-table-column>
                <el-table-column label="赛事状态" prop="status" align="center" width="120">
                    <template #default="{ row }">
                        <el-tag :type="resolveStatus(row).type" effect="plain">
                            {{ resolveStatus(row).label }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="是否启用" prop="isActive" align="center" width="110">
                    <template #default="{ row }">
                        <el-switch
                            :model-value="normalizeActiveValue(row.isActive ?? row.active) ? '1' : '0'"
                            active-value="1"
                            inactive-value="0"
                            inline-prompt
                            active-text="启用"
                            inactive-text="禁用"
                            :loading="isActiveChanging(row)"
                            :disabled="isActiveChanging(row)"
                            @change="handleActiveChange(row, $event)"
                            class="competition-active-switch"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="开始时间" prop="startTime" align="center" width="170">
                    <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
                </el-table-column>
                <el-table-column label="结束时间" prop="endTime" align="center" width="170">
                    <template #default="{ row }">{{ formatTime(row.endTime) }}</template>
                </el-table-column>
                <el-table-column label="投票截止" prop="voteDeadline" align="center" width="170">
                    <template #default="{ row }">{{ formatTime(row.voteDeadline) }}</template>
                </el-table-column>
                <el-table-column label="总票数" align="center" width="100">
                    <template #default="{ row }">{{ resolveNumber(row.totalVotes ?? row.voteCount ?? row.votes) }}</template>
                </el-table-column>
                <el-table-column label="参赛作品数" align="center" width="120">
                    <template #default="{ row }">{{ resolveNumber(row.workCount ?? row.worksCount ?? row.entryCount) }}</template>
                </el-table-column>
                <el-table-column label="浏览次数" align="center" width="110">
                    <template #default="{ row }">{{ resolveNumber(row.viewCount ?? row.browseCount ?? row.views) }}</template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" align="center" width="170">
                    <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="270" fixed="right">
                    <template #default="{ row }">
                        <div class="text-action-group">
                            <el-button link type="primary" @click="handleWorks(row)" class="op-text-btn">
                                <Icon icon="mdi:image-multiple-outline" class="btn-icon" />
                                作品
                            </el-button>
                            <el-button link type="primary" @click="handleDetail(row)" class="op-text-btn">
                                <Icon icon="ep:view" class="btn-icon" />
                                详情
                            </el-button>
                            <el-button link type="primary" @click="handleUpdate(row)" class="op-text-btn" v-hasPermi="['content:competition:edit']">
                                <Icon icon="ep:edit" class="btn-icon" />
                                编辑
                            </el-button>
                            <el-button link type="danger" @click="handleDelete(row)" class="op-text-btn" v-hasPermi="['content:competition:remove']">
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

        <CompetitionFormDialog ref="competitionDialogRef" @success="getList" />
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ContentCompetition' })
import { getCurrentInstance, reactive, ref, toRefs } from 'vue'
import type { FormInstance } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { COMPETITION_WORK_RETURN_PATH_KEY } from '@/router/constants'
import { encodeRouteId } from '@/router/routeParams'
import { parseTime } from '@/utils/utils'
import {
    delCompetition,
    getCompetition,
    listCompetition,
    parseCompetitionDetail,
    parseCompetitionRows,
    parseCompetitionTotal,
    updateCompetition,
    type CompetitionItem
} from '@/api/content/competition'
import CompetitionFormDialog from './components/CompetitionFormDialog.vue'

type CompetitionDialogExpose = {
    openAdd: () => void
    openEdit: (row: CompetitionItem) => void
    openDetail: (row: CompetitionItem) => void
}

const { proxy } = getCurrentInstance() as any
const route = useRoute()
const router = useRouter()
const queryRef = ref<FormInstance>()
const competitionDialogRef = ref<CompetitionDialogExpose>()

const competitionList = ref<CompetitionItem[]>([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref<Array<string | number>>([])
const multiple = ref(true)
const total = ref(0)
const activeChangingIds = ref(new Set<string | number>())
const fileBaseUrl = String(import.meta.env.VITE_APP_FILE_BASE_URL || '').trim()

const statusOptions = [
    { label: '未开始', value: '0', type: 'info' },
    { label: '进行中', value: '1', type: 'success' },
    { label: '已结束', value: '2', type: 'warning' }
] as const
const data = reactive({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: undefined as string | undefined,
        status: undefined as string | undefined,
        isActive: undefined as string | undefined
    }
})

const { queryParams } = toRefs(data)

function resolveId(row: CompetitionItem): string | number {
    return row.id ?? row.competitionId ?? ''
}

function resolveTitle(row: CompetitionItem): string {
    return row.title || row.name || '-'
}

function resolveStatus(row: CompetitionItem) {
    if (row.statusLabel) {
        const option = statusOptions.find(item => String(item.value) === String(row.status))
        return { label: row.statusLabel, type: option?.type || 'info' }
    }
    return statusOptions.find(item => String(item.value) === String(row.status)) || { label: row.status ?? '-', type: 'info' }
}

function normalizeActiveValue(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true'
}

function resolveActiveValue(row: CompetitionItem): '1' | '0' {
    return normalizeActiveValue(row.isActive ?? row.active) ? '1' : '0'
}

function isActiveChanging(row: CompetitionItem): boolean {
    const id = resolveId(row)
    return Boolean(id && activeChangingIds.value.has(id))
}

function setActiveChanging(row: CompetitionItem, changing: boolean) {
    const id = resolveId(row)
    if (!id) return
    const next = new Set(activeChangingIds.value)
    if (changing) next.add(id)
    else next.delete(id)
    activeChangingIds.value = next
}

function resolveNumber(value: unknown): number {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : 0
}

function formatTime(value?: string) {
    return value ? parseTime(value) : '-'
}

function resolveThemeImageUrl(value?: string) {
    const raw = String(value || '').trim()
    if (!raw) return ''
    if (/^(https?:)?\/\//i.test(raw) || /^(blob|data|file):/i.test(raw)) {
        return raw.startsWith('//') ? `${window.location.protocol}${raw}` : raw
    }
    if (!fileBaseUrl) return raw
    return `${fileBaseUrl.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`
}

function getList() {
    loading.value = true
    listCompetition(queryParams.value)
        .then(response => {
            const rows = parseCompetitionRows(response)
            competitionList.value = rows
            total.value = parseCompetitionTotal(response, rows)
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
    handleQuery()
}

function handleSelectionChange(selection: CompetitionItem[]) {
    ids.value = selection.map(item => resolveId(item)).filter(Boolean)
    multiple.value = selection.length === 0
}

function handleAdd() {
    competitionDialogRef.value?.openAdd()
}

function handleDetail(row: CompetitionItem) {
    competitionDialogRef.value?.openDetail(row)
}

function handleUpdate(row: CompetitionItem) {
    competitionDialogRef.value?.openEdit(row)
}

function handleWorks(row: CompetitionItem) {
    const competitionId = resolveId(row)
    if (!competitionId) return
    rememberCompetitionWorkReturnPath(competitionId)
    router.push({
        name: 'CompetitionWorkData',
        params: { competitionId: encodeRouteId(competitionId) },
        query: { returnPath: route.fullPath }
    })
}

function rememberCompetitionWorkReturnPath(competitionId: string | number) {
    if (typeof window === 'undefined') return
    const returnPath = String(route.fullPath || '').trim()
    if (!returnPath) return
    window.sessionStorage.setItem(COMPETITION_WORK_RETURN_PATH_KEY, returnPath)
    window.sessionStorage.setItem(`${COMPETITION_WORK_RETURN_PATH_KEY}:${competitionId}`, returnPath)
}

function handleActiveChange(row: CompetitionItem, value: string | number | boolean) {
    const id = resolveId(row)
    if (!id || isActiveChanging(row)) return
    const nextValue = String(value) === '1' || value === true ? '1' : '0'
    const oldValue = resolveActiveValue(row)
    const actionText = nextValue === '1' ? '启用' : '禁用'

    proxy?.$modal
        ?.confirm?.(`确认要${actionText}赛事 "${resolveTitle(row)}" 吗？`)
        .then(async () => {
            setActiveChanging(row, true)
            const response = await getCompetition(id)
            const detail = parseCompetitionDetail(response)
            await updateCompetition({
                ...detail,
                id: detail.id ?? detail.competitionId ?? id,
                title: detail.title || detail.name || row.title || row.name,
                status: String(detail.status ?? row.status ?? '0'),
                isActive: nextValue
            })
            row.isActive = nextValue
            row.active = nextValue
            proxy?.$modal?.msgSuccess?.(`${actionText}成功`)
        })
        .catch(() => {
            row.isActive = oldValue
            row.active = oldValue
        })
        .finally(() => {
            setActiveChanging(row, false)
        })
}

function handleDelete(row?: CompetitionItem) {
    const targetIds = row ? [resolveId(row)].filter(Boolean) : ids.value
    if (!targetIds.length) return
    proxy?.$modal
        ?.confirm?.(`是否确认删除赛事编号为 "${targetIds.join(',')}" 的数据项？`)
        .then(() => delCompetition(targetIds))
        .then(() => {
            const removedCount = targetIds.length
            if (competitionList.value.length <= removedCount && queryParams.value.pageNum > 1) {
                queryParams.value.pageNum -= 1
            }
            getList()
            proxy?.$modal?.msgSuccess?.('删除成功')
        })
        .catch(() => {})
}

getList()
</script>

<style scoped lang="scss">
@use '@/assets/styles/crud-page.scss' as *;

.content-competition {
    :deep(.competition-active-switch) {
        --el-switch-on-color: var(--el-color-success);

        --el-switch-off-color: var(--el-color-info-light-5);
    }

    .theme-image {
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
}
</style>
