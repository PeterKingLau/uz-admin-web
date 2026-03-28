<template>
    <div class="app-container monitor-online">
        <div class="online-pane">
            <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" class="search-form modern-form">
                <el-form-item label="登录地址" prop="ipaddr">
                    <el-input v-model="queryParams.ipaddr" placeholder="请输入登录地址" clearable class="search-input custom-input" @keyup.enter="handleQuery">
                        <template #prefix>
                            <Icon icon="ep:monitor" class="btn-icon" />
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item label="用户名称" prop="userName">
                    <el-input
                        v-model="queryParams.userName"
                        placeholder="请输入用户名称"
                        clearable
                        class="search-input custom-input"
                        @keyup.enter="handleQuery"
                    >
                        <template #prefix>
                            <Icon icon="ep:user" class="btn-icon" />
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item class="form-actions">
                    <el-button type="primary" @click="handleQuery" class="action-btn">
                        <Icon icon="ep:search" class="btn-icon" />
                        搜索
                    </el-button>
                    <el-button @click="resetQuery" class="action-btn">
                        <Icon icon="ep:refresh" class="btn-icon" />
                        重置
                    </el-button>
                </el-form-item>
            </el-form>

            <div class="table-wrapper">
                <div class="table-header">
                    <div class="left-tools">
                        <div class="summary-card">
                            <span class="summary-label">在线会话</span>
                            <strong class="summary-value">{{ total }}</strong>
                        </div>
                    </div>
                    <div class="right-tools">
                        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns" />
                    </div>
                </div>

                <el-table v-loading="loading" :data="onlineList" class="modern-table">
                    <el-table-column label="序号" width="70" align="center" v-if="columns[0].visible">
                        <template #default="scope">
                            <span class="row-code">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="会话编号" align="center" prop="tokenId" min-width="180" v-if="columns[1].visible" :show-overflow-tooltip="true">
                        <template #default="scope">
                            <span class="token-text">{{ scope.row.tokenId }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="登录名称" align="center" prop="userName" min-width="120" v-if="columns[2].visible" :show-overflow-tooltip="true">
                        <template #default="scope">
                            <span class="row-title">{{ scope.row.userName }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="所属部门" align="center" prop="deptName" min-width="140" v-if="columns[3].visible" :show-overflow-tooltip="true">
                        <template #default="scope">
                            <el-tag size="small" type="info" effect="light" class="dept-tag">
                                {{ scope.row.deptName || '-' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="主机" align="center" prop="ipaddr" min-width="130" v-if="columns[4].visible" :show-overflow-tooltip="true" />
                    <el-table-column
                        label="登录地点"
                        align="center"
                        prop="loginLocation"
                        min-width="140"
                        v-if="columns[5].visible"
                        :show-overflow-tooltip="true"
                    />
                    <el-table-column label="操作系统" align="center" prop="os" min-width="120" v-if="columns[6].visible" :show-overflow-tooltip="true" />
                    <el-table-column label="浏览器" align="center" prop="browser" min-width="120" v-if="columns[7].visible" :show-overflow-tooltip="true" />
                    <el-table-column label="登录时间" align="center" prop="loginTime" width="180" v-if="columns[8].visible">
                        <template #default="scope">
                            <span class="time-cell">{{ parseTime(scope.row.loginTime) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" align="center" width="100" fixed="right">
                        <template #default="scope">
                            <div class="action-group">
                                <el-tooltip content="强退" placement="top">
                                    <el-button
                                        link
                                        type="danger"
                                        @click="handleForceLogout(scope.row)"
                                        v-hasPermi="['monitor:online:forceLogout']"
                                        class="op-btn"
                                    >
                                        <Icon icon="mdi:logout" />
                                    </el-button>
                                </el-tooltip>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>

                <div class="pagination-container">
                    <pagination
                        v-show="total > 0"
                        :total="total"
                        v-model:page="queryParams.pageNum"
                        v-model:limit="queryParams.pageSize"
                        @pagination="getList"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineOptions({ name: 'Online' })
import { forceLogout, list as initData } from '@/api/monitor/online'

const { proxy } = getCurrentInstance()

const onlineList = ref([])
const loading = ref(true)
const total = ref(0)
const showSearch = ref(true)
const columns = ref([
    { key: 0, label: '序号', visible: true },
    { key: 1, label: '会话编号', visible: true },
    { key: 2, label: '登录名称', visible: true },
    { key: 3, label: '所属部门', visible: true },
    { key: 4, label: '主机', visible: true },
    { key: 5, label: '登录地点', visible: true },
    { key: 6, label: '操作系统', visible: true },
    { key: 7, label: '浏览器', visible: true },
    { key: 8, label: '登录时间', visible: true }
])

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    ipaddr: undefined,
    userName: undefined
})

function getList() {
    loading.value = true
    initData(queryParams)
        .then(response => {
            onlineList.value = response.rows || []
            total.value = Number(response.total || 0)
        })
        .finally(() => {
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
    handleQuery()
}

function handleForceLogout(row) {
    proxy.$modal
        .confirm(`是否确认强退名称为"${row.userName}"的用户?`)
        .then(() => forceLogout(row.tokenId))
        .then(() => {
            getList()
            proxy.$modal.msgSuccess('强退成功')
        })
        .catch(() => {})
}

getList()
</script>

<style scoped lang="scss">
.monitor-online {
    padding: 20px;

    .online-pane {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-height: calc(100vh - 124px);
    }

    .modern-form {
        margin-bottom: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;

        :deep(.el-form-item) {
            margin-bottom: 0;
            margin-right: 0;
        }

        :deep(.el-form-item__label) {
            font-weight: 600;
        }

        .search-input {
            width: 220px;
        }

        .form-actions {
            margin-left: auto;
        }
    }

    .custom-input {
        :deep(.el-input__wrapper) {
            border-radius: 8px;
            box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
            background-color: var(--el-fill-color-blank);
            transition: all 0.2s;

            &:hover {
                box-shadow: 0 0 0 1px var(--el-border-color) inset;
            }

            &.is-focus,
            &.is-focused {
                box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
                background-color: var(--el-color-primary-light-9);
            }
        }
    }

    .action-btn {
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s;

        &:hover {
            transform: translateY(-1px);
        }
    }

    :deep(.action-btn > span) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .btn-icon {
        font-size: 16px;
        line-height: 1;
        flex-shrink: 0;
    }

    .action-btn.el-button--primary {
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
    }

    .table-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 12px;
        background-color: var(--el-bg-color);
        overflow: hidden;

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 16px;
            background-color: var(--el-fill-color-light);
            border-bottom: 1px solid var(--el-border-color-lighter);

            .left-tools {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
        }
    }

    .summary-card {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        padding: 0 14px;
        border-radius: 10px;
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-lighter);

        .summary-label {
            color: var(--el-text-color-secondary);
            font-size: 13px;
        }

        .summary-value {
            color: var(--el-color-primary);
            font-size: 18px;
            font-weight: 700;
        }
    }

    .modern-table {
        width: 100%;
        height: 100%;

        :deep(.el-scrollbar__bar) {
            display: none !important;
        }

        :deep(.el-table__body-wrapper),
        :deep(.el-table__header-wrapper),
        :deep(.el-scrollbar__wrap) {
            scrollbar-width: none;
            -ms-overflow-style: none;

            &::-webkit-scrollbar {
                width: 0;
                height: 0;
                display: none;
            }
        }

        :deep(th.el-table__cell) {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
            font-weight: 600;
            height: 48px;
        }

        .row-code {
            font-family: 'JetBrains Mono', Consolas, monospace;
            color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
        }

        .token-text {
            font-family: 'JetBrains Mono', Consolas, monospace;
            font-size: 12px;
            color: var(--el-text-color-regular);
        }

        .row-title {
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

        .dept-tag {
            border: none;
            background-color: var(--el-fill-color-dark);
            color: var(--el-text-color-regular);
        }

        .time-cell {
            color: var(--el-text-color-secondary);
            font-size: 13px;
        }

        .action-group {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;

            .op-btn {
                padding: 4px;
                height: 28px;
                width: 28px;
                border-radius: 6px;

                &:hover {
                    background-color: var(--el-fill-color-light);
                }

                :deep(svg) {
                    font-size: 16px;
                }
            }
        }
    }

    .pagination-container {
        padding: 16px;
        border-top: 1px solid var(--el-border-color-lighter);
        display: flex;
        justify-content: flex-end;
    }
}

:global(html.dark) .monitor-online {
    .table-wrapper {
        border-color: var(--el-border-color-darker);
        background-color: var(--el-bg-color-overlay);

        .table-header {
            background-color: var(--el-fill-color-darker);
            border-bottom-color: var(--el-border-color-darker);
        }
    }

    .summary-card {
        background-color: var(--el-fill-color-darker);
        border-color: var(--el-border-color-darker);
    }
}

@media screen and (max-width: 768px) {
    .monitor-online {
        padding: 12px;

        .online-pane {
            min-height: calc(100vh - 96px);
            gap: 12px;
        }

        .modern-form {
            flex-direction: column;
            gap: 12px;

            .el-form-item {
                width: 100%;
            }

            .search-input {
                width: 100%;
            }

            .form-actions {
                margin-left: 0;
                justify-content: flex-end;
            }
        }

        .table-wrapper {
            .table-header {
                flex-direction: column;
                align-items: stretch;

                .right-tools {
                    display: flex;
                    justify-content: flex-end;
                }
            }
        }
    }
}
</style>
