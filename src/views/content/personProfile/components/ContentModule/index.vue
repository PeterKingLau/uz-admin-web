<template>
    <div class="content-wrapper">
        <div class="tabs-sticky-container">
            <div class="tabs-full">
                <div class="tabs-header">
                    <el-tabs v-model="activeTabValue" class="profile-tabs" @tab-click="onTabClick">
                        <el-tab-pane name="works">
                            <template #label>
                                <div class="tab-item-inner">
                                    <span class="tab-icon"><Icon icon="ep:grid" /></span>
                                    <span class="tab-text">作品</span>
                                    <span class="tab-count" v-if="total > 0">{{ total }}</span>
                                </div>
                            </template>
                        </el-tab-pane>

                        <el-tab-pane name="likes">
                            <template #label>
                                <div class="tab-item-inner">
                                    <span class="tab-icon"><Icon icon="mdi:heart-outline" /></span>
                                    <span class="tab-text">喜欢</span>
                                    <span class="tab-count" v-if="likeCount > 0">{{ likeCount }}</span>
                                </div>
                            </template>
                        </el-tab-pane>

                        <el-tab-pane name="bookmarks">
                            <template #label>
                                <div class="tab-item-inner">
                                    <span class="tab-icon"><Icon icon="mdi:star-outline" /></span>
                                    <span class="tab-text">收藏</span>
                                    <span class="tab-count" v-if="bookmarkCount > 0">{{ bookmarkCount }}</span>
                                </div>
                            </template>
                        </el-tab-pane>
                    </el-tabs>
                    <el-button v-if="!readOnly" class="batch-btn" :class="{ active: bulkMode }" @click="toggleBulkMode">
                        <Icon icon="mdi:playlist-check" /> 批量管理
                    </el-button>
                </div>
            </div>
        </div>

        <div class="content-area">
            <div v-if="activeTabValue === 'works'" class="sub-filter-bar">
                <template v-if="!bulkMode">
                    <div class="filter-group">
                        <div class="filter-chip" :class="{ active: worksFilter === 'all' }" @click="setWorksFilter('all')">全部作品</div>
                        <div v-if="!readOnly" class="filter-chip" :class="{ active: worksFilter === 'collection' }" @click="setWorksFilter('collection')">
                            我的合集
                        </div>
                    </div>

                    <el-button v-if="!readOnly && worksFilter === 'collection'" type="primary" class="create-collection-btn" round plain @click="openCreateDialog">
                        <Icon icon="ep:plus" /> 新建合集
                    </el-button>
                </template>
                <div v-else class="bulk-toolbar">
                    <div class="bulk-left">
                        <el-checkbox v-model="bulkAllChecked" :disabled="bulkTotalCount === 0">全选</el-checkbox>
                        <span class="bulk-count">已选 {{ bulkSelectedCount }} 个{{ bulkLabel }}</span>
                    </div>
                    <div class="bulk-actions">
                        <el-button text class="bulk-action" :disabled="bulkSelectedCount === 0" @click="handleBulkAction">
                            <Icon :icon="bulkActionIcon" /> {{ bulkActionLabel }}
                        </el-button>
                    </div>
                </div>
            </div>
            <div v-else-if="bulkMode" class="sub-filter-bar">
                <div class="bulk-toolbar">
                    <div class="bulk-left">
                        <el-checkbox v-model="bulkAllChecked" :disabled="bulkTotalCount === 0">全选</el-checkbox>
                        <span class="bulk-count">已选 {{ bulkSelectedCount }} 个{{ bulkLabel }}</span>
                    </div>
                    <div class="bulk-actions">
                        <el-button text class="bulk-action" :disabled="bulkSelectedCount === 0" @click="handleBulkAction">
                            <Icon :icon="bulkActionIcon" /> {{ bulkActionLabel }}
                        </el-button>
                    </div>
                </div>
            </div>

            <div v-if="showCollections">
                <div v-if="collectionLoadingLocal" class="status-box">
                    <el-icon class="is-loading"><Loading /></el-icon> 加载中...
                </div>

                <div v-else-if="collectionListLocal.length === 0" class="empty-collection-state">
                    <div class="empty-icon-wrapper">
                        <Icon icon="ep:folder-opened" class="empty-icon" />
                    </div>
                    <div class="empty-text">还没有创建任何合集</div>
                    <el-button type="primary" round class="empty-create-btn" @click="openCreateDialog">立即创建</el-button>
                </div>

                <div v-else class="collection-grid-view">
                    <div
                        v-for="item in collectionListLocal"
                        :key="resolveCollectionKey(item)"
                        class="collection-card-modern"
                        :class="{ 'bulk-selected': bulkMode && isBulkCollectionSelected(item) }"
                        @click="handleCollectionCardClick(item)"
                    >
                        <div v-if="bulkMode && isBulkCollectionSelected(item)" class="bulk-check">
                            <Icon icon="mdi:check" />
                        </div>
                        <div class="card-inner">
                            <div class="cover-visual">
                                <img v-if="resolveCollectionCover(item)" :src="resolveCollectionCover(item)" alt="cover" loading="lazy" />
                                <div v-else class="cover-fallback">
                                    <Icon icon="ep:folder" class="icon" />
                                </div>
                            </div>

                            <div class="meta-info">
                                <div class="title" :title="resolveCollectionName(item)">{{ resolveCollectionName(item) }}</div>
                                <div class="count">{{ Number(item?.postCount ?? item?.count ?? 0) }} 个作品</div>
                            </div>

                            <div class="actions" @click.stop>
                                <el-dropdown trigger="click" placement="bottom-end">
                                    <span class="more-btn">
                                        <Icon icon="mdi:dots-vertical" />
                                    </span>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item @click="openEditDialog(item)"> <Icon icon="mdi:pencil-outline" /> 修改合集 </el-dropdown-item>
                                            <el-dropdown-item @click="openAddPostsDialog(item, 'add')">
                                                <Icon icon="mdi:plus-box-outline" /> 添加作品
                                            </el-dropdown-item>
                                            <el-dropdown-item @click="openAddPostsDialog(item, 'selected')">
                                                <Icon icon="mdi:playlist-edit" /> 作品管理
                                            </el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else>
                <div v-if="loading && worksPostList.length === 0" class="status-box">
                    <el-icon class="is-loading"><Loading /></el-icon> 加载中...
                </div>

                <div v-else-if="!loading && worksPostList.length === 0" class="status-box empty">
                    <el-empty description="暂无内容" :image-size="140" />
                </div>

                <div v-else>
                    <div class="works-grid-view">
                        <div
                            v-for="item in worksPostList"
                            :key="item.id"
                            class="work-card-modern"
                            :class="{ 'bulk-selected': bulkMode && isBulkWorkSelected(item) }"
                            @click="handleWorkCardClick(item)"
                        >
                            <div v-if="bulkMode && isBulkWorkSelected(item)" class="bulk-check">
                                <Icon icon="mdi:check" />
                            </div>
                            <div class="cover-box">
                                <img v-if="item.postType === POST_TYPE.IMAGE" :src="getCover(item)" alt="cover" loading="lazy" />

                                <div v-else-if="item.postType === POST_TYPE.VIDEO" class="video-container">
                                    <video :src="getVideoUrl(item)" muted playsinline preload="metadata"></video>
                                    <div class="play-indicator">
                                        <Icon icon="mdi:play" />
                                    </div>
                                </div>

                                <div v-else class="text-container">
                                    <span>{{ item.content }}</span>
                                </div>

                                <div class="bottom-gradient">
                                    <div class="stat"><Icon icon="mdi:heart-outline" /> {{ item.likeCount || 0 }}</div>
                                </div>

                                <div class="type-tag" v-if="item.postType === POST_TYPE.IMAGE">
                                    <Icon icon="ep:picture" />
                                </div>
                            </div>

                            <div class="title-box">
                                {{ item.content || '分享生活' }}
                            </div>
                        </div>
                    </div>

                    <div ref="loadTriggerRef" class="scroll-trigger"></div>

                    <div v-if="loading && worksPostList.length > 0" class="status-box small">
                        <el-icon class="is-loading"><Loading /></el-icon>
                    </div>
                    <div v-if="noMore && worksPostList.length > 0" class="status-box small text-only">- 到底啦 -</div>
                </div>
            </div>
        </div>

        <el-dialog v-model="createDialogVisible" append-to-body destroy-on-close class="modern-dialog" width="460px" @closed="resetCreateForm">
            <template #header>
                <div class="dialog-header-modern">{{ dialogMode === 'create' ? '创建合集' : '编辑合集' }}</div>
            </template>

            <el-form ref="formRef" :model="createForm" :rules="rules" label-position="top" class="form-body">
                <el-form-item label="封面" prop="coverUrl">
                    <ImageUpload v-model="createForm.coverUrl" :limit="1" :file-type="[]" :file-size="0" :is-show-tip="false" class="avatar-uploader" />
                </el-form-item>

                <el-form-item label="名称" prop="title">
                    <el-input v-model="createForm.title" maxlength="20" show-word-limit placeholder="填写合集名称" class="modern-input" />
                </el-form-item>

                <el-form-item label="简介" prop="desc">
                    <el-input
                        v-model="createForm.desc"
                        type="textarea"
                        :rows="3"
                        maxlength="100"
                        show-word-limit
                        placeholder="选填，介绍一下合集内容"
                        resize="none"
                        class="modern-input"
                    />
                </el-form-item>
            </el-form>

            <template #footer>
                <div class="dialog-footer-modern">
                    <el-button text @click="createDialogVisible = false">取消</el-button>
                    <el-button type="primary" color="var(--el-color-primary)" class="confirm-btn" :loading="saving" @click="saveCreateForm">完成</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog
            v-model="addDialogVisible"
            append-to-body
            destroy-on-close
            class="modern-dialog collection-posts-dialog"
            width="860px"
            :show-close="false"
            @closed="resetAddPostsDialog"
        >
            <template #header>
                <div class="collection-dialog-header">
                    <div class="collection-dialog-title">
                        <span class="name">{{ addDialogTitle }}</span>
                        <span class="count">共{{ addDialogCount }}集</span>
                    </div>
                    <div class="collection-dialog-actions">
                        <el-button class="ghost-btn" @click="addDialogVisible = false">取消</el-button>
                        <el-button class="primary-btn" :loading="addDialogSaving" :disabled="addDialogSaving" @click="handleDialogSubmit">
                            {{ dialogActionLabel }}
                        </el-button>
                    </div>
                </div>
                <div class="collection-dialog-tabs">
                    <el-button text class="tab-btn" :class="{ active: addDialogTab === 'add' }" @click="setAddDialogTab('add')">添加作品</el-button>
                    <el-button text class="tab-btn" :class="{ active: addDialogTab === 'selected' }" @click="setAddDialogTab('selected')">
                        已选作品
                        <span class="tab-count">{{ selectedTabCount }}</span>
                    </el-button>
                </div>
            </template>

            <div class="add-posts-body">
                <div class="add-posts-toolbar">
                    <span>已选 {{ selectedPostIds.length }} 条</span>
                    <div class="toolbar-actions">
                        <el-button v-if="addDialogTab === 'selected'" text :disabled="selectedPostIds.length === 0" @click="removeSelectedPosts"
                            >移除选中</el-button
                        >
                        <el-button text @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</el-button>
                    </div>
                </div>

                <div v-if="addDialogTab === 'selected' && collectionPostsLoading" class="status-box">
                    <el-icon class="is-loading"><Loading /></el-icon> 加载中...
                </div>

                <div v-else-if="displayPosts.length === 0" class="collection-empty-state">
                    <div class="empty-icon">
                        <Icon icon="mdi:folder-outline" />
                    </div>
                    <div class="empty-title">{{ addDialogTab === 'add' ? '暂无内容' : '暂无已选作品' }}</div>
                    <div class="empty-desc">{{ addDialogTab === 'add' ? '暂无可添加作品～' : '请回到添加作品选择' }}</div>
                </div>

                <div v-else class="select-posts-grid" ref="selectedPostsGridRef" :class="{ 'is-draggable': addDialogTab === 'selected' }">
                    <div
                        v-for="(item, index) in displayPosts"
                        :key="resolvePostKey(item)"
                        class="select-post-card"
                        :class="{ selected: isPostSelected(item), 'selected-tab': addDialogTab === 'selected' }"
                        @click="togglePostSelection(item)"
                    >
                        <button v-if="addDialogTab === 'selected'" type="button" class="remove-btn" @click.stop="removeSinglePost(item)">×</button>
                        <div v-if="addDialogTab === 'selected' || isPostSelected(item)" class="select-order">
                            {{ getDisplayOrder(item, index) }}
                        </div>
                        <div class="thumb">
                            <img v-if="item.postType === POST_TYPE.IMAGE" :src="getCover(item)" alt="cover" loading="lazy" />
                            <div v-else-if="item.postType === POST_TYPE.VIDEO" class="thumb-video">
                                <video :src="getVideoUrl(item)" muted playsinline preload="metadata"></video>
                                <div class="thumb-play"><Icon icon="mdi:play" /></div>
                            </div>
                            <div v-else class="thumb-text">{{ item.content || '文字内容' }}</div>
                        </div>
                        <div class="select-check"><Icon icon="mdi:check-circle" /></div>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import { POST_TYPE } from '@/utils/enum'
import { getImgUrl } from '@/utils/img'
import { addCollection, addPostToCollection, deleteCollections, getPostByCollection, listMyCollections, updateCollection } from '@/api/content/collection'

type AnyObj = Record<string, any>
type DialogMode = 'create' | 'edit'

const DEFAULT_SORT_TYPE = 1

const toTrimmed = (value: unknown) => String(value ?? '').trim()
const toNumber = (value: unknown, fallback: number) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
}

const { proxy } = getCurrentInstance() as any

const props = defineProps({
    modelValue: { type: String, default: 'works' },
    total: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    postList: { type: Array as any, default: () => [] },
    loading: { type: Boolean, default: false },
    noMore: { type: Boolean, default: false },
    getCover: { type: Function as any, default: () => '' },
    getVideoUrl: { type: Function as any, default: () => '' },
    readOnly: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'tab-click', 'load-more', 'preview', 'works-filter-change', 'collection-open', 'collection-changed'])

const activeTabValue = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const worksPostList = computed(() => {
    const list = Array.isArray(props.postList) ? props.postList : []
    return list
})

const videoPostList = computed(() => worksPostList.value.filter(item => item?.postType === POST_TYPE.VIDEO))

const worksFilter = ref<'all' | 'collection'>('all')
const showCollections = computed(() => activeTabValue.value === 'works' && worksFilter.value === 'collection')

const onTabClick = (tab: any) => emit('tab-click', tab)
const handleLoadMore = () => emit('load-more')
const handlePreview = (item: any) => emit('preview', item)

const setWorksFilter = (value: 'all' | 'collection') => {
    if (props.readOnly && value === 'collection') return
    if (worksFilter.value === value) return
    worksFilter.value = value
    if (bulkMode.value) resetBulkSelection()
    emit('works-filter-change', value)
}

watch(
    () => props.readOnly,
    readOnly => {
        if (!readOnly) return
        if (worksFilter.value !== 'all') worksFilter.value = 'all'
        if (bulkMode.value) {
            bulkMode.value = false
            resetBulkSelection()
        }
    }
)

const collectionLoadingLocal = ref(false)
const collectionListLocal = ref<AnyObj[]>([])
const collectionLoaded = ref(false)

const normalizeCollections = (res: any) => {
    const data = res?.data ?? res?.rows ?? []
    return Array.isArray(data) ? data : []
}

const loadCollections = async (force = false) => {
    if (collectionLoadingLocal.value || (!force && collectionLoaded.value)) return
    collectionLoadingLocal.value = true
    try {
        const res = await listMyCollections()
        collectionListLocal.value = normalizeCollections(res)
        collectionLoaded.value = true
    } catch (e) {
        console.error(e)
        proxy?.$modal?.msgError?.('加载合集失败')
        collectionListLocal.value = []
        collectionLoaded.value = false
    } finally {
        collectionLoadingLocal.value = false
    }
}

const refreshCollections = () => loadCollections(true)

const resolveCollectionName = (item: any) => item?.name || item?.title || item?.collectionName || item?.label || '未命名'
const resolveCollectionKey = (item: any) => item?.id ?? item?.collectionId ?? item?.name ?? JSON.stringify(item)
const resolveCollectionId = (item: any) => item?.id ?? item?.collectionId ?? null
const resolveCollectionCover = (item: any) => {
    const raw = item?.coverUrl ?? item?.cover ?? item?.image ?? item?.thumbnail ?? ''
    return raw ? getImgUrl(raw) : ''
}

const resolvePostId = (item: any) => {
    const id = item?.postId ?? item?.id
    const num = Number(id)
    return Number.isFinite(num) ? num : null
}
const resolvePostKey = (item: any) => resolvePostId(item) ?? JSON.stringify(item)

const bulkMode = ref(false)
const bulkSelectedWorkIds = ref<number[]>([])
const bulkSelectedCollectionIds = ref<string[]>([])
const bulkWorkIdSet = computed(() => new Set(bulkSelectedWorkIds.value))
const bulkCollectionIdSet = computed(() => new Set(bulkSelectedCollectionIds.value))
const bulkIsCollectionContext = computed(() => activeTabValue.value === 'works' && worksFilter.value === 'collection')
const bulkLabel = computed(() => (bulkIsCollectionContext.value ? '合集' : '作品'))
const bulkActionLabel = computed(() => {
    if (activeTabValue.value === 'likes') return '取消喜欢'
    if (activeTabValue.value === 'bookmarks') return '取消收藏'
    return '删除'
})
const bulkActionIcon = computed(() => {
    if (activeTabValue.value === 'likes') return 'mdi:heart-off-outline'
    if (activeTabValue.value === 'bookmarks') return 'mdi:star-off-outline'
    return 'mdi:delete-outline'
})
const bulkTotalCount = computed(() => {
    if (bulkIsCollectionContext.value) return collectionListLocal.value.length
    return worksPostList.value.length
})
const bulkSelectedCount = computed(() => {
    if (!bulkMode.value) return 0
    return bulkIsCollectionContext.value ? bulkSelectedCollectionIds.value.length : bulkSelectedWorkIds.value.length
})
const bulkAllChecked = computed({
    get: () => bulkTotalCount.value > 0 && bulkSelectedCount.value === bulkTotalCount.value,
    set: checked => {
        if (!bulkMode.value) return
        if (checked) {
            if (bulkIsCollectionContext.value) {
                const ids = collectionListLocal.value
                    .map(item => resolveCollectionId(item))
                    .filter((id): id is string | number => id != null)
                    .map(id => String(id))
                bulkSelectedCollectionIds.value = Array.from(new Set(ids))
            } else {
                const ids = worksPostList.value.map(resolvePostId).filter((id): id is number => Number.isFinite(id))
                bulkSelectedWorkIds.value = Array.from(new Set(ids))
            }
        } else {
            bulkSelectedWorkIds.value = []
            bulkSelectedCollectionIds.value = []
        }
    }
})

const resetBulkSelection = () => {
    bulkSelectedWorkIds.value = []
    bulkSelectedCollectionIds.value = []
}

const toggleBulkMode = () => {
    if (props.readOnly) return
    bulkMode.value = !bulkMode.value
    resetBulkSelection()
}

const handleBulkAction = async () => {
    if (!bulkMode.value || bulkSelectedCount.value === 0) return
    if (!bulkIsCollectionContext.value) return
    const ids = bulkSelectedCollectionIds.value.filter(id => id != null)
    if (!ids.length) return
    try {
        await proxy?.$modal?.confirm?.('确认删除选中合集？删除后不可恢复。', '提示', {
            type: 'warning',
            confirmButtonText: '删除',
            cancelButtonText: '取消'
        })
    } catch {
        return
    }
    try {
        await deleteCollections(ids)
        proxy?.$modal?.msgSuccess?.('删除成功')
        await syncCollections()
        resetBulkSelection()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('删除失败')
    }
}

const resolveCollectionBulkId = (item: any) => {
    const id = resolveCollectionId(item)
    return id == null ? null : String(id)
}

const isBulkWorkSelected = (item: any) => {
    const id = resolvePostId(item)
    return id != null && bulkWorkIdSet.value.has(id)
}

const isBulkCollectionSelected = (item: any) => {
    const id = resolveCollectionBulkId(item)
    return id != null && bulkCollectionIdSet.value.has(id)
}

const toggleBulkWorkSelection = (item: any) => {
    const id = resolvePostId(item)
    if (id == null) return
    const index = bulkSelectedWorkIds.value.indexOf(id)
    if (index >= 0) bulkSelectedWorkIds.value.splice(index, 1)
    else bulkSelectedWorkIds.value.push(id)
}

const toggleBulkCollectionSelection = (item: any) => {
    const id = resolveCollectionBulkId(item)
    if (id == null) return
    const index = bulkSelectedCollectionIds.value.indexOf(id)
    if (index >= 0) bulkSelectedCollectionIds.value.splice(index, 1)
    else bulkSelectedCollectionIds.value.push(id)
}

const handleCollectionCardClick = (item: any) => {
    if (bulkMode.value) {
        toggleBulkCollectionSelection(item)
    } else {
        openAddPostsDialog(item)
    }
}

const handleWorkCardClick = (item: any) => {
    if (bulkMode.value) {
        toggleBulkWorkSelection(item)
    } else {
        handlePreview(item)
    }
}

const createDialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const saving = ref(false)

const formRef = ref<FormInstance>()

const createFormDefaults = () => ({
    id: null as number | null,
    title: '',
    desc: '',
    coverUrl: ''
})

const createForm = reactive(createFormDefaults())

const rules = reactive<FormRules>({
    coverUrl: [{ required: true, message: '请上传封面', trigger: 'change' }],
    title: [{ required: true, message: '请填写名称', trigger: 'blur' }]
})

const resetCreateForm = () => {
    formRef.value?.resetFields?.()
    formRef.value?.clearValidate?.()
    Object.assign(createForm, createFormDefaults())
}

const openCreateDialog = () => {
    dialogMode.value = 'create'
    resetCreateForm()
    createDialogVisible.value = true
}

const openEditDialog = (item: any) => {
    dialogMode.value = 'edit'
    resetCreateForm()
    Object.assign(createForm, {
        id: resolveCollectionId(item),
        title: toTrimmed(item?.title ?? item?.name),
        desc: toTrimmed(item?.description ?? item?.desc),
        coverUrl: toTrimmed(item?.coverUrl ?? item?.cover)
    })
    createDialogVisible.value = true
}

const buildCollectionPayload = () => ({
    title: toTrimmed(createForm.title),
    coverUrl: toTrimmed(createForm.coverUrl),
    description: toTrimmed(createForm.desc),
    sortType: DEFAULT_SORT_TYPE
})

const syncCollections = async () => {
    await refreshCollections()
    emit('collection-changed')
}

const saveCreateForm = async () => {
    if (saving.value) return
    const ok = await formRef.value?.validate?.().catch(() => false)
    if (!ok) return
    saving.value = true
    try {
        const payload = buildCollectionPayload()
        if (!payload.title || !payload.coverUrl || !Number.isFinite(payload.sortType)) {
            proxy?.$modal?.msgWarning?.('请完善必填项')
            return
        }

        if (dialogMode.value === 'create') {
            await addCollection(payload as any)
            proxy?.$modal?.msgSuccess?.('创建成功')
        } else {
            const id = toNumber(createForm.id, Number.NaN)
            if (!Number.isFinite(id)) {
                proxy?.$modal?.msgError?.('合集ID异常')
                return
            }
            await updateCollection({ id, ...payload } as any)
            proxy?.$modal?.msgSuccess?.('修改成功')
        }

        createDialogVisible.value = false
        await syncCollections()
    } catch (e) {
        console.error(e)
        proxy?.$modal?.msgError?.(dialogMode.value === 'create' ? '创建失败' : '修改失败')
    } finally {
        saving.value = false
    }
}

const addDialogVisible = ref(false)
const addDialogSaving = ref(false)
const addDialogTarget = ref<AnyObj | null>(null)
const addDialogTab = ref<'add' | 'selected'>('add')
const selectedPostIds = ref<number[]>([])
const collectionPosts = ref<AnyObj[]>([])
const collectionPostsLoading = ref(false)
const selectedPostsGridRef = ref<HTMLElement | null>(null)
let selectedPostsSortable: Sortable | null = null

const selectablePosts = computed(() => videoPostList.value)
const collectionPostIds = computed(() => collectionPosts.value.map(resolvePostId).filter((id): id is number => Number.isFinite(id)))
const collectionPostIdSet = computed(() => new Set(collectionPostIds.value))
const availablePosts = computed(() =>
    selectablePosts.value.filter(item => {
        const id = resolvePostId(item)
        return id != null && !collectionPostIdSet.value.has(id)
    })
)
const availablePostIds = computed(() => availablePosts.value.map(resolvePostId).filter((id): id is number => Number.isFinite(id)))
const selectedPostIdSet = computed(() => new Set(selectedPostIds.value))
const selectedOrderMap = computed(() => {
    const map = new Map<number, number>()
    selectedPostIds.value.forEach((id, index) => {
        map.set(id, index + 1)
    })
    return map
})
const currentPostIds = computed(() => (addDialogTab.value === 'selected' ? collectionPostIds.value : availablePostIds.value))
const isAllSelected = computed(() => currentPostIds.value.length > 0 && selectedPostIds.value.length === currentPostIds.value.length)
const addDialogTitle = computed(() => resolveCollectionName(addDialogTarget.value))
const addDialogCount = computed(() => {
    if (collectionPosts.value.length) return collectionPosts.value.length
    return toNumber(addDialogTarget.value?.postCount ?? addDialogTarget.value?.count, 0)
})
const selectedTabCount = computed(() => collectionPosts.value.length)
const dialogActionLabel = computed(() => '保存')
const displayPosts = computed(() => (addDialogTab.value === 'selected' ? collectionPosts.value : availablePosts.value))

const normalizeCollectionPosts = (res: any) => {
    const data = res?.data ?? res?.rows ?? res?.list ?? res?.records ?? []
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.posts)) return data.posts
    if (Array.isArray(res?.posts)) return res.posts
    return []
}

const loadCollectionPosts = async (force = false) => {
    if (collectionPostsLoading.value) return
    if (!force && collectionPosts.value.length) return
    const collectionId = resolveCollectionId(addDialogTarget.value)
    if (!collectionId) return
    collectionPostsLoading.value = true
    try {
        const res = await getPostByCollection({ collectionId })
        collectionPosts.value = normalizeCollectionPosts(res)
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('加载合集作品失败')
        collectionPosts.value = []
    } finally {
        collectionPostsLoading.value = false
        setupSelectedPostsSortable()
    }
}

const openAddPostsDialog = (item: any, tab: 'add' | 'selected' = 'add') => {
    addDialogTarget.value = item
    addDialogTab.value = tab
    selectedPostIds.value = []
    collectionPosts.value = []
    loadCollectionPosts(true)
    addDialogVisible.value = true
}

const resetAddPostsDialog = () => {
    addDialogTarget.value = null
    addDialogTab.value = 'add'
    selectedPostIds.value = []
    collectionPosts.value = []
    destroySelectedPostsSortable()
}

const setAddDialogTab = (value: 'add' | 'selected') => {
    if (addDialogTab.value === value) return
    addDialogTab.value = value
    selectedPostIds.value = []
    if (value === 'selected') loadCollectionPosts()
    setupSelectedPostsSortable()
}

const isPostSelected = (item: any) => {
    const id = resolvePostId(item)
    return id != null && selectedPostIdSet.value.has(id)
}

const getSelectedOrder = (item: any) => {
    const id = resolvePostId(item)
    if (id == null) return ''
    return selectedOrderMap.value.get(id) ?? ''
}

const getDisplayOrder = (item: any, index: number) => {
    if (addDialogTab.value === 'selected') return index + 1
    return getSelectedOrder(item)
}

const togglePostSelection = (item: any) => {
    const id = resolvePostId(item)
    if (id == null) return
    const index = selectedPostIds.value.indexOf(id)
    if (index >= 0) selectedPostIds.value.splice(index, 1)
    else selectedPostIds.value.push(id)
}

const toggleSelectAll = () => {
    selectedPostIds.value = isAllSelected.value ? [] : [...currentPostIds.value]
}

const destroySelectedPostsSortable = () => {
    if (!selectedPostsSortable) return
    selectedPostsSortable.destroy()
    selectedPostsSortable = null
}

const setupSelectedPostsSortable = async () => {
    destroySelectedPostsSortable()
    if (!addDialogVisible.value || addDialogTab.value !== 'selected') return
    await nextTick()
    const element = selectedPostsGridRef.value
    if (!element) return
    selectedPostsSortable = Sortable.create(element, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        draggable: '.select-post-card',
        filter: '.remove-btn',
        onEnd: evt => {
            if (evt.oldIndex == null || evt.newIndex == null || evt.oldIndex === evt.newIndex) return
            const moved = collectionPosts.value.splice(evt.oldIndex, 1)[0]
            if (!moved) return
            collectionPosts.value.splice(evt.newIndex, 0, moved)
        }
    })
}

const removePostsFromCollection = (postIds: number[]) => {
    if (!postIds.length || addDialogSaving.value) return
    const removeSet = new Set(postIds)
    collectionPosts.value = collectionPosts.value.filter(item => {
        const id = resolvePostId(item)
        return id == null || !removeSet.has(id)
    })
    selectedPostIds.value = selectedPostIds.value.filter(id => !removeSet.has(id))
}

const removeSelectedPosts = () => {
    if (addDialogTab.value !== 'selected') return
    removePostsFromCollection(selectedPostIds.value)
}

const removeSinglePost = (item: any) => {
    const id = resolvePostId(item)
    if (id == null) return
    removePostsFromCollection([id])
}

const buildOrderedAddPostIds = () => {
    const indexMap = new Map<number, number>()
    availablePosts.value.forEach((item, index) => {
        const id = resolvePostId(item)
        if (id != null && !indexMap.has(id)) indexMap.set(id, index)
    })
    return selectedPostIds.value.filter(id => indexMap.has(id)).sort((a, b) => (indexMap.get(a) ?? 0) - (indexMap.get(b) ?? 0))
}

const buildUpdateItems = (postIds: number[]) => {
    const seen = new Set<number>()
    const ordered = postIds.filter(id => {
        if (!Number.isFinite(id) || seen.has(id)) return false
        seen.add(id)
        return true
    })
    return ordered.map((postId, index) => ({ postId, sortOrder: index + 1 }))
}

const buildSavePostIds = () => {
    if (addDialogTab.value === 'add') {
        const addIds = buildOrderedAddPostIds()
        return [...collectionPostIds.value, ...addIds]
    }
    return [...collectionPostIds.value]
}

const submitSavePosts = async () => {
    if (addDialogSaving.value) return
    const collectionId = resolveCollectionId(addDialogTarget.value)
    if (!collectionId) {
        proxy?.$modal?.msgError?.('合集ID异常')
        return
    }
    const postIds = buildSavePostIds()
    const items = postIds.length ? buildUpdateItems(postIds) : []
    addDialogSaving.value = true
    try {
        await addPostToCollection({ collectionId: String(collectionId), sortType: DEFAULT_SORT_TYPE, items })
        proxy?.$modal?.msgSuccess?.('保存成功')
        addDialogVisible.value = false
        await syncCollections()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('保存失败')
    } finally {
        addDialogSaving.value = false
    }
}

const handleDialogSubmit = () => {
    submitSavePosts()
}

const handleDeleteCollection = async (item: any) => {
    const id = resolveCollectionId(item)
    if (!id) return
    try {
        await proxy?.$modal?.confirm?.('确认删除该合集？删除后不可恢复。', '提示', {
            type: 'warning',
            confirmButtonText: '删除',
            cancelButtonText: '取消'
        })
    } catch {
        return
    }
    try {
        await deleteCollections([id])
        proxy?.$modal?.msgSuccess?.('删除成功')
        await syncCollections()
    } catch (e) {
        console.error(e)
        proxy?.$modal?.msgError?.('删除失败')
    }
}

const loadTriggerRef = ref<HTMLElement | null>(null)
const loadPending = ref(false)
let loadObserver: IntersectionObserver | null = null

const triggerLoadMore = () => {
    if (loadPending.value || props.loading || props.noMore) return
    loadPending.value = true
    handleLoadMore()
}

const handleIntersect: IntersectionObserverCallback = entries => {
    if (!entries?.some(entry => entry.isIntersecting)) return
    triggerLoadMore()
}

const setupObserver = () => {
    loadObserver?.disconnect()
    if (!loadTriggerRef.value) return
    loadObserver = new IntersectionObserver(handleIntersect, {
        root: null,
        rootMargin: '200px 0px',
        threshold: 0.01
    })
    loadObserver.observe(loadTriggerRef.value)
}

onMounted(() => {
    setupObserver()
})

onBeforeUnmount(() => {
    loadObserver?.disconnect()
    destroySelectedPostsSortable()
})

watch(
    () => activeTabValue.value,
    next => {
        if (next !== 'works') {
            worksFilter.value = 'all'
            resetBulkSelection()
        }
    }
)

watch(
    () => props.loading,
    next => {
        if (!next) {
            loadPending.value = false
            if (loadObserver && loadTriggerRef.value) {
                loadObserver.unobserve(loadTriggerRef.value)
                loadObserver.observe(loadTriggerRef.value)
            }
        }
    }
)

watch(
    () => showCollections.value,
    open => {
        if (open) loadCollections()
    },
    { immediate: true }
)

watch(
    () => addDialogVisible.value,
    open => {
        if (!open) {
            destroySelectedPostsSortable()
            return
        }
        setupSelectedPostsSortable()
    }
)
</script>

<style scoped lang="scss">
.content-wrapper {
    width: 100%;
    background-color: var(--el-bg-color);
    scrollbar-gutter: stable;
}

.tabs-sticky-container {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 4px;
}

.tabs-full {
    width: 100%;
    padding: 0 24px;
    box-sizing: border-box;
}

.tabs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.tabs-header :deep(.profile-tabs) {
    flex: 1;
    min-width: 0;
}

.batch-btn {
    height: 32px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--el-border-color);
    color: var(--el-text-color-primary);
    background: var(--el-fill-color);
}

.batch-btn.active {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
}

.batch-btn.is-disabled {
    color: var(--el-text-color-disabled);
    background: var(--el-fill-color);
    border-color: var(--el-border-color);
}

:deep(.profile-tabs) {
    .el-tabs__header {
        margin: 0;
        display: flex;
        justify-content: flex-start;
    }

    .el-tabs__nav-wrap {
        width: 100%;
        margin: 0;
    }

    .el-tabs__nav-wrap::after {
        display: none;
    }

    .el-tabs__nav-scroll {
        display: flex;
        justify-content: flex-start;
    }

    .el-tabs__nav {
        margin-left: 0 !important;
        transform: none !important;
    }

    .el-tabs__item {
        font-size: 14px;
        padding: 0 24px;
        height: 52px;
        line-height: 52px;
        color: var(--el-text-color-regular);
        transition: color 0.3s;

        &:first-child {
            padding-left: 0;
        }

        &.is-active {
            color: var(--el-text-color-primary);
            font-weight: 600;
        }

        .tab-item-inner {
            display: flex;
            align-items: center;
            gap: 6px;

            .tab-icon {
                font-size: 16px;
                display: flex;
            }

            .tab-text {
                font-size: 14px;
                letter-spacing: 0.5px;
            }

            .tab-count {
                font-size: 12px;
                opacity: 0.6;
                font-weight: normal;
                margin-left: 2px;
            }
        }
    }

    .el-tabs__active-bar {
        background-color: var(--el-text-color-primary);
        height: 2px;
        bottom: 4px;
        border-radius: 2px;
    }
}

.content-area {
    width: 100%;
    margin: 0;
    padding: 20px 24px 60px;
    min-height: 400px;
    box-sizing: border-box;
}

.sub-filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .filter-group {
        display: flex;
        gap: 12px;
    }

    .filter-chip {
        padding: 6px 20px;
        border-radius: 20px;
        font-size: 13px;
        cursor: pointer;
        color: var(--el-text-color-regular);
        background-color: var(--el-fill-color);
        transition: all 0.2s ease;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            background-color: var(--el-fill-color-dark);
            color: var(--el-text-color-primary);
        }

        &.active {
            color: var(--el-bg-color);
            background-color: var(--el-text-color-primary);
            font-weight: 600;
        }
    }

    .create-collection-btn {
        font-size: 13px;
        font-weight: 500;
        height: 32px;
    }
}

.bulk-toolbar {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-radius: 12px;
    background: var(--el-fill-color);
    border: 1px solid var(--el-border-color);
    color: var(--el-text-color-regular);
}

.bulk-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.bulk-count {
    font-size: 13px;
    line-height: 1;
    color: var(--el-text-color-primary);
    font-weight: 500;
}

.bulk-actions {
    display: flex;
    align-items: center;
    gap: 16px;
}

.bulk-action {
    color: var(--el-color-danger);
}

.bulk-action.is-disabled {
    color: var(--el-text-color-disabled);
}

.bulk-toolbar :deep(.el-checkbox__label) {
    color: var(--el-text-color-regular);
    line-height: 1;
    padding-left: 6px;
}

.bulk-toolbar :deep(.el-checkbox) {
    display: inline-flex;
    align-items: center;
}

.bulk-check {
    position: absolute;
    top: 0;
    right: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--el-color-primary);
    color: var(--el-color-white);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    line-height: 1;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
    pointer-events: none;
    z-index: 2;
    transform: translate(50%, -50%);
}

.works-grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, 200px);
    gap: 20px;
    justify-content: flex-start;
}

.work-card-modern {
    cursor: pointer;
    position: relative;

    &.bulk-selected .cover-box {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }

    &:hover .cover-box {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);

        img {
            transform: scale(1.05);
        }
        .play-indicator {
            transform: translate(-50%, -50%) scale(1.1);
            background: rgba(0, 0, 0, 0.5);
        }
    }

    .cover-box {
        position: relative;
        width: 200px;
        height: 266px;
        border-radius: 8px;
        overflow: hidden;
        background-color: var(--el-fill-color-light);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        border: 1px solid var(--el-border-color-extra-light);

        img,
        video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }

        .video-container {
            position: absolute;
            inset: 0;
        }

        .play-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: var(--el-color-white);
            font-size: 24px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(2px);
            transition: all 0.3s;
        }

        .text-container {
            position: absolute;
            inset: 0;
            background: var(--el-bg-color-page);
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-primary);
            font-size: 14px;
            line-height: 1.6;
            text-align: center;

            span {
                display: -webkit-box;
                -webkit-line-clamp: 5;
                line-clamp: 5;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        }

        .bottom-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
            display: flex;
            align-items: flex-end;
            padding: 10px;
        }

        .stat {
            color: var(--el-color-white);
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 4px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .type-tag {
            position: absolute;
            top: 8px;
            right: 8px;
            color: var(--el-color-white);
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            padding: 2px 4px;
            font-size: 12px;
            backdrop-filter: blur(2px);
        }
    }

    .title-box {
        margin-top: 8px;
        width: 200px;
        font-size: 14px;
        color: var(--el-text-color-primary);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        height: 40px;
    }
}

.collection-grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, 260px);
    gap: 20px;
    justify-content: flex-start;
}

.collection-card-modern {
    width: 260px;
    position: relative;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s;

    &.bulk-selected {
        border-color: var(--el-color-primary);
        box-shadow: 0 6px 16px var(--el-color-primary-light-9);
    }

    &:hover {
        border-color: var(--el-color-primary-light-5);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

        .cover-visual img {
            transform: scale(1.04);
        }

        .more-btn {
            opacity: 1;
        }
    }

    .card-inner {
        display: flex;
        align-items: center;
        gap: 16px;
        position: relative;
    }

    .cover-visual {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        border-radius: 8px;
        overflow: hidden;
        background: var(--el-fill-color-light);
        border: 1px solid var(--el-border-color-light);
        display: flex;
        align-items: center;
        justify-content: center;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.3s;
        }

        .cover-fallback {
            width: 100%;
            height: 100%;
            background: var(--el-color-primary-light-8);
            display: flex;
            align-items: center;
            justify-content: center;

            .icon {
                color: var(--el-color-white);
                font-size: 20px;
            }
        }
    }

    .meta-info {
        flex: 1;
        min-width: 0;

        .title {
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .count {
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }
    }

    .actions {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .more-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color);
        transition: all 0.2s;
        opacity: 0.9;

        &:hover {
            background: var(--el-fill-color-dark);
            color: var(--el-text-color-primary);
        }
    }
}

.empty-collection-state {
    width: 100%;
    min-height: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);

    .empty-icon-wrapper {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: var(--el-fill-color-light);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;

        .empty-icon {
            font-size: 40px;
            color: var(--el-text-color-placeholder);
        }
    }

    .empty-text {
        font-size: 14px;
        margin-bottom: 24px;
        color: var(--el-text-color-regular);
        text-align: center;
    }

    .empty-create-btn {
        padding: 10px 32px;
        font-weight: 500;
    }
}

.status-box {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    width: 100%;

    &.empty {
        min-height: 300px;
    }

    &.small {
        padding: 20px 0;
    }

    &.text-only {
        color: var(--el-text-color-placeholder);
        font-size: 12px;
    }
}

.scroll-trigger {
    height: 1px;
}

.dialog-header-modern {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.form-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.dialog-footer-modern {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.confirm-btn {
    padding: 8px 24px;
    font-weight: 500;
}

.avatar-uploader {
    :deep(.el-upload--picture-card) {
        width: 100px;
        height: 100px;
        border-radius: 8px;
    }

    :deep(.el-upload-list--picture-card .el-upload-list__item) {
        width: 100px;
        height: 100px;
        border-radius: 8px;
    }
}

.modern-input {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
        box-shadow: none;
        background: var(--el-fill-color);
        border: 1px solid transparent;
        transition: all 0.2s;

        &:hover {
            background: var(--el-fill-color-dark);
        }

        &.is-focus {
            background: var(--el-bg-color);
            box-shadow: 0 0 0 1px var(--el-color-primary) inset;
        }
    }
}

.modern-select {
    :deep(.el-select__wrapper) {
        box-shadow: none;
        background: var(--el-fill-color);
        border: 1px solid transparent;
        transition: all 0.2s;

        &:hover {
            background: var(--el-fill-color-dark);
        }

        &.is-focused {
            background: var(--el-bg-color);
            box-shadow: 0 0 0 1px var(--el-color-primary) inset;
        }
    }
}

:deep(.modern-dialog .el-dialog),
:deep(.el-dialog.modern-dialog) {
    border-radius: 12px;
    overflow: hidden;

    .el-dialog__header {
        margin: 0;
        padding: 20px 24px;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .el-dialog__body {
        padding: 24px;
    }

    .el-dialog__footer {
        padding: 16px 24px;
        border-top: 1px solid var(--el-border-color-lighter);
        background: var(--el-fill-color-extra-light);
    }
}

:deep(.collection-posts-dialog .el-dialog),
:deep(.el-dialog.collection-posts-dialog) {
    background: var(--el-bg-color-overlay);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    border: 1px solid var(--el-border-color-lighter);

    .el-dialog__header {
        margin: 0;
        padding: 20px 24px 4px;
        border-bottom: none;
    }

    .el-dialog__body {
        padding: 0 24px 24px;
        background: var(--el-bg-color-overlay);
    }

    .el-dialog__footer {
        border-top: none;
        background: var(--el-bg-color-overlay);
    }

    .el-dialog__headerbtn {
        display: none;
    }
}

:deep(.el-overlay) {
    background-color: rgba(0, 0, 0, 0.55);
}

.collection-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.collection-dialog-title {
    display: flex;
    align-items: baseline;
    gap: 12px;
    color: var(--el-text-color-primary);

    .name {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .count {
        font-size: 12px;
        color: var(--el-color-primary);
    }
}

.collection-dialog-actions {
    display: flex;
    align-items: center;
    gap: 10px;

    .ghost-btn {
        height: 32px;
        padding: 0 16px;
        border-radius: 999px;
        border: 1px solid var(--el-border-color);
        color: var(--el-text-color-primary);
        background: var(--el-fill-color);
    }

    .primary-btn {
        height: 32px;
        padding: 0 18px;
        border-radius: 999px;
        border: none;
        color: var(--el-color-white);
        background: var(--el-color-primary);
        box-shadow: 0 6px 16px var(--el-color-primary-light-5);
    }

    .primary-btn.is-disabled {
        background: var(--el-fill-color);
        color: var(--el-text-color-disabled);
        box-shadow: none;
    }
}

.collection-dialog-tabs {
    display: flex;
    align-items: center;
    gap: 22px;
    margin-top: 12px;

    :deep(.el-button.tab-btn) {
        color: var(--el-text-color-secondary);
    }

    :deep(.el-button.tab-btn.active) {
        color: var(--el-text-color-primary);
    }
}

.tab-btn {
    position: relative;
    border: none;
    background: transparent;
    padding: 8px 0 14px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: color 0.2s ease;

    &.active {
        color: var(--el-text-color-primary);
        font-weight: 600;
    }

    &.active::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: 4px;
        width: 100%;
        height: 2px;
        border-radius: 999px;
        background: var(--el-color-primary);
    }

    .tab-count {
        margin-left: 6px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }
}

.add-posts-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 360px;
}

.add-posts-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    :deep(.el-button) {
        color: var(--el-text-color-regular);
    }
}

.select-posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 14px;

    &.is-draggable .select-post-card {
        cursor: grab;
    }

    &.is-draggable .select-post-card:active {
        cursor: grabbing;
    }
}

.sortable-ghost {
    opacity: 0.6;
}

.select-post-card {
    position: relative;
    border-radius: 10px;
    overflow: visible;
    background: var(--el-fill-color);
    border: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--el-border-color);
        transform: translateY(-2px);
    }

    &.selected {
        border-color: var(--el-color-primary);
        box-shadow: var(--el-box-shadow-light);
    }

    &.selected-tab.selected {
        border-color: var(--el-border-color-lighter);
        box-shadow: none;
    }

    .thumb {
        position: relative;
        width: 100%;
        aspect-ratio: 3 / 4;
        background: var(--el-fill-color-dark);
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;

        img,
        video {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .thumb-video {
            position: absolute;
            inset: 0;
        }

        .thumb-play {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.4);
            color: var(--el-color-white);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .thumb-text {
            padding: 12px;
            font-size: 12px;
            color: var(--el-text-color-secondary);
            line-height: 1.4;
            text-align: center;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }

    .select-check {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 20px;
        color: var(--el-color-primary);
        background: var(--el-fill-color);
        border-radius: 50%;
        opacity: 0;
        transform: scale(0.6);
        transition: all 0.2s ease;
    }

    .select-order {
        position: absolute;
        top: 8px;
        left: 8px;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 999px;
        background: var(--el-color-primary);
        color: var(--el-color-white);
        font-size: 12px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
        z-index: 2;
    }

    .remove-btn {
        position: absolute;
        top: 0;
        right: 0;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: #f56c6c;
        color: #fff;
        font-size: 16px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2;
        padding: 0;
        transform: translate(50%, -50%);
    }

    &.selected .select-check {
        opacity: 1;
        transform: scale(1);
    }
}

.collection-empty-state {
    flex: 1;
    min-height: 320px;
    border-radius: 16px;
    background: var(--el-fill-color-lighter);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--el-text-color-secondary);

    .empty-icon {
        width: 80px;
        height: 80px;
        border-radius: 24px;
        background: var(--el-fill-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        color: var(--el-text-color-placeholder);
        margin-bottom: 6px;
    }

    .empty-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .empty-desc {
        font-size: 13px;
        color: var(--el-text-color-secondary);
    }
}
</style>
