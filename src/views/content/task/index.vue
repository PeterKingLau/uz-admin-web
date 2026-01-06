<template>
    <div class="app-container">
        <el-form v-show="showSearch" ref="queryRef" :model="queryParams" :inline="true">
            <el-form-item label="题目名称" prop="title">
                <el-input v-model="queryParams.title" placeholder="请输入题目名称" clearable style="width: 240px" @keyup.enter="handleQuery">
                    <template #prefix>
                        <Icon icon="mdi:magnify" />
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleQuery"> <Icon icon="mdi:magnify" class="mr-1 text-[16px]" /> 搜索 </el-button>
                <el-button @click="resetQuery"> <Icon icon="mdi:refresh" class="mr-1 text-[16px]" /> 重置 </el-button>
            </el-form-item>
        </el-form>

        <div class="table-wrapper">
            <div class="table-header">
                <div class="left-tools">
                    <el-button type="primary" plain @click="handleAdd"> <Icon icon="mdi:plus" class="mr-1 text-[16px]" /> 新增题目 </el-button>
                    <el-button type="success" plain @click="handleBatchOpen">
                        <Icon icon="mdi:file-document-plus-outline" class="mr-1 text-[16px]" /> 批量导入
                    </el-button>
                    <el-button type="info" plain @click="handleBatchExport"> <Icon icon="mdi:download" class="mr-1 text-[16px]" /> 批量导出 </el-button>
                    <el-button type="danger" plain :disabled="!ids.length" @click="handleDelete()">
                        <Icon icon="mdi:trash-can-outline" class="mr-1 text-[16px]" /> 批量删除
                    </el-button>
                </div>
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
            </div>

            <el-table v-loading="loading" :data="displayQuestionList" @selection-change="handleSelectionChange" header-cell-class-name="table-header-cell">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="所属模块" align="center" prop="moduleCode" min-width="140" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span>{{ getModuleName(row.moduleCode) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="题目内容" align="left" prop="title" min-width="200" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span class="row-title">{{ getQuestionTitle(row) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="题型" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getQuestionType(row) === '能力题' ? 'warning' : 'info'" effect="plain">
                            {{ getQuestionType(row) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="题目类型" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag effect="plain" type="info">{{ getQuestionMode(row) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="排序" align="center" width="80">
                    <template #default="{ row }">
                        <span>{{ row.sortOrder ?? '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" align="center" width="90">
                    <template #default="{ row }">
                        <el-switch v-model="row.status" :active-value="'0'" :inactive-value="'1'" @change="handleStatusChange(row, $event)" />
                    </template>
                </el-table-column>
                <el-table-column label="更新时间" align="center" width="160">
                    <template #default="{ row }">
                        <div class="time-cell">
                            <span>{{ formatTimeCell(row.updateTime) }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="180" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handleEdit(row)"> <Icon icon="mdi:pencil" class="mr-1 text-[16px]" /> 修改 </el-button>
                        <el-button link type="danger" @click="handleDelete(row)">
                            <Icon icon="mdi:trash-can-outline" class="mr-1 text-[16px]" /> 删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </div>

        <el-dialog :title="dialogTitle" v-model="open" width="700px" append-to-body class="custom-dialog" top="5vh">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" label-position="top">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="所属模块" prop="moduleCode">
                            <el-tree-select
                                :key="treeSelectKey"
                                v-model="form.moduleCode"
                                :data="dimensionTree"
                                :props="{ value: 'dimensionCode', label: 'dimensionName', children: 'children', disabled: 'disabled' }"
                                value-key="dimensionCode"
                                node-key="dimensionCode"
                                placeholder="请选择所属模块"
                                clearable
                                check-strictly
                                :loading="dimensionLoading"
                                style="width: 100%"
                                :expand-on-click-node="false"
                                highlight-current
                                :current-node-key="form.moduleCode"
                                default-expand-all
                            >
                                <template #default="{ node, data }">
                                    <div class="custom-tree-node" :class="{ 'is-leaf': !data.children || data.children.length === 0 }">
                                        <Icon v-if="data.children && data.children.length > 0" icon="mdi:folder-outline" class="mr-1 text-gray-400" />
                                        <Icon v-else icon="mdi:file-document-outline" class="mr-1 text-primary" />
                                        <span>{{ node.label }}</span>
                                        <span v-if="!data.children || data.children.length === 0" class="select-tag">可选</span>
                                    </div>
                                </template>
                            </el-tree-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="题目类型" prop="type">
                            <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
                                <el-option label="能力题" value="ABILITY" />
                                <el-option label="普通题" value="NORMAL" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="题目内容" prop="content">
                            <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入题目详细内容" resize="none" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="选择题型" prop="questionType">
                            <el-radio-group v-model="form.questionType">
                                <el-radio-button value="1">单选题</el-radio-button>
                                <el-radio-button value="2">多选题</el-radio-button>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="排序" prop="sortOrder">
                            <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" v-if="form.type === 'ABILITY'">
                        <el-form-item label="标准答案" prop="correctAnswer">
                            <el-input v-model="form.correctAnswer" placeholder="请输入标准答案 (如: A)" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <div class="option-section">
                    <div class="option-header">
                        <span class="title">题目选项</span>
                        <div class="actions">
                            <el-button type="primary" link @click="handleAddOption"> <Icon icon="mdi:plus" /> 添加选项 </el-button>
                            <el-button type="success" link @click="handleBatchOptionOpen"> <Icon icon="mdi:lightning-bolt" /> 快速生成 </el-button>
                        </div>
                    </div>

                    <div class="option-list">
                        <div v-for="(item, index) in formOptions" :key="index" class="option-item">
                            <div class="option-index">
                                <el-tag effect="dark" size="small">{{ String.fromCharCode(65 + index) }}</el-tag>
                            </div>
                            <div class="option-content">
                                <el-input v-model="item.content" placeholder="选项描述" />
                            </div>
                            <div class="option-meta">
                                <el-input-number v-model="item.scoreValue" :min="0" controls-position="right" style="width: 100px" placeholder="分值" />
                                <el-button type="danger" circle plain @click="handleRemoveOption(index, item)">
                                    <Icon icon="mdi:close" />
                                </el-button>
                            </div>
                        </div>
                        <div v-if="formOptions.length === 0" class="empty-options">暂无选项，请点击上方按钮添加</div>
                    </div>
                </div>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="open = false">取 消</el-button>
                    <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog title="批量导入题目" v-model="batchOpen" width="600px" append-to-body class="custom-dialog">
            <el-alert
                title="格式提示：支持多模块(标题行=moduleCode)，每题可带A/B/C选项与分值；排序为全局自增"
                type="info"
                :closable="false"
                show-icon
                class="mb-3"
            />
            <el-input v-model="batchText" type="textarea" :rows="12" placeholder="例如：&#10;情绪稳定性&#10;问题...?&#10;A. ... (分值:2)&#10;B. ... (分值:1)" />
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="batchOpen = false">取 消</el-button>
                    <el-button type="primary" :loading="batchLoading" @click="submitBatch">开始导入</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog title="快速生成选项" v-model="batchOptionOpen" width="600px" append-to-body class="custom-dialog">
            <el-alert title="智能识别：支持自动识别选项标识(A/B...)和分值" type="success" :closable="false" show-icon class="mb-3" />
            <el-input
                v-model="batchOptionText"
                type="textarea"
                :rows="10"
                placeholder="示例：&#10;A. 非常同意 (分值: 5)&#10;B. 比较同意 (分值: 3)&#10;C. 不同意 (分值: 0)"
            />
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="batchOptionOpen = false">取 消</el-button>
                    <el-button type="primary" :loading="batchOptionLoading" @click="submitBatchOptions">确认生成</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="AssessmentQuestionList" lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref, toRefs } from 'vue'
import { parseTime } from '@/utils/ruoyi'
import type { AssessmentQuestionItem, DimensionNode } from '@/api/content/assessmentQuestion'
import type { AssessmentOptionItem } from '@/api/content/assessmentOption'

const { proxy } = getCurrentInstance() as any

const loadQuestionApi = (() => {
    let cache: Promise<typeof import('@/api/content/assessmentQuestion')> | null = null
    return () => (cache ??= import('@/api/content/assessmentQuestion'))
})()

const loadOptionApi = (() => {
    let cache: Promise<typeof import('@/api/content/assessmentOption')> | null = null
    return () => (cache ??= import('@/api/content/assessmentOption'))
})()

const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
type DimensionNodeWithDisabled = DimensionNode & { disabled?: boolean; children?: DimensionNodeWithDisabled[] }

const questionList = ref<AssessmentQuestionItem[]>([])
const dimensionTree = ref<DimensionNodeWithDisabled[]>([])
const dimensionLoading = ref(false)
const queryRef = ref()
const formRef = ref()
const open = ref(false)
const dialogTitle = ref('新增题目')
const treeSelectKey = ref(0)
const submitLoading = ref(false)
const formOptions = ref<AssessmentOptionItem[]>([])
const removedOptionIds = ref<(string | number)[]>([])
const batchOptionOpen = ref(false)
const batchOptionLoading = ref(false)
const batchOptionText = ref('')
const batchOpen = ref(false)
const batchLoading = ref(false)
const batchText = ref('')
const ids = ref<(string | number)[]>([])
const selectedRows = ref<AssessmentQuestionItem[]>([])
const single = ref(true)
const multiple = ref(true)

const serverPaginationOk = ref(true)

const data = reactive({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: ''
    },
    form: {
        id: undefined as number | undefined,
        moduleCode: '',
        type: '',
        content: '',
        questionType: '1',
        correctAnswer: '',
        sortOrder: 0
    },
    rules: {
        moduleCode: [{ required: true, message: '所属模块不能为空', trigger: 'change' }],
        type: [{ required: true, message: '类型不能为空', trigger: 'change' }],
        content: [{ required: true, message: '题目内容不能为空', trigger: 'blur' }],
        questionType: [{ required: true, message: '题型不能为空', trigger: 'change' }],
        correctAnswer: [
            {
                validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
                    if (form.value.type === 'ABILITY' && !value) {
                        callback(new Error('标准答案不能为空'))
                        return
                    }
                    callback()
                },
                trigger: 'blur'
            }
        ],
        sortOrder: [{ required: true, message: '排序不能为空', trigger: 'blur' }]
    }
})

const { queryParams, form, rules } = toRefs(data)

const dimensionNameMap = computed(() => {
    const map = new Map<string, string>()
    const walk = (nodes: DimensionNodeWithDisabled[]) => {
        for (const node of nodes) {
            const code = node.dimensionCode ?? ''
            const name = node.dimensionName ?? ''
            if (code) map.set(String(code), String(name))
            if (node.children && node.children.length) walk(node.children)
        }
    }
    walk(dimensionTree.value)
    return map
})

const dimensionCodeMap = computed(() => {
    const map = new Map<string, string>()
    const walk = (nodes: DimensionNodeWithDisabled[]) => {
        for (const node of nodes) {
            const name = node.dimensionName ?? ''
            const code = node.dimensionCode ?? ''
            if (name && code) map.set(String(name), String(code))
            if (node.children && node.children.length) walk(node.children)
        }
    }
    walk(dimensionTree.value)
    return map
})

const displayQuestionList = computed(() => {
    const pageNum = Number(queryParams.value.pageNum || 1)
    const pageSize = Number(queryParams.value.pageSize || 10)
    const rows = questionList.value || []
    if (serverPaginationOk.value) return rows
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    return rows.slice(start, end)
})

function getQuestionTitle(row: AssessmentQuestionItem) {
    return (row as any).title || (row as any).questionTitle || (row as any).name || (row as any).questionName || (row as any).content || '-'
}

function getQuestionType(row: AssessmentQuestionItem) {
    const val = (row as any).typeName || (row as any).questionTypeName || (row as any).type || (row as any).questionType
    if (val === 'ABILITY') return '能力题'
    if (val === 'NORMAL') return '普通题'
    return val || '-'
}

function getQuestionMode(row: AssessmentQuestionItem) {
    const val = String((row as any).questionType ?? '')
    if (val === '1') return '单选题'
    if (val === '2') return '多选题'
    return val ? val : '-'
}

function getModuleName(code: string | number | undefined | null) {
    if (code === undefined || code === null || code === '') return '-'
    const key = String(code)
    return dimensionNameMap.value.get(key) || key
}

function getModuleCodeFromInput(input: string) {
    const key = String(input || '').trim()
    if (!key) return ''
    return dimensionCodeMap.value.get(key) || key
}

function getStatusLabel(row: AssessmentQuestionItem) {
    const val = String((row as any).status ?? '')
    if (val === '0') return '启用'
    if (val === '1') return '停用'
    return val ? val : '-'
}

async function handleStatusChange(row: AssessmentQuestionItem, value: string | number | boolean) {
    const anyRow: any = row
    const prev = String(anyRow.status ?? '')
    anyRow.status = String(value)
    if (!anyRow?.id) {
        anyRow.status = prev
        proxy?.$modal?.msgWarning?.('未找到要更新的题目')
        return
    }
    try {
        const { updateAssessmentQuestion } = await loadQuestionApi()
        await updateAssessmentQuestion({
            id: Number(anyRow.id),
            moduleCode: anyRow.moduleCode || undefined,
            type: anyRow.type || undefined,
            content: anyRow.content || anyRow.title || anyRow.questionContent || '',
            questionType: String(anyRow.questionType ?? anyRow.questionTypeCode ?? '1'),
            correctAnswer: anyRow.correctAnswer || anyRow.answer || undefined,
            sortOrder: Number(anyRow.sortOrder ?? anyRow.sort ?? 0),
            status: anyRow.status
        } as any)
        const statusText = String(anyRow.status) === '0' ? '启用' : '禁用'
        proxy?.$modal?.msgSuccess?.(`${statusText}成功`)
    } catch (error) {
        anyRow.status = prev
        const statusText = String(value) === '0' ? '启用' : '禁用'
        proxy?.$modal?.msgError?.(`${statusText}失败`)
    }
}

function formatTimeCell(val: any) {
    if (!val) return ''
    return parseTime(val)
}

function disableParentNodes(nodes: DimensionNodeWithDisabled[]): DimensionNodeWithDisabled[] {
    return nodes.map(node => {
        if (node.children && node.children.length > 0) {
            return {
                ...node,
                disabled: true,
                children: disableParentNodes(node.children)
            }
        }
        return {
            ...node,
            disabled: false
        }
    })
}

async function loadDimensionTree() {
    dimensionLoading.value = true
    try {
        const { getDimensionTree, parseDimensionTree } = await loadQuestionApi()
        const res = await getDimensionTree()
        const rawTree = parseDimensionTree(res)
        dimensionTree.value = disableParentNodes(rawTree)
    } catch (error) {
        console.error(error)
        dimensionTree.value = []
        proxy?.$modal?.msgWarning?.('获取所属模块失败')
    } finally {
        dimensionLoading.value = false
    }
}

async function ensureDimensionTreeReady() {
    if (dimensionTree.value.length) return true
    await loadDimensionTree()
    return dimensionTree.value.length > 0
}

async function getList(pagination?: { page?: number; limit?: number }) {
    const pageNum = Number(pagination?.page ?? queryParams.value.pageNum ?? 1)
    const pageSize = Number(pagination?.limit ?? queryParams.value.pageSize ?? 10)
    queryParams.value.pageNum = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1
    queryParams.value.pageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10

    if (!serverPaginationOk.value && pagination) return

    loading.value = true
    try {
        const { listAssessmentQuestions, parseAssessmentQuestionRows } = await loadQuestionApi()
        const res = await listAssessmentQuestions({
            ...queryParams.value,
            pageNum: queryParams.value.pageNum,
            pageSize: queryParams.value.pageSize
        } as any)

        const rows = parseAssessmentQuestionRows(res) || []
        questionList.value = rows

        const resTotal = (res as any)?.total ?? (res as any)?.data?.total
        const pageSizeNow = Number(queryParams.value.pageSize || 10)

        serverPaginationOk.value = !(rows.length > pageSizeNow)

        total.value = Number.isFinite(Number(resTotal)) ? Number(resTotal) : rows.length
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('获取题目列表失败')
    } finally {
        loading.value = false
    }
}

function handleQuery() {
    queryParams.value.pageNum = 1
    serverPaginationOk.value = true
    getList()
}

function resetQuery() {
    proxy?.resetForm?.('queryRef')
    handleQuery()
}

function handleSelectionChange(selection: AssessmentQuestionItem[]) {
    selectedRows.value = selection
    ids.value = selection.map(item => (item as any).id).filter(Boolean)
    single.value = selection.length !== 1
    multiple.value = !selection.length
}

function resetFormData() {
    form.value = {
        id: undefined,
        moduleCode: '',
        type: '',
        content: '',
        questionType: '1',
        correctAnswer: '',
        sortOrder: 0
    }
    proxy?.resetForm?.('formRef')
}

function resetOptions() {
    formOptions.value = []
    removedOptionIds.value = []
}

async function handleAdd() {
    resetFormData()
    resetOptions()
    treeSelectKey.value += 1
    dialogTitle.value = '新增题目'

    if (dimensionTree.value.length === 0) {
        await loadDimensionTree()
    }

    try {
        const maxSort = await getGlobalMaxSortOrderSafe()
        form.value.sortOrder = maxSort + 1
    } catch (e) {
        console.error(e)
        form.value.sortOrder = 1
    }

    open.value = true
}

function handleEdit(row: AssessmentQuestionItem) {
    const anyRow: any = row
    if (!anyRow?.id) {
        proxy?.$modal?.msgWarning?.('未找到要修改的题目')
        return
    }
    resetFormData()
    if (dimensionTree.value.length === 0) {
        loadDimensionTree()
    }

    form.value = {
        id: anyRow.id,
        moduleCode: anyRow.moduleCode || '',
        type: anyRow.type || '',
        content: anyRow.content || anyRow.title || anyRow.questionContent || '',
        questionType: String(anyRow.questionType ?? anyRow.questionTypeCode ?? '1'),
        correctAnswer: anyRow.correctAnswer || anyRow.answer || '',
        sortOrder: Number(anyRow.sortOrder ?? anyRow.sort ?? 0)
    }
    dialogTitle.value = '修改题目'
    open.value = true
    loadOptions(anyRow.id)
}

function handleAddOption() {
    formOptions.value.push({
        id: undefined,
        content: '',
        optionKey: String.fromCharCode(65 + formOptions.value.length),
        scoreValue: 0,
        sortOrder: formOptions.value.length + 1
    } as any)
}

function handleRemoveOption(index: number, row: AssessmentOptionItem) {
    const anyRow: any = row
    if (anyRow?.id) removedOptionIds.value.push(anyRow.id)
    formOptions.value.splice(index, 1)
}

function handleBatchOptionOpen() {
    batchOptionText.value = ''
    batchOptionOpen.value = true
}

function parseOptionBatchLines(text: string) {
    const lines = (text || '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)

    return lines.map((line, index) => {
        const match = line.match(/^\s*([A-F])[\.\s、)]*\s*(.+?)\s*$/i)
        const optionKey = (match?.[1] || String.fromCharCode(65 + index)).toUpperCase()
        const rawContent = match?.[2] || line
        const scoreMatch = rawContent.match(/[\(（]\s*分值\s*[:：]\s*([-\d.]+)\s*[\)）]/)
        const scoreValue = scoreMatch?.[1] ? Number(scoreMatch[1]) : 0
        const content = rawContent.replace(/[\(（]\s*分值\s*[:：]\s*[-\d.]+\s*[\)）]/, '').trim()

        return {
            optionKey,
            content,
            scoreValue: Number.isFinite(scoreValue) ? scoreValue : 0,
            sortOrder: formOptions.value.length + index + 1
        }
    })
}

function pickQuestionId(res: any): number | undefined {
    const id = res?.id ?? res?.data?.id ?? res?.data?.questionId ?? res?.questionId ?? res?.data
    const n = Number(id)
    return Number.isFinite(n) && n > 0 ? n : undefined
}

function submitBatchOptions() {
    const items = parseOptionBatchLines(batchOptionText.value || '')
    if (!items.length) {
        proxy?.$modal?.msgWarning?.('请输入选项文本')
        return
    }
    formOptions.value = formOptions.value.concat(items as any)
    batchOptionOpen.value = false
}

function validateOptions() {
    if (!formOptions.value.length) return true
    for (const opt of formOptions.value as any[]) {
        if (!opt.content) {
            proxy?.$modal?.msgWarning?.('请补全选项内容')
            return false
        }
    }
    return true
}

async function loadOptions(questionId: number) {
    try {
        const { listAssessmentOptions, parseAssessmentOptionRows } = await loadOptionApi()
        const res = await listAssessmentOptions({ questionId } as any)
        formOptions.value = parseAssessmentOptionRows(res) as any
        removedOptionIds.value = []
    } catch (error) {
        console.error(error)
        formOptions.value = []
        removedOptionIds.value = []
        proxy?.$modal?.msgError?.('获取选项列表失败')
    }
}

async function saveOptions(questionId: number) {
    if (!validateOptions()) throw new Error('invalid options')

    const { addAssessmentOption, deleteAssessmentOption, updateAssessmentOption } = await loadOptionApi()

    if (removedOptionIds.value.length) {
        await deleteAssessmentOption(removedOptionIds.value.join(',') as any)
        removedOptionIds.value = []
    }

    for (let index = 0; index < formOptions.value.length; index += 1) {
        const opt: any = formOptions.value[index]
        const optionKey = String.fromCharCode(65 + index)
        if (opt.id) {
            await updateAssessmentOption({
                id: Number(opt.id),
                content: opt.content,
                optionKey,
                scoreValue: Number(opt.scoreValue ?? 0),
                sortOrder: Number(opt.sortOrder ?? index + 1)
            } as any)
        } else {
            await addAssessmentOption({
                questionId,
                content: opt.content,
                optionKey,
                scoreValue: Number(opt.scoreValue ?? 0),
                sortOrder: Number(opt.sortOrder ?? index + 1)
            } as any)
        }
    }
}

function handleDelete(row?: AssessmentQuestionItem) {
    const targetRows = row ? [row] : selectedRows.value
    const targetIds = targetRows.map((item: any) => item.id).filter(Boolean)

    if (!targetIds.length) {
        proxy?.$modal?.msgWarning?.('请先选择要删除的题目')
        return
    }

    const names = targetRows.map(item => getQuestionTitle(item)).join('、')
    const tip = row ? `确认删除题目「${names}」吗？` : `确认删除选中的 ${targetIds.length} 题吗？`

    proxy?.$modal
        ?.confirm?.(tip)
        .then(async () => {
            const { deleteAssessmentQuestion } = await loadQuestionApi()
            return deleteAssessmentQuestion(targetIds.join(',') as any)
        })
        .then(() => {
            proxy?.$modal?.msgSuccess?.('删除成功')
            serverPaginationOk.value = true
            getList()
        })
        .catch(() => {})
}

type BatchOption = { optionKey: string; content: string; scoreValue: number }
type BatchFlatItem = { moduleCode: string; content: string; options: BatchOption[]; type: 'ABILITY' | 'NORMAL' }

function splitInlineOptions(line: string) {
    const parts: string[] = []
    const re = /([A-F])[\.\s、\)）]\s*/gi
    let match: RegExpExecArray | null = null
    const indices: { idx: number; key: string }[] = []

    while ((match = re.exec(line)) !== null) {
        indices.push({ idx: match.index, key: match[1] })
    }

    if (!indices.length) return [line]

    if (indices[0].idx > 0) {
        const head = line.slice(0, indices[0].idx).trim()
        if (head) parts.push(head)
    }

    for (let i = 0; i < indices.length; i++) {
        const start = indices[i].idx
        const end = i + 1 < indices.length ? indices[i + 1].idx : line.length
        const seg = line.slice(start, end).trim()
        if (seg) parts.push(seg)
    }
    return parts
}

function normalizeLinesExpanded(text: string) {
    const rawLines = (text || '')
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean)

    const result: string[] = []

    const splitByTypeTag = (line: string) => {
        const parts = line
            .split(/(?=【\s*(能力题|普通题)\s*】)/g)
            .map(s => s.trim())
            .filter(Boolean)
        return parts.length ? parts : [line]
    }

    const splitByQuestionMark = (line: string) => {
        const qCount = (line.match(/[？?]/g) || []).length
        if (qCount <= 1) return [line]
        const parts = line
            .split(/(?<=[？?])\s*/g)
            .map(s => s.trim())
            .filter(Boolean)
        return parts.length ? parts : [line]
    }

    const splitInlineOptions = (line: string) => {
        const parts: string[] = []
        const re = /([A-F])[\.\s、\)）]\s*/gi
        let match: RegExpExecArray | null = null
        const indices: { idx: number }[] = []

        while ((match = re.exec(line)) !== null) indices.push({ idx: match.index })
        if (!indices.length) return [line]

        if (indices[0].idx > 0) {
            const head = line.slice(0, indices[0].idx).trim()
            if (head) parts.push(head)
        }

        for (let i = 0; i < indices.length; i++) {
            const start = indices[i].idx
            const end = i + 1 < indices.length ? indices[i + 1].idx : line.length
            const seg = line.slice(start, end).trim()
            if (seg) parts.push(seg)
        }
        return parts
    }

    for (const raw of rawLines) {
        const tagParts = splitByTypeTag(raw)
        for (const p1 of tagParts) {
            const qParts = splitByQuestionMark(p1)
            for (const p2 of qParts) {
                const optParts = splitInlineOptions(p2)
                result.push(...optParts)
            }
        }
    }

    return result
}

function isOptionLine(line: string) {
    return /^[A-F][\.\s、\)）]/i.test(line)
}

function isQuestionLine(line: string) {
    if (/[？?]/.test(line)) return true
    if (/[：:]\s*$/.test(line)) return true
    return false
}

function isHeadingLine(line: string) {
    if (!line) return false
    if (isOptionLine(line)) return false
    if (isQuestionLine(line)) return false
    if (/分值\s*[:：]/.test(line)) return false
    if (/^\d+[\.\s、]/.test(line)) return false
    if (/[。,.，:：;；!！\(\)（）]/.test(line)) return false
    if (line.length > 20) return false
    return true
}

function parseOptionLine(line: string, fallbackKey: string) {
    const match = line.match(/^\s*([A-F])[\.\s、)]*\s*(.+?)\s*$/i)
    const optionKey = (match?.[1] || fallbackKey).toUpperCase()
    const raw = match?.[2] || line

    const scoreMatch = raw.match(/[\(（]\s*分值\s*[:：]\s*([-\d.]+)\s*[\)）]/)
    const scoreValue = scoreMatch?.[1] ? Number(scoreMatch[1]) : 0
    const content = raw.replace(/[\(（]\s*分值\s*[:：]\s*[-\d.]+\s*[\)）]/, '').trim()

    return {
        optionKey,
        content,
        scoreValue: Number.isFinite(scoreValue) ? scoreValue : 0
    }
}

function parseQuestionTypeFromLine(line: string): { type?: 'ABILITY' | 'NORMAL'; content: string } {
    const tagMatch = line.match(/【\s*(能力题|普通题)\s*】/i)
    const tag = tagMatch?.[1]
    const type = tag === '能力题' ? 'ABILITY' : tag === '普通题' ? 'NORMAL' : undefined
    const content = line.replace(/【\s*(能力题|普通题)\s*】/gi, '').trim()
    return { type, content }
}

function parseBatchFlatItems(text: string): BatchFlatItem[] {
    const lines = normalizeLinesExpanded(text)
    if (!lines.length) return []

    const items: BatchFlatItem[] = []
    let currentModule = ''
    let current: BatchFlatItem | null = null

    const flush = () => {
        if (!current) return
        if (!currentModule) {
            current = null
            return
        }
        const content = (current.content || '').trim()
        if (!content) {
            current = null
            return
        }
        current.moduleCode = currentModule
        if (current.options?.length) {
            current.options = current.options.map((o, idx) => ({
                ...o,
                optionKey: (o.optionKey || String.fromCharCode(65 + idx)).toUpperCase()
            }))
        }
        items.push(current)
        current = null
    }

    const setModule = (m: string) => {
        flush()
        currentModule = getModuleCodeFromInput(m)
    }

    if (isHeadingLine(lines[0])) setModule(lines[0])

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        if (isHeadingLine(line)) {
            const next = lines[i + 1] || ''
            if (isQuestionLine(next) || isOptionLine(next)) {
                setModule(line)
                continue
            }
        }

        if (!currentModule) {
            if (isHeadingLine(line)) setModule(line)
            continue
        }

        if (isQuestionLine(line)) {
            const parsed = parseQuestionTypeFromLine(line)
            const questionLine = parsed.content || line
            const questionType: 'ABILITY' | 'NORMAL' = parsed.type || 'NORMAL'

            if (current && (current.content || '').trim()) {
                flush()
            }

            current = {
                moduleCode: currentModule,
                content: questionLine,
                options: [],
                type: questionType
            }
            continue
        }

        if (isOptionLine(line)) {
            if (!current) {
                current = { moduleCode: currentModule, content: '', options: [], type: 'NORMAL' }
            }
            const fallbackKey = String.fromCharCode(65 + (current.options.length || 0))
            current.options.push(parseOptionLine(line, fallbackKey))
            continue
        }

        if (!current) {
            const parsed = parseQuestionTypeFromLine(line)
            current = { moduleCode: currentModule, content: parsed.content || line, options: [], type: parsed.type || 'NORMAL' }
        } else {
            current.content = `${current.content} ${line}`.trim()
        }
    }

    flush()
    return items
}

async function getGlobalMaxSortOrderSafe(): Promise<number> {
    let pageNum = 1
    const pageSize = 200
    let maxSort = 0
    const { listAssessmentQuestions, parseAssessmentQuestionRows } = await loadQuestionApi()

    while (true) {
        const res = await listAssessmentQuestions({ pageNum, pageSize } as any)
        const rows = parseAssessmentQuestionRows(res) || []
        if (!rows.length) break

        for (const r of rows as any[]) {
            const v = Number(r.sortOrder ?? r.sort ?? 0)
            if (Number.isFinite(v)) maxSort = Math.max(maxSort, v)
        }

        if (rows.length < pageSize) break
        pageNum += 1
        if (pageNum > 500) break
    }
    return maxSort
}

function handleBatchOpen() {
    batchText.value = ''
    batchOpen.value = true
}

async function submitBatch() {
    const treeReady = await ensureDimensionTreeReady()
    if (!treeReady) {
        proxy?.$modal?.msgError?.('所属模块加载失败，无法完成模块映射')
        return
    }

    const items = parseBatchFlatItems(batchText.value || '')
    if (!items.length) {
        proxy?.$modal?.msgWarning?.('未识别到可导入内容：请确保存在模块标题(moduleCode)与题目/选项')
        return
    }

    batchLoading.value = true
    try {
        const { addAssessmentQuestion } = await loadQuestionApi()
        const { addAssessmentOption } = await loadOptionApi()
        let sortOrder = (await getGlobalMaxSortOrderSafe()) + 1

        for (const it of items) {
            const res = await addAssessmentQuestion({
                moduleCode: it.moduleCode,
                type: it.type || 'NORMAL',
                content: it.content,
                questionType: '1',
                correctAnswer: undefined,
                sortOrder
            } as any)

            const newId = pickQuestionId(res)
            if (!newId) throw new Error(`批量导入失败：新增题目成功但未返回ID，题目内容：${it.content}`)

            if (it.options?.length) {
                let optionSort = 1
                for (const opt of it.options) {
                    await addAssessmentOption({
                        questionId: Number(newId),
                        content: opt.content,
                        optionKey: opt.optionKey,
                        scoreValue: Number(opt.scoreValue ?? 0),
                        sortOrder: optionSort
                    } as any)
                    optionSort += 1
                }
            }

            sortOrder += 1
        }

        proxy?.$modal?.msgSuccess?.('批量导入成功')
        batchOpen.value = false
        serverPaginationOk.value = true
        queryParams.value.pageNum = 1
        await getList()
    } catch (error: any) {
        console.error(error)
        proxy?.$modal?.msgError?.(error?.message || '批量导入失败')
    } finally {
        batchLoading.value = false
    }
}

function formatBatchExport(items: BatchFlatItem[]) {
    const lines: string[] = []
    let currentModule = ''
    for (const item of items) {
        const moduleName = getModuleName(item.moduleCode || '')
        if (moduleName !== currentModule) {
            currentModule = moduleName
            lines.push(currentModule)
        }
        const typeTag = item.type === 'ABILITY' ? '【能力题】' : '【普通题】'
        lines.push(`${typeTag}${item.content}`)
        for (const opt of item.options || []) {
            const score = Number(opt.scoreValue ?? 0)
            lines.push(`${opt.optionKey}. ${opt.content} (分值:${score})`)
        }
        lines.push('')
    }
    return lines.join('\n').trim()
}

function getQuestionTypeCode(row: AssessmentQuestionItem): 'ABILITY' | 'NORMAL' {
    const val = (row as any).typeName || (row as any).questionTypeName || (row as any).type || (row as any).questionType
    if (val === 'ABILITY' || val === 'NORMAL') return val
    if (val === '能力题') return 'ABILITY'
    if (val === '普通题') return 'NORMAL'
    return 'NORMAL'
}

async function fetchAllQuestions(): Promise<AssessmentQuestionItem[]> {
    const allRows: AssessmentQuestionItem[] = []
    let pageNum = 1
    const pageSize = 200
    const { listAssessmentQuestions, parseAssessmentQuestionRows } = await loadQuestionApi()

    while (true) {
        const res = await listAssessmentQuestions({ ...queryParams.value, pageNum, pageSize } as any)
        const rows = parseAssessmentQuestionRows(res) || []
        allRows.push(...rows)
        if (rows.length < pageSize) break
        pageNum += 1
        if (pageNum > 500) break
    }
    return allRows
}

async function handleBatchExport() {
    batchLoading.value = true
    proxy?.$modal?.loading?.('正在生成导出内容，请稍候...')
    try {
        const rows = await fetchAllQuestions()
        if (!rows.length) {
            proxy?.$modal?.msgWarning?.('暂无可导出的题目')
            return
        }

        const optionCache = new Map<number, AssessmentOptionItem[]>()
        const items: BatchFlatItem[] = []
        const { listAssessmentOptions, parseAssessmentOptionRows } = await loadOptionApi()
        for (const row of rows as any[]) {
            const questionId = Number(row.id)
            if (!Number.isFinite(questionId)) continue

            let options = optionCache.get(questionId)
            if (!options) {
                const res = await listAssessmentOptions({ questionId } as any)
                options = (parseAssessmentOptionRows(res) || []) as AssessmentOptionItem[]
                optionCache.set(questionId, options)
            }

            items.push({
                moduleCode: row.moduleCode || '',
                content: row.content || row.title || row.questionContent || '',
                type: getQuestionTypeCode(row),
                options: (options || []).map(opt => ({
                    optionKey: (opt as any).optionKey || '',
                    content: (opt as any).content || '',
                    scoreValue: Number((opt as any).scoreValue ?? 0)
                }))
            })
        }

        const exportText = formatBatchExport(items)
        batchText.value = exportText
        batchOpen.value = true
        proxy?.$modal?.msgSuccess?.('已生成导出文本，可直接复制用于批量导入')
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('批量导出失败')
    } finally {
        proxy?.$modal?.closeLoading?.()
        batchLoading.value = false
    }
}

function submitForm() {
    if (!formRef.value) return
    formRef.value.validate(async (valid: boolean) => {
        if (!valid) return
        submitLoading.value = true
        try {
            const { addAssessmentQuestion, updateAssessmentQuestion } = await loadQuestionApi()
            const payload: any = {
                id: form.value.id,
                moduleCode: form.value.moduleCode || undefined,
                type: form.value.type || undefined,
                content: form.value.content,
                questionType: String(form.value.questionType),
                correctAnswer: form.value.correctAnswer || undefined,
                sortOrder: Number(form.value.sortOrder ?? 0)
            }

            if (form.value.id) {
                await updateAssessmentQuestion(payload)
                await saveOptions(Number(form.value.id))
                proxy?.$modal?.msgSuccess?.('修改成功')
            } else {
                const res = await addAssessmentQuestion(payload)
                const newId = pickQuestionId(res)
                if (!newId) throw new Error('missing question id')
                await saveOptions(Number(newId))
                proxy?.$modal?.msgSuccess?.('新增成功')
            }

            open.value = false
            resetOptions()
            serverPaginationOk.value = true
            queryParams.value.pageNum = 1
            await getList()
        } catch (error) {
            console.error(error)
            proxy?.$modal?.msgError?.(form.value.id ? '修改失败' : '新增失败')
        } finally {
            submitLoading.value = false
        }
    })
}

onMounted(() => {
    getList()
    loadDimensionTree()
})
</script>

<style scoped lang="scss">
.table-wrapper {
    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 4px;

        .left-tools {
            display: flex;
            gap: 10px;
        }
    }
}

.row-title {
    font-weight: 500;
    color: var(--el-text-color-primary);
}

.time-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
}

.option-section {
    margin-top: 20px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 16px;
    background: var(--el-bg-color-page);

    .option-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .title {
            font-weight: 600;
            font-size: 14px;
            color: var(--el-text-color-regular);
            border-left: 3px solid var(--el-color-primary);
            padding-left: 8px;
        }
    }

    .option-list {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .option-item {
            display: flex;
            align-items: center;
            gap: 12px;
            background: var(--el-bg-color);
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--el-border-color-lighter);
            transition: all 0.2s;

            &:hover {
                border-color: var(--el-color-primary-light-5);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            }

            .option-content {
                flex: 1;
            }

            .option-index {
                display: flex;
                align-items: center;
            }

            .option-meta {
                display: flex;
                align-items: center;
                gap: 8px;
            }
        }

        .empty-options {
            text-align: center;
            color: var(--el-text-color-secondary);
            padding: 20px;
            font-size: 13px;
            border: 1px dashed var(--el-border-color-lighter);
            border-radius: 6px;
        }
    }
}

.custom-tree-node {
    display: flex;
    align-items: center;
    width: 100%;

    &.is-leaf {
        font-weight: bold;
        color: var(--el-color-primary);
    }

    .select-tag {
        margin-left: auto;
        font-size: 12px;
        color: var(--el-color-success);
        background: var(--el-color-success-light-9);
        padding: 0 4px;
        border-radius: 4px;
    }
}
</style>
