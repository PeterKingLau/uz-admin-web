<template>
    <div class="top-right-btn" :style="style">
        <el-tooltip effect="dark" :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top" v-if="search">
            <el-button circle @click="toggleSearch()">
                <Icon icon="ep:search" class="action-icon" />
            </el-button>
        </el-tooltip>

        <el-tooltip effect="dark" content="刷新" placement="top">
            <el-button circle @click="refresh()">
                <Icon icon="ep:refresh" class="action-icon" />
            </el-button>
        </el-tooltip>

        <el-tooltip v-if="columns" effect="dark" content="显隐列" placement="top">
            <template #default>
                <span class="columns-trigger">
                    <el-button v-if="showColumnsType === 'transfer'" circle @click="showColumn()">
                        <Icon icon="ep:menu" class="action-icon" />
                    </el-button>

                    <el-dropdown v-else-if="showColumnsType === 'checkbox'" trigger="click" :hide-on-click="false" popper-class="columns-dropdown">
                        <el-button circle>
                            <Icon icon="ep:menu" class="action-icon" />
                        </el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item class="check-all-item">
                                    <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">列展示</el-checkbox>
                                </el-dropdown-item>
                                <div class="check-line"></div>
                                <template v-for="item in columns" :key="item.key">
                                    <el-dropdown-item>
                                        <el-checkbox v-model="item.visible" :label="item.label" @change="handleCheckedTableChange(item)" />
                                    </el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>

                    <span v-else class="columns-trigger-empty"></span>
                </span>
            </template>
        </el-tooltip>

        <el-dialog :title="title" v-model="open" append-to-body class="modern-transfer-dialog">
            <el-transfer :titles="['显示', '隐藏']" v-model="value" :data="columns" @change="dataChange" />
        </el-dialog>
    </div>
</template>

<script setup name="ComponentsRightToolbar">
import { computed, ref } from 'vue'

const props = defineProps({
    showSearch: {
        type: Boolean,
        default: true
    },
    columns: {
        type: Array
    },
    search: {
        type: Boolean,
        default: true
    },
    showColumnsType: {
        type: String,
        default: 'checkbox'
    },
    gutter: {
        type: Number,
        default: 10
    }
})

const emits = defineEmits(['update:showSearch', 'queryTable'])

const value = ref([])
const title = ref('显示/隐藏')
const open = ref(false)

const style = computed(() => {
    const ret = {}
    if (props.gutter) {
        ret.marginRight = `${props.gutter / 2}px`
    }
    return ret
})

const checkAll = computed({
    get: () => {
        return props.columns.every(item => item.visible)
    },
    set: val => {}
})

const isIndeterminate = computed(() => {
    const checkedCount = props.columns.filter(item => item.visible).length
    return checkedCount > 0 && checkedCount < props.columns.length
})

function toggleSearch() {
    emits('update:showSearch', !props.showSearch)
}

function refresh() {
    emits('queryTable')
}

function dataChange(data) {
    for (let item in props.columns) {
        const key = props.columns[item].key
        props.columns[item].visible = !data.includes(key)
    }
}

function showColumn() {
    open.value = true
}

if (props.showColumnsType == 'transfer') {
    for (let item in props.columns) {
        if (props.columns[item].visible === false) {
            value.value.push(parseInt(item))
        }
    }
}

function handleCheckedTableChange(item) {}

function handleCheckAllChange(val) {
    props.columns.forEach(item => {
        item.visible = val
    })
}
</script>

<style lang="scss" scoped>
.top-right-btn {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 10px;
    margin-left: auto;
    flex-shrink: 0;

    :deep(.el-button.is-circle) {
        width: 36px;
        height: 36px;
        padding: 0;
        margin: 0;
        border: 1px solid var(--el-border-color-lighter);
        background-color: var(--el-bg-color);
        color: var(--el-text-color-regular);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex;
        align-items: center;
        justify-content: center;

        &:hover {
            color: var(--el-color-primary);
            border-color: var(--el-color-primary-light-5);
            background-color: var(--el-color-primary-light-9);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
        }

        &:active {
            transform: translateY(0);
            box-shadow: none;
        }

        .action-icon {
            font-size: 16px;
        }
    }
}

.columns-trigger {
    display: inline-flex;
    align-items: center;
}

.columns-trigger-empty {
    display: inline-block;
    width: 1px;
    height: 1px;
}

:deep(.el-transfer__button) {
    border-radius: 50%;
    display: block;
    margin-left: 0;
}

:deep(.el-transfer__button:first-child) {
    margin-bottom: 10px;
}

.modern-transfer-dialog {
    :deep(.el-dialog__body) {
        display: flex;
        justify-content: center;
    }
}
</style>

<style lang="scss">
.columns-dropdown {
    border-radius: 12px !important;
    padding: 6px 0 !important;
    border: 1px solid var(--el-border-color-lighter) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;

    .el-dropdown-menu__item {
        padding: 6px 16px;
        line-height: normal;
        background: transparent !important;

        &:hover {
            background-color: var(--el-fill-color-light) !important;
        }

        .el-checkbox {
            margin-right: 0;
            width: 100%;
            height: auto;
            display: flex;
            align-items: center;
        }

        .el-checkbox__label {
            font-size: 13px;
            color: var(--el-text-color-regular);
        }
    }

    .check-all-item {
        padding-top: 8px;
        padding-bottom: 8px;

        .el-checkbox__label {
            font-weight: 600;
            color: var(--el-text-color-primary);
        }
    }

    .check-line {
        width: calc(100% - 24px);
        height: 1px;
        background-color: var(--el-border-color-lighter);
        margin: 6px auto;
    }
}
</style>
