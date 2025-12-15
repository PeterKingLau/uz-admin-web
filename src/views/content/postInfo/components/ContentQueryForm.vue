<template>
    <el-form ref="formRef" :model="queryParams" :inline="true" label-width="72px" class="toolbar-form">
        <el-form-item label="帖子类型" prop="postType">
            <el-select v-model="queryParams.postType" placeholder="全部" clearable style="width: 180px">
                <el-option v-for="opt in postTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
        </el-form-item>
        <el-form-item label="搜索内容" prop="content">
            <el-input v-model="queryParams.content" placeholder="按内容模糊搜索" clearable style="width: 260px" @keyup.enter="$emit('submit')" />
        </el-form-item>
        <el-form-item label="条数" prop="limit">
            <el-input-number v-model="queryParams.limit" :min="1" :max="30" :step="5" style="width: 130px" />
        </el-form-item>
        <el-form-item class="toolbar-actions">
            <el-button type="primary" :loading="loading" @click="$emit('submit')">
                <el-icon><Icon icon="ep:search" /></el-icon> 搜索
            </el-button>
            <el-button @click="$emit('reset')">
                <el-icon><Icon icon="ep:refresh" /></el-icon> 重置
            </el-button>
        </el-form-item>
    </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'

const formRef = ref<FormInstance | null>(null)

defineProps<{
    queryParams: { postType?: string; content: string; limit: number }
    loading: boolean
    postTypeOptions: { label: string; value: string | number }[]
}>()
defineEmits<{
    (e: 'submit'): void
    (e: 'reset'): void
}>()

const reset = () => {
    formRef.value?.resetFields?.()
}

defineExpose({ reset })
</script>

<style scoped lang="scss">
.toolbar-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 6px 14px;

    :deep(.el-form-item) {
        margin-bottom: 6px;
    }

    .toolbar-actions {
        margin-left: auto;
    }
}
</style>
