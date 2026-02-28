<template>
    <el-form :inline="true" :model="queryParams" class="content-query-form" @submit.prevent>
        <el-form-item class="search-input-item">
            <el-input v-model="queryParams.content" placeholder="搜索动态内容..." clearable @keyup.enter="handleSubmit" style="width: 240px">
                <template #prefix>
                    <Icon icon="mdi:magnify" />
                </template>
            </el-input>
        </el-form-item>

        <el-form-item>
            <el-select v-model="queryParams.postType" placeholder="内容类型" clearable style="width: 120px" @change="handleSubmit">
                <el-option v-for="item in postTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
        </el-form-item>

        <el-form-item>
            <el-select
                v-model="queryParams.tagId"
                placeholder="话题标签"
                clearable
                filterable
                style="width: 160px"
                class="color-tag-select"
                popper-class="content-tag-select-popper"
                @change="handleSubmit"
            >
                <template #prefix>
                    <Icon icon="mdi:pound" />
                </template>
                <template v-for="group in tagOptions" :key="group.id">
                    <el-option-group v-if="group.children && group.children.length" :label="group.name">
                        <el-option v-for="tag in group.children" :key="tag.id" :label="tag.name" :value="tag.id">
                            <span class="option-tag-pill" :style="resolveOptionTagStyle(tag, 'query')">
                                <span class="option-tag-text">{{ tag.name }}</span>
                            </span>
                        </el-option>
                    </el-option-group>
                </template>
            </el-select>
        </el-form-item>

        <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="loading">
                <template #icon>
                    <Icon v-if="!loading" icon="mdi:magnify" />
                </template>
                搜索
            </el-button>
            <el-button @click="$emit('reset')">
                <Icon icon="mdi:refresh" class="mr-1" />
                重置
            </el-button>
            <el-button :type="batchMode ? 'primary' : 'info'" @click="$emit('toggle-batch')">
                <Icon icon="mdi:checkbox-multiple-marked-outline" class="mr-1" />
                {{ batchMode ? '退出批量' : '批量管理' }}
            </el-button>
        </el-form-item>
    </el-form>
</template>

<script setup lang="ts">
import { resolveOptionTagStyle } from '@/utils/content/tagOptionStyle'

defineProps<{
    queryParams: any
    loading: boolean
    postTypeOptions: any[]
    tagOptions: any[]
    batchMode?: boolean
}>()

const emit = defineEmits(['submit', 'reset', 'toggle-batch'])

function handleSubmit() {
    emit('submit')
}

function reset() {}

defineExpose({ reset })
</script>

<style scoped lang="scss">
.content-query-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    :deep(.el-form-item) {
        margin-bottom: 0;
        margin-right: 0;
    }

    :deep(.color-tag-select .el-select__wrapper) {
        border-radius: 10px;
    }

    :deep(.color-tag-select .el-tag) {
        border-radius: 6px;
    }

    :deep(.content-tag-select-popper .el-select-dropdown__item) {
        min-height: 38px;
        display: flex;
        align-items: center;
    }

    :deep(.content-tag-select-popper .el-select-dropdown__item .option-tag-pill) {
        display: inline-flex;
        align-items: center;
        padding: 5px 12px;
        border: 1px solid var(--tag-pill-border, var(--el-border-color));
        border-radius: 10px;
        background: var(--tag-pill-bg, var(--el-fill-color-light));
        color: var(--tag-pill-text, var(--el-text-color-regular));
        box-shadow: var(--tag-pill-shadow, none);
        transition: all 0.2s ease;
    }

    :deep(.content-tag-select-popper .el-select-dropdown__item .option-tag-text) {
        line-height: 1.2;
        font-weight: 500;
    }

    :deep(.content-tag-select-popper .el-select-dropdown__item:hover .option-tag-pill),
    :deep(.content-tag-select-popper .el-select-dropdown__item.hovering .option-tag-pill) {
        border-color: var(--tag-pill-border-hover, var(--tag-pill-border, var(--el-color-primary-light-5)));
        background: var(--tag-pill-bg-hover, var(--tag-pill-bg, var(--el-fill-color-light)));
        transform: translateY(-1px);
    }

    :deep(.content-tag-select-popper .el-select-dropdown__item.is-selected .option-tag-pill) {
        border-color: var(--tag-pill-border-selected, var(--el-color-primary));
        background: var(--tag-pill-bg-selected, var(--el-color-primary-light-9));
        color: var(--tag-pill-text-selected, var(--tag-pill-text, var(--el-color-primary)));
    }

    @media screen and (max-width: 768px) {
        .search-input-item {
            width: 100%;

            :deep(.el-input) {
                width: 100% !important;
            }
        }
    }
}
</style>
