<template>
    <div class="app-container content-feed-page">
        <div class="page-header">
            <div class="header-left">
                <span class="page-title">内容管理</span>
                <span class="page-subtitle" v-if="postList.length">
                    共 <span class="count">{{ postList.length }}</span> 条动态
                </span>
            </div>

            <div class="header-right">
                <div class="search-container">
                    <ContentQueryForm
                        ref="queryFormRef"
                        :query-params="queryParams"
                        :loading="loading"
                        :post-type-options="postTypeOptions"
                        @submit="handleQuery"
                        @reset="resetQuery"
                    />
                </div>

                <transition name="el-fade-in-linear">
                    <div class="action-wrapper" v-if="selectedIds.length">
                        <el-divider direction="vertical" class="header-divider" />

                        <div class="batch-actions">
                            <span class="selection-text">已选 {{ selectedIds.length }}</span>
                            <el-divider direction="vertical" class="action-divider" />
                            <el-button type="danger" link @click="handleBatchDelete" :loading="deleting">
                                <Icon icon="mdi:trash-can-outline" style="margin-right: 4px" /> 删除
                            </el-button>
                            <el-button link type="info" @click="selectedIds = []">取消</el-button>
                        </div>
                    </div>
                </transition>
            </div>
        </div>

        <div class="feed-wrapper">
            <FeedList
                :posts="postList"
                :loading="loading"
                :loading-more="loadingMore"
                :finished="finished"
                :selected-ids="selectedIds"
                @select="handleSelect"
                @load-more="loadMore"
                @delete="handleSingleDelete"
            />

            <div v-if="!loading && !postList.length" class="empty-wrapper">
                <el-empty description="暂无内容" :image-size="120" />
            </div>
        </div>
    </div>
</template>

<script setup name="ContentList" lang="ts">
import { ref, reactive, onMounted, onActivated, getCurrentInstance } from 'vue'
import ContentQueryForm from './components/ContentQueryForm.vue'
import FeedList from './components/FeedList.vue'
import { deletePost, listPostByApp } from '@/api/content/post'
import { useEnumOptions } from '@/hooks/useEnumOptions'
import { Icon } from '@iconify/vue'

const { proxy } = getCurrentInstance() || {}

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
        proxy?.$modal?.msgError?.('获取内容列表失败')
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
    handleDeleteConfirm(selectedIds.value)
}

async function handleSingleDelete(id: string | number) {
    if (!id) return
    handleDeleteConfirm([id])
}

async function handleDeleteConfirm(ids: Array<string | number>) {
    const isBatch = ids.length > 1
    try {
        await proxy?.$modal?.confirm(isBatch ? `确认删除选中的 ${ids.length} 条帖子？` : '确认删除该条内容吗？删除后不可恢复。')
    } catch {
        return
    }

    deleting.value = true
    try {
        await deletePost({ postIds: ids })
        proxy?.$modal?.msgSuccess?.('删除成功')

        postList.value = postList.value.filter(item => !ids.includes(item.id))
        selectedIds.value = selectedIds.value.filter(id => !ids.includes(id))

        if (postList.value.length < 5 && !finished.value) {
            loadMore()
        }
    } catch (e) {
        console.error(e)
        proxy?.$modal?.msgError?.('删除失败')
    } finally {
        deleting.value = false
    }
}

onMounted(() => {
    resetQuery()
})

onActivated(() => {
    resetQuery()
})
</script>

<style scoped lang="scss">
.content-feed-page {
    padding: 20px;
    background-color: var(--el-bg-color-page);
    min-height: calc(100vh - 84px);
    display: flex;
    flex-direction: column;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--el-bg-color-overlay);
    padding: 12px 20px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-light);
    position: sticky;
    top: 0;
    z-index: 10;
    margin-bottom: 16px;
    box-shadow: var(--el-box-shadow-light);

    backdrop-filter: saturate(180%) blur(20px);
    background-color: rgba(var(--el-bg-color-overlay-rgb, 255, 255, 255), 0.9);

    .header-left {
        display: flex;
        align-items: baseline;
        gap: 12px;

        .page-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

        .page-subtitle {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            .count {
                color: var(--el-color-primary);
                font-weight: 600;
                margin: 0 2px;
            }
        }
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 16px;

        .search-container {
            display: flex;
            align-items: center;

            :deep(.el-form-item) {
                margin-bottom: 0;
                margin-right: 12px;
                &:last-child {
                    margin-right: 0;
                }
            }
        }

        .action-wrapper {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header-divider {
            height: 18px;
            border-color: var(--el-border-color);
            margin: 0;
        }

        .batch-actions {
            height: 32px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--el-color-danger-light-9);
            border: 1px solid var(--el-color-danger-light-8);
            border-radius: 4px;
            padding: 0 12px;
            box-sizing: border-box;

            .selection-text {
                font-size: 13px;
                color: var(--el-color-danger);
                font-weight: 500;
                line-height: 1;
            }

            .action-divider {
                border-color: var(--el-color-danger-light-5);
                margin: 0 4px;
                height: 14px;
            }

            :deep(.el-button) {
                padding: 0;
                height: auto;
                min-height: auto;
                line-height: 1;

                span {
                    display: flex;
                    align-items: center;
                }
            }
        }
    }
}

.feed-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
}

.empty-wrapper {
    padding: 60px 0;
    display: flex;
    justify-content: center;
    background-color: var(--el-bg-color-overlay);
    border-radius: 8px;
    border: 1px dashed var(--el-border-color-lighter);
}

html.dark {
    .page-header {
        background-color: rgba(29, 30, 31, 0.85);
        box-shadow: none;
    }
    .batch-actions {
        background-color: rgba(245, 108, 108, 0.2);
        border-color: rgba(245, 108, 108, 0.3);
    }
}

@media screen and (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        position: static;

        .header-right {
            flex-direction: column;
            align-items: stretch;

            .search-container {
                width: 100%;
                overflow-x: auto;
                padding-bottom: 4px;
                :deep(.el-form--inline) {
                    display: flex;
                    flex-wrap: nowrap;
                }
            }

            .action-wrapper {
                justify-content: space-between;
                width: 100%;
            }

            .header-divider {
                display: none;
            }
        }
    }
}
</style>
