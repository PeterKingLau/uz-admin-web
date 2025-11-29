<template>
    <div class="app-container">
        <!-- 查询条件 -->
        <el-form v-show="showSearch" ref="queryRef" :model="queryParams" :inline="true" label-width="68px">
            <el-form-item label="标签名称" prop="name">
                <el-input v-model="queryParams.name" placeholder="请输入标签名称" clearable style="width: 240px" @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="标签编码" prop="code">
                <el-input v-model="queryParams.code" placeholder="请输入标签编码" clearable style="width: 240px" @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="启用状态" prop="isActive">
                <el-select v-model="queryParams.isActive" placeholder="请选择状态" clearable style="width: 240px">
                    <el-option v-for="dict in tag_use_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
            </el-form-item>

            <el-form-item>
                <el-button type="primary" @click="handleQuery">
                    <el-icon><Icon icon="ep:search" /></el-icon>
                    搜索
                </el-button>
                <el-button @click="resetQuery">
                    <el-icon><Icon icon="ep:refresh" /></el-icon>
                    重置
                </el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain @click="handleAdd">
                    <el-icon><Icon icon="ep:plus" /></el-icon>
                    新增
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain :disabled="single" @click="handleUpdate">
                    <el-icon><Icon icon="ep:edit" /></el-icon>
                    修改
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="danger" plain :disabled="multiple" @click="handleDelete()">
                    <el-icon><Icon icon="ep:delete" /></el-icon>
                    删除
                </el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <!-- 列表 -->
        <el-table v-loading="loading" :data="categoryList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="标签编号" prop="id" align="center" width="80" />
            <el-table-column label="标签名称" prop="name" align="center" :show-overflow-tooltip="true" />
            <el-table-column label="标签编码" prop="code" align="center" :show-overflow-tooltip="true">
                <template #default="scope">
                    <router-link :to="`/configuration/tag-data/index/${scope.row.id}`" class="link-type">
                        <span>{{ scope.row.code }}</span>
                    </router-link>
                </template>
            </el-table-column>
            <el-table-column label="标签序号" prop="sortOrder" align="center" width="100" />
            <el-table-column label="状态" prop="isActive" align="center" width="100">
                <template #default="scope">
                    <dict-tag :options="tag_use_type" :value="scope.row.isActive" />
                </template>
            </el-table-column>
            <el-table-column label="创建时间" prop="createTime" align="center" width="180">
                <template #default="{ row }">
                    <span>{{ formatTimeCell(row.createTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="更新时间" prop="updateTime" align="center" width="180">
                <template #default="{ row }">
                    <span>{{ formatTimeCell(row.updateTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="备注" prop="remark" align="center" :show-overflow-tooltip="true" />
            <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width operation-column">
                <template #default="{ row }">
                    <el-button link type="primary" @click="handleEdit(row)">
                        <el-icon><Icon icon="ep:edit" /></el-icon>
                        修改
                    </el-button>
                    <el-button link type="danger" @click="handleDelete(row)">
                        <el-icon><Icon icon="ep:delete" /></el-icon>
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 编辑/新增弹窗 -->
        <el-dialog v-model="editDialogVisible" :title="dialogTitle" width="460px" append-to-body>
            <el-form ref="editFormRef" :model="editForm" :rules="rules" label-width="90px">
                <el-form-item label="标签名称" prop="name">
                    <el-input v-model="editForm.name" placeholder="请输入标签名称" />
                </el-form-item>
                <el-form-item label="标签编码" prop="code">
                    <el-input v-model="editForm.code" placeholder="请输入标签编码" />
                </el-form-item>
                <el-form-item label="排序" prop="sortOrder">
                    <el-input-number v-model="editForm.sortOrder" :min="0" />
                </el-form-item>
                <el-form-item label="状态" prop="isActive">
                    <el-radio-group v-model="editForm.isActive">
                        <el-radio label="1">启用</el-radio>
                        <el-radio label="0">停用</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="editDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="submitLoading" @click="submitEdit">确定</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </div>
</template>

<script setup name="InterestCategory">
import { ref, reactive, toRefs, getCurrentInstance, onMounted } from 'vue'
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

/** 查询列表 */
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

/** 搜索 */
function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
}

/** 重置 */
function resetQuery() {
    proxy.resetForm?.('queryRef')
    queryParams.value.pageNum = 1
    queryParams.value.pageSize = 10
    queryParams.value.name = ''
    queryParams.value.code = ''
    queryParams.value.isActive = undefined
    getList()
}

/** 多选框选中数据 */
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

/** 新增 */
function handleAdd() {
    dialogTitle.value = '新增标签'
    resetEditForm()
    editDialogVisible.value = true
}

/** 修改-根据选择 */
function handleUpdate() {
    if (single.value || !selectedRows.value.length) {
        proxy.$modal?.msgWarning && proxy.$modal.msgWarning('请选择一条要修改的数据')
        return
    }
    handleEdit(selectedRows.value[0])
}

/** 修改-行内 */
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

/** 删除 */
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

/** 提交保存（新增/修改） */
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

/** 单元格时间格式化（防止空值报错） */
function formatTimeCell(val) {
    if (!val) return ''
    return parseTime(val)
}

onMounted(() => {
    getList()
})
</script>

<style scoped>
.operation-column .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
}
</style>
