<template>
    <div class="app-container system-crud-page system-dict-data">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px" class="search-form">
            <el-form-item label="字典名称" prop="dictType">
                <el-select v-model="queryParams.dictType" placeholder="请选择字典名称" style="width: 240px">
                    <el-option v-for="item in typeOptions" :key="item.dictId" :label="item.dictName" :value="item.dictType" />
                </el-select>
            </el-form-item>
            <el-form-item label="字典标签" prop="dictLabel">
                <el-input v-model="queryParams.dictLabel" placeholder="请输入字典标签" clearable style="width: 240px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="数据状态" clearable style="width: 240px">
                    <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
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
            <div class="table-toolbar">
                <div class="left-tools">
                    <el-button type="primary" @click="handleAdd" v-hasPermi="['system:dict:add']" class="tool-btn">
                        <Icon icon="ep:plus" class="btn-icon" />
                        新增
                    </el-button>
                    <el-button type="success" :disabled="single" @click="handleUpdate" v-hasPermi="['system:dict:edit']" class="tool-btn">
                        <Icon icon="ep:edit" class="btn-icon" />
                        修改
                    </el-button>
                    <el-button type="danger" :disabled="multiple" @click="handleDelete" v-hasPermi="['system:dict:remove']" class="tool-btn">
                        <Icon icon="ep:delete" class="btn-icon" />
                        删除
                    </el-button>
                    <el-button type="warning" @click="handleExport" v-hasPermi="['system:dict:export']" class="tool-btn">
                        <Icon icon="ep:download" class="btn-icon" />
                        导出
                    </el-button>
                    <el-button @click="handleClose" class="tool-btn">
                        <Icon icon="ep:close" class="btn-icon" />
                        关闭
                    </el-button>
                </div>
                <div class="right-tools">
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </div>
            </div>

            <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange" class="modern-table">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="字典编码" align="center" prop="dictCode" />
                <el-table-column label="字典标签" align="center" prop="dictLabel" min-width="140">
                    <template #default="scope">
                        <span v-if="isPlainTag(scope.row)">{{ scope.row.dictLabel }}</span>
                        <el-tag v-else :type="scope.row.listClass === 'primary' ? '' : scope.row.listClass" :class="scope.row.cssClass">
                            {{ scope.row.dictLabel }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="字典键值" align="center" prop="dictValue" />
                <el-table-column label="字典排序" align="center" prop="dictSort" />
                <el-table-column label="状态" align="center" prop="status">
                    <template #default="scope">
                        <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
                    </template>
                </el-table-column>
                <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
                <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                    <template #default="scope">
                        <span>{{ parseTime(scope.row.createTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <div class="action-group">
                            <el-tooltip content="修改" placement="top">
                                <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:dict:edit']" class="op-btn">
                                    <Icon icon="ep:edit" class="btn-icon" />
                                </el-button>
                            </el-tooltip>
                            <el-tooltip content="删除" placement="top">
                                <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['system:dict:remove']" class="op-btn">
                                    <Icon icon="ep:delete" class="btn-icon" />
                                </el-button>
                            </el-tooltip>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </div>

        <el-dialog :title="title" v-model="open" width="500px" append-to-body class="modern-dialog">
            <el-form ref="dataRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="字典类型">
                    <el-input v-model="form.dictType" disabled />
                </el-form-item>
                <el-form-item label="数据标签" prop="dictLabel">
                    <el-input v-model="form.dictLabel" placeholder="请输入数据标签" />
                </el-form-item>
                <el-form-item label="数据键值" prop="dictValue">
                    <el-input v-model="form.dictValue" placeholder="请输入数据键值" />
                </el-form-item>
                <el-form-item label="样式属性" prop="cssClass">
                    <el-input v-model="form.cssClass" placeholder="请输入样式属性" />
                </el-form-item>
                <el-form-item label="显示排序" prop="dictSort">
                    <el-input-number v-model="form.dictSort" controls-position="right" :min="0" />
                </el-form-item>
                <el-form-item label="回显样式" prop="listClass">
                    <el-select v-model="form.listClass">
                        <el-option v-for="item in listClassOptions" :key="item.value" :label="`${item.label}(${item.value})`" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="form.status">
                        <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm" class="dialog-btn">确 定</el-button>
                    <el-button @click="cancel" class="dialog-btn">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="Data">
import useDictStore from '@/store/modules/dict'
import { optionselect as getDictOptionselect, getType } from '@/api/system/dict/type'
import { listData, getData, delData, addData, updateData } from '@/api/system/dict/data'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const dataList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const defaultDictType = ref('')
const typeOptions = ref([])
const route = useRoute()

const listClassOptions = ref([
    { value: 'default', label: '默认' },
    { value: 'primary', label: '主要' },
    { value: 'success', label: '成功' },
    { value: 'info', label: '信息' },
    { value: 'warning', label: '警告' },
    { value: 'danger', label: '危险' }
])

const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        dictType: undefined,
        dictLabel: undefined,
        status: undefined
    },
    rules: {
        dictLabel: [{ required: true, message: '数据标签不能为空', trigger: 'blur' }],
        dictValue: [{ required: true, message: '数据键值不能为空', trigger: 'blur' }],
        dictSort: [{ required: true, message: '数据顺序不能为空', trigger: 'blur' }]
    }
})

const { queryParams, form, rules } = toRefs(data)

function isPlainTag(row) {
    return (row.listClass === '' || row.listClass === 'default') && (row.cssClass === '' || row.cssClass == null)
}

function getTypes(dictId) {
    getType(dictId).then(response => {
        queryParams.value.dictType = response.data.dictType
        defaultDictType.value = response.data.dictType
        getList()
    })
}

function getTypeList() {
    getDictOptionselect().then(response => {
        typeOptions.value = response.data
    })
}

function getList() {
    loading.value = true
    listData(queryParams.value).then(response => {
        dataList.value = response.rows
        total.value = response.total
        loading.value = false
    })
}

function cancel() {
    open.value = false
    reset()
}

function reset() {
    form.value = {
        dictCode: undefined,
        dictType: queryParams.value.dictType,
        dictLabel: undefined,
        dictValue: undefined,
        cssClass: undefined,
        listClass: 'default',
        dictSort: 0,
        status: '0',
        remark: undefined
    }
    proxy.resetForm('dataRef')
}

function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
}

function handleClose() {
    proxy.$tab.closeOpenPage({ path: '/system/dict' })
}

function resetQuery() {
    proxy.resetForm('queryRef')
    queryParams.value.dictType = defaultDictType.value
    handleQuery()
}

function handleAdd() {
    reset()
    open.value = true
    title.value = '添加字典数据'
}

function handleSelectionChange(selection) {
    ids.value = selection.map(item => item.dictCode)
    single.value = selection.length !== 1
    multiple.value = !selection.length
}

function handleUpdate(row) {
    reset()
    const dictCode = row.dictCode || ids.value
    getData(dictCode).then(response => {
        form.value = response.data
        open.value = true
        title.value = '修改字典数据'
    })
}

function submitForm() {
    proxy.$refs['dataRef'].validate(valid => {
        if (valid) {
            if (form.value.dictCode != undefined) {
                updateData(form.value).then(() => {
                    useDictStore().removeDict(queryParams.value.dictType)
                    proxy.$modal.msgSuccess('修改成功')
                    open.value = false
                    getList()
                })
            } else {
                addData(form.value).then(() => {
                    useDictStore().removeDict(queryParams.value.dictType)
                    proxy.$modal.msgSuccess('新增成功')
                    open.value = false
                    getList()
                })
            }
        }
    })
}

function handleDelete(row) {
    const dictCodes = row.dictCode || ids.value
    proxy.$modal
        .confirm('是否确认删除字典编码为"' + dictCodes + '"的数据项？')
        .then(function () {
            return delData(dictCodes)
        })
        .then(() => {
            getList()
            proxy.$modal.msgSuccess('删除成功')
            useDictStore().removeDict(queryParams.value.dictType)
        })
        .catch(() => {})
}

function handleExport() {
    proxy.download(
        'system/dict/data/export',
        {
            ...queryParams.value
        },
        `dict_data_${new Date().getTime()}.xlsx`
    )
}

getTypes(route.params && route.params.dictId)
getTypeList()
</script>

<style scoped lang="scss">
@use '@/assets/styles/crud-page.scss' as *;
</style>
