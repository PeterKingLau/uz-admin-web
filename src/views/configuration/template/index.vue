<template>
    <div class="app-container template-manage">
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
            <div class="drawer-content template-drawer-content">
                <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="top" class="drawer-form template-drawer-form">
                    <el-row :gutter="24" class="template-drawer-grid">
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
                            <el-form-item :label="TEXT_MAP.representative" prop="representativeList" class="mb-0 representative-form-item">
                                <div class="rep-list">
                                    <div v-for="(item, index) in form.representativeList" :key="index" class="rep-card">
                                        <div class="rep-card-header">
                                            <div class="rep-card-index">{{ index + 1 }}</div>
                                            <div class="rep-card-actions">
                                                <el-tooltip content="删除代表人物" placement="top" :show-after="500">
                                                    <el-button class="rep-delete-btn" circle @click="removeRepresentative(index)">
                                                        <Icon icon="mdi:close" />
                                                    </el-button>
                                                </el-tooltip>
                                            </div>
                                        </div>

                                        <div class="rep-card-body">
                                            <div class="rep-info-panel">
                                                <el-input v-model="item.name" placeholder="人物姓名" class="rep-name-input">
                                                    <template #prefix><Icon icon="mdi:account" /></template>
                                                </el-input>
                                                <el-input
                                                    v-model="item.description"
                                                    placeholder="简短描述 / 核心成就"
                                                    type="textarea"
                                                    :rows="4"
                                                    resize="none"
                                                    class="rep-desc-input"
                                                />
                                            </div>

                                            <div class="rep-avatar-panel">
                                                <div class="rep-avatar-frame">
                                                    <ImageUpload
                                                        v-model="item.image"
                                                        :limit="1"
                                                        :is-show-tip="false"
                                                        oss-type="templates"
                                                        class="rep-avatar-uploader"
                                                        :file-type="['png', 'jpg', 'jpeg']"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <el-button class="rep-add-btn" plain @click="addRepresentative">
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
.template-manage {
    .template-drawer-content {
        padding-right: 20px;
        padding-bottom: 8px;
    }

    .template-drawer-form {
        min-height: 100%;

        :deep(.el-form-item) {
            margin-bottom: 22px;
        }

        :deep(.el-form-item__label) {
            line-height: 1.4;
            padding-bottom: 8px;
            font-weight: 600;
        }

        :deep(.el-textarea__inner) {
            min-height: 92px;
        }
    }

    .template-drawer-grid {
        align-content: start;
    }

    .drawer-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
    }

    .representative-form-item {
        :deep(.el-form-item__content) {
            display: block;
        }
    }

    .rep-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
    }

    .rep-card {
        background: linear-gradient(180deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
        border: 1px solid var(--el-border-color-light);
        border-radius: 18px;
        padding: 18px;
        transition:
            border-color 0.3s,
            box-shadow 0.3s,
            transform 0.3s;

        &:hover {
            border-color: var(--el-color-primary-light-4);
            box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
            transform: translateY(-1px);

            :deep(.rep-delete-btn.el-button) {
                opacity: 1;
                transform: translateY(0);
            }
        }
    }

    .rep-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
        width: 100%;
        min-width: 0;
    }

    .rep-card-actions {
        margin-left: auto;
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: flex-end;

        :deep(.el-tooltip__trigger) {
            display: inline-flex;
            margin-left: auto;
        }
    }

    .rep-card-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        padding: 0 12px;
        background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
        color: var(--el-color-primary-dark-2);
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        border-radius: 999px;
        box-shadow: inset 0 0 0 1px rgba(var(--el-color-primary-rgb), 0.08);
    }

    :deep(.rep-delete-btn.el-button) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border-radius: 999px;
        border: 1px solid rgba(var(--el-color-danger-rgb), 0.14);
        background: rgba(var(--el-color-danger-rgb), 0.06);
        color: var(--el-color-danger);
        opacity: 0.8;
        transition:
            opacity 0.2s,
            transform 0.2s,
            background-color 0.2s,
            border-color 0.2s;

        &:hover {
            background: rgba(var(--el-color-danger-rgb), 0.12);
            border-color: rgba(var(--el-color-danger-rgb), 0.24);
            transform: translateY(-1px);
        }

        .iconify {
            font-size: 14px;
        }
    }

    .rep-card-body {
        display: flex;
        gap: 18px;
        align-items: stretch;
    }

    .rep-info-panel {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 18px;
        border-radius: 16px;
        background: rgba(var(--el-fill-color-rgb), 0.55);
        border: 1px solid var(--el-border-color-lighter);
        backdrop-filter: blur(4px);

        .rep-name-input :deep(.el-input__wrapper) {
            box-shadow: none;
            border: 1px solid transparent;
            border-radius: 12px;
            background-color: var(--el-bg-color);
            min-height: 44px;
            transition:
                border-color 0.2s,
                box-shadow 0.2s,
                background-color 0.2s;

            &.is-focus,
            &:hover {
                border-color: var(--el-color-primary);
                background-color: var(--el-bg-color-overlay);
            }

            &.is-focus {
                box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
            }

            .el-input__inner {
                font-weight: 600;
                color: var(--el-text-color-primary);
                font-size: 14px;
            }
        }

        .rep-desc-input :deep(.el-textarea__inner) {
            box-shadow: none;
            border: 1px solid transparent;
            border-radius: 14px;
            background-color: var(--el-bg-color);
            transition:
                border-color 0.2s,
                box-shadow 0.2s,
                background-color 0.2s;
            padding: 12px 14px;
            line-height: 1.6;
            min-height: 128px !important;

            &:hover,
            &:focus {
                border-color: var(--el-color-primary);
                background-color: var(--el-bg-color-overlay);
            }

            &:focus {
                box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
            }
        }
    }

    .rep-avatar-panel {
        flex: 0 0 148px;
        display: flex;
    }

    .rep-avatar-frame {
        width: 100%;
        min-height: 192px;
        padding: 12px;
        border-radius: 16px;
        border: 1px solid var(--el-border-color-lighter);
        background: linear-gradient(180deg, var(--el-fill-color-light) 0%, var(--el-bg-color) 100%);
        display: flex;
        align-items: center;
        justify-content: center;

        .rep-avatar-uploader {
            width: 120px;

            :deep(.glass-upload-container) {
                padding: 0;
                background: transparent;
                border: none;
                box-shadow: none;
            }

            :deep(.upload-wrapper) {
                width: 120px;
            }

            :deep(.el-upload--picture-card) {
                width: 120px !important;
                height: 152px !important;
                border-radius: 14px;
                margin: 0 !important;
                background: var(--el-bg-color);
                border: 2px dashed var(--el-border-color-lighter);
                transition:
                    border-color 0.3s,
                    background-color 0.3s,
                    transform 0.3s;

                &:hover {
                    border-color: var(--el-color-primary);
                    background: var(--el-color-primary-light-9);
                    transform: translateY(-1px);
                }
            }

            :deep(.el-upload-list__item) {
                width: 120px !important;
                height: 152px !important;
                border-radius: 14px;
                margin: 0 !important;
                border: 1px solid var(--el-border-color-lighter);
                box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
            }

            :deep(.el-upload-list) {
                display: block;
                margin: 0;
            }

            :deep(.upload-trigger-content) {
                gap: 10px;

                .icon-box {
                    font-size: 32px;
                    color: var(--el-text-color-placeholder);
                }

                .main-text {
                    font-size: 13px;
                    color: var(--el-text-color-secondary);
                }

                .sub-text {
                    display: none;
                }
            }

            :deep(.upload-info-bar) {
                display: none;
            }
        }
    }

    .rep-add-btn {
        width: 100%;
        border-style: dashed;
        border-width: 1px;
        height: 48px;
        border-radius: 12px;
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
        background: var(--el-color-primary-light-9);
        font-weight: 600;
        transition: all 0.3s;

        &:hover {
            border-color: var(--el-color-primary);
            background: var(--el-color-primary-light-8);
        }
    }

    :global(html.dark) .template-manage {
        .rep-card {
            background: var(--el-bg-color-overlay);
            border-color: var(--el-border-color-lighter);

            &:hover {
                border-color: var(--el-border-color);
            }
        }

        .rep-card-index {
            background: linear-gradient(135deg, var(--el-color-primary-dark-2) 0%, var(--el-color-primary) 100%);
            color: var(--el-color-primary-light-9);
        }

        .rep-delete-btn {
            background: rgba(var(--el-color-danger-rgb), 0.14);
            border-color: rgba(var(--el-color-danger-rgb), 0.24);
        }

        .rep-info-panel,
        .rep-avatar-frame {
            background: var(--el-fill-color-dark);
            border-color: var(--el-border-color);
        }

        .rep-name-input :deep(.el-input__wrapper),
        .rep-desc-input :deep(.el-textarea__inner) {
            background-color: var(--el-bg-color-overlay);
            border-color: transparent;

            &.is-focus,
            &:focus,
            &:hover {
                background-color: var(--el-bg-color);
                border-color: var(--el-color-primary);
            }
        }

        .rep-avatar-uploader {
            :deep(.el-upload--picture-card) {
                background: var(--el-fill-color-dark);
                border-color: var(--el-border-color-dark);

                &:hover {
                    background: var(--el-color-primary-dark-2);
                }
            }
        }
    }

    @media (max-width: 768px) {
        .template-drawer-content {
            padding-right: 0;
        }

        .rep-card {
            padding: 16px;
        }

        .rep-card-body {
            gap: 16px;
        }

        .rep-avatar-panel {
            flex-basis: 132px;
        }

        .rep-avatar-frame {
            min-height: 176px;
            padding: 12px;
        }
    }

    @media (max-width: 560px) {
        .rep-avatar-frame {
            min-height: auto;
            padding: 14px;
        }

        .rep-card-body {
            flex-direction: column;
        }

        .rep-avatar-panel {
            flex: none;
            width: 100%;
        }

        .rep-avatar-frame .rep-avatar-uploader {
            width: 120px;
        }
    }
}
</style>
