<template>
    <div class="app-container system-crud-page content-notice">
        <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" class="search-form">
            <el-form-item label="标题" prop="title">
                <el-input v-model="queryParams.title" placeholder="请输入标题" clearable style="width: 220px" @keyup.enter="handleQuery">
                    <template #prefix>
                        <Icon icon="mdi:magnify" />
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
            <div class="table-toolbar">
                <div class="left-tools">
                    <el-button type="primary" @click="handleAdd" v-hasPermi="['content:notice:add']" class="tool-btn">
                        <Icon icon="ep:plus" class="btn-icon" />
                        新增
                    </el-button>
                    <el-button type="danger" :disabled="multiple" @click="handleDelete()" v-hasPermi="['content:notice:remove']" class="tool-btn">
                        <Icon icon="ep:delete" class="btn-icon" />
                        删除
                    </el-button>
                </div>
                <div class="right-tools">
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
                </div>
            </div>

            <el-table v-loading="loading" :data="announcementList" @selection-change="handleSelectionChange" class="modern-table">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="标题" align="center" prop="title" min-width="220" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span>{{ getTitle(row) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="内容" align="center" prop="content" min-width="260" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span>{{ getContent(row) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.status === '1' ? 'success' : 'info'" effect="plain">
                            {{ row.status === '1' ? '启用' : '停用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="发布时间" align="center" width="180">
                    <template #default="{ row }">
                        <span>{{ parseTime(row.createTime || row.publishTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="100" fixed="right">
                    <template #default="{ row }">
                        <div class="action-group">
                            <el-tooltip content="删除" placement="top">
                                <el-button link type="danger" @click="handleDelete(row)" v-hasPermi="['content:notice:remove']" class="op-btn">
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

        <el-dialog :title="title" v-model="open" width="560px" append-to-body class="modern-dialog">
            <el-form ref="noticeRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="form.title" placeholder="请输入标题" />
                </el-form-item>
                <el-form-item label="跳转链接" prop="jumpUrl">
                    <el-input v-model="form.jumpUrl" placeholder="请输入跳转链接" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="form.status">
                        <el-radio value="1">启用</el-radio>
                        <el-radio value="0">停用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入内容" resize="none" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm" class="dialog-btn">确定</el-button>
                    <el-button @click="cancel" class="dialog-btn">取消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
defineOptions({ name: 'ContentNotice' })
import { listAnnouncements, addAnnouncement, deleteAnnouncement, parseAnnouncementRows } from '@/api/content/notice'

const { proxy } = getCurrentInstance()

const announcementList = ref([])
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
        title: undefined
    },
    rules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
        content: [{ required: true, message: '内容不能为空', trigger: 'blur' }],
        jumpUrl: [{ required: true, message: '跳转链接不能为空', trigger: 'blur' }],
        status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
    }
})

const { queryParams, form, rules } = toRefs(data)

function getTitle(row) {
    return row.title || row.noticeTitle || row.announcementTitle || '-'
}

function getContent(row) {
    return row.content || row.noticeContent || row.announcementContent || '-'
}

function getList() {
    loading.value = true
    listAnnouncements(queryParams.value)
        .then(response => {
            const rows = parseAnnouncementRows(response)
            announcementList.value = rows
            total.value = response.total || response.data?.total || rows.length
        })
        .finally(() => {
            loading.value = false
        })
}

function cancel() {
    open.value = false
    reset()
}

function reset() {
    form.value = {
        id: undefined,
        title: undefined,
        content: undefined,
        jumpUrl: undefined,
        status: '1'
    }
    proxy.resetForm('noticeRef')
}

function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
}

function resetQuery() {
    proxy.resetForm('queryRef')
    handleQuery()
}

function handleSelectionChange(selection) {
    ids.value = selection.map(item => item.id || item.noticeId || item.announcementId)
    single.value = selection.length !== 1
    multiple.value = selection.length === 0
}

function handleAdd() {
    reset()
    open.value = true
    title.value = '添加通告'
}

function submitForm() {
    proxy.$refs.noticeRef.validate(valid => {
        if (!valid) return
        addAnnouncement(form.value).then(() => {
            proxy.$modal.msgSuccess('新增成功')
            open.value = false
            getList()
        })
    })
}

function handleDelete(row) {
    const noticeIds = row?.id || row?.noticeId || row?.announcementId || ids.value
    proxy.$modal
        .confirm('是否确认删除选中的数据项？')
        .then(() => deleteAnnouncement(noticeIds))
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
