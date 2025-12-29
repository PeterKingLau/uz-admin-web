<template>
    <div class="app-container">
        <el-card shadow="never" class="search-wrapper">
            <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch">
                <el-form-item label="资料类型" prop="applyType">
                    <el-select v-model="queryParams.applyType" placeholder="全部类型" clearable style="width: 200px">
                        <el-option v-for="item in apply_type" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="审核状态" prop="auditStatus">
                    <el-select v-model="queryParams.auditStatus" placeholder="全部状态" clearable style="width: 200px">
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
        </el-card>

        <el-card shadow="never" class="table-wrapper">
            <template #header>
                <div class="table-header">
                    <span class="header-title">审核列表</span>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
                </div>
            </template>

            <el-table v-loading="loading" :data="auditList" header-cell-class-name="table-header-cell" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center" />

                <el-table-column label="申请人" min-width="140" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div>{{ row.nickName }}</div>
                        <div class="sub-text">{{ row.userName }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="资料类型" align="center" width="120">
                    <template #default="{ row }">
                        <EnumTag enum-type="PROFILE_APPLY_TYPE" :value="row.applyType" :fallback-label="row.applyTypeDesc || row.applyType" />
                    </template>
                </el-table-column>

                <el-table-column label="原数据" min-width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                        <template v-if="row.applyType === 'avatar'">
                            <AvatarPreview :src="row.oldValue" :size="36" />
                        </template>
                        <template v-else>
                            <span class="text-content">{{ row.oldValue || '-' }}</span>
                        </template>
                    </template>
                </el-table-column>

                <el-table-column label="新数据" min-width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                        <template v-if="row.applyType === 'avatar'">
                            <AvatarPreview :src="row.newValue" :size="36" :deleted="row.auditStatus === AUDIT_STATUS.REJECTED" />
                        </template>
                        <template v-else>
                            <span class="text-content highlight">{{ row.newValue }}</span>
                        </template>
                    </template>
                </el-table-column>

                <el-table-column label="状态" align="center" width="100">
                    <template #default="{ row }">
                        <EnumTag enum-type="AUDIT_STATUS" :value="row.auditStatus" />
                    </template>
                </el-table-column>

                <el-table-column label="申请时间" prop="applyTime" width="160" align="center">
                    <template #default="{ row }">
                        <div class="time-cell">
                            <span>{{ row.applyTime }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="操作" align="center" width="160" fixed="right">
                    <template #default="{ row }">
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
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </el-card>

        <el-dialog title="审核详情" v-model="openDetail" width="700px" append-to-body class="custom-dialog">
            <el-descriptions :column="2" border class="detail-desc">
                <el-descriptions-item label="用户名">{{ current?.userName }}</el-descriptions-item>
                <el-descriptions-item label="用户昵称">{{ current?.nickName }}</el-descriptions-item>
                <el-descriptions-item label="资料类型">
                    <EnumTag enum-type="PROFILE_APPLY_TYPE" :value="current?.applyType" />
                </el-descriptions-item>
                <el-descriptions-item label="审核状态">
                    <EnumTag enum-type="AUDIT_STATUS" :value="current?.auditStatus" />
                </el-descriptions-item>
                <el-descriptions-item label="申请时间">{{ current?.applyTime }}</el-descriptions-item>
                <el-descriptions-item label="审核时间">{{ current?.auditTime || '-' }}</el-descriptions-item>
                <el-descriptions-item label="审核备注" :span="2">{{ current?.auditRemark || '-' }}</el-descriptions-item>
            </el-descriptions>

            <div class="compare-section">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <div class="compare-card old">
                            <div class="card-title">变更前 (原数据)</div>
                            <div class="card-content">
                                <template v-if="current?.applyType === 'avatar'">
                                    <AvatarPreview :src="current?.oldValue" :size="100" />
                                </template>
                                <div v-else class="text-val">{{ current?.oldValue || '无' }}</div>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="12">
                        <div class="compare-card new">
                            <div class="card-title">变更后 (新数据)</div>
                            <div class="card-content">
                                <template v-if="current?.applyType === 'avatar'">
                                    <AvatarPreview :src="current?.newValue" :size="100" :deleted="current?.auditStatus === AUDIT_STATUS.REJECTED" />
                                </template>
                                <div v-else class="text-val highlight">{{ current?.newValue }}</div>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="openDetail = false">关 闭</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog title="驳回申请" v-model="openReject" width="400px" append-to-body class="custom-dialog">
            <el-form :model="rejectForm" label-position="top">
                <el-form-item label="请输入驳回原因">
                    <el-input v-model="rejectForm.auditRemark" type="textarea" :rows="4" placeholder="例如：头像包含违规内容..." resize="none" />
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
import { Icon } from '@iconify/vue'

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
.search-wrapper {
    border-radius: 8px;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.04);

    :deep(.el-card__body) {
        padding: 18px 18px 0 18px;
    }

    :deep(.el-form-item) {
        margin-bottom: 18px;
    }
}

.table-wrapper {
    border-radius: 8px;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.04);

    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-title {
            font-weight: 600;
            color: #303133;
            font-size: 16px;
        }
    }
}

.btn-icon {
    margin-right: 4px;
    font-size: 16px;
}

:deep(.table-header-cell) {
    background-color: #f8fafd !important;
    color: #606266;
    font-weight: 600;
    height: 50px;
}

.sub-text {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
}

.op-icon {
    font-size: 18px;
}

.text-content {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.highlight {
        color: var(--el-color-primary);
        font-weight: 500;
    }
}

.pagination-container {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
}

/* 详情弹窗样式 */
.detail-desc {
    margin-bottom: 20px;
}

.compare-section {
    margin-top: 20px;

    .compare-card {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 1px solid transparent;

        &.new {
            border-color: var(--el-color-primary-light-8);

            .card-title {
                color: var(--el-color-primary);
            }
        }

        .card-title {
            font-size: 14px;
            font-weight: 600;
            color: #606266;
            margin-bottom: 16px;
        }

        .card-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 100px;

            .text-val {
                font-size: 16px;
                color: #303133;
                word-break: break-all;
                text-align: center;

                &.highlight {
                    color: var(--el-color-primary);
                    font-weight: 600;
                }
            }
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
