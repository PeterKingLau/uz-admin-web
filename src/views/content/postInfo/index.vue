<template>
    <div class="app-container content-feed-page">
        <ContentQueryForm
            v-show="showSearch"
            ref="queryFormRef"
            :query-params="queryParams"
            :loading="loading"
            :post-type-options="postTypeOptions"
            @submit="handleQuery"
            @reset="resetQuery"
        />

        <el-card shadow="never" class="feed-card">
            <template #header>
                <div class="feed-header">
                    <div class="feed-header__left">
                        <div class="feed-title">内容列表</div>
                        <div class="feed-sub">
                            当前展示 <b>{{ postList.length }}</b> 条
                        </div>
                    </div>

                    <div class="feed-header__right">
                        <RightToolbar v-model:showSearch="showSearch" @queryTable="handleQuery" />
                        <div class="selection-info" v-if="selectedIds.length">已选 {{ selectedIds.length }} 条</div>
                        <el-button type="danger" size="small" plain :disabled="!selectedIds.length" :loading="deleting" @click="handleBatchDelete">
                            删除选中
                        </el-button>
                        <el-tag v-if="finished && postList.length" size="small" type="info" effect="plain">已加载全部</el-tag>
                    </div>
                </div>
            </template>

            <FeedList
                :posts="postList"
                :loading="loading"
                :loading-more="loadingMore"
                :finished="finished"
                :selected-ids="selectedIds"
                @select="handleSelect"
                @load-more="loadMore"
            />
        </el-card>
    </div>
</template>

<script setup name="ContentList" lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import ContentQueryForm from './components/ContentQueryForm.vue'
import FeedList from './components/FeedList.vue'
import { deletePost, listPostByApp } from '@/api/content/post'
import RightToolbar from '@/components/RightToolbar/index.vue'
import { useEnumOptions } from '@/hooks/useEnumOptions'

const queryParams = reactive<{
    postType?: string
    content: string
    lastId?: number
    lastCreateTime?: string
    limit: number
}>({
    postType: undefined,
    content: '',
    lastId: undefined,
    lastCreateTime: undefined,
    limit: 10
})

const queryFormRef = ref<InstanceType<typeof ContentQueryForm> | null>(null)
const postList = ref<any[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const deleting = ref(false)
const selectedIds = ref<Array<number | string>>([])
const showSearch = ref(true)

const postTypeOptions = useEnumOptions('POST_TYPE')

async function fetchList(isLoadMore = false) {
    if (loading.value || loadingMore.value) return

    if (isLoadMore) loadingMore.value = true
    else loading.value = true

    try {
        const params = {
            postType: queryParams.postType,
            content: queryParams.content?.trim() || undefined,
            lastId: queryParams.lastId,
            lastCreateTime: queryParams.lastCreateTime,
            limit: queryParams.limit
        }

        const res = await listPostByApp(params)
        const list = (res as any)?.rows || (res as any)?.data || res || []
        const records = Array.isArray(list) ? list : []

        if (!isLoadMore) postList.value = records
        else postList.value = postList.value.concat(records)

        if (records.length > 0) {
            const last = records[records.length - 1]
            queryParams.lastId = last.id
            queryParams.lastCreateTime = last.createTime
        }

        finished.value = records.length < queryParams.limit
    } catch (e) {
        console.error(e)
        ElMessage.error('获取内容列表失败')
    } finally {
        loading.value = false
        loadingMore.value = false
    }
}

function handleQuery() {
    finished.value = false
    queryParams.lastId = undefined
    queryParams.lastCreateTime = undefined
    selectedIds.value = []
    fetchList(false)
}

function resetQuery() {
    queryFormRef.value?.reset()
    queryParams.postType = undefined
    queryParams.content = ''
    queryParams.limit = 10
    queryParams.lastId = undefined
    queryParams.lastCreateTime = undefined
    finished.value = false
    selectedIds.value = []

    fetchList(false)
}

function loadMore() {
    if (finished.value) return
    fetchList(true)
}

function handleSelect(payload: { id: string | number; checked: boolean }) {
    const id = payload.id
    const checked = payload.checked
    if (checked) {
        if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
    } else {
        selectedIds.value = selectedIds.value.filter(v => v !== id)
    }
}

async function handleBatchDelete() {
    if (!selectedIds.value.length || deleting.value) return
    const ids = selectedIds.value
    try {
        await ElMessageBox.confirm(`确认删除选中的 ${ids.length} 条帖子？`, '提示', { type: 'warning' })
    } catch {
        return
    }

    deleting.value = true
    try {
        await deletePost({ postIds: ids })
        ElMessage.success('删除成功')
        postList.value = postList.value.filter(item => !ids.includes(item.id))
        selectedIds.value = []
        finished.value = postList.value.length < queryParams.limit
    } catch (e) {
        console.error(e)
        ElMessage.error('删除失败')
    } finally {
        deleting.value = false
    }
}

onMounted(() => {
    resetQuery()
})
</script>

<style scoped lang="scss">
.content-feed-page {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.toolbar-row {
    align-items: center;
}
.selection-meta {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.feed-card {
    :deep(.el-card__body) {
        padding: 10px 12px 12px;
    }
}
.feed-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .feed-title {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.5px;
    }

    .feed-sub {
        margin-top: 2px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        b {
            color: var(--el-color-primary);
            font-weight: 700;
        }
    }

    .feed-header__right {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .selection-info {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }
}
</style>
