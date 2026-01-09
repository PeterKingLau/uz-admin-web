<template>
    <div class="app-container content-feed-page">
        <div class="page-header-wrapper">
            <div class="header-content">
                <div class="left-section">
                    <div class="title-block">
                        <span class="main-title">内容列表</span>
                        <span class="sub-info" v-if="totalCount !== null">
                            共 <span class="highlight">{{ totalCount }}</span> 条数据
                        </span>
                    </div>
                </div>

                <div class="right-section">
                    <ContentQueryForm
                        ref="queryFormRef"
                        :query-params="queryParams"
                        :loading="loading"
                        :post-type-options="postTypeOptions"
                        :tag-options="tagOptions"
                        @submit="handleQuery"
                        @reset="resetQuery"
                    />

                    <div class="batch-action-bar" v-if="selectedIds.length > 0">
                        <span class="selected-count">已选 {{ selectedIds.length }} 项</span>
                        <el-button type="danger" link @click="handleBatchDelete" :loading="deleting">
                            <Icon icon="mdi:trash-can-outline" class="mr-1" />
                            批量删除
                        </el-button>
                        <el-button link @click="selectedIds = []">取消选择</el-button>
                    </div>
                </div>
            </div>
        </div>

        <div class="feed-list-container" v-loading="loading && !loadingMore">
            <FeedList
                v-if="postList.length > 0"
                :posts="postList"
                :loading="loading"
                :loading-more="loadingMore"
                :finished="finished"
                :selected-ids="selectedIds"
                @select="handleSelect"
                @load-more="loadMore"
                @delete="handleSingleDelete"
                @edit-tag="handleEditTag"
            />

            <el-empty v-else description="暂无内容" :image-size="100" />
        </div>

        <el-dialog v-model="editTagVisible" title="编辑标签" width="520px" @closed="resetEditTag">
            <el-form label-position="top">
                <el-form-item label="话题标签" required>
                    <el-select
                        v-model="editTagIds"
                        multiple
                        filterable
                        placeholder="请选择话题标签"
                        style="width: 100%"
                        clearable
                        :loading="loadingTags"
                        class="custom-select"
                        tag-type="primary"
                    >
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
            </el-form>
            <template #footer>
                <el-button @click="editTagVisible = false">取消</el-button>
                <el-button type="primary" :loading="updatingTag" @click="submitEditTag">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="ContentList" lang="ts">
import { ref, reactive, onMounted, onActivated, getCurrentInstance } from 'vue'
import ContentQueryForm from './components/ContentQueryForm.vue'
import FeedList from './components/FeedList.vue'
import { deletePost, listPostByApp, updatePostTag } from '@/api/content/post'
import { getInterestAll } from '@/api/content/interest'
import { useEnumOptions } from '@/hooks/useEnumOptions'

const { proxy } = getCurrentInstance() || {}

const queryParams = reactive<{
    postType?: string
    content: string
    tagId?: number | string
    lastId?: number
    lastCreateTime?: string
    limit: number
}>({
    postType: undefined,
    content: '',
    tagId: undefined,
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
const totalCount = ref<number | null>(null)
const tagOptions = ref<any[]>([])
const loadingTags = ref(false)
const editTagVisible = ref(false)
const editTagPost = ref<any | null>(null)
const editTagIds = ref<Array<string | number>>([])
const updatingTag = ref(false)

const postTypeOptions = useEnumOptions('POST_TYPE')

async function loadTags() {
    if (loadingTags.value) return
    loadingTags.value = true
    try {
        const res = await getInterestAll()
        tagOptions.value = (res as any).data || res || []
    } catch (e) {
        console.error('Failed to load tags', e)
    } finally {
        loadingTags.value = false
    }
}

function resolveTagIds(post: any) {
    if (Array.isArray(post?.tags)) {
        return post.tags.map((tag: any) => tag.tagId ?? tag.id).filter((id: any) => id !== undefined && id !== null && id !== '')
    }
    if (Array.isArray(post?.tagIds)) return post.tagIds
    if (typeof post?.tagStr === 'string') {
        return post.tagStr
            .split(',')
            .map((value: string) => value.trim())
            .filter(Boolean)
    }
    return []
}

function handleEditTag(post: any) {
    editTagPost.value = post
    editTagIds.value = resolveTagIds(post)
    if (!tagOptions.value.length) loadTags()
    editTagVisible.value = true
}

function resetEditTag() {
    editTagPost.value = null
    editTagIds.value = []
}

async function submitEditTag() {
    if (updatingTag.value) return
    const postId = editTagPost.value?.id
    if (!postId) {
        proxy?.$modal?.msgError?.('未找到帖子ID')
        return
    }
    if (!editTagIds.value.length) {
        proxy?.$modal?.msgError?.('请至少选择一个话题标签')
        return
    }

    updatingTag.value = true
    try {
        await updatePostTag({
            postId,
            tagStr: editTagIds.value.join(',')
        })
        proxy?.$modal?.msgSuccess?.('标签更新成功')
        editTagVisible.value = false
        handleQuery()
    } catch (e) {
        console.error(e)
        proxy?.$modal?.msgError?.('标签更新失败')
    } finally {
        updatingTag.value = false
    }
}

async function fetchList(isLoadMore = false) {
    if (loading.value || loadingMore.value) return

    if (isLoadMore) loadingMore.value = true
    else loading.value = true

    try {
        const params = {
            postType: queryParams.postType,
            content: queryParams.content?.trim() || undefined,
            tagId: queryParams.tagId || undefined,
            lastId: queryParams.lastId,
            lastCreateTime: queryParams.lastCreateTime,
            limit: queryParams.limit
        }

        const res = await listPostByApp(params)
        const list = (res as any)?.rows || (res as any)?.data || res || []
        const records = Array.isArray(list) ? list : []
        const resTotal = (res as any)?.total ?? (res as any)?.data?.total ?? (res as any)?.count

        if (Number.isFinite(Number(resTotal))) {
            totalCount.value = Number(resTotal)
        } else if (!isLoadMore) {
            totalCount.value = null
        }

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
    totalCount.value = null
    fetchList(false)
}

function resetQuery() {
    queryFormRef.value?.reset()
    queryParams.postType = undefined
    queryParams.content = ''
    queryParams.tagId = undefined
    queryParams.limit = 10
    queryParams.lastId = undefined
    queryParams.lastCreateTime = undefined
    finished.value = false
    selectedIds.value = []
    totalCount.value = null
    fetchList(false)
}

function loadMore() {
    if (finished.value) return
    fetchList(true)
}

function handleSelect(payload: { id: string | number; checked: boolean }) {
    const { id, checked } = payload
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
        if (totalCount.value !== null) {
            totalCount.value = Math.max(0, totalCount.value - ids.length)
        }

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
    loadTags()
    resetQuery()
})

onActivated(() => {
    resetQuery()
})
</script>

<style scoped lang="scss">
.content-feed-page {
    padding: 0;
    background-color: transparent;
}

.page-header-wrapper {
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
    padding: 16px 24px;
    margin-bottom: 20px;

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
    }

    .left-section {
        .title-block {
            display: flex;
            align-items: baseline;
            gap: 12px;

            .main-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            .sub-info {
                font-size: 13px;
                color: var(--el-text-color-secondary);

                .highlight {
                    color: var(--el-color-primary);
                    font-weight: 600;
                    margin: 0 2px;
                }
            }
        }
    }

    .right-section {
        display: flex;
        align-items: center;
        gap: 16px;

        .batch-action-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-left: 16px;
            border-left: 1px solid var(--el-border-color);

            .selected-count {
                font-size: 13px;
                color: var(--el-text-color-secondary);
            }
        }
    }
}

.feed-list-container {
    padding: 0 24px 24px;
    min-height: 200px;
}

@media screen and (max-width: 768px) {
    .page-header-wrapper {
        padding: 12px 16px;

        .header-content {
            flex-direction: column;
            align-items: stretch;
        }

        .right-section {
            flex-direction: column;
            align-items: stretch;

            .batch-action-bar {
                padding-left: 0;
                border-left: none;
                border-top: 1px solid var(--el-border-color-lighter);
                padding-top: 12px;
                justify-content: space-between;
            }
        }
    }

    .feed-list-container {
        padding: 0 12px 12px;
    }
}
</style>
