<template>
    <div class="app-container content-list-page">
        <el-form ref="queryRef" :model="queryParams" :inline="true" label-width="72px" class="search-form">
            <el-form-item label="帖子类型" prop="postType">
                <el-select v-model="queryParams.postType" placeholder="全部" clearable style="width: 180px">
                    <el-option v-for="opt in postTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-form-item>

            <el-form-item label="搜索内容" prop="content">
                <el-input v-model="queryParams.content" placeholder="按内容模糊搜索" clearable style="width: 220px" @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="条数" prop="limit">
                <el-input-number v-model="queryParams.limit" :min="1" :max="30" :step="5" style="width: 120px" />
            </el-form-item>

            <el-form-item class="search-actions">
                <el-button type="primary" :loading="loading" @click="handleQuery">
                    <el-icon><Icon icon="ep:search" /></el-icon>
                    搜索
                </el-button>
                <el-button @click="resetQuery">
                    <el-icon><Icon icon="ep:refresh" /></el-icon>
                    重置
                </el-button>
            </el-form-item>
        </el-form>

        <el-card shadow="never" class="list-card">
            <template #header>
                <div class="list-header">
                    <div class="list-header__left">
                        <span class="list-title">内容列表</span>
                        <span class="list-sub">
                            当前展示 <b>{{ postList.length }}</b> 条
                        </span>
                    </div>
                </div>
            </template>

            <el-empty v-if="!loading && postList.length === 0" description="暂无内容" :image-size="100" />

            <el-skeleton v-else-if="loading && postList.length === 0" animated :count="4">
                <template #template>
                    <div class="post-item-skeleton">
                        <el-skeleton-item variant="text" style="width: 60%" />
                        <el-skeleton-item variant="text" style="width: 90%; margin-top: 6px" />
                        <el-skeleton-item variant="text" style="width: 70%; margin-top: 4px" />
                    </div>
                </template>
            </el-skeleton>

            <div v-else class="post-list-grid">
                <el-card v-for="item in postList" :key="item.id" shadow="hover" class="post-item-card">
                    <div class="post-item__header">
                        <div class="post-user">
                            <el-avatar :size="32" :src="fullAvatar(item.avatar)" class="post-avatar">
                                {{ item.nickName?.slice(0, 1) || 'U' }}
                            </el-avatar>
                            <div class="post-user__info">
                                <div class="post-nickname">
                                    {{ item.nickName || '未知用户' }}
                                </div>
                                <div class="post-meta">
                                    <span class="post-time">
                                        {{ item.createTime || '-' }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="post-tags">
                            <EnumTag enum-type="POST_TYPE" :value="item.postType" />
                        </div>
                    </div>

                    <div v-if="item.content" class="post-content">
                        {{ item.content }}
                    </div>

                    <div v-if="hasMedia(item)" class="post-media">
                        <MediaPreview
                            :post-type="item.postType"
                            :media-urls="item.mediaUrls"
                            :audit-status="item.auditStatus"
                            :mode="AUDIT_MEDIA_MODE.DETAIL"
                        />
                    </div>

                    <div class="post-stats">
                        <div class="stat-item">
                            <Icon icon="mdi:thumb-up-outline" />
                            <span>{{ item.likeCount ?? 0 }}</span>
                        </div>
                        <div class="stat-item">
                            <Icon icon="mdi:comment-outline" />
                            <span>{{ item.commentCount ?? 0 }}</span>
                        </div>
                        <div class="stat-item">
                            <Icon icon="mdi:share-variant-outline" />
                            <span>{{ item.repostCount ?? 0 }}</span>
                        </div>
                        <div class="stat-item">
                            <Icon :icon="item.bookmark ? 'mdi:bookmark' : 'mdi:bookmark-outline'" />
                            <span>{{ item.bookmarkCount ?? 0 }}</span>
                        </div>
                    </div>
                </el-card>
            </div>

            <div v-if="postList.length" class="load-more-wrapper">
                <el-button v-if="!finished" :loading="loadingMore" size="small" @click="loadMore">
                    {{ loadingMore ? '加载中...' : '加载更多' }}
                </el-button>
                <span v-else class="load-more-finished"> 已无更多数据 </span>
            </div>
        </el-card>
    </div>
</template>

<script setup name="ContentList">
import { ref, reactive, onMounted, onActivated, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'

import { listPostByApp } from '@/api/content/post'
import EnumTag from '@/components/EnumTag/index.vue'
import MediaPreview from '@/components/MediaPreview/index.vue'
import { AUDIT_MEDIA_MODE } from '@/utils/enum'
import { useEnumOptions } from '@/hooks/useEnumOptions'

const { proxy } = getCurrentInstance()

const queryParams = reactive({
    postType: undefined,
    content: '',
    lastId: undefined,
    lastCreateTime: undefined,
    limit: 10
})

const queryRef = ref(null)

const postList = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)

const postTypeOptions = useEnumOptions('POST_TYPE')

function fullAvatar(avatar) {
    if (!avatar) return ''
    if (/^https?:\/\//.test(avatar)) return avatar
    return import.meta.env.VITE_APP_BASE_API + avatar
}

function hasMedia(item) {
    if (item?.postType === '1') return false
    if (Array.isArray(item?.mediaUrls)) return item.mediaUrls.length > 0
    return !!item?.mediaUrls
}

async function fetchList(isLoadMore = false) {
    if (loading.value || loadingMore.value) return

    if (isLoadMore) {
        loadingMore.value = true
    } else {
        loading.value = true
    }

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

        if (!isLoadMore) {
            postList.value = records
        } else {
            postList.value = postList.value.concat(records)
        }

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
    if (proxy?.resetForm) {
        proxy.resetForm('queryRef')
    } else if (queryRef.value?.resetFields) {
        queryRef.value.resetFields()
    }

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

onActivated(() => {
    handleQuery()
})
</script>

<style lang="scss" scoped>
.content-list-page {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.search-card {
    padding-bottom: 6px;

    :deep(.el-card__body) {
        padding: 12px 16px 8px;
    }

    .search-form {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 6px 16px;

        :deep(.el-form-item) {
            margin-bottom: 4px;
        }

        .search-actions {
            margin-left: auto;
        }
    }
}

.list-card {
    :deep(.el-card__body) {
        padding: 10px 12px 12px;
    }

    .list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2px;

        .list-title {
            font-size: 14px;
            font-weight: 600;
            margin-right: 8px;
        }

        .list-sub {
            font-size: 12px;
            color: var(--el-text-color-secondary);

            b {
                font-weight: 600;
                color: var(--el-color-primary);
            }
        }
    }
}

.post-list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 10px;
    margin-top: 4px;
}

.post-item-card {
    border-radius: 8px;
    padding: 8px 10px;

    :deep(.el-card__body) {
        padding: 0;
    }

    .post-item__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
    }

    .post-user {
        display: flex;
        align-items: center;

        .post-avatar {
            margin-right: 8px;
        }

        .post-user__info {
            display: flex;
            flex-direction: column;

            .post-nickname {
                font-size: 13px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            .post-meta {
                margin-top: 2px;
                font-size: 11px;
                color: var(--el-text-color-secondary);

                .post-time {
                    margin-right: 6px;
                }

                .post-user-id {
                    opacity: 0.9;
                }
            }
        }
    }

    .post-tags {
        display: flex;
        align-items: center;
        gap: 4px;

        :deep(.el-tag) {
            transform: scale(0.88);
            transform-origin: right center;
        }
    }

    .post-content {
        margin: 2px 0 4px;
        font-size: 13px;
        line-height: 1.5;
        color: var(--el-text-color-primary);
        max-height: 3.5em;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    .post-media {
        margin-top: 4px;
    }

    .post-stats {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 6px;
        font-size: 11px;
        color: var(--el-text-color-secondary);

        .stat-item {
            display: inline-flex;
            align-items: center;
            gap: 3px;

            :deep(svg) {
                font-size: 14px;
            }
        }
    }
}

.post-item-skeleton {
    padding: 8px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.load-more-wrapper {
    margin-top: 8px;
    display: flex;
    justify-content: center;

    .load-more-finished {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }
}

@media (max-width: 768px) {
    .search-card {
        :deep(.el-card__body) {
            padding: 10px;
        }

        .search-form {
            flex-direction: column;
            align-items: flex-start;

            .search-actions {
                margin-left: 0;
            }
        }
    }

    .post-list-grid {
        grid-template-columns: 1fr;
    }
}
</style>
