<template>
    <div class="app-container template-manage">
        <div class="table-wrapper">
            <div class="table-header">
                <div class="left-tools">
                    <el-button type="primary" plain @click="handleAdd"> <Icon icon="mdi:plus" class="mr-1" /> {{ textMap.add }} </el-button>
                    <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleDelete()">
                        <Icon icon="mdi:trash-can-outline" class="mr-1" /> {{ textMap.delete }}
                    </el-button>
                </div>
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :search="false" />
            </div>

            <el-table v-loading="loading" :data="templateList" header-cell-class-name="table-header-cell" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" align="center" />

                <el-table-column label="职业兴趣" align="center" width="120">
                    <template #default="{ row }">
                        <el-tag :type="getInterestTagType(row.interestType)" effect="light">
                            {{ interestMap[row.interestType] || row.interestType || '-' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="能力水平" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.abilityLevel === 2 ? 'success' : 'warning'" effect="plain">
                            {{ abilityMap[row.abilityLevel] || '-' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="价值观" align="center" min-width="120" show-overflow-tooltip>
                    <template #default="{ row }">
                        <el-tag type="info" effect="plain">{{ getValueLabel(row.valueType) }}</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="人格特质" align="center" min-width="120" show-overflow-tooltip>
                    <template #default="{ row }">
                        <el-tag type="info" effect="plain">{{ getPersonalityLabel(row.personalityTrait) }}</el-tag>
                    </template>
                </el-table-column>

                <el-table-column :label="textMap.updateTime" align="center" width="170">
                    <template #default="{ row }">
                        <span class="time-cell">{{ formatTimeCell(row.updateTime || row.createTime) }}</span>
                    </template>
                </el-table-column>

                <el-table-column :label="textMap.actions" align="center" width="140" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handleEdit(row)"> <Icon icon="mdi:pencil-outline" class="mr-1" /> {{ textMap.edit }} </el-button>
                        <el-button link type="danger" @click="handleDelete(row)">
                            <Icon icon="mdi:trash-can-outline" class="mr-1" /> {{ textMap.delete }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </div>

        <el-drawer v-model="open" :title="dialogTitle" direction="rtl" size="640px" append-to-body destroy-on-close class="modern-drawer">
            <div class="drawer-content">
                <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="top">
                    <el-row :gutter="24">
                        <el-col :span="12">
                            <el-form-item :label="textMap.interestType" prop="interestType">
                                <el-select v-model="form.interestType" :placeholder="textMap.interestTypePlaceholder" style="width: 100%">
                                    <el-option v-for="(label, value) in interestMap" :key="value" :label="label" :value="value">
                                        <div class="option-flex">
                                            <span>{{ label }}</span>
                                            <span class="option-code">{{ value }}</span>
                                        </div>
                                    </el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="textMap.abilityLevel" prop="abilityLevel">
                                <el-select v-model="form.abilityLevel" :placeholder="textMap.abilityLevelPlaceholder" style="width: 100%">
                                    <el-option v-for="(label, value) in abilityMap" :key="value" :label="label" :value="Number(value)" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="textMap.valueType" prop="valueType">
                                <el-select
                                    v-model="form.valueType"
                                    :placeholder="textMap.valueTypePlaceholder"
                                    :loading="dimensionLoading"
                                    clearable
                                    filterable
                                    style="width: 100%"
                                >
                                    <el-option v-for="opt in valueTypeSelectOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="textMap.personalityTrait" prop="personalityTrait">
                                <el-select
                                    v-model="form.personalityTrait"
                                    :placeholder="textMap.personalityTraitPlaceholder"
                                    :loading="dimensionLoading"
                                    clearable
                                    filterable
                                    style="width: 100%"
                                >
                                    <el-option v-for="opt in personalityTraitSelectOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>

                        <el-col :span="24" class="form-section-title">
                            <span>详细描述配置</span>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item :label="textMap.interestDesc" prop="interestDesc">
                                <el-input v-model="form.interestDesc" type="textarea" :rows="3" :placeholder="textMap.interestDescPlaceholder" resize="none" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item :label="textMap.abilityDesc" prop="abilityDesc">
                                <el-input v-model="form.abilityDesc" type="textarea" :rows="3" :placeholder="textMap.abilityDescPlaceholder" resize="none" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item :label="textMap.valueDesc" prop="valueDesc">
                                <el-input v-model="form.valueDesc" type="textarea" :rows="3" :placeholder="textMap.valueDescPlaceholder" resize="none" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item :label="textMap.personalityDesc" prop="personalityDesc">
                                <el-input
                                    v-model="form.personalityDesc"
                                    type="textarea"
                                    :rows="3"
                                    :placeholder="textMap.personalityDescPlaceholder"
                                    resize="none"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item :label="textMap.comprehensiveDesc" prop="comprehensiveDesc">
                                <el-input
                                    v-model="form.comprehensiveDesc"
                                    type="textarea"
                                    :rows="3"
                                    :placeholder="textMap.comprehensiveDescPlaceholder"
                                    resize="none"
                                />
                            </el-form-item>
                        </el-col>

                        <el-col :span="24" class="form-section-title">
                            <span>其他信息</span>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item :label="textMap.representative" prop="representativeList" class="representative-form-item">
                                <div class="representative-container">
                                    <div v-for="(item, index) in form.representativeList" :key="index" class="representative-card">
                                        <div class="card-header">
                                            <span class="index-badge">{{ index + 1 }}</span>
                                            <el-button link type="danger" @click="removeRepresentative(index)">
                                                <Icon icon="mdi:close" />
                                            </el-button>
                                        </div>
                                        <div class="card-body">
                                            <div class="left-inputs">
                                                <el-input v-model="item.name" placeholder="人物姓名" class="mb-2">
                                                    <template #prefix><Icon icon="mdi:account" /></template>
                                                </el-input>
                                                <el-input v-model="item.description" placeholder="简短描述/头衔" type="textarea" :rows="2" resize="none" />
                                            </div>
                                            <div class="right-upload">
                                                <ImageUpload
                                                    v-model="item.image"
                                                    :limit="1"
                                                    :is-show-tip="false"
                                                    class="mini-upload"
                                                    :file-type="['png', 'jpg', 'jpeg']"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <el-button type="primary" plain class="add-btn" @click="addRepresentative">
                                        <Icon icon="mdi:plus" class="mr-1" /> 添加代表人物
                                    </el-button>
                                </div>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </div>
            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="open = false" class="btn-cancel">{{ textMap.cancel }}</el-button>
                    <el-button type="primary" :loading="submitLoading" @click="submitForm" class="btn-submit">{{ textMap.confirm }}</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup name="TemplateManage" lang="ts">
import { computed, reactive, ref, toRefs, getCurrentInstance, onMounted } from 'vue'
import { parseTime } from '@/utils/utils'
import { addTemplate, updateTemplate, deleteTemplate, listTemplates, parseTemplateRows, type TemplateItem } from '@/api/configuration/template'
import { getDimensionTree, parseDimensionTree, type DimensionNode } from '@/api/content/assessmentQuestion'
import { textMap } from './constants'

const { proxy } = getCurrentInstance() as any

const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const templateList = ref<TemplateItem[]>([])
const queryRef = ref()
const formRef = ref()
const open = ref(false)
const dialogTitle = ref<string>(textMap.addTitle)
const submitLoading = ref(false)

const currentEditId = ref<number | null>(null)
const selectedIds = ref<(number | string)[]>([])
const dimensionTree = ref<DimensionNode[]>([])
const dimensionLoading = ref(false)

const interestMap: Record<string, string> = {
    R: '现实型',
    I: '研究型',
    A: '艺术型',
    S: '社会型',
    E: '企业型',
    C: '常规型'
}

const abilityMap: Record<number, string> = {
    1: '低水平',
    2: '高水平'
}

const staticValueMap: Record<string, string> = {
    ACHIEVEMENT: '成就导向',
    INDEPENDENCE: '独立自主',
    RECOGNITION: '社会认可',
    SUPPORT: '注重支持',
    WORKING_CONDITIONS: '工作条件',
    RELATIONSHIPS: '人际关系'
}

const staticPersonalityMap: Record<string, string> = {
    NEUROTICISM: '神经质',
    EXTRAVERSION: '外向性',
    OPENNESS: '开放性',
    AGREEABLENESS: '宜人性',
    CONSCIENTIOUSNESS: '尽责性'
}

type DimensionOption = { label: string; value: string }
type RepresentativeItem = { name: string; description: string; image: string }

const VALUE_KEYWORDS = ['value', 'values', '价值', '价值观']
const PERSONALITY_KEYWORDS = ['personality', 'trait', '人格', '特质']

const data = reactive({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: '',
        code: ''
    },
    form: {
        id: undefined as number | undefined,
        interestType: '',
        abilityLevel: 2,
        valueType: '',
        personalityTrait: '',
        interestDesc: '',
        abilityDesc: '',
        valueDesc: '',
        personalityDesc: '',
        comprehensiveDesc: '',
        representativeList: [] as RepresentativeItem[]
    },
    rules: {
        interestType: [{ required: true, message: textMap.interestTypePlaceholder, trigger: 'change' }],
        abilityLevel: [{ required: true, message: textMap.abilityLevelPlaceholder, trigger: 'change' }],
        valueType: [{ required: true, message: textMap.valueTypePlaceholder, trigger: 'change' }],
        personalityTrait: [{ required: true, message: textMap.personalityTraitPlaceholder, trigger: 'change' }],
        interestDesc: [{ required: true, message: textMap.interestDescPlaceholder, trigger: 'blur' }],
        abilityDesc: [{ required: true, message: textMap.abilityDescPlaceholder, trigger: 'blur' }],
        valueDesc: [{ required: true, message: textMap.valueDescPlaceholder, trigger: 'blur' }],
        personalityDesc: [{ required: true, message: textMap.personalityDescPlaceholder, trigger: 'blur' }],
        comprehensiveDesc: [{ required: false, message: textMap.comprehensiveDescPlaceholder, trigger: 'blur' }]
    }
})

const { queryParams, form, rules } = toRefs(data)

const dimensionNameMap = computed(() => {
    const map = new Map<string, string>()
    const walk = (nodes: DimensionNode[]) => {
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
    const walk = (nodes: DimensionNode[]) => {
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

const valueTypeOptions = computed(() => buildDimensionOptions(VALUE_KEYWORDS))
const personalityTraitOptions = computed(() => buildDimensionOptions(PERSONALITY_KEYWORDS))
const valueTypeSelectOptions = computed(() => withCurrentOption(valueTypeOptions.value, form.value.valueType))
const personalityTraitSelectOptions = computed(() => withCurrentOption(personalityTraitOptions.value, form.value.personalityTrait))

function getInterestTagType(type: string) {
    const map: Record<string, string> = {
        R: 'primary',
        I: 'success',
        A: 'warning',
        S: 'danger',
        E: '',
        C: 'info'
    }
    return map[type] || 'info'
}

function getValueLabel(code: string) {
    if (!code) return '-'
    const fromMap = dimensionNameMap.value.get(code)
    if (fromMap) return fromMap
    return staticValueMap[code] || code
}

function getPersonalityLabel(code: string) {
    if (!code) return '-'
    const fromMap = dimensionNameMap.value.get(code)
    if (fromMap) return fromMap
    return staticPersonalityMap[code] || code
}

function normalizeDimensionValue(input: string) {
    const key = String(input || '').trim()
    if (!key) return ''
    return dimensionCodeMap.value.get(key) || key
}

function collectDimensionOptions(nodes: DimensionNode[], keywords?: string[]) {
    const options: DimensionOption[] = []
    const seen = new Set<string>()
    const normalized = (keywords || []).map(keyword => keyword.toLowerCase())
    const isMatch = (node: DimensionNode) => {
        if (!normalized.length) return true
        const text = [node.category, node.dimensionName, node.dimensionCode, node.id].filter(Boolean).join(' ').toLowerCase()
        return normalized.some(keyword => text.includes(keyword))
    }

    const walk = (node: DimensionNode, parentMatched: boolean) => {
        const nodeMatched = parentMatched || isMatch(node)
        const children = node.children || []
        if (children.length) {
            children.forEach(child => walk(child, nodeMatched))
            return
        }
        if (!nodeMatched) return
        const value = String(node.dimensionCode ?? node.dimensionName ?? '').trim()
        if (!value || seen.has(value)) return
        const label = String(node.dimensionName ?? node.dimensionCode ?? value).trim()
        options.push({ label, value })
        seen.add(value)
    }

    nodes.forEach(node => walk(node, false))
    return options
}

function buildDimensionOptions(keywords: string[]) {
    const matched = collectDimensionOptions(dimensionTree.value, keywords)
    if (matched.length) return matched
    return collectDimensionOptions(dimensionTree.value)
}

function withCurrentOption(options: DimensionOption[], currentValue: string | number | undefined) {
    const value = String(currentValue ?? '').trim()
    if (!value) return options
    if (options.some(option => option.value === value)) return options
    const label = dimensionNameMap.value.get(value) || value
    return [...options, { label, value }]
}

function formatTimeCell(val: any) {
    if (!val) return ''
    return parseTime(val)
}

function addRepresentative() {
    form.value.representativeList.push({ name: '', description: '', image: '' })
}

function removeRepresentative(index: number) {
    form.value.representativeList.splice(index, 1)
}

async function loadDimensionTree() {
    dimensionLoading.value = true
    try {
        const res = await getDimensionTree()
        dimensionTree.value = parseDimensionTree(res) || []
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.(textMap.dimensionFetchError)
        dimensionTree.value = []
    } finally {
        dimensionLoading.value = false
    }
}

async function getList() {
    loading.value = true
    try {
        const res = await listTemplates({
            pageNum: queryParams.value.pageNum,
            pageSize: queryParams.value.pageSize,
            name: queryParams.value.name || undefined,
            code: queryParams.value.code || undefined
        })
        const rows = parseTemplateRows(res) || []
        templateList.value = rows
        const resTotal = (res as any)?.total ?? (res as any)?.data?.total
        total.value = Number.isFinite(Number(resTotal)) ? Number(resTotal) : rows.length
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.(textMap.fetchError)
    } finally {
        loading.value = false
    }
}

function resetQuery() {
    proxy?.resetForm?.('queryRef')
    queryParams.value.pageNum = 1
    getList()
}

function resetForm() {
    if (formRef.value?.resetFields) {
        formRef.value.resetFields()
    }
    Object.assign(form.value, {
        id: undefined,
        interestType: '',
        abilityLevel: 2,
        valueType: '',
        personalityTrait: '',
        interestDesc: '',
        abilityDesc: '',
        valueDesc: '',
        personalityDesc: '',
        comprehensiveDesc: '',
        representativeList: []
    })
}

function handleAdd() {
    dialogTitle.value = textMap.addTitle
    currentEditId.value = null
    resetForm()
    if (!dimensionTree.value.length) loadDimensionTree()
    open.value = true
}

function handleEdit(row: TemplateItem) {
    const id = row.id
    if (!id) {
        proxy?.$modal?.msgWarning?.(textMap.editMissingId)
        return
    }
    dialogTitle.value = textMap.editTitle
    currentEditId.value = id
    resetForm()
    Object.assign(form.value, {
        id,
        interestType: row.interestType ?? '',
        abilityLevel: Number(row.abilityLevel ?? 2),
        valueType: normalizeDimensionValue(row.valueType ?? ''),
        personalityTrait: normalizeDimensionValue(row.personalityTrait ?? ''),
        interestDesc: row.interestDesc ?? '',
        abilityDesc: row.abilityDesc ?? '',
        valueDesc: row.valueDesc ?? '',
        personalityDesc: row.personalityDesc ?? '',
        comprehensiveDesc: row.comprehensiveDesc ?? '',
        representativeList: Array.isArray(row.representativeList)
            ? row.representativeList.map((item: any) => ({
                  name: item?.name ?? '',
                  description: item?.description ?? '',
                  image: item?.image ?? ''
              }))
            : []
    })
    open.value = true
}

function handleSelectionChange(selection: TemplateItem[]) {
    selectedIds.value = selection.map(item => item.id).filter(Boolean) as number[]
}

function handleDelete(row?: TemplateItem) {
    const ids = row ? [row.id].filter(Boolean) : selectedIds.value
    if (!ids.length) {
        proxy?.$modal?.msgWarning?.(row ? textMap.deleteMissingId : textMap.deleteEmpty)
        return
    }
    proxy?.$modal
        ?.confirm?.(textMap.deleteConfirm)
        .then(async () => {
            await deleteTemplate(ids.join(','))
        })
        .then(() => {
            proxy?.$modal?.msgSuccess?.(textMap.deleteSuccess)
            getList()
        })
        .catch((error: any) => {
            if (error) proxy?.$modal?.msgError?.(textMap.deleteError)
        })
}

function submitForm() {
    if (!formRef.value) return
    formRef.value.validate(async (valid: boolean) => {
        if (!valid) return
        submitLoading.value = true
        try {
            const payload = {
                interestType: String(form.value.interestType || '').trim(),
                abilityLevel: Number(form.value.abilityLevel || 1),
                valueType: normalizeDimensionValue(String(form.value.valueType || '').trim()),
                personalityTrait: normalizeDimensionValue(String(form.value.personalityTrait || '').trim()),
                interestDesc: String(form.value.interestDesc || '').trim(),
                abilityDesc: String(form.value.abilityDesc || '').trim(),
                valueDesc: String(form.value.valueDesc || '').trim(),
                personalityDesc: String(form.value.personalityDesc || '').trim(),
                comprehensiveDesc: String(form.value.comprehensiveDesc || '').trim(),
                representativeList: (form.value.representativeList || [])
                    .map(item => ({
                        name: String(item?.name || '').trim(),
                        description: String(item?.description || '').trim(),
                        image: String(item?.image || '').trim()
                    }))
                    .filter(item => item.name || item.description || item.image)
            }
            if (currentEditId.value) {
                await updateTemplate({ id: currentEditId.value, ...payload })
                proxy?.$modal?.msgSuccess?.(textMap.updateSuccess)
            } else {
                await addTemplate(payload)
                proxy?.$modal?.msgSuccess?.(textMap.saveSuccess)
            }
            open.value = false
            queryParams.value.pageNum = 1
            getList()
        } catch (error) {
            console.error(error)
            proxy?.$modal?.msgError?.(currentEditId.value ? textMap.updateError : textMap.saveError)
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
.template-manage {
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

.representative-container {
    width: 100%;

    .representative-card {
        background-color: var(--el-fill-color-lighter);
        border: 1px solid var(--el-border-color-light);
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 16px;
        transition: all 0.3s ease;
        display: block;

        &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            border-color: var(--el-border-color);
            transform: translateY(-1px);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .index-badge {
                font-size: 12px;
                font-weight: 600;
                color: var(--el-text-color-secondary);
                background: var(--el-fill-color);
                padding: 2px 8px;
                border-radius: 10px;
            }
        }

        .card-body {
            display: flex;
            gap: 20px;
            align-items: flex-start;

            .left-inputs {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-width: 0;
            }

            .right-upload {
                width: 80px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
    }

    .add-btn {
        width: 100%;
        border-style: dashed;
        color: var(--el-text-color-secondary);
        &:hover {
            border-color: var(--el-color-primary);
            color: var(--el-color-primary);
        }
    }
}

.representative-form-item {
    margin-bottom: 0;
}
</style>
