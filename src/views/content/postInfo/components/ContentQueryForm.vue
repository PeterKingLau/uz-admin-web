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
            <el-select v-model="queryParams.tagId" placeholder="话题标签" clearable filterable style="width: 160px" @change="handleSubmit">
                <template #prefix>
                    <Icon icon="mdi:pound" />
                </template>
                <template v-for="group in tagOptions" :key="group.id">
                    <el-option-group v-if="group.children && group.children.length" :label="group.name">
                        <el-option v-for="tag in group.children" :key="tag.id" :label="tag.name" :value="tag.id" />
                    </el-option-group>
                </template>
            </el-select>
        </el-form-item>

        <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="loading"> 搜索 </el-button>
            <el-button @click="$emit('reset')">重置</el-button>
        </el-form-item>
    </el-form>
</template>

<script setup lang="ts">
// 接收 tagOptions
defineProps<{
    queryParams: any
    loading: boolean
    postTypeOptions: any[]
    tagOptions: any[]
}>()

const emit = defineEmits(['submit', 'reset'])

function handleSubmit() {
    emit('submit')
}

// 暴露 reset 方法给父组件调用
function reset() {
    // 逻辑已经在父组件处理，这里主要用于特定内部状态重置(如果需要)
}

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

    /* 让搜索框在移动端占满 */
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
