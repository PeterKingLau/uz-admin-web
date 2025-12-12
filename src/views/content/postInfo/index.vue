<template>
    <div class="app-container content-feed-page">
        <!-- 顶部筛选栏（紧凑） -->
        <el-card shadow="never" class="toolbar-card">
            <el-form ref="queryRef" :model="queryParams" :inline="true" label-width="72px" class="toolbar-form">
                <el-form-item label="帖子类型" prop="postType">
                    <el-select v-model="queryParams.postType" placeholder="全部" clearable style="width: 180px">
                        <el-option v-for="opt in postTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                </el-form-item>

                <el-form-item label="搜索内容" prop="content">
                    <el-input v-model="queryParams.content" placeholder="按内容模糊搜索" clearable style="width: 260px" @keyup.enter="handleQuery" />
                </el-form-item>

                <el-form-item label="条数" prop="limit">
                    <el-input-number v-model="queryParams.limit" :min="1" :max="30" :step="5" style="width: 130px" />
                </el-form-item>

                <el-form-item class="toolbar-actions">
                    <el-button type="primary" :loading="loading" @click="handleQuery">
                        <el-icon><Icon icon="ep:search" /></el-icon> 搜索
                    </el-button>
                    <el-button @click="resetQuery">
                        <el-icon><Icon icon="ep:refresh" /></el-icon> 重置
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 列表主体 -->
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
                        <el-tag v-if="finished && postList.length" size="small" type="info" effect="plain">已加载全部</el-tag>
                    </div>
                </div>
            </template>

            <!-- 空状态 -->
            <el-empty v-if="!loading && postList.length === 0" description="暂无内容" :image-size="110" />

            <!-- 骨架屏 -->
            <div v-else-if="loading && postList.length === 0" class="feed-skeleton">
                <el-skeleton animated :count="6">
                    <template #template>
                        <div class="feed-item feed-item--skeleton">
                            <div class="media-skeleton"></div>
                            <div class="body-skeleton">
                                <el-skeleton-item variant="text" style="width: 40%" />
                                <el-skeleton-item variant="text" style="width: 70%; margin-top: 8px" />
                                <el-skeleton-item variant="text" style="width: 55%; margin-top: 6px" />
                                <el-skeleton-item variant="text" style="width: 85%; margin-top: 10px" />
                            </div>
                        </div>
                    </template>
                </el-skeleton>
            </div>

            <!-- Feed 列表 -->
            <div v-else class="feed-list">
                <div v-for="item in postList" :key="item.id" class="feed-item">
                    <!-- 左侧媒体 -->
                    <div class="feed-media" v-if="hasMedia(item)">
                        <MediaPreview
                            :post-type="item.postType"
                            :media-urls="normalizeMediaUrls(item.mediaUrls)"
                            :audit-status="item.auditStatus"
                            :mode="AUDIT_MEDIA_MODE.CELL"
                        />
                    </div>

                    <!-- 文本帖：给一个“内容卡片区”占位，避免右侧太空 -->
                    <div v-else class="feed-media feed-media--text">
                        <div class="text-thumb">
                            <Icon icon="ep:document" />
                            <span>文字</span>
                        </div>
                    </div>

                    <!-- 右侧内容 -->
                    <div class="feed-body">
                        <div class="feed-top">
                            <div class="user-block">
                                <el-avatar :size="32" :src="fullAvatar(item.avatar)" class="avatar">
                                    {{ item.nickName?.slice(0, 1) || 'U' }}
                                </el-avatar>
                                <div class="user-meta">
                                    <div class="name-line">
                                        <span class="name">{{ item.nickName || '未知用户' }}</span>
                                        <span class="time">{{ item.createTime || '-' }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="type-tags">
                                <EnumTag enum-type="POST_TYPE" :value="item.postType" />
                            </div>
                        </div>

                        <!-- 内容 -->
                        <div v-if="item.content" class="feed-content" :class="{ 'feed-content--center': item.postType === '1' && !hasMedia(item) }">
                            {{ item.content }}
                        </div>
                        <div v-else class="feed-content feed-content--empty">（无正文内容）</div>

                        <div v-if="isImagePost(item) && imageUrls(item).length" class="feed-images">
                            <el-image
                                v-for="(img, idx) in imageUrls(item)"
                                :key="img + idx"
                                :src="img"
                                fit="cover"
                                preview-teleported
                                :preview-src-list="imageUrls(item)"
                                :initial-index="idx"
                                :style="{ width: '120px', height: '120px' }"
                            />
                        </div>

                        <!-- 底部统计 -->
                        <div class="feed-footer">
                            <div class="stats">
                                <div class="stat">
                                    <Icon icon="mdi:thumb-up-outline" />
                                    <span>{{ item.likeCount ?? 0 }}</span>
                                </div>
                                <div class="stat">
                                    <Icon icon="mdi:comment-outline" />
                                    <span>{{ item.commentCount ?? 0 }}</span>
                                </div>
                                <div class="stat">
                                    <Icon icon="mdi:share-variant-outline" />
                                    <span>{{ item.repostCount ?? 0 }}</span>
                                </div>
                                <div class="stat">
                                    <Icon :icon="(item.bookmarkCount ?? 0) > 0 ? 'mdi:bookmark' : 'mdi:bookmark-outline'" />
                                    <span>{{ item.bookmarkCount ?? 0 }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 加载更多 -->
                <div v-if="postList.length" class="load-more">
                    <el-button v-if="!finished" :loading="loadingMore" size="small" @click="loadMore">
                        {{ loadingMore ? '加载中...' : '加载更多' }}
                    </el-button>
                    <span v-else class="finished">已无更多数据</span>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup name="ContentList" lang="ts">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'

import { listPostByApp } from '@/api/content/post'
import EnumTag from '@/components/EnumTag/index.vue'
import MediaPreview from '@/components/MediaPreview/index.vue'
import { AUDIT_MEDIA_MODE } from '@/utils/enum'
import { useEnumOptions } from '@/hooks/useEnumOptions'
import { isExternal } from '@/utils/validate'

const { proxy } = getCurrentInstance() || {}

const queryParams = reactive({
    postType: undefined,
    content: '',
    lastId: undefined,
    lastCreateTime: undefined,
    limit: 10
})

const queryRef = ref<FormInstance | null>(null)
const postList = ref<any[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)

const postTypeOptions = useEnumOptions('POST_TYPE')

function fullAvatar(avatar: string) {
    if (!avatar) return ''
    if (/^https?:\/\//.test(avatar)) return avatar
    return (import.meta.env.VITE_APP_BASE_API || '') + avatar
}

/** 兼容后端 mediaUrls 可能是 JSON 字符串 */
function normalizeMediaUrls(mediaUrls: any) {
    if (!mediaUrls) return []
    if (Array.isArray(mediaUrls)) return mediaUrls
    if (typeof mediaUrls === 'string') {
        const s = mediaUrls.trim()
        // 可能是 '["a","b"]'
        if (s.startsWith('[')) {
            try {
                const arr = JSON.parse(s)
                return Array.isArray(arr) ? arr : []
            } catch {
                return []
            }
        }
        // 也可能是单个 url
        return [s]
    }
    return []
}

function hasMedia(item: any) {
    if (item?.postType === '1') return false
    const arr = normalizeMediaUrls(item?.mediaUrls)
    return arr.length > 0
}

function isImagePost(item: any) {
    return String(item?.postType) === '2'
}

function imageUrls(item: any) {
    const arr = normalizeMediaUrls(item?.mediaUrls)
    const list = Array.isArray(arr) ? arr : []
    const transformUrl = (url: string) => {
        const imgUrlFn = (proxy as any)?.$imgUrl
        return !isExternal(url) && imgUrlFn ? imgUrlFn(url) : url
    }
    return list.map(transformUrl)
}

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
        const list = res?.rows || res?.data || res || []
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
    fetchList(false)
}

function resetQuery() {
    if (proxy?.resetForm) proxy.resetForm('queryRef')
    else queryRef.value?.resetFields?.()

    queryParams.postType = undefined
    queryParams.content = ''
    queryParams.limit = 10
    queryParams.lastId = undefined
    queryParams.lastCreateTime = undefined
    finished.value = false

    fetchList(false)
}

function loadMore() {
    if (finished.value) return
    fetchList(true)
}

onMounted(() => {
    resetQuery()
})
</script>

<style lang="scss" scoped>
.content-feed-page {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* 顶部工具条：紧凑、贴合后台 */
.toolbar-card {
    :deep(.el-card__body) {
        padding: 10px 12px 6px;
    }
}
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

/* 列表卡片 */
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
}

/* 骨架 */
.feed-skeleton {
    padding: 4px 0;
}
.feed-item--skeleton {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 10px;
    display: flex;
    gap: 12px;
    margin-bottom: 10px;

    .media-skeleton {
        width: 170px;
        height: 220px;
        border-radius: 10px;
        background: var(--el-fill-color-lighter);
        flex-shrink: 0;
    }
    .body-skeleton {
        flex: 1;
        padding-top: 4px;
    }
}

/* Feed 列表 */
.feed-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* 单条 */
.feed-item {
    display: flex;
    gap: 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 10px;
    transition:
        box-shadow 0.15s ease,
        transform 0.15s ease;
    background: #fff;

    &:hover {
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
        transform: translateY(-1px);
    }
}

/* 左侧媒体区：固定尺寸，整体更“齐” */
.feed-media {
    width: 170px;
    min-width: 170px;
    height: 220px;
    border-radius: 10px;
    overflow: hidden;
    background: var(--el-fill-color-lighter);
    display: flex;
    align-items: center;
    justify-content: center;
}

.feed-media--text {
    background: #f7f9fc;
    border: 1px dashed rgba(0, 0, 0, 0.08);
}
.text-thumb {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    :deep(svg) {
        font-size: 18px;
    }
}

/* 右侧内容 */
.feed-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.feed-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}

.user-block {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;

    .avatar {
        flex-shrink: 0;
    }
}
.user-meta {
    min-width: 0;

    .name-line {
        display: flex;
        align-items: baseline;
        gap: 10px;
        min-width: 0;

        .name {
            font-size: 13px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 260px;
        }
        .time {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            white-space: nowrap;
        }
    }

    .sub-line {
        margin-top: 3px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 6px;

        .dot {
            opacity: 0.6;
        }
    }
}

.type-tags {
    display: flex;
    align-items: center;

    :deep(.el-tag) {
        transform: scale(0.9);
        transform-origin: right top;
    }
}

/* 正文：更紧凑 + 省空间 */
.feed-content {
    margin-top: 8px;
    padding: 10px 10px;
    background: #fbfcff;
    border: 1px solid rgba(0, 0, 0, 0.04);
    border-radius: 10px;

    font-size: 13px;
    line-height: 1.55;
    color: var(--el-text-color-primary);

    display: -webkit-box;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
}

.feed-content--center {
    min-height: 120px;
    line-clamp: 3;
    -webkit-line-clamp: 3;
}

.feed-content--empty {
    color: var(--el-text-color-secondary);
    font-style: italic;
}

.feed-images {
    margin-top: 8px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;

    :deep(img) {
        border-radius: 8px;
        object-fit: cover;
        width: 100%;
        height: 120px;
    }
}

/* 底部统计条：靠右更像后台 */
.feed-footer {
    margin-top: auto;
    padding-top: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.stats {
    display: flex;
    align-items: center;
    gap: 18px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    .stat {
        display: inline-flex;
        align-items: center;
        gap: 8px;

        :deep(svg) {
            font-size: 18px;
        }
    }
}

.hint {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 加载更多 */
.load-more {
    margin-top: 6px;
    display: flex;
    justify-content: center;
    padding: 8px 0 2px;

    .finished {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }
}

/* 响应式：移动端改纵向 */
@media (max-width: 900px) {
    .toolbar-form {
        .toolbar-actions {
            margin-left: 0;
        }
    }

    .feed-item {
        flex-direction: column;
    }

    .feed-media {
        width: 100%;
        min-width: 0;
        height: 240px;
    }

    .user-meta .name-line .name {
        max-width: 60vw;
    }
}
</style>
