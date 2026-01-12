<template>
    <div class="app-container tag-data">
        <!-- 查询条件 -->
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px" class="search-form">
            <el-form-item label="标签名称" prop="name">
                <el-input v-model="queryParams.name" placeholder="请输入标签名称" clearable style="width: 220px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="启用状态" prop="isActive">
                <el-select v-model="queryParams.isActive" placeholder="请选择状态" clearable style="width: 200px">
                    <el-option v-for="dict in tag_use_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
                <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
            </el-form-item>
        </el-form>

        <div class="table-wrapper">
            <div class="table-header">
                <div class="left-tools">
                    <el-button type="primary" plain @click="handleAdd"><Icon icon="ep:plus" />新增</el-button>
                    <el-button type="success" plain :disabled="single" @click="handleUpdate"><Icon icon="ep:edit" />修改</el-button>
                    <el-button type="danger" plain :disabled="multiple" @click="handleDelete"><Icon icon="ep:delete" />删除</el-button>
                    <el-button type="warning" plain @click="handleClose"><Icon icon="ep:close" />返回</el-button>
                </div>
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
            </div>

            <el-table
                v-loading="loading"
                :data="dataList"
                table-layout="fixed"
                header-cell-class-name="table-header-cell"
                @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="标签编码" align="center" prop="id" width="90" />
                <el-table-column label="标签名称" align="center" prop="name" :show-overflow-tooltip="true" />
                <el-table-column label="描述" align="center" prop="description" :show-overflow-tooltip="true" />
                <el-table-column label="状态" align="center" prop="isActive" width="100">
                    <template #default="scope">
                        <dict-tag :options="tag_use_type" :value="scope.row.isActive" />
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                    <template #default="scope">
                        <span>{{ formatTimeCell(scope.row.createTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
                    <template #default="scope">
                        <span>{{ formatTimeCell(scope.row.updateTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-button link type="primary" @click="handleEdit(scope.row)"><Icon icon="ep:edit" />修改</el-button>
                        <el-button link type="danger" @click="handleDelete(scope.row)"><Icon icon="ep:delete" />删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </div>

        <!-- 添加或修改子标签对话框 -->
        <el-dialog :title="dialogTitle" v-model="open" width="500px" append-to-body>
            <el-form ref="dataRef" :model="form" :rules="rules" label-width="90px">
                <el-form-item label="标签名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入标签名称" />
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
                </el-form-item>
                <el-form-item label="状态" prop="isActive">
                    <el-radio-group v-model="form.isActive">
                        <el-radio label="1">启用</el-radio>
                        <el-radio label="0">停用</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="open = false">取消</el-button>
                    <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="TagData">
import { onMounted, reactive, ref, toRefs, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseTime } from '@/utils/ruoyi'
import { addInterestTag, deleteInterestTag, listInterestTag, updateInterestTag } from '@/api/configuration/tag'

const { proxy } = getCurrentInstance()
const { tag_use_type } = proxy.useDict('tag_use_type')
const route = useRoute()
const router = useRouter()

const dataList = ref([])
const open = ref(false)
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const selectedRows = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const dialogTitle = ref('新增子标签')
const submitLoading = ref(false)
const categoryId = ref()
const dataRef = ref()

const data = reactive({
    form: {
        id: undefined,
        name: '',
        description: '',
        isActive: '1'
    },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: '',
        isActive: undefined
    },
    rules: {
        name: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }],
        isActive: [{ required: true, message: '状态不能为空', trigger: 'change' }]
    }
})

const { form, queryParams, rules } = toRefs(data)

function ensureCategoryId() {
    const id = Number(route.params.id)
    if (!Number.isFinite(id) || id <= 0) {
        proxy.$modal?.msgError && proxy.$modal.msgError('未获取到父级标签ID')
        return null
    }
    categoryId.value = id
    return id
}

/** 查询列表 */
function getList() {
    const cid = ensureCategoryId()
    if (!cid) return
    loading.value = true

    const query = {
        pageNum: queryParams.value.pageNum,
        pageSize: queryParams.value.pageSize,
        name: queryParams.value.name,
        isActive: queryParams.value.isActive,
        categoryId: cid
    }

    listInterestTag(query)
        .then(res => {
            dataList.value = res.rows || []
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

function resetFormData() {
    proxy.resetForm?.('dataRef')
    Object.assign(form.value, {
        id: undefined,
        name: '',
        description: '',
        isActive: '1'
    })
}

/** 新增按钮 */
function handleAdd() {
    dialogTitle.value = '新增子标签'
    resetFormData()
    open.value = true
}

/** 修改按钮（批量入口） */
function handleUpdate() {
    if (single.value || !selectedRows.value.length) {
        proxy.$modal?.msgWarning && proxy.$modal.msgWarning('请选择一条要修改的数据')
        return
    }
    handleEdit(selectedRows.value[0])
}

/** 修改按钮（行内） */
function handleEdit(row) {
    if (!row?.id) {
        proxy.$modal?.msgError && proxy.$modal.msgError('未找到要修改的子标签')
        return
    }

    dialogTitle.value = '修改子标签'
    resetFormData()
    Object.assign(form.value, {
        id: row.id,
        name: row.name || '',
        description: row.description || '',
        isActive: row.isActive ?? '1'
    })
    open.value = true
}

/** 删除 */
function handleDelete(row) {
    const targets = row ? [row] : selectedRows.value
    const targetIds = targets.map(item => item.id).filter(Boolean)

    if (!targetIds.length) {
        proxy.$modal?.msgWarning && proxy.$modal.msgWarning('请先选择要删除的数据')
        return
    }

    const names = targets.map(item => item.name || item.id).join('、')
    proxy.$modal
        ?.confirm?.(`确认删除子标签「${names}」吗？`)
        .then(() => {
            loading.value = true
            return Promise.all(targetIds.map(id => deleteInterestTag(id)))
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

/** 保存 */
function submitForm() {
    if (!dataRef.value) return

    dataRef.value.validate(valid => {
        if (!valid) return
        const cid = ensureCategoryId()
        if (!cid) return

        const isUpdate = !!form.value.id
        const payload = isUpdate
            ? { id: form.value.id, name: form.value.name, description: form.value.description, isActive: form.value.isActive }
            : { name: form.value.name, categoryId: cid, description: form.value.description, isActive: form.value.isActive }

        submitLoading.value = true
        const action = isUpdate ? updateInterestTag(payload) : addInterestTag(payload)

        action
            .then(() => {
                proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess(isUpdate ? '修改成功' : '新增成功')
                open.value = false
                getList()
            })
            .finally(() => {
                submitLoading.value = false
            })
    })
}

/** 返回 */
function handleClose() {
    router.push('/configuration/tag')
}

function formatTimeCell(val) {
    if (!val) return ''
    return parseTime(val)
}

onMounted(() => {
    ensureCategoryId()
    getList()
})
</script>
