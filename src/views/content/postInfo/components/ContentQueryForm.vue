<template>
    <el-form :model="queryParams" class="content-query-form" @submit.prevent>
        <div class="form-top-row">
            <div class="search-center-group">
                <el-form-item class="search-input-item">
                    <el-input v-model="queryParams.content" placeholder="搜索动态内容..." clearable @keyup.enter="handleSubmitNow" class="custom-input">
                        <template #prefix>
                            <Icon icon="mdi:magnify" class="input-icon" />
                        </template>
                    </el-input>
                </el-form-item>

                <el-form-item class="type-select-item">
                    <el-select v-model="queryParams.postType" placeholder="内容类型" clearable class="custom-select" @change="handleFilterChange">
                        <el-option v-for="item in postTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
            </div>

            <el-form-item class="action-btns-item">
                <el-button type="primary" @click="handleSubmitNow" :loading="loading" class="action-btn">
                    <template #icon>
                        <Icon v-if="!loading" icon="mdi:magnify" />
                    </template>
                    搜索
                </el-button>
                <el-button @click="$emit('reset')" class="action-btn">
                    <Icon icon="mdi:refresh" class="mr-1" />
                    重置
                </el-button>
                <el-button :type="batchMode ? 'primary' : 'default'" :plain="!batchMode" @click="$emit('toggle-batch')" class="action-btn batch-btn">
                    <Icon icon="mdi:checkbox-multiple-marked-outline" class="mr-1" />
                    {{ batchMode ? '退出批量' : '批量管理' }}
                </el-button>
            </el-form-item>
        </div>

        <div class="form-bottom-row">
            <el-form-item class="tag-tabs-item">
                <div class="query-tag-tabs" role="tablist" aria-label="一级话题标签">
                    <el-button class="query-tag-button" text :class="{ 'is-active': activePrimaryId === '' }" @click="handlePrimaryTagChange('')"
                        >全部</el-button
                    >
                    <el-button
                        v-for="tag in topLevelTagOptions"
                        :key="tag.id"
                        class="query-tag-button"
                        text
                        :class="{ 'is-active': activePrimaryId === String(tag.id) }"
                        @click="handlePrimaryTagChange(String(tag.id))"
                    >
                        {{ tag.name }}
                    </el-button>
                </div>

                <div v-if="secondaryTagOptions.length" class="query-subtag-tabs" role="tablist" aria-label="二级话题标签">
                    <el-button class="query-subtag-button is-all" :class="{ 'is-active': activeTagId === '' }" @click="handleSecondaryTagChange('')">
                        全部
                    </el-button>
                    <el-button
                        v-for="tag in secondaryTagOptions"
                        :key="tag.id"
                        class="query-subtag-button"
                        :class="{ 'is-active': activeTagId === String(tag.id) }"
                        :style="resolveOptionTagStyle(tag, 'query')"
                        @click="handleSecondaryTagChange(String(tag.id))"
                    >
                        {{ tag.name }}
                    </el-button>
                </div>
            </el-form-item>
        </div>
    </el-form>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsContentPostInfoComponentsContentQueryForm' })
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { resolveOptionTagStyle } from '@/utils/content/tagOptionStyle'

const props = defineProps<{
    queryParams: any
    loading: boolean
    postTypeOptions: any[]
    tagOptions: any[]
    batchMode?: boolean
}>()

const emit = defineEmits(['submit', 'reset', 'toggle-batch'])
const CONTENT_SEARCH_DEBOUNCE_MS = 420
const SUBMIT_THROTTLE_MS = 280
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let trailingSubmitTimer: ReturnType<typeof setTimeout> | null = null
let lastSubmitAt = 0

const topLevelTagOptions = computed(() => (props.tagOptions || []).filter((item: any) => item?.id !== undefined && item?.id !== null && item?.name))

const activeTagId = computed(() => {
    const value = props.queryParams?.tagId
    return value === undefined || value === null || value === '' ? '' : String(value)
})

const activePrimaryId = ref('')

const activePrimaryTag = computed(() => topLevelTagOptions.value.find((item: any) => String(item.id) === activePrimaryId.value) || null)

const secondaryTagOptions = computed(() =>
    (activePrimaryTag.value?.children || []).filter((item: any) => item?.id !== undefined && item?.id !== null && item?.name)
)

watch(
    [topLevelTagOptions, activeTagId],
    ([groups, tagId]) => {
        if (!tagId) {
            const hasActivePrimary = groups.some((item: any) => String(item.id) === activePrimaryId.value)
            if (!hasActivePrimary) activePrimaryId.value = ''
            return
        }

        const parent = groups.find((group: any) => (group?.children || []).some((child: any) => String(child?.id) === tagId))
        if (parent) {
            activePrimaryId.value = String(parent.id)
            return
        }

        activePrimaryId.value = ''
    },
    { immediate: true }
)

watch(
    () => props.queryParams?.content,
    (nextValue, prevValue) => {
        if (nextValue === prevValue) return
        scheduleDebouncedSubmit()
    }
)

function clearSubmitTimers() {
    if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
    }
    if (trailingSubmitTimer) {
        clearTimeout(trailingSubmitTimer)
        trailingSubmitTimer = null
    }
}

function emitSubmit() {
    clearSubmitTimers()
    lastSubmitAt = Date.now()
    emit('submit')
}

function requestSubmit(immediate = false) {
    const now = Date.now()
    const elapsed = now - lastSubmitAt

    if (immediate || elapsed >= SUBMIT_THROTTLE_MS) {
        emitSubmit()
        return
    }

    if (trailingSubmitTimer) clearTimeout(trailingSubmitTimer)
    trailingSubmitTimer = setTimeout(() => {
        trailingSubmitTimer = null
        emitSubmit()
    }, SUBMIT_THROTTLE_MS - elapsed)
}

function scheduleDebouncedSubmit() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        debounceTimer = null
        requestSubmit()
    }, CONTENT_SEARCH_DEBOUNCE_MS)
}

function handleSubmitNow() {
    requestSubmit(true)
}

function handleFilterChange() {
    requestSubmit(true)
}

function handlePrimaryTagChange(tagId?: string | number) {
    const nextPrimaryId = tagId === undefined || tagId === null || tagId === '' ? '' : String(tagId)
    const nextPrimaryTag = topLevelTagOptions.value.find((item: any) => String(item.id) === nextPrimaryId)
    const firstSecondaryTag = nextPrimaryTag?.children?.find((item: any) => item?.id !== undefined && item?.id !== null && item?.name)
    const nextTagId = nextPrimaryId ? firstSecondaryTag?.id : undefined
    const nextTagKey = nextTagId === undefined || nextTagId === null || nextTagId === '' ? '' : String(nextTagId)

    if (activePrimaryId.value === nextPrimaryId && activeTagId.value === nextTagKey) return

    activePrimaryId.value = nextPrimaryId
    props.queryParams.tagId = nextTagId
    handleFilterChange()
}

function handleSecondaryTagChange(tagId?: string | number) {
    const nextTagId = tagId === undefined || tagId === null || tagId === '' ? undefined : tagId
    const nextTagKey = nextTagId === undefined ? '' : String(nextTagId)
    if (activeTagId.value === nextTagKey) return
    props.queryParams.tagId = nextTagId
    handleFilterChange()
}

function reset() {
    clearSubmitTimers()
    activePrimaryId.value = ''
}

onBeforeUnmount(() => {
    clearSubmitTimers()
})

defineExpose({ reset })
</script>

<style scoped lang="scss">
.content-query-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;

    :deep(.el-form-item) {
        margin: 0;
    }

    .form-top-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        width: 100%;
    }

    .search-center-group {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
    }

    .search-input-item {
        width: 360px;
        flex-shrink: 0;
    }

    .type-select-item {
        width: 160px;
        flex-shrink: 0;
    }

    .action-btns-item {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        margin-left: auto;
    }

    .custom-input,
    .custom-select {
        width: 100%;

        :deep(.el-input__wrapper),
        :deep(.el-select__wrapper) {
            border-radius: 20px;
            box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
            background-color: var(--el-fill-color-light);
            padding: 0 16px;
            height: 36px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &:hover {
                background-color: var(--el-fill-color);
                box-shadow: 0 0 0 1px var(--el-border-color) inset;
            }

            &.is-focus,
            &.is-focused {
                box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
                background-color: var(--el-bg-color);
            }
        }

        .input-icon {
            font-size: 16px;
            color: var(--el-text-color-placeholder);
            margin-right: 4px;
            transition: color 0.3s;
        }

        :deep(.el-input__wrapper.is-focus) .input-icon {
            color: var(--el-color-primary);
        }
    }

    .action-btn {
        border-radius: 20px;
        padding: 8px 20px;
        height: 36px;
        font-weight: 500;
        transition: all 0.3s;
        border: 1px solid var(--el-border-color-light);

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        &.el-button--primary {
            border-color: transparent;
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);

            &:hover {
                box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
            }
        }

        &.batch-btn {
            margin-left: 12px;
        }
    }

    .form-bottom-row {
        width: 100%;
        overflow: hidden;
    }

    .tag-tabs-item {
        width: 100%;

        :deep(.el-form-item__content) {
            width: 100%;
        }
    }

    .query-tag-tabs {
        display: flex;
        align-items: center;
        gap: 28px;
        width: 100%;
        overflow-x: auto;
        padding: 2px 0 10px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        scrollbar-width: none;
    }

    .query-tag-tabs::-webkit-scrollbar {
        display: none;
    }

    :deep(.query-tag-button.el-button) {
        position: relative;
        flex: 0 0 auto;
        height: auto;
        margin: 0;
        padding: 8px 0 12px;
        border: none;
        border-radius: 0;
        font-size: 15px;
        font-weight: 500;
        color: var(--el-text-color-regular);
        background: transparent !important;
        box-shadow: none;
        transition: color 0.2s ease;
    }

    :deep(.query-tag-button.el-button::after) {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        border-radius: 999px;
        background: var(--el-color-primary);
        opacity: 0;
        transform: scaleX(0.5);
        transition:
            opacity 0.2s ease,
            transform 0.2s ease;
    }

    :deep(.query-tag-button.el-button:hover),
    :deep(.query-tag-button.el-button:focus-visible) {
        color: var(--el-text-color-primary);
    }

    :deep(.query-tag-button.el-button.is-active) {
        color: var(--el-color-primary);
        font-weight: 600;
    }

    :deep(.query-tag-button.el-button.is-active::after) {
        opacity: 1;
        transform: scaleX(1);
    }

    .query-subtag-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding-top: 14px;
    }

    :deep(.query-subtag-button.el-button) {
        position: relative;
        height: 32px;
        margin: 0;
        padding: 0 14px;
        border-width: 1px;
        border-style: solid;
        border-color: var(--tag-pill-border, var(--el-border-color));
        border-radius: 999px;
        background: var(--tag-pill-bg, var(--el-fill-color-light));
        color: var(--tag-pill-text, var(--el-text-color-regular));
        box-shadow: var(--tag-pill-shadow, none);
        font-weight: 500;
        transition: all 0.2s ease;
    }

    :deep(.query-subtag-button.el-button:hover),
    :deep(.query-subtag-button.el-button:focus-visible) {
        border-color: var(--tag-pill-border-hover, var(--tag-pill-border, var(--el-color-primary-light-5)));
        background: var(--tag-pill-bg-hover, var(--tag-pill-bg, var(--el-fill-color-light)));
        color: var(--tag-pill-text, var(--el-text-color-primary));
        transform: translateY(-1px);
    }

    :deep(.query-subtag-button.el-button.is-active) {
        border-color: var(--tag-pill-border-selected, var(--el-color-primary));
        background: var(--tag-pill-bg-selected, var(--el-color-primary-light-9));
        color: var(--tag-pill-text-selected, var(--el-color-primary));
        box-shadow:
            0 0 0 1px var(--tag-pill-border-selected, var(--el-color-primary)),
            0 8px 18px rgba(0, 0, 0, 0.08);
        font-weight: 700;
        transform: translateY(-1px);
    }

    :deep(.query-subtag-button.el-button.is-active::after) {
        content: '';
        position: absolute;
        left: 8px;
        top: 50%;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        transform: translateY(-50%);
        opacity: 0.95;
    }

    :deep(.query-subtag-button.el-button.is-active) {
        padding-left: 20px;
    }

    :deep(.query-subtag-button.el-button.is-all) {
        --tag-pill-bg: var(--el-fill-color-light);
        --tag-pill-border: var(--el-border-color);
        --tag-pill-text: var(--el-text-color-regular);
        --tag-pill-bg-hover: var(--el-fill-color);
        --tag-pill-border-hover: var(--el-border-color);
        --tag-pill-bg-selected: var(--el-color-primary-light-9);
        --tag-pill-border-selected: var(--el-color-primary-light-5);
        --tag-pill-text-selected: var(--el-color-primary);
        --tag-pill-shadow: none;
    }

    @media screen and (max-width: 768px) {
        .form-top-row {
            flex-direction: column;
            align-items: stretch;
        }

        .search-center-group {
            width: 100%;
            justify-content: stretch;
        }

        .search-input-item,
        .type-select-item {
            width: 100%;
        }

        .action-btns-item {
            margin-left: 0;
            justify-content: flex-end;
            margin-top: 4px;
        }

        .query-tag-tabs {
            gap: 20px;
            padding-bottom: 8px;
        }

        :deep(.query-tag-button.el-button) {
            padding-bottom: 10px;
            font-size: 14px;
        }

        .query-subtag-tabs {
            gap: 8px;
            padding-top: 12px;
        }

        :deep(.query-subtag-button.el-button) {
            height: 30px;
            padding: 0 12px;
            font-size: 13px;
        }
    }
}

:global(html.dark) .content-query-form {
    .custom-input,
    .custom-select {
        :deep(.el-input__wrapper),
        :deep(.el-select__wrapper) {
            background-color: var(--el-fill-color-dark);
            box-shadow: 0 0 0 1px var(--el-border-color-dark) inset;

            &:hover {
                background-color: var(--el-fill-color-darker);
            }

            &.is-focus,
            &.is-focused {
                background-color: var(--el-bg-color);
            }
        }
    }

    .query-tag-tabs {
        :deep(.query-tag-button.el-button:hover) {
            color: var(--el-text-color-primary);
        }

        :deep(.query-tag-button.el-button.is-active) {
            color: var(--el-color-primary-light-3);
        }
    }

    .query-subtag-tabs {
        :deep(.query-subtag-button.el-button.is-all) {
            --tag-pill-bg: var(--el-fill-color-dark);
            --tag-pill-border: var(--el-border-color-dark);
            --tag-pill-text: var(--el-text-color-regular);
            --tag-pill-bg-hover: var(--el-fill-color-darker);
            --tag-pill-border-hover: var(--el-border-color);
            --tag-pill-bg-selected: var(--el-color-primary-dark-2);
            --tag-pill-border-selected: var(--el-color-primary);
            --tag-pill-text-selected: var(--el-color-primary-light-3);
        }
    }
}
</style>
