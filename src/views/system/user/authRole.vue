<template>
    <div class="app-container auth-role-page">
        <el-card class="info-card" shadow="never">
            <template #header>
                <div class="card-header">
                    <span class="title">基本信息</span>
                </div>
            </template>
            <el-descriptions :column="2" border class="modern-descriptions">
                <el-descriptions-item label="用户昵称" label-class-name="desc-label" class-name="desc-content">
                    <span class="highlight-text">{{ form.nickName || '-' }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="登录账号" label-class-name="desc-label" class-name="desc-content">
                    <span class="highlight-text">{{ form.userName || '-' }}</span>
                </el-descriptions-item>
            </el-descriptions>
        </el-card>

        <el-card class="role-card" shadow="never">
            <template #header>
                <div class="card-header">
                    <span class="title">角色信息</span>
                </div>
            </template>

            <div class="table-wrapper">
                <el-table
                    v-loading="loading"
                    :row-key="getRowKey"
                    @row-click="clickRow"
                    ref="roleRef"
                    @selection-change="handleSelectionChange"
                    :data="roles.slice((pageNum - 1) * pageSize, pageNum * pageSize)"
                    class="modern-table"
                >
                    <el-table-column label="序号" width="80" type="index" align="center">
                        <template #default="scope">
                            <span class="row-index">{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column type="selection" :reserve-selection="true" :selectable="checkSelectable" width="60" align="center" />
                    <el-table-column label="角色编号" align="center" prop="roleId" width="120">
                        <template #default="{ row }">
                            <span class="role-code">{{ row.roleId }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="角色名称" align="center" prop="roleName" min-width="150">
                        <template #default="{ row }">
                            <span class="role-name">{{ row.roleName }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="权限字符" align="center" prop="roleKey" min-width="150">
                        <template #default="{ row }">
                            <el-tag type="info" effect="light" class="role-tag">{{ row.roleKey }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                        <template #default="scope">
                            <span class="time-cell">{{ parseTime(scope.row.createTime) }}</span>
                        </template>
                    </el-table-column>
                </el-table>

                <div class="pagination-container">
                    <pagination v-show="total > 0" :total="total" v-model:page="pageNum" v-model:limit="pageSize" />
                </div>
            </div>
        </el-card>

        <div class="footer-actions">
            <el-button class="action-btn cancel-btn" @click="close" size="large">返回上一页</el-button>
            <el-button class="action-btn submit-btn" type="primary" @click="submitForm" size="large">提交保存</el-button>
        </div>
    </div>
</template>

<script setup name="AuthRole">
import { ref, nextTick, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import { getAuthRole, updateAuthRole } from '@/api/system/user'

const route = useRoute()
const { proxy } = getCurrentInstance()

const loading = ref(true)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const roleIds = ref([])
const roles = ref([])
const form = ref({
    nickName: undefined,
    userName: undefined,
    userId: undefined
})

function clickRow(row) {
    if (checkSelectable(row)) {
        proxy.$refs['roleRef'].toggleRowSelection(row)
    }
}

function handleSelectionChange(selection) {
    roleIds.value = selection.map(item => item.roleId)
}

function getRowKey(row) {
    return row.roleId
}

function checkSelectable(row) {
    return row.status === '0' ? true : false
}

function close() {
    const obj = { path: '/system/user' }
    proxy.$tab.closeOpenPage(obj)
}

function submitForm() {
    const userId = form.value.userId
    const rIds = roleIds.value.join(',')
    updateAuthRole({ userId: userId, roleIds: rIds }).then(response => {
        proxy.$modal.msgSuccess('授权成功')
        close()
    })
}

;(() => {
    const userId = route.params && route.params.userId
    if (userId) {
        loading.value = true
        getAuthRole(userId).then(response => {
            form.value = response.user
            roles.value = response.roles
            total.value = roles.value.length
            nextTick(() => {
                roles.value.forEach(row => {
                    if (row.flag) {
                        proxy.$refs['roleRef'].toggleRowSelection(row)
                    }
                })
            })
            loading.value = false
        })
    }
})()
</script>

<style scoped lang="scss">
.auth-role-page {
    padding: 24px;
    background-color: var(--el-bg-color-page);
    min-height: calc(100vh - 84px);

    .info-card,
    .role-card {
        border-radius: 16px;
        border: none;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        background: var(--el-bg-color);
        margin-bottom: 24px;
        transition: box-shadow 0.3s ease;

        &:hover {
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
        }

        :deep(.el-card__header) {
            padding: 20px 24px;
            border-bottom: 1px solid var(--el-border-color-lighter);
        }

        :deep(.el-card__body) {
            padding: 24px;
        }
    }

    .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title {
            font-size: 16px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            position: relative;
            padding-left: 12px;
            display: flex;
            align-items: center;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 16px;
                background: linear-gradient(180deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
                border-radius: 2px;
            }
        }
    }

    .modern-descriptions {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--el-border-color-lighter);

        :deep(.el-descriptions__body) {
            background-color: transparent;
        }

        :deep(.desc-label) {
            width: 140px;
            background-color: var(--el-fill-color-light) !important;
            color: var(--el-text-color-regular);
            font-weight: 600;
            padding: 16px 20px !important;
        }

        :deep(.desc-content) {
            padding: 16px 20px !important;
            background-color: var(--el-bg-color) !important;
        }

        .highlight-text {
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
        }
    }

    .table-wrapper {
        border-radius: 12px;
        border: 1px solid var(--el-border-color-lighter);
        overflow: hidden;
    }

    .modern-table {
        width: 100%;

        :deep(th.el-table__cell) {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
            font-weight: 600;
            height: 50px;
            border-bottom: 1px solid var(--el-border-color-lighter);
        }

        :deep(td.el-table__cell) {
            padding: 14px 0;
            border-bottom: 1px solid var(--el-border-color-extra-light);
            cursor: pointer;
        }

        .row-index {
            font-size: 13px;
            color: var(--el-text-color-secondary);
        }

        .role-code {
            font-family: 'JetBrains Mono', Consolas, monospace;
            color: var(--el-text-color-regular);
            background-color: var(--el-fill-color);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
        }

        .role-name {
            font-weight: 600;
            color: var(--el-text-color-primary);
            font-size: 14px;
        }

        .role-tag {
            border: none;
            background-color: var(--el-fill-color-dark);
            color: var(--el-text-color-regular);
            padding: 4px 12px;
            border-radius: 6px;
        }

        .time-cell {
            color: var(--el-text-color-secondary);
            font-size: 13px;
        }
    }

    .pagination-container {
        padding: 16px 20px;
        background-color: var(--el-bg-color);
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid var(--el-border-color-lighter);
    }

    .footer-actions {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-top: 32px;
        margin-bottom: 20px;

        .action-btn {
            border-radius: 12px;
            padding: 0 36px;
            font-weight: 600;
            font-size: 15px;
            height: 48px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &.cancel-btn {
                background-color: var(--el-bg-color);
                border: 1px solid var(--el-border-color);
                color: var(--el-text-color-regular);

                &:hover {
                    color: var(--el-text-color-primary);
                    border-color: var(--el-text-color-secondary);
                    background-color: var(--el-fill-color-light);
                }
            }

            &.submit-btn {
                box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.25);
                border: none;

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(var(--el-color-primary-rgb), 0.35);
                }

                &:active {
                    transform: translateY(0);
                    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
                }
            }
        }
    }

    @media (max-width: 768px) {
        padding: 16px;

        .modern-descriptions {
            :deep(.el-descriptions__table) {
                display: flex;
                flex-direction: column;
            }

            :deep(tbody),
            :deep(tr) {
                display: flex;
                flex-direction: column;
                width: 100%;
            }

            :deep(.el-descriptions__cell) {
                display: flex;
                width: 100%;
                border-bottom: 1px solid var(--el-border-color-lighter);
            }

            :deep(.desc-label) {
                width: 120px;
                border-right: 1px solid var(--el-border-color-lighter);
                border-bottom: none;
            }

            :deep(.desc-content) {
                flex: 1;
                border-bottom: none;
            }
        }

        .footer-actions {
            flex-direction: column;
            gap: 16px;

            .action-btn {
                width: 100%;
            }
        }
    }

    :global(html.dark) & {
        .info-card,
        .role-card {
            background-color: var(--el-bg-color-overlay);
            border: 1px solid var(--el-border-color-darker);
        }

        .table-wrapper {
            border-color: var(--el-border-color-darker);
        }
    }
}
</style>
