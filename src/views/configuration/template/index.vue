<template>
    <div class="app-container">
        <el-form v-show="showSearch" ref="queryRef" :model="queryParams" :inline="true">
            <el-form-item :label="TEXT_MAP.interestType" prop="interestType">
                <el-select
                    v-model="queryParams.interestType"
                    :placeholder="TEXT_MAP.interestTypePlaceholder"
                    :loading="dimensionLoading"
                    clearable
                    filterable
                    class="w-[220px]"
                >
                    <el-option v-for="opt in interestTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="TEXT_MAP.abilityLevel" prop="abilityLevel">
                <el-select v-model="queryParams.abilityLevel" :placeholder="TEXT_MAP.abilityLevelPlaceholder" clearable class="w-[180px]">
                    <el-option v-for="(label, value) in ABILITY_MAP" :key="value" :label="label" :value="Number(value)" />
                </el-select>
            </el-form-item>
            <el-form-item :label="TEXT_MAP.valueType" prop="valueType">
                <el-select
                    v-model="queryParams.valueType"
                    :placeholder="TEXT_MAP.valueTypePlaceholder"
                    :loading="dimensionLoading"
                    clearable
                    filterable
                    class="w-[200px]"
                >
                    <el-option v-for="opt in valueTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="TEXT_MAP.personalityTrait" prop="personalityTrait">
                <el-select
                    v-model="queryParams.personalityTrait"
                    :placeholder="TEXT_MAP.personalityTraitPlaceholder"
                    :loading="dimensionLoading"
                    clearable
                    filterable
                    class="w-[200px]"
                >
                    <el-option v-for="opt in personalityTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleQuery"> <Icon icon="mdi:magnify" class="mr-1" /> {{ TEXT_MAP.search }} </el-button>
                <el-button @click="resetQuery"> <Icon icon="mdi:refresh" class="mr-1" /> {{ TEXT_MAP.reset }} </el-button>
            </el-form-item>
        </el-form>

        <div class="rounded-md">
            <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <el-button type="primary" plain @click="handleAdd"> <Icon icon="mdi:plus" class="mr-1" /> {{ TEXT_MAP.add }} </el-button>
                    <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleDelete()">
                        <Icon icon="mdi:trash-can-outline" class="mr-1" /> {{ TEXT_MAP.delete }}
                    </el-button>
                </div>
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
            </div>

            <el-table v-loading="loading" :data="templateList" header-cell-class-name="table-header-cell" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" align="center" />

                <el-table-column label="职业兴趣" align="center" width="120">
                    <template #default="{ row }">
                        <el-tag :type="getInterestTagType(row.interestType)" effect="light">
                            {{ getInterestName(row.interestType) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="能力水平" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.abilityLevel === 2 ? 'success' : 'warning'" effect="plain">
                            {{ ABILITY_MAP[row.abilityLevel as AbilityLevel] || '-' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="价值观" align="center" min-width="120" show-overflow-tooltip>
                    <template #default="{ row }">
                        <el-tag type="info" effect="plain">{{ getLabel(row.valueType, STATIC_VALUE_MAP) }}</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="人格特质" align="center" min-width="120" show-overflow-tooltip>
                    <template #default="{ row }">
                        <el-tag type="info" effect="plain">{{ getLabel(row.personalityTrait, STATIC_PERSONALITY_MAP) }}</el-tag>
                    </template>
                </el-table-column>

                <el-table-column :label="TEXT_MAP.updateTime" align="center" width="170">
                    <template #default="{ row }">
                        <span class="text-[13px] text-[var(--el-text-color-secondary)]">{{ formatTimeCell(row.updateTime || row.createTime) }}</span>
                    </template>
                </el-table-column>

                <el-table-column :label="TEXT_MAP.actions" align="center" width="140" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handleEdit(row)">
                            <Icon icon="mdi:pencil-outline" class="mr-1" /> {{ TEXT_MAP.edit }}
                        </el-button>
                        <el-button link type="danger" @click="handleDelete(row)">
                            <Icon icon="mdi:trash-can-outline" class="mr-1" /> {{ TEXT_MAP.delete }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </div>

        <el-drawer v-model="open" :title="dialogTitle" direction="rtl" size="640px" append-to-body destroy-on-close class="modern-drawer">
            <div class="h-full overflow-y-auto pr-1">
                <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="top">
                    <el-row :gutter="24">
                        <el-col :span="12">
                            <el-form-item :label="TEXT_MAP.interestType" prop="interestType">
                                <el-select
                                    v-model="form.interestType"
                                    :placeholder="TEXT_MAP.interestTypePlaceholder"
                                    :loading="dimensionLoading"
                                    clearable
                                    filterable
                                    class="w-full"
                                >
                                    <el-option v-for="opt in interestTypeSelectOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12">
                            <el-form-item :label="TEXT_MAP.abilityLevel" prop="abilityLevel">
                                <el-select v-model="form.abilityLevel" :placeholder="TEXT_MAP.abilityLevelPlaceholder" class="w-full">
                                    <el-option v-for="(label, value) in ABILITY_MAP" :key="value" :label="label" :value="Number(value)" />
                                </el-select>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12">
                            <el-form-item :label="TEXT_MAP.valueType" prop="valueType">
                                <el-select
                                    v-model="form.valueType"
                                    :placeholder="TEXT_MAP.valueTypePlaceholder"
                                    :loading="dimensionLoading"
                                    clearable
                                    filterable
                                    class="w-full"
                                >
                                    <el-option v-for="opt in valueTypeSelectOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12">
                            <el-form-item :label="TEXT_MAP.personalityTrait" prop="personalityTrait">
                                <el-select
                                    v-model="form.personalityTrait"
                                    :placeholder="TEXT_MAP.personalityTraitPlaceholder"
                                    :loading="dimensionLoading"
                                    clearable
                                    filterable
                                    class="w-full"
                                >
                                    <el-option v-for="opt in personalityTraitSelectOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>

                        <el-col :span="24" class="form-section-title">
                            <span>详细描述配置</span>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item :label="TEXT_MAP.interestDesc" prop="interestDesc">
                                <el-input v-model="form.interestDesc" type="textarea" :rows="3" :placeholder="TEXT_MAP.interestDescPlaceholder" resize="none" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item :label="TEXT_MAP.abilityDesc" prop="abilityDesc">
                                <el-input v-model="form.abilityDesc" type="textarea" :rows="3" :placeholder="TEXT_MAP.abilityDescPlaceholder" resize="none" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item :label="TEXT_MAP.valueDesc" prop="valueDesc">
                                <el-input v-model="form.valueDesc" type="textarea" :rows="3" :placeholder="TEXT_MAP.valueDescPlaceholder" resize="none" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item :label="TEXT_MAP.personalityDesc" prop="personalityDesc">
                                <el-input
                                    v-model="form.personalityDesc"
                                    type="textarea"
                                    :rows="3"
                                    :placeholder="TEXT_MAP.personalityDescPlaceholder"
                                    resize="none"
                                />
                            </el-form-item>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item :label="TEXT_MAP.comprehensiveDesc" prop="comprehensiveDesc">
                                <el-input
                                    v-model="form.comprehensiveDesc"
                                    type="textarea"
                                    :rows="3"
                                    :placeholder="TEXT_MAP.comprehensiveDescPlaceholder"
                                    resize="none"
                                />
                            </el-form-item>
                        </el-col>

                        <el-col :span="24" class="form-section-title">
                            <span>其他信息</span>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item :label="TEXT_MAP.representative" prop="representativeList" class="mb-0">
                                <div class="w-full">
                                    <div
                                        v-for="(item, index) in form.representativeList"
                                        :key="index"
                                        class="mb-4 rounded-md border border-[var(--el-border-color-light)] bg-[var(--el-fill-color-lighter)] p-4 transition-all duration-300 ease-in-out hover:-translate-y-px hover:border-[var(--el-border-color)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
                                    >
                                        <div class="mb-3 flex items-center justify-between">
                                            <span
                                                class="rounded-[10px] bg-[var(--el-fill-color)] px-2 py-[2px] text-xs font-semibold text-[var(--el-text-color-secondary)]"
                                            >
                                                {{ index + 1 }}
                                            </span>
                                            <el-button link type="danger" @click="removeRepresentative(index)">
                                                <Icon icon="mdi:close" />
                                            </el-button>
                                        </div>
                                        <div class="flex items-start gap-5">
                                            <div class="flex min-w-0 flex-1 flex-col gap-3">
                                                <el-input v-model="item.name" placeholder="人物姓名" class="mb-2">
                                                    <template #prefix><Icon icon="mdi:account" /></template>
                                                </el-input>
                                                <el-input v-model="item.description" placeholder="简短描述/头衔" type="textarea" :rows="2" resize="none" />
                                            </div>
                                            <div class="right-upload flex w-24 shrink-0 items-start">
                                                <ImageUpload
                                                    v-model="item.image"
                                                    :limit="1"
                                                    :is-show-tip="false"
                                                    oss-type="templates"
                                                    class="mini-upload"
                                                    :file-type="['png', 'jpg', 'jpeg']"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <el-button
                                        type="primary"
                                        plain
                                        class="w-full border-dashed text-[var(--el-text-color-secondary)] hover:border-[var(--el-color-primary)] hover:text-[var(--el-color-primary)]"
                                        @click="addRepresentative"
                                    >
                                        <Icon icon="mdi:plus" class="mr-1" /> 添加代表人物
                                    </el-button>
                                </div>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </div>
            <template #footer>
                <div class="flex items-center justify-end gap-3">
                    <el-button @click="open = false">{{ TEXT_MAP.cancel }}</el-button>
                    <el-button type="primary" :loading="submitLoading" @click="submitForm">
                        {{ TEXT_MAP.confirm }}
                    </el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts" name="TemplateManage">
import { reactive, ref, computed, getCurrentInstance, onMounted } from 'vue'
import { parseTime } from '@/utils/utils'
import { addTemplate, updateTemplate, deleteTemplate, listTemplates, parseTemplateRows, type TemplateItem } from '@/api/configuration/template'
import { useDimension } from '@/features/configuration/template/composables/useDimension'
import { useTemplateForm } from '@/features/configuration/template/composables/useTemplateForm'
import { TEXT_MAP, ABILITY_MAP, STATIC_VALUE_MAP, STATIC_PERSONALITY_MAP, type AbilityLevel } from '@/features/configuration/template/constants'

const { proxy } = getCurrentInstance()!

const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const templateList = ref<TemplateItem[]>([])
const selectedIds = ref<(number | string)[]>([])
const queryRef = ref()

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    interestType: '',
    abilityLevel: '',
    valueType: '',
    personalityTrait: ''
})

const {
    dimensionLoading,
    dimensionNameMap,
    interestTypeOptions,
    valueTypeOptions,
    personalityTypeOptions,
    getInterestName,
    getInterestTagType,
    withCurrentOption,
    normalizeDimensionValue,
    loadDimensionTree
} = useDimension()

const {
    formRef,
    open,
    dialogTitle,
    submitLoading,
    currentEditId,
    form,
    rules,
    resetForm,
    addRepresentative,
    removeRepresentative,
    normalizeRepresentativeList
} = useTemplateForm()

const valueTypeSelectOptions = computed(() => withCurrentOption(valueTypeOptions.value, form.valueType))
const personalityTraitSelectOptions = computed(() => withCurrentOption(personalityTypeOptions.value, form.personalityTrait))
const interestTypeSelectOptions = computed(() => withCurrentOption(interestTypeOptions.value, form.interestType))

function getLabel(code: string, fallbackMap: Record<string, string>) {
    if (!code) return '-'
    return dimensionNameMap.value.get(code) || fallbackMap[code] || code
}

function formatTimeCell(val: any) {
    return val ? parseTime(val) : ''
}

async function getList() {
    loading.value = true
    try {
        const res = await listTemplates({
            pageNum: queryParams.pageNum,
            pageSize: queryParams.pageSize,
            interestType: queryParams.interestType || undefined,
            abilityLevel: queryParams.abilityLevel || undefined,
            valueType: queryParams.valueType || undefined,
            personalityTrait: queryParams.personalityTrait || undefined
        })
        const rows = parseTemplateRows(res) || []
        templateList.value = rows
        const resTotal = (res as any)?.total ?? (res as any)?.data?.total
        total.value = Number.isFinite(Number(resTotal)) ? Number(resTotal) : rows.length
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.(TEXT_MAP.fetchError)
    } finally {
        loading.value = false
    }
}

function handleQuery() {
    queryParams.pageNum = 1
    getList()
}

function resetQuery() {
    proxy?.resetForm?.('queryRef')
    handleQuery()
}

function handleAdd() {
    dialogTitle.value = TEXT_MAP.addTitle
    currentEditId.value = null
    resetForm()

    loadDimensionTree().catch(() => {
        proxy?.$modal?.msgError?.(TEXT_MAP.dimensionFetchError)
    })

    open.value = true
}

function handleEdit(row: TemplateItem) {
    const id = row.id
    if (!id) {
        proxy?.$modal?.msgWarning?.(TEXT_MAP.editMissingId)
        return
    }

    dialogTitle.value = TEXT_MAP.editTitle
    currentEditId.value = id
    resetForm()

    Object.assign(form, {
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
        representativeList: normalizeRepresentativeList(row.representativeList)
    })

    open.value = true
}

function handleSelectionChange(selection: TemplateItem[]) {
    selectedIds.value = selection.map(item => item.id).filter(Boolean) as number[]
}

function handleDelete(row?: TemplateItem) {
    const ids = row ? [row.id].filter(Boolean) : selectedIds.value

    if (!ids.length) {
        proxy?.$modal?.msgWarning?.(row ? TEXT_MAP.deleteMissingId : TEXT_MAP.deleteEmpty)
        return
    }

    proxy?.$modal
        ?.confirm?.(TEXT_MAP.deleteConfirm)
        .then(async () => {
            await deleteTemplate(ids.join(','))
            proxy?.$modal?.msgSuccess?.(TEXT_MAP.deleteSuccess)
            getList()
        })
        .catch((error: any) => {
            if (error) proxy?.$modal?.msgError?.(TEXT_MAP.deleteError)
        })
}

function submitForm() {
    if (!formRef.value) return

    formRef.value.validate(async (valid: boolean) => {
        if (!valid) return

        submitLoading.value = true
        try {
            const payload = {
                interestType: String(form.interestType || '').trim(),
                abilityLevel: Number(form.abilityLevel || 1),
                valueType: normalizeDimensionValue(String(form.valueType || '').trim()),
                personalityTrait: normalizeDimensionValue(String(form.personalityTrait || '').trim()),
                interestDesc: String(form.interestDesc || '').trim(),
                abilityDesc: String(form.abilityDesc || '').trim(),
                valueDesc: String(form.valueDesc || '').trim(),
                personalityDesc: String(form.personalityDesc || '').trim(),
                comprehensiveDesc: String(form.comprehensiveDesc || '').trim(),
                representativeList: normalizeRepresentativeList(form.representativeList)
            }

            if (currentEditId.value) {
                await updateTemplate({ id: currentEditId.value, ...payload })
                proxy?.$modal?.msgSuccess?.(TEXT_MAP.updateSuccess)
            } else {
                await addTemplate(payload)
                proxy?.$modal?.msgSuccess?.(TEXT_MAP.saveSuccess)
            }

            open.value = false
            queryParams.pageNum = 1
            getList()
        } catch (error) {
            console.error(error)
            proxy?.$modal?.msgError?.(currentEditId.value ? TEXT_MAP.updateError : TEXT_MAP.saveError)
        } finally {
            submitLoading.value = false
        }
    })
}

onMounted(() => {
    getList()

    loadDimensionTree().catch(() => {
        console.error('预加载维度树失败')
    })
})
</script>

<style scoped lang="scss">
.right-upload {
    :deep(.mini-upload.glass-upload-container) {
        width: 96px;
        padding: 0;
        background: transparent;
        border: none;
        box-shadow: none;
    }

    :deep(.mini-upload .upload-wrapper) {
        width: 96px;
    }

    :deep(.mini-upload .glass-uploader) {
        --item-size: 96px;
        --radius: 10px;
    }

    :deep(.mini-upload .el-upload-list--picture-card) {
        grid-template-columns: 1fr;
        gap: 0;
    }

    :deep(.el-upload) {
        width: 96px;
        height: 96px;
    }

    :deep(.el-upload-list) {
        width: 96px;
    }

    :deep(.el-upload-list__item) {
        width: 96px;
        height: 96px;
        margin: 0;
    }
}
</style>
