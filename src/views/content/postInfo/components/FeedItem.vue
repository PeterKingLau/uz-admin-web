<template>
    <div class="feed-item" :class="{ 'is-checked': checked }" @click="$emit('select', !checked)">
        <div class="feed-left">
            <div class="select-box" @click.stop>
                <el-checkbox :model-value="checked" @change="$emit('select', $event)" />
            </div>
            <div class="type-indicator" :class="post.postType">
                <Icon :icon="typeIcon" class="type-icon" />
                <span class="type-text">{{ typeText }}</span>
            </div>
        </div>

        <div class="feed-body">
            <div class="feed-header">
                <div class="user-info">
                    <el-avatar :size="36" :src="fullAvatar(post.avatar)" class="avatar">
                        {{ post.nickName?.charAt(0).toUpperCase() || 'U' }}
                    </el-avatar>
                    <div class="meta">
                        <div class="top-row">
                            <span class="username">{{ post.nickName || '未知用户' }}</span>
                        </div>
                        <div class="time">{{ post.createTime || '-' }}</div>
                    </div>
                </div>

                <div class="header-actions">
                    <el-tag :type="getStatusType(post.auditStatus)" size="small" effect="light" class="audit-tag">
                        {{ getAuditStatusName(post.auditStatus) }}
                    </el-tag>

                    <el-tooltip content="编辑标签" placement="top">
                        <div class="edit-btn" @click.stop="$emit('edit-tag', post)">
                            <Icon icon="mdi:tag-outline" />
                        </div>
                    </el-tooltip>

                    <el-tooltip content="删除该条" placement="top">
                        <div class="delete-btn" @click.stop="handleDelete">
                            <Icon icon="mdi:trash-can-outline" />
                        </div>
                    </el-tooltip>
                </div>
            </div>

            <div class="feed-content-wrapper">
                <div v-if="post.content" class="feed-text">
                    {{ post.content }}
                </div>
                <div v-else class="feed-text empty">（无正文内容）</div>

                <div class="feed-media" v-if="mediaFiles.length > 0" @click.stop>
                    <MediaPreview :post-type="post.postType" :media-urls="mediaFiles" :audit-status="post.auditStatus" />
                </div>

                <div class="tags-wrapper" v-if="post.tags && post.tags.length > 0">
                    <span v-for="tag in post.tags" :key="tag.tagId" class="hash-tag"> # {{ tag.tagName }} </span>
                </div>
            </div>

            <div class="feed-footer">
                <div class="stat-item">
                    <Icon icon="mdi:thumb-up-outline" />
                    <span>{{ post.likeCount ?? 0 }}</span>
                </div>
                <div class="stat-item">
                    <Icon icon="mdi:comment-outline" />
                    <span>{{ post.commentCount ?? 0 }}</span>
                </div>
                <div class="stat-item">
                    <Icon icon="mdi:share-variant-outline" />
                    <span>{{ post.repostCount ?? 0 }}</span>
                </div>
                <div class="stat-item">
                    <Icon :icon="(post.bookmarkCount ?? 0) > 0 ? 'mdi:bookmark' : 'mdi:bookmark-outline'" />
                    <span>{{ post.bookmarkCount ?? 0 }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MediaPreview from '@/components/MediaPreview/index.vue'
import { AUDIT_STATUS, ENUM_TAG_CONFIG } from '@/utils/enum'

const props = defineProps<{
    post: any
    checked?: boolean
}>()

const emit = defineEmits<{
    (e: 'select', value: boolean): void
    (e: 'delete', id: number | string): void
    (e: 'edit-tag', post: any): void
}>()

const typeText = computed(() => {
    const t = String(props.post?.postType)
    return t === '1' ? '文字' : t === '2' ? '图文' : '视频'
})

const typeIcon = computed(() => {
    const t = String(props.post?.postType)
    return t === '1' ? 'mdi:format-text' : t === '2' ? 'mdi:image' : 'mdi:video'
})

const mediaFiles = computed(() => {
    let rawList: any[] = []

    if (props.post.mediaUrls) {
        if (Array.isArray(props.post.mediaUrls)) {
            rawList = props.post.mediaUrls
        } else if (typeof props.post.mediaUrls === 'string') {
            try {
                const parsed = JSON.parse(props.post.mediaUrls)
                rawList = Array.isArray(parsed) ? parsed : [props.post.mediaUrls]
            } catch (e) {
                rawList = [props.post.mediaUrls]
            }
        }
    } else if (props.post.files && Array.isArray(props.post.files)) {
        rawList = props.post.files
    }

    return rawList
        .map(item => {
            if (typeof item === 'string') return item
            return item?.url || item?.src || item?.path || ''
        })
        .filter(url => !!url)
})

const fullAvatar = (avatar: string) => {
    if (!avatar) return ''
    if (/^https?:\/\//.test(avatar)) return avatar
    return (import.meta.env.VITE_APP_BASE_API || '') + avatar
}

const auditStatusAlias: Record<string, string> = {
    PENDING: AUDIT_STATUS.PENDING,
    APPROVED: AUDIT_STATUS.APPROVED,
    REJECTED: AUDIT_STATUS.REJECTED
}

function resolveAuditStatusKey(status: string) {
    const key = String(status ?? '')
    if (ENUM_TAG_CONFIG.AUDIT_STATUS[key]) return key
    return auditStatusAlias[key] || key
}

function getStatusType(status: string) {
    const key = resolveAuditStatusKey(status)
    return ENUM_TAG_CONFIG.AUDIT_STATUS[key]?.type || 'warning'
}

function getAuditStatusName(status: string) {
    const key = resolveAuditStatusKey(status)
    return ENUM_TAG_CONFIG.AUDIT_STATUS[key]?.label || status
}

function handleDelete() {
    emit('delete', props.post.id)
}
</script>

<style scoped lang="scss">
.feed-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
    background-color: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-light);
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
        background-color: var(--el-bg-color);
        border-color: var(--el-border-color-darker);
        box-shadow: var(--el-box-shadow-light);
    }

    &.is-checked {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);

        html.dark & {
            background-color: rgba(64, 158, 255, 0.1);
        }

        .type-indicator {
            background-color: transparent;
        }
    }
}

.feed-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    min-width: 48px;

    .type-indicator {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-regular);
        font-size: 12px;

        .type-icon {
            font-size: 20px;
            margin-bottom: 2px;
        }
    }
}

.feed-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.feed-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .user-info {
        display: flex;
        align-items: center;
        gap: 10px;

        .meta {
            display: flex;
            flex-direction: column;

            .top-row {
                display: flex;
                align-items: center;
                gap: 8px;

                .username {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--el-text-color-primary);
                }
            }

            .time {
                font-size: 12px;
                color: var(--el-text-color-secondary);
                margin-top: 2px;
            }
        }
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .delete-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 4px;
            color: var(--el-text-color-secondary);
            transition: all 0.2s;

            &:hover {
                background-color: var(--el-color-danger-light-9);
                color: var(--el-color-danger);
            }

            font-size: 18px;
        }

        .edit-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 4px;
            color: var(--el-text-color-secondary);
            transition: all 0.2s;

            &:hover {
                background-color: var(--el-color-primary-light-9);
                color: var(--el-color-primary);
            }

            font-size: 18px;
        }
    }
}

.feed-content-wrapper {
    .feed-text {
        font-size: 14px;
        line-height: 1.6;
        color: var(--el-text-color-regular);
        white-space: pre-wrap;

        &.empty {
            color: var(--el-text-color-placeholder);
            font-style: italic;
        }
    }

    .feed-media {
        margin-top: 12px; /* 增加图片与文字的间距 */
        border-radius: 8px;
        overflow: hidden;
        background-color: var(--el-fill-color-lighter);
    }

    .tags-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px; /* 标签在媒体下方，增加间距 */

        .hash-tag {
            font-size: 12px;
            color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 500;
            cursor: default;
            transition: all 0.2s;

            &:hover {
                background-color: var(--el-color-primary-light-8);
            }
        }
    }
}

.feed-footer {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);

    .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--el-text-color-secondary);

        &:hover {
            color: var(--el-color-primary);
        }
    }
}
</style>
