<template>
    <div class="app-container">
        <el-card shadow="never" class="search-wrapper">
            <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch">
                <el-form-item label="帖子类型" prop="postType">
                    <el-select v-model="queryParams.postType" placeholder="全部类型" clearable style="width: 180px">
                        <el-option v-for="opt in postTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="审核状态" prop="auditStatus">
                    <el-select v-model="queryParams.auditStatus" placeholder="全部状态" clearable style="width: 180px">
                        <el-option v-for="opt in auditStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="内容状态" prop="status">
                    <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 180px">
                        <el-option v-for="opt in contentStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleQuery"> <Icon icon="mdi:magnify" class="btn-icon" /> 搜索 </el-button>
                    <el-button @click="resetQuery"> <Icon icon="mdi:refresh" class="btn-icon" /> 重置 </el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card shadow="never" class="table-wrapper">
            <template #header>
                <div class="table-header">
                    <span class="header-title">审核列表</span>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
                </div>
            </template>

            <el-table v-loading="loading" :data="contentList" header-cell-class-name="table-header-cell" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" align="center" />

                <el-table-column label="发布人" min-width="140" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div>{{ row.nickName }}</div>
                        <div class="sub-text">{{ row.userName }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="类型" align="center" width="100">
                    <template #default="{ row }">
                        <EnumTag enum-type="POST_TYPE" :value="row.postType" />
                    </template>
                </el-table-column>

                <el-table-column label="内容预览" min-width="240" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div class="content-preview">{{ row.content }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="媒体资源" width="160" align="center">
                    <template #default="{ row }">
                        <MediaPreview :post-type="row.postType" :media-urls="row.mediaUrls" :audit-status="row.auditStatus" :max-display-count="1" />
                    </template>
                </el-table-column>

                <el-table-column label="内容状态" align="center" width="100">
                    <template #default="{ row }">
                        <EnumTag enum-type="CONTENT_STATUS" :value="row.status" />
                    </template>
                </el-table-column>

                <el-table-column label="审核状态" align="center" width="100">
                    <template #default="{ row }">
                        <EnumTag enum-type="AUDIT_STATUS" :value="row.auditStatus" />
                    </template>
                </el-table-column>

                <el-table-column label="操作" align="center" width="180" fixed="right">
                    <template #default="{ row }">
                        <el-tooltip content="查看详情" placement="top">
                            <el-button link type="primary" @click="handleView(row)">
                                <Icon icon="mdi:eye-outline" class="op-icon" />
                            </el-button>
                        </el-tooltip>

                        <el-tooltip content="删除" placement="top">
                            <el-button link type="danger" @click="handleDelete(row)">
                                <Icon icon="mdi:trash-can-outline" class="op-icon" />
                            </el-button>
                        </el-tooltip>

                        <template v-if="row.auditStatus === AUDIT_STATUS.PENDING">
                            <el-divider direction="vertical" />
                            <el-tooltip content="通过" placement="top">
                                <el-button link type="success" @click="handleApprove(row)">
                                    <Icon icon="mdi:check-circle-outline" class="op-icon" />
                                </el-button>
                            </el-tooltip>
                            <el-tooltip content="驳回" placement="top">
                                <el-button link type="danger" @click="openRejectDialog(row)">
                                    <Icon icon="mdi:close-circle-outline" class="op-icon" />
                                </el-button>
                            </el-tooltip>
                        </template>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </el-card>

        <el-dialog title="内容详情" v-model="openDetail" width="600px" append-to-body class="custom-dialog">
            <el-descriptions :column="2" border class="detail-desc" size="small">
                <el-descriptions-item label="用户名">{{ current?.userName }}</el-descriptions-item>
                <el-descriptions-item label="昵称">{{ current?.nickName }}</el-descriptions-item>
                <el-descriptions-item label="类型">
                    <EnumTag enum-type="POST_TYPE" :value="current?.postType" />
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                    <EnumTag enum-type="CONTENT_STATUS" :value="current?.status" />
                </el-descriptions-item>
                <el-descriptions-item label="审核状态">
                    <EnumTag enum-type="AUDIT_STATUS" :value="current?.auditStatus" />
                </el-descriptions-item>
                <el-descriptions-item label="审核理由">{{ current?.reason || '-' }}</el-descriptions-item>
            </el-descriptions>

            <div class="detail-content">
                <div class="section-title">正文内容</div>
                <div class="content-text">{{ current?.content }}</div>
            </div>

            <div class="detail-media">
                <div class="section-title">媒体资源</div>
                <MediaPreview v-if="current" :post-type="current.postType" :media-urls="current.mediaUrls" :audit-status="current.auditStatus" />
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="openDetail = false">关 闭</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog title="驳回原因" v-model="openReject" width="400px" append-to-body class="custom-dialog">
            <el-form :model="rejectForm" label-position="top">
                <el-form-item label="请输入驳回原因">
                    <el-input v-model="rejectForm.reason" type="textarea" :rows="4" placeholder="例如：内容违规..." resize="none" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="openReject = false">取 消</el-button>
                    <el-button type="danger" @click="submitReject">确认驳回</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="ContentAudit">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { listContentAudit, auditPost } from '@/api/audit/profile/content'
import { deletePost } from '@/api/content/post'
import { AUDIT_STATUS } from '@/utils/enum'
import EnumTag from '@/components/EnumTag/index.vue'
import MediaPreview from '@/components/MediaPreview/index.vue' // 假设路径，需确认
import { useEnumOptions } from '@/hooks/useEnumOptions'

const { proxy } = getCurrentInstance()

const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const contentList = ref([])
const ids = ref([])

const openDetail = ref(false)
const openReject = ref(false)
const current = ref(null)
const rejectTarget = ref(null)

const rejectForm = reactive({
    reason: ''
})

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    postType: undefined,
    status: undefined,
    auditStatus: AUDIT_STATUS.PENDING
})

const postTypeOptions = useEnumOptions('POST_TYPE')
const auditStatusOptions = useEnumOptions('AUDIT_STATUS')
const contentStatusOptions = useEnumOptions('CONTENT_STATUS')

function getList() {
    loading.value = true
    listContentAudit(queryParams)
        .then(res => {
            contentList.value = res.rows || []
            total.value = res.total || 0
            loading.value = false
        })
        .catch(() => {
            loading.value = false
        })
}

function handleQuery() {
    queryParams.pageNum = 1
    getList()
}

function resetQuery() {
    proxy.resetForm('queryRef')
    queryParams.pageNum = 1
    queryParams.pageSize = 10
    queryParams.postType = undefined
    queryParams.status = undefined
    queryParams.auditStatus = undefined
    getList()
}

function handleSelectionChange(selection) {
    ids.value = selection.map(item => item.id)
}

function handleView(row) {
    current.value = row
    openDetail.value = true
}

function handleApprove(row) {
    proxy.$modal
        .confirm(`确认通过该条内容的审核吗？`)
        .then(() => {
            return auditPost({
                id: row.id,
                auditStatus: AUDIT_STATUS.APPROVED,
                reason: '审核通过'
            })
        })
        .then(() => {
            proxy.$modal.msgSuccess('操作成功')
            getList()
            if (openDetail.value && current.value?.id === row.id) {
                openDetail.value = false
            }
        })
}

function openRejectDialog(row) {
    rejectTarget.value = row
    rejectForm.reason = ''
    openReject.value = true
}

function submitReject() {
    if (!rejectForm.reason.trim()) {
        proxy.$modal.msgWarning('请填写驳回原因')
        return
    }
    auditPost({
        id: rejectTarget.value.id,
        auditStatus: AUDIT_STATUS.REJECTED,
        reason: rejectForm.reason
    }).then(() => {
        proxy.$modal.msgSuccess('操作成功')
        openReject.value = false
        getList()
        if (openDetail.value && current.value?.id === rejectTarget.value.id) {
            openDetail.value = false
        }
    })
}

function handleDelete(row) {
    if (!row?.id) return
    proxy.$modal
        .confirm('确认删除该内容吗？')
        .then(() => {
            return deletePost({ postIds: [row.id] })
        })
        .then(() => {
            proxy.$modal.msgSuccess('删除成功')
            if (openDetail.value && current.value?.id === row.id) {
                openDetail.value = false
            }
            getList()
        })
}

onMounted(() => {
    resetQuery()
})
</script>

<style scoped lang="scss">
.search-wrapper {
    border-radius: 4px;
    border: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    :deep(.el-form-item) {
        margin-bottom: 16px;
        margin-right: 12px; /* 减少表单项间距 */
    }
}

.table-wrapper {
    border-radius: 4px;
    border: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px; /* 头部与表格的间距 */

        .header-title {
            font-weight: 600;
            color: #303133;
            font-size: 18px;
        }
    }
}

.btn-icon {
    margin-right: 4px;
    font-size: 14px;
}

:deep(.table-header-cell) {
    background-color: #f8fafd !important;
    color: #606266;
    font-weight: 600;
    height: 44px; /* 稍微减小表头高度 */
    padding: 8px 0;
}

.sub-text {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
}

.op-icon {
    font-size: 16px;
}

.content-preview {
    font-size: 13px;
    color: #606266;
    line-height: 1.4;
}

.pagination-container {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
}

/* 详情弹窗 */
.detail-desc {
    margin-bottom: 16px;

    :deep(.el-descriptions__cell) {
        padding: 8px 12px;
    }
}

.section-title {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    margin-bottom: 8px;
    border-left: 3px solid var(--el-color-primary);
    padding-left: 8px;
    line-height: 1;
}

.content-text {
    background: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
    font-size: 13px;
    color: #555;
    line-height: 1.6;
    margin-bottom: 16px;
    white-space: pre-wrap;
}

.detail-media {
    margin-bottom: 0;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
