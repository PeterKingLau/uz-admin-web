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

        <el-drawer v-model="open" :title="dialogTitle" direction="rtl" size="640px" destroy-on-close class="modern-drawer">
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
                                        <div class="rep-card-index">{{ index + 1 }}</div>
                                        <el-tooltip content="删除代表人物" placement="top" :show-after="500">
                                            <div class="rep-delete-btn" @click="removeRepresentative(index)">
                                                <Icon icon="mdi:trash-can-outline" />
                                            </div>
                                        </el-tooltip>

                                        <div class="rep-card-content">
                                            <div class="rep-info-panel">
                                                <div class="rep-panel-header">
                                                    <span class="rep-panel-title">人物信息</span>
                                                </div>
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
                                                <div class="rep-panel-header">
                                                    <span class="rep-panel-title">人物照片</span>
                                                </div>
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
        position: relative;
        background: var(--el-fill-color-blank);
        border: 1px solid var(--el-border-color-light);
        border-radius: 16px;
        padding: 24px;
        transition: all 0.3s;

        &:hover {
            border-color: var(--el-color-primary-light-5);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);

            .rep-delete-btn {
                opacity: 1;
                background-color: var(--el-color-danger-light-9);
            }
        }
    }

    .rep-card-index {
        position: absolute;
        top: -1px;
        left: -1px;
        background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 14px;
        border-radius: 16px 0 16px 0;
        box-shadow: 2px 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
    }

    .rep-delete-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        font-size: 16px;
        color: var(--el-color-danger);
        background-color: transparent;
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 10;

        &:hover {
            opacity: 1;
            background-color: var(--el-color-danger-light-8);
            color: var(--el-color-danger-dark-2);
        }
    }

    .rep-card-content {
        display: flex;
        gap: 20px;
        align-items: stretch;
        margin-top: 12px;
    }

    .rep-panel-header {
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px dashed var(--el-border-color-lighter);

        .rep-panel-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--el-text-color-regular);
            display: inline-flex;
            align-items: center;
            gap: 6px;

            &::before {
                content: '';
                display: block;
                width: 3px;
                height: 12px;
                background-color: var(--el-color-primary);
                border-radius: 2px;
            }
        }
    }

    .rep-info-panel {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        background-color: var(--el-fill-color-light);
        border: 1px solid transparent;

        .rep-name-input :deep(.el-input__wrapper) {
            box-shadow: none;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 8px;
            background-color: var(--el-bg-color);
            height: 40px;
            transition: all 0.2s;

            &.is-focus,
            &:hover {
                border-color: var(--el-color-primary);
            }

            &.is-focus {
                box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
            }

            .el-input__inner {
                font-weight: 600;
                color: var(--el-text-color-primary);
            }
        }

        .rep-desc-input :deep(.el-textarea__inner) {
            box-shadow: none;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 8px;
            background-color: var(--el-bg-color);
            transition: all 0.2s;
            padding: 10px 14px;
            line-height: 1.6;
            min-height: 98px !important;

            &:hover,
            &:focus {
                border-color: var(--el-color-primary);
            }

            &:focus {
                box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
            }
        }
    }

    .rep-avatar-panel {
        width: 160px;
        flex-shrink: 0;
        padding: 16px;
        border-radius: 12px;
        background-color: var(--el-fill-color-light);
        border: 1px solid transparent;
        display: flex;
        flex-direction: column;

        .rep-avatar-uploader {
            width: 100%;
            flex: 1;
            display: flex;
            align-items: stretch;

            :deep(.glass-uploader) {
                width: 100%;
            }

            :deep(.el-upload) {
                width: 100%;
            }

            :deep(.glass-upload-container) {
                padding: 0;
                background: transparent;
                border: none;
                box-shadow: none;
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
            }

            :deep(.upload-wrapper) {
                width: 100%;
                flex: 1;
                display: flex;
                align-items: stretch;
            }

            :deep(.el-upload-list__item-container) {
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
            }

            :deep(.el-upload--picture-card) {
                width: 100% !important;
                height: 100% !important;
                min-height: 120px;
                border-radius: 8px;
                margin: 0 !important;
                background: var(--el-bg-color);
                border: 1px dashed var(--el-border-color);
                transition: all 0.3s;

                &:hover {
                    border-color: var(--el-color-primary);
                    background: var(--el-color-primary-light-9);
                }
            }

            :deep(.el-upload-list__item) {
                width: 100% !important;
                height: 100% !important;
                min-height: 120px;
                border-radius: 8px;
                margin: 0 !important;
                border: 1px solid var(--el-border-color-lighter);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }

            :deep(.el-upload-list) {
                display: block;
                margin: 0;
                width: 100%;
                height: 100%;
            }

            :deep(.el-upload-list--picture-card) {
                display: flex;
                width: 100%;
                height: 100%;
                gap: 0;
            }

            :deep(.upload-trigger-content) {
                gap: 8px;

                .icon-box {
                    font-size: 28px;
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
            box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
        }

        .rep-delete-btn {
            &:hover {
                background-color: rgba(var(--el-color-danger-rgb), 0.15);
            }
        }

        .rep-info-panel,
        .rep-avatar-panel {
            background-color: var(--el-fill-color-dark);
            border-color: var(--el-border-color-dark);
        }

        .rep-name-input :deep(.el-input__wrapper),
        .rep-desc-input :deep(.el-textarea__inner) {
            background-color: var(--el-bg-color-overlay);
            border-color: var(--el-border-color-dark);

            &.is-focus,
            &:focus,
            &:hover {
                background-color: var(--el-bg-color);
                border-color: var(--el-color-primary);
            }
        }

        .rep-avatar-uploader {
            :deep(.el-upload--picture-card) {
                background: var(--el-bg-color-overlay);
                border-color: var(--el-border-color-dark);

                &:hover {
                    background: var(--el-color-primary-dark-2);
                    border-color: var(--el-color-primary);
                }
            }
        }
    }

    @media (max-width: 768px) {
        .template-drawer-content {
            padding-right: 0;
        }

        .rep-card-content {
            flex-direction: column-reverse;
            gap: 16px;
        }

        .rep-avatar-panel {
            width: 100%;
            height: 180px;
        }
    }
}
</style>
