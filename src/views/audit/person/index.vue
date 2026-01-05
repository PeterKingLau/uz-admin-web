<template>
    <div class="app-container">
        <el-card shadow="never" class="main-card">
            <div class="search-section">
                <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" class="search-form">
                    <el-form-item label="资料类型" prop="applyType">
                        <el-select v-model="queryParams.applyType" placeholder="全部类型" clearable class="search-input">
                            <el-option v-for="item in apply_type" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="审核状态" prop="auditStatus">
                        <el-select v-model="queryParams.auditStatus" placeholder="全部状态" clearable class="search-input">
                            <el-option label="待审核" :value="AUDIT_STATUS.PENDING" />
                            <el-option label="通过" :value="AUDIT_STATUS.APPROVED" />
                            <el-option label="驳回" :value="AUDIT_STATUS.REJECTED" />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleQuery"> <Icon icon="mdi:magnify" class="btn-icon" /> 搜索 </el-button>
                        <el-button @click="resetQuery"> <Icon icon="mdi:refresh" class="btn-icon" /> 重置 </el-button>
                    </el-form-item>
                </el-form>
            </div>

            <el-divider class="section-divider" />

            <div class="table-toolbar">
                <div class="toolbar-left">
                    <span class="section-title">审核列表</span>
                </div>
                <div class="toolbar-right">
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
                </div>
            </div>

            <el-table v-loading="loading" :data="auditList" header-cell-class-name="table-header-cell" @selection-change="handleSelectionChange" border>
                <el-table-column type="selection" width="55" align="center" />

                <el-table-column label="申请人" min-width="140" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div class="user-info">
                            <div class="nickname">{{ row.nickName }}</div>
                            <div class="username text-secondary">{{ row.userName }}</div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="资料类型" align="center" width="120">
                    <template #default="{ row }">
                        <EnumTag enum-type="PROFILE_APPLY_TYPE" :value="row.applyType" :fallback-label="row.applyTypeDesc || row.applyType" />
                    </template>
                </el-table-column>

                <el-table-column label="原数据" min-width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div class="data-cell">
                            <template v-if="row.applyType === 'avatar'">
                                <AvatarPreview :src="row.oldValue" :size="36" />
                            </template>
                            <template v-else>
                                <span class="text-content text-secondary">{{ row.oldValue || '-' }}</span>
                            </template>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="新数据 (申请)" min-width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div class="data-cell">
                            <template v-if="row.applyType === 'avatar'">
                                <AvatarPreview :src="row.newValue" :size="36" :deleted="row.auditStatus === AUDIT_STATUS.REJECTED" />
                            </template>
                            <template v-else>
                                <span class="text-content text-primary font-medium">{{ row.newValue }}</span>
                            </template>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="状态" align="center" width="100">
                    <template #default="{ row }">
                        <EnumTag enum-type="AUDIT_STATUS" :value="row.auditStatus" />
                    </template>
                </el-table-column>

                <el-table-column label="申请时间" prop="applyTime" width="170" align="center" />

                <el-table-column label="操作" align="center" width="160" fixed="right">
                    <template #default="{ row }">
                        <div class="operation-group">
                            <el-tooltip content="查看详情" placement="top">
                                <el-button link type="primary" @click="handleView(row)">
                                    <Icon icon="mdi:eye-outline" class="op-icon" />
                                </el-button>
                            </el-tooltip>

                            <template v-if="row.auditStatus === AUDIT_STATUS.PENDING">
                                <el-divider direction="vertical" />
                                <el-tooltip content="通过" placement="top">
                                    <el-button link type="success" @click="handleApprove(row)">
                                        <Icon icon="mdi:check-circle-outline" class="op-icon" />
                                    </el-button>
                                </el-tooltip>
                                <el-divider direction="vertical" />
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
        </el-card>

        <el-dialog title="审核详情" v-model="openDetail" width="720px" append-to-body class="audit-detail-dialog" destroy-on-close>
            <div class="detail-section">
                <div class="section-label">基础信息</div>
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="用户账号">{{ current?.userName }}</el-descriptions-item>
                    <el-descriptions-item label="用户昵称">{{ current?.nickName }}</el-descriptions-item>
                    <el-descriptions-item label="资料类型">
                        <EnumTag enum-type="PROFILE_APPLY_TYPE" :value="current?.applyType" />
                    </el-descriptions-item>
                    <el-descriptions-item label="当前状态">
                        <EnumTag enum-type="AUDIT_STATUS" :value="current?.auditStatus" />
                    </el-descriptions-item>
                    <el-descriptions-item label="申请时间">{{ current?.applyTime }}</el-descriptions-item>
                    <el-descriptions-item label="审核时间">{{ current?.auditTime || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="审核备注" :span="2">
                        <span :class="{ 'text-placeholder': !current?.auditRemark }">
                            {{ current?.auditRemark || '暂无备注' }}
                        </span>
                    </el-descriptions-item>
                </el-descriptions>
            </div>

            <div class="detail-section mt-5">
                <div class="section-label">变更对比</div>
                <div class="compare-container">
                    <el-row :gutter="24">
                        <el-col :span="12">
                            <div class="compare-card old-state">
                                <div class="card-header">
                                    <span class="badge">原</span>
                                    <span class="title">变更前数据</span>
                                </div>
                                <div class="card-body">
                                    <template v-if="current?.applyType === 'avatar'">
                                        <div class="img-wrapper">
                                            <AvatarPreview :src="current?.oldValue" :size="100" />
                                            <span class="img-tip">原头像</span>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="text-content empty" v-if="!current?.oldValue">（空）</div>
                                        <div class="text-content" v-else>{{ current?.oldValue }}</div>
                                    </template>
                                </div>
                            </div>
                        </el-col>

                        <el-col :span="12">
                            <div class="compare-card new-state">
                                <div class="card-header">
                                    <span class="badge">新</span>
                                    <span class="title">申请变更内容</span>
                                </div>
                                <div class="card-body">
                                    <template v-if="current?.applyType === 'avatar'">
                                        <div class="img-wrapper">
                                            <AvatarPreview :src="current?.newValue" :size="100" />
                                            <span class="img-tip">新头像</span>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="text-content highlight">{{ current?.newValue }}</div>
                                    </template>
                                </div>
                            </div>
                        </el-col>
                    </el-row>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="openDetail = false">关 闭</el-button>
                    <template v-if="current?.auditStatus === AUDIT_STATUS.PENDING">
                        <el-button type="danger" plain @click="openRejectDialog(current)">驳 回</el-button>
                        <el-button type="primary" @click="handleApprove(current)">通 过</el-button>
                    </template>
                </div>
            </template>
        </el-dialog>

        <el-dialog title="驳回申请" v-model="openReject" width="420px" append-to-body>
            <el-form :model="rejectForm" label-position="top">
                <el-form-item label="请输入驳回原因">
                    <el-input
                        v-model="rejectForm.auditRemark"
                        type="textarea"
                        :rows="4"
                        placeholder="例如：头像包含不合规内容，请修改后重新提交..."
                        resize="none"
                    />
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

<script setup name="ProfileAudit">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { listUserAuditDetail, auditUserAvatar } from '@/api/audit/person/person'
import AvatarPreview from '@/components/AvatarPreview/index.vue'
import EnumTag from '@/components/EnumTag/index.vue'
import { AUDIT_STATUS } from '@/utils/enum'

const { proxy } = getCurrentInstance()
const { apply_type } = proxy.useDict('apply_type')

const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const auditList = ref([])
const ids = ref([])
const dateRange = ref([])

const openDetail = ref(false)
const openReject = ref(false)
const current = ref(null)
const rejectTarget = ref(null)

const rejectForm = reactive({
    auditRemark: ''
})

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    applyType: undefined,
    auditStatus: AUDIT_STATUS.PENDING
})

function getList() {
    loading.value = true
    const query = proxy.addDateRange ? proxy.addDateRange(queryParams, dateRange.value) : queryParams

    listUserAuditDetail(query)
        .then(res => {
            auditList.value = res.rows || []
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
    dateRange.value = []
    proxy.resetForm('queryRef')
    queryParams.pageNum = 1
    queryParams.pageSize = 10
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
    if (!row.id) return
    proxy.$modal
        .confirm('确认通过该资料变更申请吗？')
        .then(() => {
            return auditUserAvatar({
                id: row.id,
                auditStatus: AUDIT_STATUS.APPROVED,
                auditRemark: '审核通过'
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
    rejectForm.auditRemark = ''
    openReject.value = true
}

function submitReject() {
    if (!rejectForm.auditRemark?.trim()) {
        proxy.$modal.msgWarning('请填写驳回原因')
        return
    }
    auditUserAvatar({
        id: rejectTarget.value.id,
        auditStatus: AUDIT_STATUS.REJECTED,
        auditRemark: rejectForm.auditRemark
    }).then(() => {
        proxy.$modal.msgSuccess('操作成功')
        openReject.value = false
        getList()
        if (openDetail.value && current.value?.id === rejectTarget.value.id) {
            openDetail.value = false
        }
    })
}

onMounted(() => {
    getList()
})
</script>

<style scoped lang="scss">
/* 1. 搜索区域 */
.search-section {
    .search-input {
        width: 200px;
    }
}

.user-info {
    .nickname {
        font-size: 14px;
        color: #303133;
    }
    .username {
        font-size: 12px;
        margin-top: 2px;
    }
}

.data-cell {
    display: flex;
    align-items: center;
    min-height: 36px;
}

.text-content {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
}

.text-placeholder {
    color: #c0c4cc;
    font-style: italic;
}
.text-primary {
    color: var(--el-color-primary);
}
.font-medium {
    font-weight: 500;
}

/* 4. 详情弹窗内部样式 */
.detail-section {
    .section-label {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 12px;
        padding-left: 10px;
        border-left: 4px solid var(--el-color-primary);
        line-height: 1;
    }
    .mt-5 {
        margin-top: 20px;
    }
}

.compare-container {
    padding: 4px;
}

/* 对比卡片核心样式 */
.compare-card {
    border-radius: 8px;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
    border: 1px solid;
    transition: all 0.3s;

    /* 头部 */
    .card-header {
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);

        .badge {
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
        }
        .title {
            font-size: 14px;
            font-weight: 600;
        }
    }

    /* 内容区 */
    .card-body {
        flex: 1;
        padding: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 160px;
        background-color: #fff;
    }

    /* 旧数据风格 (灰) */
    &.old-state {
        background-color: #f8f9fa;
        border-color: #e4e7ed;

        .card-header {
            background-color: #f2f3f5;
            color: #909399;
            .badge {
                background: #dedfe0;
                color: #606266;
            }
        }

        .text-content.empty {
            color: #c0c4cc;
            font-style: italic;
        }
    }

    /* 新数据风格 (蓝) */
    &.new-state {
        background-color: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-5);

        .card-header {
            background-color: var(--el-color-primary-light-8);
            color: var(--el-color-primary-dark-2);
            .badge {
                background: var(--el-color-primary);
                color: #fff;
            }
        }

        .text-content.highlight {
            color: var(--el-color-primary);
            font-weight: 600;
            font-size: 16px;
        }
    }

    /* 头像 wrapper */
    .img-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        .img-tip {
            font-size: 12px;
            color: #909399;
        }
    }

    .text-content {
        font-size: 15px;
        color: #606266;
        word-break: break-all;
        text-align: center;
        line-height: 1.6;
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>
