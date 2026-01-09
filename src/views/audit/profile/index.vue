<template>
    <div class="app-container audit-profile">
        <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" class="search-form">
            <el-form-item label="帖子类型" prop="postType">
                <el-select v-model="queryParams.postType" placeholder="全部类型" clearable class="search-input">
                    <el-option v-for="opt in postTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="审核状态" prop="auditStatus">
                <el-select v-model="queryParams.auditStatus" placeholder="全部状态" clearable class="search-input">
                    <el-option v-for="opt in auditStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="内容状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="全部状态" clearable class="search-input">
                    <el-option v-for="opt in contentStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleQuery"> <Icon icon="mdi:magnify" class="btn-icon" /> 搜索 </el-button>
                <el-button @click="resetQuery"> <Icon icon="mdi:refresh" class="btn-icon" /> 重置 </el-button>
            </el-form-item>
        </el-form>

        <div class="table-wrapper">
            <div class="table-header">
                <div class="left-tools">
                    <span class="section-title">审核列表</span>
                </div>
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
            </div>

            <el-table v-loading="loading" :data="contentList" header-cell-class-name="table-header-cell" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" align="center" />

                <el-table-column label="发布人" min-width="140" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div class="user-info">
                            <div class="nickname">{{ row.nickName }}</div>
                            <div class="username text-secondary">{{ row.userName }}</div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="类型" align="center" width="100">
                    <template #default="{ row }">
                        <EnumTag enum-type="POST_TYPE" :value="row.postType" />
                    </template>
                </el-table-column>

                <el-table-column label="内容预览" min-width="240" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div class="content-preview text-content">{{ row.content }}</div>
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
                        <div class="operation-group">
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
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </div>

        <el-dialog title="内容详情" v-model="openDetail" width="650px" append-to-body class="custom-dialog audit-profile-dialog">
            <el-descriptions :column="2" border class="detail-desc">
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

            <div class="detail-section">
                <div class="section-header">
                    <Icon icon="mdi:format-text" class="section-icon" />
                    <span>正文内容</span>
                </div>
                <div class="content-box">{{ current?.content || '（无正文内容）' }}</div>
            </div>

            <div class="detail-section" v-if="current?.mediaUrls && current.mediaUrls.length">
                <div class="section-header">
                    <Icon icon="mdi:image-multiple-outline" class="section-icon" />
                    <span>媒体资源</span>
                </div>
                <div class="media-box">
                    <MediaPreview :post-type="current.postType" :media-urls="current.mediaUrls" :audit-status="current.auditStatus" />
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="openDetail = false">关 闭</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog title="驳回原因" v-model="openReject" width="420px" append-to-body class="audit-profile-dialog">
            <el-form :model="rejectForm" label-position="top">
                <el-form-item label="请输入驳回原因">
                    <el-input v-model="rejectForm.reason" type="textarea" :rows="4" placeholder="例如：内容包含违规信息..." resize="none" />
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
import MediaPreview from '@/components/MediaPreview/index.vue'
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
