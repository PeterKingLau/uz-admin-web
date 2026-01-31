<template>
    <div v-loading="loadingPosts" class="posts-feed">
        <div v-for="post in postList" :key="post.id" class="feed-card">
            <div class="card-header">
                <div class="author-section">
                    <el-avatar :size="40" :src="getImgUrl(post.authorAvatar || '')" class="author-avatar">
                        {{ post.authorName?.charAt(0) }}
                    </el-avatar>
                    <div class="author-info">
                        <div class="author-name">{{ post.authorName }}</div>
                    </div>
                </div>
                <div v-if="post.isTop" class="top-badge">
                    <Icon icon="mdi:pin" />
                    置顶
                </div>
            </div>

            <div class="card-content">
                <div class="content-text">
                    <span v-if="post.title" class="text-title">{{ post.title }}</span>
                    <span v-if="post.title && post.content"> </span>
                    <span v-if="post.content">{{ post.content }}</span>
                </div>

                <div v-if="post.images?.length" class="content-images" :class="`images-count-${Math.min(post.images.length, 4)}`">
                    <div v-for="(img, idx) in post.images.slice(0, 9)" :key="idx" class="image-wrapper">
                        <el-image
                            :src="getImgUrl(img)"
                            fit="cover"
                            class="image-item"
                            :preview-src-list="post.images.map(i => getImgUrl(i))"
                            :initial-index="idx"
                            loading="lazy"
                        />
                        <div v-if="idx === 8 && post.images.length > 9" class="image-overlay">+{{ post.images.length - 9 }}</div>
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <div class="post-time">{{ formatTime(post.updateTime || post.createTime) }}</div>
                <div class="action-bar">
                    <div class="action-item">
                        <Icon icon="mdi:thumb-up-outline" />
                        <span>{{ formatActionCount(post.likeCount, '赞同') }}</span>
                    </div>
                    <div class="action-item">
                        <Icon icon="mdi:comment-text-outline" />
                        <span>{{ formatActionCount(post.commentCount, '条评论') }}</span>
                    </div>
                    <div class="action-item">
                        <Icon icon="mdi:share-variant-outline" />
                        <span>分享</span>
                    </div>
                    <div class="action-item">
                        <Icon icon="mdi:star-outline" />
                        <span>收藏</span>
                    </div>
                </div>
            </div>
        </div>

        <el-empty v-if="!loadingPosts && postList.length === 0" description="暂无讨论内容" :image-size="120" />
    </div>
</template>

<script setup lang="ts">
interface PostItem {
    id: string | number
    title: string
    content?: string
    authorName?: string
    authorAvatar?: string
    images?: string[]
    videoUrl?: string
    isTop?: boolean
    likeCount?: number
    commentCount?: number
    createTime?: string
    updateTime?: string
}

defineProps<{
    postList: PostItem[]
    loadingPosts: boolean
    getImgUrl: (url: string) => string
    formatTime: (time?: string) => string
    formatActionCount: (num?: number, suffix?: string) => string
}>()
</script>

<style scoped lang="scss">
.posts-feed {
    min-height: 400px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.feed-card {
    background: var(--circle-card-bg);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    border: 1px solid transparent;
    transition: all 0.2s ease;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: var(--el-border-color-lighter);
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .author-section {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
    }

    .author-avatar {
        flex-shrink: 0;
    }

    .author-info {
        flex: 1;
        min-width: 0;

        .author-name {
            font-size: 15px;
            font-weight: 600;
            color: var(--circle-text-main);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    .top-badge {
        font-size: 12px;
        color: var(--el-color-warning);
        background: var(--el-color-warning-light-9);
        padding: 3px 8px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
        flex-shrink: 0;
    }
}

.card-content {
    margin-bottom: 12px;

    .content-text {
        font-size: 15px;
        color: var(--circle-text-main);
        line-height: 1.7;
        margin-bottom: 12px;
        word-wrap: break-word;
        word-break: break-word;

        .text-title {
            font-weight: 600;
        }
    }

    .content-images {
        display: grid;
        gap: 4px;
        border-radius: 8px;
        overflow: hidden;

        &.images-count-1 {
            grid-template-columns: 1fr;
            max-width: 400px;

            .image-wrapper {
                aspect-ratio: 4/3;
                max-height: 300px;
            }
        }

        &.images-count-2 {
            grid-template-columns: repeat(2, 1fr);

            .image-wrapper {
                aspect-ratio: 1;
            }
        }

        &.images-count-3 {
            grid-template-columns: repeat(3, 1fr);

            .image-wrapper {
                aspect-ratio: 1;
            }
        }

        &.images-count-4 {
            grid-template-columns: repeat(2, 1fr);

            .image-wrapper {
                aspect-ratio: 1;
            }
        }

        grid-template-columns: repeat(3, 1fr);

        .image-wrapper {
            position: relative;
            aspect-ratio: 1;
            overflow: hidden;
            background: var(--el-fill-color-light);

            .image-item {
                width: 100%;
                height: 100%;
                display: block;
                cursor: zoom-in;
                transition: transform 0.3s ease;

                &:hover {
                    transform: scale(1.05);
                }
            }

            .image-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: 600;
                cursor: pointer;
                backdrop-filter: blur(2px);
            }
        }
    }
}

.card-footer {
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);

    .post-time {
        font-size: 13px;
        color: var(--circle-text-muted);
        margin-bottom: 8px;
    }

    .action-bar {
        display: flex;
        gap: 20px;
        align-items: center;
    }

    .action-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--circle-text-muted);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
        margin-left: -8px;

        &:hover {
            color: var(--el-color-primary);
            background: var(--el-fill-color-light);
        }

        .iconify {
            font-size: 16px;
        }
    }
}
</style>
