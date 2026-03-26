<template>
    <div class="app-container system-crud-page system-dict">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px" class="search-form">
            <el-form-item label="字典名称" prop="dictName">
                <el-input v-model="queryParams.dictName" placeholder="请输入字典名称" clearable style="width: 240px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="字典类型" prop="dictType">
                <el-input v-model="queryParams.dictType" placeholder="请输入字典类型" clearable style="width: 240px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="字典状态" clearable style="width: 240px">
                    <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="创建时间" style="width: 308px">
                <el-date-picker
                    v-model="dateRange"
                    value-format="YYYY-MM-DD"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                ></el-date-picker>
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
                    <el-button type="danger" @click="handleRefreshCache" v-hasPermi="['system:dict:remove']" class="tool-btn">
                        <Icon icon="ep:refresh" class="btn-icon" />
                        刷新缓存
                    </el-button>
                </div>
                <div class="right-tools">
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </div>
            </div>

            <el-table v-loading="loading" :data="typeList" @selection-change="handleSelectionChange" class="modern-table">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="字典编号" align="center" prop="dictId" />
                <el-table-column label="字典名称" align="center" prop="dictName" :show-overflow-tooltip="true" />
                <el-table-column label="字典类型" align="center" :show-overflow-tooltip="true">
                    <template #default="scope">
                        <router-link :to="'/system/dict-data/index/' + scope.row.dictId" class="link-type">
                            <span>{{ scope.row.dictType }}</span>
                        </router-link>
                    </template>
                </el-table-column>
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

        <!-- 添加或修改参数配置对话框 -->
        <el-dialog :title="title" v-model="open" width="500px" append-to-body class="modern-dialog">
            <el-form ref="dictRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="字典名称" prop="dictName">
                    <el-input v-model="form.dictName" placeholder="请输入字典名称" />
                </el-form-item>
                <el-form-item label="字典类型" prop="dictType">
                    <el-input v-model="form.dictType" placeholder="请输入字典类型" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="form.status">
                        <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
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

<script setup name="Dict">
import useDictStore from '@/store/modules/dict'
import { listType, getType, delType, addType, updateType, refreshCache } from '@/api/system/dict/type'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const typeList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const dateRange = ref([])

const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        dictName: undefined,
        dictType: undefined,
        status: undefined
    },
    rules: {
        dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
        dictType: [{ required: true, message: '字典类型不能为空', trigger: 'blur' }]
    }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
    loading.value = true
    listType(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
        typeList.value = response.rows
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
        dictId: undefined,
        dictName: undefined,
        dictType: undefined,
        status: '0',
        remark: undefined
    }
    proxy.resetForm('dictRef')
}

function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
}

function resetQuery() {
    dateRange.value = []
    proxy.resetForm('queryRef')
    handleQuery()
}

function handleAdd() {
    reset()
    open.value = true
    title.value = '添加字典类型'
}

function handleSelectionChange(selection) {
    ids.value = selection.map(item => item.dictId)
    single.value = selection.length != 1
    multiple.value = !selection.length
}

function handleUpdate(row) {
    reset()
    const dictId = row.dictId || ids.value
    getType(dictId).then(response => {
        form.value = response.data
        open.value = true
        title.value = '修改字典类型'
    })
}

function submitForm() {
    proxy.$refs['dictRef'].validate(valid => {
        if (valid) {
            if (form.value.dictId != undefined) {
                updateType(form.value).then(response => {
                    proxy.$modal.msgSuccess('修改成功')
                    open.value = false
                    getList()
                })
            } else {
                addType(form.value).then(response => {
                    proxy.$modal.msgSuccess('新增成功')
                    open.value = false
                    getList()
                })
            }
        }
    })
}

function handleDelete(row) {
    const dictIds = row.dictId || ids.value
    proxy.$modal
        .confirm('是否确认删除字典编号为"' + dictIds + '"的数据项？')
        .then(function () {
            return delType(dictIds)
        })
        .then(() => {
            getList()
            proxy.$modal.msgSuccess('删除成功')
        })
        .catch(() => {})
}

function handleExport() {
    proxy.download(
        'system/dict/type/export',
        {
            ...queryParams.value
        },
        `dict_${new Date().getTime()}.xlsx`
    )
}

function handleRefreshCache() {
    refreshCache().then(() => {
        proxy.$modal.msgSuccess('刷新成功')
        useDictStore().cleanDict()
    })
}

getList()
</script>

<style scoped lang="scss">
@use '@/assets/styles/crud-page.scss' as *;
</style>
