<template>
    <div class="app-container system-crud-page system-notice">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" class="search-form">
            <el-form-item label="公告标题" prop="noticeTitle">
                <el-input v-model="queryParams.noticeTitle" placeholder="请输入公告标题" clearable style="width: 200px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="操作人员" prop="createBy">
                <el-input v-model="queryParams.createBy" placeholder="请输入操作人员" clearable style="width: 200px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="类型" prop="noticeType">
                <el-select v-model="queryParams.noticeType" placeholder="公告类型" clearable style="width: 200px">
                    <el-option v-for="dict in sys_notice_type" :key="dict.value" :label="dict.label" :value="dict.value" />
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
                    <el-button type="primary" @click="handleAdd" v-hasPermi="['system:notice:add']" class="tool-btn">
                        <Icon icon="ep:plus" class="btn-icon" />
                        新增
                    </el-button>
                    <el-button type="success" :disabled="single" @click="handleUpdate" v-hasPermi="['system:notice:edit']" class="tool-btn">
                        <Icon icon="ep:edit" class="btn-icon" />
                        修改
                    </el-button>
                    <el-button type="danger" :disabled="multiple" @click="handleDelete" v-hasPermi="['system:notice:remove']" class="tool-btn">
                        <Icon icon="ep:delete" class="btn-icon" />
                        删除
                    </el-button>
                </div>
                <div class="right-tools">
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </div>
            </div>

            <el-table v-loading="loading" :data="noticeList" @selection-change="handleSelectionChange" class="modern-table">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="序号" align="center" prop="noticeId" width="100" />
                <el-table-column label="公告标题" align="center" prop="noticeTitle" :show-overflow-tooltip="true" />
                <el-table-column label="公告类型" align="center" prop="noticeType" width="100">
                    <template #default="scope">
                        <dict-tag :options="sys_notice_type" :value="scope.row.noticeType" />
                    </template>
                </el-table-column>
                <el-table-column label="状态" align="center" prop="status" width="100">
                    <template #default="scope">
                        <dict-tag :options="sys_notice_status" :value="scope.row.status" />
                    </template>
                </el-table-column>
                <el-table-column label="创建者" align="center" prop="createBy" width="100" />
                <el-table-column label="创建时间" align="center" prop="createTime" width="100">
                    <template #default="scope">
                        <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <div class="action-group">
                            <el-tooltip content="修改" placement="top">
                                <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:notice:edit']" class="op-btn">
                                    <Icon icon="ep:edit" class="btn-icon" />
                                </el-button>
                            </el-tooltip>
                            <el-tooltip content="删除" placement="top">
                                <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['system:notice:remove']" class="op-btn">
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

        <!-- 添加或修改公告对话框 -->
        <el-dialog :title="title" v-model="open" width="780px" append-to-body destroy-on-close class="modern-dialog">
            <el-form ref="noticeRef" :model="form" :rules="rules" label-width="80px">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="公告标题" prop="noticeTitle">
                            <el-input v-model="form.noticeTitle" placeholder="请输入公告标题" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="公告类型" prop="noticeType">
                            <el-select v-model="form.noticeType" placeholder="请选择">
                                <el-option v-for="dict in sys_notice_type" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="状态">
                            <el-radio-group v-model="form.status">
                                <el-radio v-for="dict in sys_notice_status" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="内容">
                            <Editor v-if="open" v-model="form.noticeContent" mode="textarea" :min-height="192" />
                        </el-form-item>
                    </el-col>
                </el-row>
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

<script setup name="Notice">
import { defineAsyncComponent } from 'vue'
import { listNotice, getNotice, delNotice, addNotice, updateNotice } from '@/api/system/notice'

const Editor = defineAsyncComponent(() => import('@/components/Editor/index.vue'))

const { proxy } = getCurrentInstance()
const { sys_notice_status, sys_notice_type } = proxy.useDict('sys_notice_status', 'sys_notice_type')

const noticeList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        noticeTitle: undefined,
        createBy: undefined,
        status: undefined
    },
    rules: {
        noticeTitle: [{ required: true, message: '公告标题不能为空', trigger: 'blur' }],
        noticeType: [{ required: true, message: '公告类型不能为空', trigger: 'change' }]
    }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询公告列表 */
function getList() {
    loading.value = true
    listNotice(queryParams.value).then(response => {
        noticeList.value = response.rows
        total.value = response.total
        loading.value = false
    })
}

/** 取消按钮 */
function cancel() {
    open.value = false
    reset()
}

/** 表单重置 */
function reset() {
    form.value = {
        noticeId: undefined,
        noticeTitle: undefined,
        noticeType: undefined,
        noticeContent: undefined,
        status: '0'
    }
    proxy.resetForm('noticeRef')
}

/** 搜索按钮操作 */
function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
}

/** 重置按钮操作 */
function resetQuery() {
    proxy.resetForm('queryRef')
    handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
    ids.value = selection.map(item => item.noticeId)
    single.value = selection.length != 1
    multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
    reset()
    open.value = true
    title.value = '添加公告'
}

/**修改按钮操作 */
function handleUpdate(row) {
    reset()
    const noticeId = row.noticeId || ids.value
    getNotice(noticeId).then(response => {
        form.value = response.data
        open.value = true
        title.value = '修改公告'
    })
}

/** 提交按钮 */
function submitForm() {
    proxy.$refs['noticeRef'].validate(valid => {
        if (valid) {
            if (form.value.noticeId != undefined) {
                updateNotice(form.value).then(response => {
                    proxy.$modal.msgSuccess('修改成功')
                    open.value = false
                    getList()
                })
            } else {
                addNotice(form.value).then(response => {
                    proxy.$modal.msgSuccess('新增成功')
                    open.value = false
                    getList()
                })
            }
        }
    })
}

/** 删除按钮操作 */
function handleDelete(row) {
    const noticeIds = row.noticeId || ids.value
    proxy.$modal
        .confirm('是否确认删除公告编号为"' + noticeIds + '"的数据项？')
        .then(function () {
            return delNotice(noticeIds)
        })
        .then(() => {
            getList()
            proxy.$modal.msgSuccess('删除成功')
        })
        .catch(() => {})
}

getList()
</script>

<style scoped lang="scss">
@use '@/assets/styles/crud-page.scss' as *;
</style>
