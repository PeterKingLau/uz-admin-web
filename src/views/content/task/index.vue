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
                <el-button type="primary" @click="handleQuery"> <Icon icon="mdi:magnify" class="btn-icon" /> 搜索 </el-button>
                <el-button @click="resetQuery"> <Icon icon="mdi:refresh" class="btn-icon" /> 重置 </el-button>
            </el-form-item>
        </el-form>

        <div class="table-wrapper">
            <div class="table-header">
                <div class="left-tools">
                    <el-button type="primary" plain @click="handleAdd"> <Icon icon="mdi:plus" class="btn-icon" /> 新增题目 </el-button>
                    <el-button type="success" plain @click="handleBatchOpen">
                        <Icon icon="mdi:file-document-plus-outline" class="btn-icon" /> 批量导入
                    </el-button>
                    <el-button type="danger" plain :disabled="!ids.length" @click="handleDelete()">
                        <Icon icon="mdi:trash-can-outline" class="btn-icon" /> 批量删除
                    </el-button>
                </div>
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
            </div>
            <el-table v-loading="loading" :data="questionList" @selection-change="handleSelectionChange" header-cell-class-name="table-header-cell">
                <el-table-column type="selection" width="55" align="center" />
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
                <el-table-column label="难度" align="center" width="100">
                    <template #default="{ row }">
                        <span>{{ getQuestionLevel(row) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="分值" align="center" width="80">
                    <template #default="{ row }">
                        <span>{{ getQuestionScore(row) }}</span>
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
                        <el-button link type="primary" @click="handleEdit(row)"> <Icon icon="mdi:pencil" class="btn-icon" /> 修改 </el-button>
                        <el-button link type="danger" @click="handleDelete(row)"> <Icon icon="mdi:trash-can-outline" class="btn-icon" /> 删除 </el-button>
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
                            <el-input v-model="form.moduleCode" placeholder="请输入所属模块" />
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
                                <el-radio-button label="1">单选题</el-radio-button>
                                <el-radio-button label="2">多选题</el-radio-button>
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
                                <el-select v-model="item.optionKey" placeholder="标识" style="width: 80px">
                                    <el-option v-for="k in ['A', 'B', 'C', 'D', 'E', 'F']" :key="k" :label="k" :value="k" />
                                </el-select>
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
            <el-alert title="格式提示：每行一题" type="info" :closable="false" show-icon class="mb-3" />
            <el-input v-model="batchText" type="textarea" :rows="10" placeholder="例如：&#10;1. 题目内容一...&#10;2. 题目内容二..." />
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="batchOpen = false">取 消</el-button>
                    <el-button type="primary" :loading="batchLoading" @click="submitBatch">开始生成</el-button>
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
import { getCurrentInstance, onMounted, reactive, ref, toRefs } from 'vue'
import { parseTime } from '@/utils/ruoyi'
import { Icon } from '@iconify/vue'
import {
    addAssessmentQuestion,
    deleteAssessmentQuestion,
    listAssessmentQuestions,
    parseAssessmentQuestionRows,
    updateAssessmentQuestion,
    type AssessmentQuestionItem
} from '@/api/content/assessmentQuestion'
import {
    addAssessmentOption,
    deleteAssessmentOption,
    listAssessmentOptions,
    parseAssessmentOptionRows,
    updateAssessmentOption,
    type AssessmentOptionItem
} from '@/api/content/assessmentOption'

const { proxy } = getCurrentInstance() as any

const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const questionList = ref<AssessmentQuestionItem[]>([])
const queryRef = ref()
const formRef = ref()
const open = ref(false)
const dialogTitle = ref('新增题目')
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

function getQuestionTitle(row: AssessmentQuestionItem) {
    return row.title || row.questionTitle || row.name || row.questionName || row.content || '-'
}

function getQuestionType(row: AssessmentQuestionItem) {
    const val = row.typeName || row.questionTypeName || row.type || row.questionType
    if (val === 'ABILITY') return '能力题'
    if (val === 'NORMAL') return '普通题'
    return val || '-'
}

function getQuestionLevel(row: AssessmentQuestionItem) {
    return row.difficultyName || row.levelName || row.difficulty || row.level || '-'
}

function getQuestionScore(row: AssessmentQuestionItem) {
    if (row.score !== undefined && row.score !== null) return row.score
    if (row.points !== undefined && row.points !== null) return row.points
    if (row.point !== undefined && row.point !== null) return row.point
    return '-'
}

function formatTimeCell(val: any) {
    if (!val) return ''
    return parseTime(val)
}

async function getList() {
    loading.value = true
    try {
        const res = await listAssessmentQuestions(queryParams.value)
        const rows = parseAssessmentQuestionRows(res)
        questionList.value = rows
        total.value = (res as any)?.total ?? (res as any)?.data?.total ?? rows.length
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('获取题目列表失败')
    } finally {
        loading.value = false
    }
}

function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
}

function resetQuery() {
    proxy?.resetForm?.('queryRef')
    handleQuery()
}

function handleSelectionChange(selection: AssessmentQuestionItem[]) {
    selectedRows.value = selection
    ids.value = selection.map(item => item.id).filter(Boolean)
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

function handleAdd() {
    resetFormData()
    resetOptions()
    dialogTitle.value = '新增题目'
    open.value = true
}

function handleEdit(row: AssessmentQuestionItem) {
    if (!row?.id) {
        proxy?.$modal?.msgWarning?.('未找到要修改的题目')
        return
    }
    resetFormData()
    form.value = {
        id: row.id,
        moduleCode: row.moduleCode || '',
        type: row.type || '',
        content: row.content || row.title || row.questionContent || '',
        questionType: String(row.questionType ?? row.questionTypeCode ?? '1'),
        correctAnswer: row.correctAnswer || row.answer || '',
        sortOrder: Number(row.sortOrder ?? row.sort ?? 0)
    }
    dialogTitle.value = '修改题目'
    open.value = true
    loadOptions(row.id)
}

function resetOptions() {
    formOptions.value = []
    removedOptionIds.value = []
}

function handleAddOption() {
    formOptions.value.push({
        id: undefined,
        content: '',
        optionKey: '',
        scoreValue: 0,
        sortOrder: formOptions.value.length + 1
    })
}

function handleRemoveOption(index: number, row: AssessmentOptionItem) {
    if (row?.id) {
        removedOptionIds.value.push(row.id)
    }
    formOptions.value.splice(index, 1)
}

function handleBatchOptionOpen() {
    batchOptionText.value = ''
    batchOptionOpen.value = true
}

function parseOptionBatchLines(text: string) {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
    return lines.map((line, index) => {
        const match = line.match(/^\s*([A-D])[\.\s、)]*\s*(.+?)\s*$/i)
        const optionKey = (match?.[1] || String.fromCharCode(65 + index)).toUpperCase()
        const rawContent = match?.[2] || line
        const scoreMatch = rawContent.match(/[\(（]\s*分值[:：]\s*([-\d.]+)\s*[\)）]/)
        const scoreValue = scoreMatch?.[1] ? Number(scoreMatch[1]) : 0
        const content = rawContent.replace(/[\(（]\s*分值[:：]\s*[-\d.]+\s*[\)）]/, '').trim()
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
    formOptions.value = formOptions.value.concat(items)
    batchOptionOpen.value = false
}

function validateOptions() {
    if (!formOptions.value.length) return true
    for (const opt of formOptions.value) {
        if (!opt.content || !opt.optionKey) {
            proxy?.$modal?.msgWarning?.('请补全选项内容和标识')
            return false
        }
    }
    return true
}

async function loadOptions(questionId: number) {
    try {
        const res = await listAssessmentOptions({ questionId })
        formOptions.value = parseAssessmentOptionRows(res)
        removedOptionIds.value = []
    } catch (error) {
        console.error(error)
        formOptions.value = []
        removedOptionIds.value = []
        proxy?.$modal?.msgError?.('获取选项列表失败')
    }
}

async function saveOptions(questionId: number) {
    if (!validateOptions()) {
        throw new Error('invalid options')
    }
    if (removedOptionIds.value.length) {
        await deleteAssessmentOption(removedOptionIds.value.join(','))
        removedOptionIds.value = []
    }
    for (const opt of formOptions.value) {
        if (opt.id) {
            await updateAssessmentOption({
                id: Number(opt.id),
                content: opt.content,
                optionKey: opt.optionKey,
                scoreValue: Number(opt.scoreValue ?? 0),
                sortOrder: Number(opt.sortOrder ?? 0)
            })
        } else {
            await addAssessmentOption({
                questionId,
                content: opt.content,
                optionKey: opt.optionKey,
                scoreValue: Number(opt.scoreValue ?? 0),
                sortOrder: Number(opt.sortOrder ?? 0)
            })
        }
    }
}

function handleDelete(row?: AssessmentQuestionItem) {
    const targetRows = row ? [row] : selectedRows.value
    const targetIds = targetRows.map(item => item.id).filter(Boolean)

    if (!targetIds.length) {
        proxy?.$modal?.msgWarning?.('请先选择要删除的题目')
        return
    }

    const names = targetRows.map(item => getQuestionTitle(item)).join('、')
    const tip = row ? `确认删除题目「${names}」吗？` : `确认删除选中的 ${targetIds.length} 题吗？`
    proxy?.$modal
        ?.confirm?.(tip)
        .then(() => deleteAssessmentQuestion(targetIds.join(',')))
        .then(() => {
            proxy?.$modal?.msgSuccess?.('删除成功')
            getList()
        })
        .catch(() => {})
}

function handleBatchOpen() {
    batchText.value = ''
    batchOpen.value = true
}

function parseBatchQuestions(text: string) {
    return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
}

function parseBatchQuestionsWithOptions(text: string) {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)

    if (!lines.length) return { moduleCode: undefined, items: [] as any[] }

    const isQuestionLine = (line: string) => /^(?:●\s*)?题\s*\d+\s*[：:]/.test(line) || /[？?]$/.test(line)
    const isOptionLine = (line: string) => /^[A-F][\.\s、)]/i.test(line)

    let moduleCode: string | undefined
    let startIndex = 0
    if (!isQuestionLine(lines[0]) && !isOptionLine(lines[0])) {
        moduleCode = lines[0]
        startIndex = 1
    }

    const items: Array<{ content: string; options: Array<{ optionKey: string; content: string; scoreValue: number }> }> = []
    let current: { content: string; options: Array<{ optionKey: string; content: string; scoreValue: number }> } | null = null

    for (let i = startIndex; i < lines.length; i += 1) {
        const line = lines[i]
        if (isQuestionLine(line)) {
            if (current) items.push(current)
            const content = line.replace(/^(?:●\s*)?题\s*\d+\s*[：:]\s*/, '')
            current = { content, options: [] }
            continue
        }

        if (!current) {
            current = { content: line, options: [] }
            continue
        }

        if (isOptionLine(line)) {
            const match = line.match(/^\s*([A-F])[\.\s、)]*\s*(.+?)\s*$/i)
            const optionKey = (match?.[1] || '').toUpperCase()
            const rawContent = match?.[2] || line
            const scoreMatch = rawContent.match(/[\(（]\s*分值[:：]\s*([-\d.]+)\s*[\)）]/)
            const scoreValue = scoreMatch?.[1] ? Number(scoreMatch[1]) : 0
            const content = rawContent.replace(/[\(（]\s*分值[:：]\s*[-\d.]+\s*[\)）]/, '').trim()
            current.options.push({
                optionKey: optionKey || String.fromCharCode(65 + current.options.length),
                content,
                scoreValue: Number.isFinite(scoreValue) ? scoreValue : 0
            })
        } else {
            current.content = `${current.content} ${line}`.trim()
        }
    }

    if (current) items.push(current)

    return { moduleCode, items }
}

async function getMaxQuestionSortOrder(moduleCode: string | undefined): Promise<number> {
    if (!moduleCode) return 0

    const res = await listAssessmentQuestions({
        pageNum: 1,
        pageSize: 1,
        moduleCode,
        orderByColumn: 'sortOrder',
        isAsc: 'desc'
    } as any)

    const rows = parseAssessmentQuestionRows(res) || []
    return rows.length ? Number((rows[0] as any).sortOrder || 0) : 0
}

async function getMaxOptionSortOrder(questionId: number): Promise<number> {
    try {
        const res = await listAssessmentOptions({
            questionId,
            pageNum: 1,
            pageSize: 1,
            orderByColumn: 'sortOrder',
            isAsc: 'desc'
        } as any)

        const rows = res?.rows || res?.data || []
        return rows.length ? Number(rows[0].sortOrder || 0) : 0
    } catch {
        return 0
    }
}

async function submitBatch() {
    const { moduleCode, items } = parseBatchQuestionsWithOptions(batchText.value || '')
    if (!items.length) {
        proxy?.$modal?.msgWarning?.('请输入题目列表')
        return
    }

    batchLoading.value = true
    try {
        let sortOrder = 1

        for (const item of items) {
            const res = await addAssessmentQuestion({
                moduleCode: moduleCode || form.value.moduleCode || undefined,
                type: 'NORMAL',
                content: item.content,
                questionType: '1',
                correctAnswer: undefined,
                sortOrder
            } as any)

            const newId = pickQuestionId(res)
            if (!newId) {
                console.error('[batch] addAssessmentQuestion response =', res)
                throw new Error(`批量导入失败：新增题目成功但未返回ID，题目内容：${item.content}`)
            }

            if (item.options?.length) {
                let optionSort = 1
                for (const opt of item.options) {
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

        proxy?.$modal?.msgSuccess?.('批量生成成功')
        batchOpen.value = false
        getList()
    } catch (error: any) {
        console.error(error)
        proxy?.$modal?.msgError?.(error?.message || '批量生成失败')
    } finally {
        batchLoading.value = false
    }
}

function submitForm() {
    if (!formRef.value) return
    formRef.value.validate(async (valid: boolean) => {
        if (!valid) return
        submitLoading.value = true
        try {
            const payload = {
                id: form.value.id,
                moduleCode: form.value.moduleCode || undefined,
                type: form.value.type || undefined,
                content: form.value.content,
                questionType: String(form.value.questionType),
                correctAnswer: form.value.correctAnswer || undefined,
                sortOrder: Number(form.value.sortOrder ?? 0)
            }
            if (form.value.id) {
                await updateAssessmentQuestion(payload as any)
                await saveOptions(Number(form.value.id))
                proxy?.$modal?.msgSuccess?.('修改成功')
            } else {
                const res = await addAssessmentQuestion(payload as any)
                const newId = (res as any)?.id ?? (res as any)?.data?.id ?? (res as any)?.data?.questionId ?? (res as any)?.questionId
                if (!newId) {
                    throw new Error('missing question id')
                }
                await saveOptions(Number(newId))
                proxy?.$modal?.msgSuccess?.('新增成功')
            }
            open.value = false
            resetOptions()
            getList()
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

.btn-icon {
    margin-right: 4px;
    font-size: 16px;
}

:deep(.table-header-cell) {
    background-color: #f8fafd !important;
    color: #606266;
    font-weight: 600;
    height: 50px;
}

.row-title {
    font-weight: 500;
    color: #303133;
}

.time-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
}

.pagination-container {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
}

/* 选项区域美化 */
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
            color: #606266;
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
            background: #fff;
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

            .option-meta {
                display: flex;
                align-items: center;
                gap: 8px;
            }
        }

        .empty-options {
            text-align: center;
            color: #909399;
            padding: 20px;
            font-size: 13px;
            border: 1px dashed var(--el-border-color-lighter);
            border-radius: 6px;
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.mb-3 {
    margin-bottom: 12px;
}

:deep(.el-radio-button__inner) {
    display: flex;
    align-items: center;
    padding: 8px 16px;
}
</style>
