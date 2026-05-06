<template>
    <div :class="{ hidden: hidden }" class="pagination-container">
        <el-pagination
            :background="background"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :layout="layout"
            :page-sizes="pageSizes"
            :pager-count="pagerCount"
            :total="total"
            class="modern-pagination"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
    </div>
</template>

<script setup>
defineOptions({ name: 'ComponentsPagination' })
import { computed } from 'vue'
import { scrollTo } from '@/utils/scroll-to'

const props = defineProps({
    total: {
        required: true,
        type: Number
    },
    page: {
        type: Number,
        default: 1
    },
    limit: {
        type: Number,
        default: 20
    },
    pageSizes: {
        type: Array,
        default() {
            return [10, 20, 30, 50]
        }
    },
    pagerCount: {
        type: Number,
        default: document.body.clientWidth < 992 ? 5 : 7
    },
    layout: {
        type: String,
        default: 'total, sizes, prev, pager, next, jumper'
    },
    background: {
        type: Boolean,
        default: true
    },
    autoScroll: {
        type: Boolean,
        default: true
    },
    hidden: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:page', 'update:limit', 'pagination'])

const currentPage = computed({
    get() {
        return props.page
    },
    set(val) {
        emit('update:page', val)
    }
})

const pageSize = computed({
    get() {
        return props.limit
    },
    set(val) {
        emit('update:limit', val)
    }
})

function handleSizeChange(val) {
    if (currentPage.value * val > props.total) {
        currentPage.value = 1
    }
    emit('pagination', { page: currentPage.value, limit: val })
    if (props.autoScroll) {
        scrollTo(0, 800)
    }
}

function handleCurrentChange(val) {
    emit('pagination', { page: val, limit: pageSize.value })
    if (props.autoScroll) {
        scrollTo(0, 800)
    }
}
</script>

<style scoped lang="scss">
.pagination-container {
    background: transparent;
    margin-top: 0;
    padding: 12px 0;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    transition: opacity var(--app-motion-normal);

    &.hidden {
        display: none;
    }

    .modern-pagination {
        --pagination-item-size: 32px;

        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;

        :deep(.el-pagination__total) {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            font-weight: 500;
            margin-right: 4px;
        }

        :deep(.el-pagination__jump) {
            font-size: 13px;
            color: var(--el-text-color-regular);
            font-weight: 500;
            margin-left: 4px;
        }

        :deep(.el-pager) {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin: 0 2px;
        }

        :deep(button),
        :deep(.el-pager li) {
            background-color: transparent !important;
            border-radius: 10px;
            min-width: var(--pagination-item-size);
            height: var(--pagination-item-size);
            line-height: var(--pagination-item-size);
            font-weight: 500;
            color: var(--el-text-color-regular);
            transition:
                background-color var(--app-motion-fast),
                border-color var(--app-motion-fast),
                color var(--app-motion-fast),
                box-shadow var(--app-motion-fast);
            border: 1px solid transparent;
            margin: 0 !important;

            &:hover {
                color: var(--el-color-primary);
                background-color: var(--el-color-primary-light-9) !important;
            }

            &.is-disabled {
                background-color: var(--el-fill-color-blank) !important;
                color: var(--el-text-color-placeholder);
                cursor: not-allowed;
            }
        }

        :deep(.el-pager li.is-active) {
            background-color: var(--el-color-primary) !important;
            color: var(--el-color-white);
            border-color: var(--el-color-primary);
            box-shadow: 0 4px 10px rgba(var(--el-color-primary-rgb), 0.24);
            font-weight: 600;

            &:hover {
                color: var(--el-color-white);
            }
        }

        :deep(.el-pagination__sizes .el-select__wrapper),
        :deep(.el-pagination__editor.el-input .el-input__wrapper) {
            border-radius: 10px;
            box-shadow: 0 0 0 1px var(--el-border-color-light) inset;
            background-color: var(--el-fill-color-blank);
            height: var(--pagination-item-size);
            min-height: var(--pagination-item-size);
            transition: box-shadow var(--app-motion-fast);

            &:hover {
                box-shadow: 0 0 0 1px var(--el-border-color) inset;
            }

            &.is-focus,
            &.is-focused {
                box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
                background-color: var(--el-color-primary-light-9);
            }
        }

        :deep(.el-pagination__editor.el-input) {
            width: 52px;
            margin: 0 6px;
        }

        :deep(.el-select__wrapper) {
            padding: 0 10px 0 12px;
        }

        :deep(.el-select) {
            width: 128px;
        }
    }

    @media (max-width: 768px) {
        justify-content: center;
        padding: 16px 12px;

        .modern-pagination {
            justify-content: center;
            gap: 6px;

            :deep(.el-pagination__sizes) {
                width: 100%;
                display: flex;
                justify-content: center;
                margin-bottom: 8px;
                margin-right: 0;
            }

            :deep(.el-pager) {
                gap: 4px;
                margin: 0;
            }

            :deep(.el-pagination__total),
            :deep(.el-pagination__jump) {
                display: none;
            }
        }
    }
}

:global(html.dark) .pagination-container {
    .modern-pagination {
        :deep(.el-pagination__total),
        :deep(.el-pagination__jump) {
            color: var(--el-text-color-secondary);
        }

        :deep(button),
        :deep(.el-pager li) {
            color: var(--el-text-color-regular);
            background-color: transparent !important;

            &:hover:not(.is-disabled) {
                color: var(--el-color-primary-light-3);
                background-color: color-mix(in srgb, var(--el-color-primary) 16%, transparent) !important;
            }

            &.is-disabled {
                background-color: transparent !important;
                color: color-mix(in srgb, var(--el-text-color-placeholder) 70%, transparent);
            }
        }

        :deep(.el-pager li.is-active) {
            background-color: var(--el-color-primary) !important;
            color: var(--el-color-white);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.24);
            border-color: var(--el-color-primary);
        }

        :deep(.el-pagination__sizes .el-select__wrapper),
        :deep(.el-pagination__editor.el-input .el-input__wrapper) {
            background-color: color-mix(in srgb, var(--el-bg-color-overlay) 86%, var(--el-fill-color-dark));
            box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-border-color-darker) 82%, transparent) inset;

            &:hover {
                background-color: var(--el-fill-color-darker);
                box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-border-color-dark) 88%, transparent) inset;
            }

            &.is-focus,
            &.is-focused {
                background-color: var(--el-bg-color-overlay);
                box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
            }
        }
    }
}
</style>
