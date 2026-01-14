<template>
    <div class="app-container tag-manage">
        <el-form v-show="showSearch" ref="queryRef" :model="queryParams" :inline="true" class="search-form">
            <el-form-item label="标签名称" prop="name">
                <el-input v-model="queryParams.name" placeholder="请输入标签名称" clearable style="width: 240px" @keyup.enter="handleQuery">
                    <template #prefix>
                        <Icon icon="mdi:magnify" />
                    </template>
                </el-input>
            </el-form-item>

            <el-form-item label="标签编码" prop="code">
                <el-input v-model="queryParams.code" placeholder="请输入标签编码" clearable style="width: 240px" @keyup.enter="handleQuery">
                    <template #prefix>
                        <Icon icon="mdi:code-tags" />
                    </template>
                </el-input>
            </el-form-item>

            <el-form-item label="启用状态" prop="isActive">
                <el-select v-model="queryParams.isActive" placeholder="请选择状态" clearable style="width: 240px">
                    <el-option v-for="dict in tag_use_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
            </el-form-item>

            <el-form-item>
                <el-button type="primary" @click="handleQuery">
                    <Icon icon="mdi:magnify" class="mr-1" />
                    搜索
                </el-button>
                <el-button @click="resetQuery">
                    <Icon icon="mdi:refresh" class="mr-1" />
                    重置
                </el-button>
            </el-form-item>
        </el-form>

        <div class="table-wrapper">
            <div class="table-header">
                <div class="left-tools">
                    <el-button type="primary" plain @click="handleAdd">
                        <Icon icon="mdi:plus" class="mr-1" />
                        新增
                    </el-button>
                    <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleDelete()">
                        <Icon icon="mdi:trash-can-outline" class="mr-1" />
                        删除
                    </el-button>
                </div>
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
            </div>

            <el-table v-loading="loading" :data="categoryList" header-cell-class-name="table-header-cell" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="标签编号" prop="id" align="center" width="80" />
                <el-table-column label="标签名称" prop="name" align="left" :show-overflow-tooltip="true">
                    <template #default="{ row }">
                        <span class="row-title">{{ row.name }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="标签编码" prop="code" align="center" :show-overflow-tooltip="true">
                    <template #default="scope">
                        <router-link :to="`/configuration/tag-data/index/${scope.row.id}`" class="link-type">
                            <span class="row-code">{{ scope.row.code }}</span>
                        </router-link>
                    </template>
                </el-table-column>
                <el-table-column label="标签序号" prop="sortOrder" align="center" width="100" />
                <el-table-column label="状态" prop="isActive" align="center" width="100">
                    <template #default="{ row }">
                        <el-switch v-model="row.isActive" active-value="1" inactive-value="0" @change="handleStatusChange(row)" />
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" align="center" width="180">
                    <template #default="{ row }">
                        <span class="time-cell">{{ formatTimeCell(row.createTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="更新时间" prop="updateTime" align="center" width="180">
                    <template #default="{ row }">
                        <span class="time-cell">{{ formatTimeCell(row.updateTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="160" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handleEdit(row)">
                            <Icon icon="mdi:pencil-outline" class="mr-1" />
                            修改
                        </el-button>
                        <el-button link type="danger" @click="handleDelete(row)">
                            <Icon icon="mdi:trash-can-outline" class="mr-1" />
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </div>

        <el-drawer v-model="editDialogVisible" :title="dialogTitle" direction="rtl" size="500px" append-to-body destroy-on-close class="modern-drawer">
            <div class="drawer-content">
                <el-form ref="editFormRef" :model="editForm" :rules="rules" label-width="100px" label-position="top" class="drawer-form">
                    <el-row :gutter="24">
                        <el-col :span="24">
                            <el-form-item label="标签名称" prop="name">
                                <el-input v-model="editForm.name" placeholder="请输入标签名称" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="标签编码" prop="code">
                                <el-input v-model="editForm.code" placeholder="请输入标签编码" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="排序" prop="sortOrder">
                                <el-input-number v-model="editForm.sortOrder" :min="0" controls-position="right" style="width: 100%" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="状态" prop="isActive">
                                <el-radio-group v-model="editForm.isActive">
                                    <el-radio label="1">启用</el-radio>
                                    <el-radio label="0">停用</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </div>
            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="editDialogVisible = false" class="btn-cancel">取消</el-button>
                    <el-button type="primary" :loading="submitLoading" @click="submitEdit" class="btn-submit">确定</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup name="InterestCategory">
import { ref, reactive, toRefs, getCurrentInstance, onMounted, computed } from 'vue'
import { parseTime } from '@/utils/ruoyi'
import { addInterestCategory, deleteInterestCategory, listInterestCategory, updateInterestCategory } from '@/api/configuration/tag'

const { proxy } = getCurrentInstance()
const { tag_use_type } = proxy.useDict('tag_use_type')

const categoryList = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const selectedRows = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const editDialogVisible = ref(false)
const dialogTitle = ref('新增标签')
const submitLoading = ref(false)
const editFormRef = ref()

const selectedIds = computed(() => selectedRows.value.map(item => item.id).filter(Boolean))

const data = reactive({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: '',
        code: '',
        isActive: undefined
    },
    editForm: {
        id: undefined,
        name: '',
        code: '',
        sortOrder: 0,
        isActive: '1'
    },
    rules: {
        name: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }],
        code: [{ required: true, message: '标签编码不能为空', trigger: 'blur' }],
        sortOrder: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
        isActive: [{ required: true, message: '状态不能为空', trigger: 'change' }]
    }
})

const { queryParams, editForm, rules } = toRefs(data)

function getList() {
    loading.value = true

    const query = {
        pageNum: queryParams.value.pageNum,
        pageSize: queryParams.value.pageSize,
        name: queryParams.value.name,
        code: queryParams.value.code,
        isActive: queryParams.value.isActive
    }

    listInterestCategory(query)
        .then(res => {
            categoryList.value = res.rows || []
            total.value = res.total || 0
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
    proxy.resetForm?.('queryRef')
    queryParams.value.pageNum = 1
    queryParams.value.pageSize = 10
    queryParams.value.name = ''
    queryParams.value.code = ''
    queryParams.value.isActive = undefined
    getList()
}

function handleSelectionChange(selection) {
    selectedRows.value = selection
    ids.value = selection.map(item => item.id)
    single.value = selection.length !== 1
    multiple.value = !selection.length
}

function resetEditForm() {
    proxy.resetForm?.('editFormRef')
    Object.assign(editForm.value, {
        id: undefined,
        name: '',
        code: '',
        sortOrder: 0,
        isActive: '1'
    })
}

function handleAdd() {
    dialogTitle.value = '新增标签'
    resetEditForm()
    editDialogVisible.value = true
}

function handleEdit(row) {
    if (!row?.id) {
        proxy.$modal?.msgError && proxy.$modal.msgError('未找到要修改的标签')
        return
    }

    dialogTitle.value = '修改标签'
    resetEditForm()
    Object.assign(editForm.value, {
        id: row.id,
        name: row.name || '',
        code: row.code || '',
        sortOrder: row.sortOrder ?? 0,
        isActive: row.isActive ?? '1'
    })
    editDialogVisible.value = true
}

function handleDelete(row) {
    const targetRows = row ? [row] : selectedRows.value
    const targetIds = targetRows.map(item => item.id).filter(Boolean)

    if (!targetIds.length) {
        proxy.$modal?.msgWarning && proxy.$modal.msgWarning('请先选择要删除的数据')
        return
    }

    const names = targetRows.map(item => item.name || item.id).join('、')
    proxy.$modal
        ?.confirm?.(`确认删除标签「${names}」吗？`)
        .then(() => {
            loading.value = true
            return Promise.all(targetIds.map(id => deleteInterestCategory(id)))
        })
        .then(() => {
            proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess('删除成功')
            getList()
        })
        .finally(() => {
            loading.value = false
        })
        .catch(() => {})
}

function handleStatusChange(row) {
    if (!row?.id) return

    const previous = row.isActive === '1' ? '0' : '1'
    const text = row.isActive === '1' ? '启用' : '停用'
    const payload = {
        id: row.id,
        name: row.name,
        code: row.code,
        sortOrder: row.sortOrder ?? 0,
        isActive: row.isActive
    }

    proxy.$modal
        ?.confirm?.(`确认${text}标签「${row.name || row.id}」吗？`)
        .then(() => updateInterestCategory(payload))
        .then(() => {
            proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess(`${text}成功`)
            getList()
        })
        .catch(() => {
            row.isActive = previous
        })
}

function submitEdit() {
    if (!editFormRef.value) return

    editFormRef.value.validate(valid => {
        if (!valid) return

        const isUpdate = !!editForm.value.id
        submitLoading.value = true
        const action = isUpdate ? updateInterestCategory(editForm.value) : addInterestCategory(editForm.value)

        action
            .then(() => {
                proxy.$modal?.msgSuccess ? proxy.$modal.msgSuccess(isUpdate ? '修改成功' : '新增成功') : console.info('保存成功')
                editDialogVisible.value = false
                getList()
            })
            .finally(() => {
                submitLoading.value = false
            })
    })
}

function formatTimeCell(val) {
    if (!val) return ''
    return parseTime(val)
}

onMounted(() => {
    getList()
})
</script>

<style scoped lang="scss">
.tag-manage {
    .table-wrapper {
        border-radius: 6px;

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            .left-tools {
                display: flex;
                gap: 12px;
                align-items: center;
            }
        }
    }

    .time-cell {
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }

    .row-title {
        font-weight: 500;
        color: var(--el-text-color-primary);
        cursor: pointer;
    }

    .row-code {
        font-family: 'JetBrains Mono', Consolas, monospace;
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        border: 1px solid var(--el-color-primary-light-8);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
    }
}
</style>
