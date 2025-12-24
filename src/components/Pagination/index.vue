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
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
    </div>
</template>

<script setup>
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
    // 移动端页码按钮的数量端默认值5
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
    background: var(--el-bg-color-overlay);
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    transition: all 0.3s;

    &.hidden {
        display: none;
    }

    /* 针对移动端的小屏优化 */
    @media (max-width: 768px) {
        justify-content: center;
        padding: 12px;

        :deep(.el-pagination) {
            flex-wrap: wrap;
            justify-content: center;

            .el-pagination__sizes {
                margin-bottom: 8px;
            }
        }
    }
}
</style>
