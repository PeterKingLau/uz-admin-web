<template>
    <div class="app-container topbar-config">
        <el-form v-show="showSearch" ref="queryRef" :model="queryParams" :inline="true" class="search-form">
            <el-form-item label="导航编码" prop="code">
                <el-input v-model="queryParams.code" placeholder="请输入导航编码" clearable style="width: 240px" @keyup.enter="handleQuery">
                    <template #prefix>
                        <Icon icon="mdi:code-tags" />
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item label="导航名称" prop="name">
                <el-input v-model="queryParams.name" placeholder="请输入导航名称" clearable style="width: 240px" @keyup.enter="handleQuery">
                    <template #prefix>
                        <Icon icon="mdi:magnify" />
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item label="状态" prop="isActive">
                <el-select v-model="queryParams.isActive" placeholder="请选择状态" clearable style="width: 240px">
                    <el-option label="启用" value="1" />
                    <el-option label="禁用" value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleQuery"> <Icon icon="mdi:magnify" class="mr-1" /> 搜索 </el-button>
                <el-button @click="resetQuery"> <Icon icon="mdi:refresh" class="mr-1" /> 重置 </el-button>
            </el-form-item>
        </el-form>

        <div class="table-wrapper">
            <div class="table-header">
                <div class="left-tools">
                    <el-button type="primary" plain @click="handleAdd"> <Icon icon="mdi:plus" class="mr-1" /> 新增 </el-button>
                    <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleDeleteSelected">
                        <Icon icon="mdi:trash-can-outline" class="mr-1" /> 删除
                    </el-button>
                </div>
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
            </div>

            <ConfigTable
                :columns="columns"
                :data="topbarList"
                :loading="loading"
                header-cell-class-name="table-header-cell"
                @selection-change="handleSelectionChange"
            >
                <template #status="{ row }">
                    <el-switch
                        v-model="row.isActive"
                        active-value="1"
                        inactive-value="0"
                        inline-prompt
                        active-text="启"
                        inactive-text="禁"
                        :loading="statusLoading === row.id"
                        @change="handleToggleStatus(row, $event)"
                    />
                </template>
                <template #createTime="{ row }">
                    <span class="time-cell">{{ formatTime(row.createTime) }}</span>
                </template>
                <template #updateTime="{ row }">
                    <span class="time-cell">{{ formatTime(row.updateTime) }}</span>
                </template>
                <template #actions="{ row }">
                    <el-button link type="primary" @click="handleUpdate(row)"> <Icon icon="mdi:pencil-outline" class="mr-1" /> 编辑 </el-button>
                    <el-button link type="danger" @click="handleDelete(row)"> <Icon icon="mdi:trash-can-outline" class="mr-1" /> 删除 </el-button>
                </template>
            </ConfigTable>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </div>

        <el-drawer v-model="open" :title="title" direction="rtl" size="500px" append-to-body destroy-on-close class="modern-drawer">
            <div class="drawer-content">
                <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="top" class="drawer-form">
                    <el-row :gutter="24">
                        <el-col :span="24">
                            <el-form-item label="导航编码" prop="code">
                                <el-input v-model="form.code" placeholder="请输入导航编码" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="导航名称" prop="name">
                                <el-input v-model="form.name" placeholder="请输入导航名称" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="排序" prop="sort">
                                <el-input-number v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="状态" prop="isActive">
                                <el-radio-group v-model="form.isActive">
                                    <el-radio label="1">启用</el-radio>
                                    <el-radio label="0">禁用</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </div>
            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="open = false" class="btn-cancel">取 消</el-button>
                    <el-button type="primary" @click="submitForm" class="btn-submit">确 定</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup name="TopbarConfig" lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref, toRefs } from 'vue'
import { addTopbarConfig, deleteTopbarConfig, listTopbarConfig, parseTopbarRows, updateTopbarConfig, type TopbarConfigItem } from '@/api/content/topbar'
import { parseTime } from '@/utils/utils'
import ConfigTable from '@/components/ConfigTable/index.vue'
import { useTableColumnStore } from '@/store/modules/tableColumn'
import { TOPBAR_COLUMNS, TOPBAR_TABLE_KEY } from '@/config/table/topbarColumns'

const { proxy } = getCurrentInstance() as any
const tableColumnStore = useTableColumnStore()

const loading = ref(false)
const showSearch = ref(true)
const open = ref(false)
const title = ref('新增导航栏')
const total = ref(0)
const topbarList = ref<TopbarConfigItem[]>([])
const selectedRows = ref<TopbarConfigItem[]>([])
const selectedIds = computed(() => selectedRows.value.map(r => r.id).filter(id => id !== undefined && id !== null))
const statusLoading = ref<number | string | null>(null)
const queryRef = ref()
const formRef = ref()

const data = reactive({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: '',
        name: '',
        isActive: ''
    },
    form: {
        id: undefined as number | undefined,
        code: '',
        name: '',
        sort: 1,
        isActive: '1'
    },
    rules: {
        code: [{ required: true, message: '导航编码不能为空', trigger: 'blur' }],
        name: [{ required: true, message: '导航名称不能为空', trigger: 'blur' }],
        sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }]
    }
})

const { queryParams, form, rules } = toRefs(data)

const baseColumnMap = computed(() => {
    const map = new Map<string, any>()
    TOPBAR_COLUMNS.forEach(col => map.set(col.key, col))
    return map
})

const columns = computed(() => {
    const enabledKeys = tableColumnStore.getEnabledKeys(TOPBAR_TABLE_KEY) || TOPBAR_COLUMNS.map(c => c.key)
    const map = baseColumnMap.value
    return enabledKeys.map(key => map.get(key)).filter(Boolean)
})

function statusLabel(val: any) {
    return String(val) === '1' ? '启用' : '禁用'
}

function formatTime(val: any) {
    if (!val) return ''
    return parseTime(val)
}

async function getList() {
    loading.value = true
    try {
        const res = await listTopbarConfig(queryParams.value)
        const rows = parseTopbarRows(res)
        topbarList.value = rows
        total.value = (res as any)?.total ?? rows.length
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('获取导航栏列表失败')
    } finally {
        loading.value = false
    }
}

function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
}

function handleSelectionChange(rows: TopbarConfigItem[]) {
    selectedRows.value = rows || []
}

function resetQuery() {
    proxy?.resetForm?.('queryRef')
    handleQuery()
}

function resetFormData() {
    form.value = {
        id: undefined,
        code: '',
        name: '',
        sort: 1,
        isActive: '1'
    }
    proxy?.resetForm?.('formRef')
}

function handleAdd() {
    resetFormData()
    open.value = true
    title.value = '新增导航栏'
}

async function handleDeleteSelected() {
    if (!selectedIds.value.length) return
    try {
        await proxy?.$modal?.confirm?.(`确认删除选中的 ${selectedIds.value.length} 条导航栏记录吗？`)
    } catch {
        return
    }
    loading.value = true
    try {
        await Promise.all(selectedIds.value.map(id => deleteTopbarConfig(id)))
        proxy?.$modal?.msgSuccess?.('删除成功')
        selectedRows.value = []
        getList()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('删除失败')
    } finally {
        loading.value = false
    }
}

function submitForm() {
    if (!formRef.value) return
    formRef.value.validate(async (valid: boolean) => {
        if (!valid) return
        try {
            const payload = {
                ...form.value,
                sort: form.value.sort ?? 0,
                isActive: String(form.value.isActive ?? '1')
            }
            if (form.value.id) {
                await updateTopbarConfig(payload as any)
                proxy?.$modal?.msgSuccess?.('编辑成功')
            } else {
                await addTopbarConfig(payload)
                proxy?.$modal?.msgSuccess?.('新增成功')
            }
            open.value = false
            getList()
        } catch (error) {
            console.error(error)
            proxy?.$modal?.msgError?.(form.value.id ? '编辑失败' : '新增失败')
        }
    })
}

function handleUpdate(row: any) {
    resetFormData()
    form.value = {
        id: row.id,
        code: row.code ?? '',
        name: row.name ?? '',
        sort: Number(row.sort ?? 1),
        isActive: String(row.isActive ?? '1')
    }
    open.value = true
    title.value = '编辑导航栏'
}

async function handleToggleStatus(row: any, val: string | number | boolean) {
    if (!row?.id) return
    const previous = row.isActive
    row.isActive = val
    statusLoading.value = row.id
    const targetName = row.name || row.code || row.id
    try {
        const payload = {
            id: row.id,
            code: row.code ?? '',
            name: row.name ?? '',
            sort: row.sort ?? 0,
            isActive: String(val ?? previous)
        }
        await updateTopbarConfig(payload as any)
        proxy?.$modal?.msgSuccess?.(`导航栏“${targetName}”已${statusLabel(val)}。`)
    } catch (error) {
        console.error(error)
        row.isActive = previous
        proxy?.$modal?.msgError?.('更新状态失败')
    } finally {
        statusLoading.value = null
    }
}

function handleDelete(row: any) {
    if (!row?.id) return
    proxy?.$modal
        ?.confirm?.(`确认删除导航栏“${row.name || row.code || row.id}”吗？`)
        .then(async () => {
            await deleteTopbarConfig(row.id)
            proxy?.$modal?.msgSuccess?.('删除成功')
            getList()
        })
        .catch(() => {})
}

onMounted(() => {
    getList()
})
</script>

<style scoped lang="scss">
.topbar-config {
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
