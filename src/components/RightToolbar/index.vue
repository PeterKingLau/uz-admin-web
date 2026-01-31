<template>
    <div class="top-right-btn" :style="style">
        <el-tooltip class="item" effect="dark" :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top" v-if="search">
            <el-button circle @click="toggleSearch()">
                <Icon icon="ep:search" />
            </el-button>
        </el-tooltip>

        <el-tooltip class="item" effect="dark" content="刷新" placement="top">
            <el-button circle @click="refresh()">
                <Icon icon="ep:refresh" />
            </el-button>
        </el-tooltip>

        <el-tooltip v-if="columns" class="item" effect="dark" content="显隐列" placement="top">
            <template #default>
                <span class="columns-trigger">
                    <el-button v-if="showColumnsType === 'transfer'" circle @click="showColumn()">
                        <Icon icon="ep:menu" />
                    </el-button>

                    <el-dropdown v-else-if="showColumnsType === 'checkbox'" trigger="click" :hide-on-click="false">
                        <el-button circle>
                            <Icon icon="ep:menu" />
                        </el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item>
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

        <el-dialog :title="title" v-model="open" append-to-body>
            <el-transfer :titles="['显示', '隐藏']" v-model="value" :data="columns" @change="dataChange" />
        </el-dialog>
    </div>
</template>

<script setup>
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

// 显隐数据
const value = ref([])
// 弹出层标题
const title = ref('显示/隐藏')
// 是否显示弹出层
const open = ref(false)

// 样式计算
const style = computed(() => {
    const ret = {}
    if (props.gutter) {
        ret.marginRight = `${props.gutter / 2}px`
    }
    return ret
})

// 计算全选状态
const checkAll = computed({
    get: () => {
        return props.columns.every(item => item.visible)
    },
    set: val => {
        // setter 留空，通过 handleCheckAllChange 处理
    }
})

// 计算半选状态
const isIndeterminate = computed(() => {
    const checkedCount = props.columns.filter(item => item.visible).length
    return checkedCount > 0 && checkedCount < props.columns.length
})

// 切换搜索
function toggleSearch() {
    emits('update:showSearch', !props.showSearch)
}

// 刷新
function refresh() {
    emits('queryTable')
}

// Transfer 数据变化
function dataChange(data) {
    for (let item in props.columns) {
        const key = props.columns[item].key
        props.columns[item].visible = !data.includes(key)
    }
}

// 打开 Transfer 弹窗
function showColumn() {
    open.value = true
}

// Transfer 初始化
if (props.showColumnsType == 'transfer') {
    for (let item in props.columns) {
        if (props.columns[item].visible === false) {
            value.value.push(parseInt(item))
        }
    }
}

// Checkbox 单个改变
function handleCheckedTableChange(item) {
    // 逻辑已通过 v-model 自动处理，此处可扩展其他逻辑
}

// Checkbox 全选/反选改变
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

    // 修复按钮间距
    .el-button + .el-button {
        margin-left: 12px;
    }
}

:deep(.el-transfer__button) {
    border-radius: 50%;
    display: block;
    margin-left: 0px;
}

:deep(.el-transfer__button:first-child) {
    margin-bottom: 10px;
}

:deep(.el-dropdown-menu__item) {
    line-height: 30px;
    padding: 0 16px;
}

.check-line {
    width: 100%;
    height: 1px;
    background-color: var(--el-border-color-light);
    margin: 5px 0;
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
</style>
