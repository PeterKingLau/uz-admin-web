<template>
    <div v-if="!isOriginalMissing" class="feed-card" :class="{ checked, 'is-batch': isBatchMode }">
        <div class="card-media-wrapper" :class="{ 'is-clickable': canPreview }" @click="handleMediaClick">
            <div class="media-top-bar" @click.stop>
                <div class="type-tag" :data-type="post?.postType">
                    <Icon :icon="typeIcon" class="tag-icon" />
                    <span>{{ typeText }}</span>
                </div>

                <div class="admin-toolbar">
                    <el-tooltip content="编辑标签" placement="bottom" :show-after="500">
                        <div class="tool-btn" @click="emit('edit-tag', post)">
                            <Icon icon="mdi:tag-outline" />
                        </div>
                    </el-tooltip>
                    <el-tooltip :content="post.isTop ? '取消置顶' : '置顶'" placement="bottom" :show-after="500">
                        <div class="tool-btn" :class="{ active: post.isTop }" @click="handleTogglePin">
                            <Icon :icon="post.isTop ? 'mdi:pin-off-outline' : 'mdi:pin-outline'" />
                        </div>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="bottom" :show-after="500">
                        <div class="tool-btn danger" @click="emit('delete', currentPostId)">
                            <Icon icon="mdi:trash-can-outline" />
                        </div>
                    </el-tooltip>
                </div>
            </div>

            <div v-if="isBatchMode" class="batch-select-layer" @click.stop="handleCheckboxChange(!checked)">
                <div class="checkbox-circle" :class="{ active: checked }">
                    <Icon icon="mdi:check" v-if="checked" />
                </div>
            </div>

            <div v-if="isTextPost" class="text-cover" :style="textCoverStyle">
                <div class="quote-symbol">“</div>
                <div class="text-content-inner">{{ textCoverText }}</div>
                <div class="quote-symbol-end">”</div>
            </div>

            <el-image v-else-if="coverUrl" :src="coverUrl" fit="cover" class="media-image" loading="lazy">
                <template #placeholder>
                    <div class="image-slot">
                        <Icon icon="mdi:loading" class="spin-icon" />
                    </div>
                </template>
                <template #error>
                    <div class="image-slot error">
                        <Icon icon="mdi:image-broken-variant" />
                    </div>
                </template>
            </el-image>

            <div v-else class="media-empty">
                <Icon icon="mdi:image-off-outline" />
            </div>

            <div v-if="isVideoPost" class="play-overlay">
                <div class="play-button">
                    <Icon icon="mdi:play" />
                </div>
            </div>
        </div>

        <div class="card-bottom">
            <div class="content-text" :class="{ 'is-empty': !post.content }">
                {{ post.content || '无正文内容' }}
            </div>

            <div class="card-footer">
                <div class="footer-user" @click.stop="emit('view-profile', post)">
                    <el-avatar :size="28" :src="resolveAvatar(post.avatar)" class="user-avatar">
                        {{ post.nickName?.charAt(0).toUpperCase() || 'U' }}
                    </el-avatar>
                    <span class="user-name">{{ post.nickName || '未知用户' }}</span>
                </div>

                <div class="footer-actions">
                    <el-tooltip content="二维码" placement="top" v-if="isVideoPost">
                        <div class="action-item" @click.stop="emit('qrcode', post)">
                            <Icon icon="mdi:qrcode" />
                        </div>
                    </el-tooltip>
                    <div class="action-item like-btn" :class="{ active: post.isLiked }" @click.stop="emit('like', post)">
                        <div class="icon-anim-wrapper">
                            <Icon :icon="post.isLiked ? 'mdi:heart' : 'mdi:heart-outline'" />
                        </div>
                        <span class="count" v-if="post.likeCount">{{ post.likeCount }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { POST_TYPE } from '@/utils/enum'
import { getImgUrl } from '@/utils/img'
import { resolveTextCoverPalette } from '@/utils/textCover'

const props = defineProps<{
    post: any
    checked?: boolean
    batchMode?: boolean
}>()

const emit = defineEmits<{
    (e: 'select', value: boolean): void
    (e: 'delete', id: number | string): void
    (e: 'edit-tag', post: any): void
    (e: 'pin', post: any): void
    (e: 'unpin', post: any): void
    (e: 'preview', post: any): void
    (e: 'view-profile', post: any): void
    (e: 'like', post: any): void
    (e: 'qrcode', post: any): void
}>()

const post = computed(() => props.post || {})
const currentPostId = computed(() => props.post?.id ?? props.post?.postId ?? '')
const isBatchMode = computed(() => Boolean(props.batchMode))
const isOriginalMissing = computed(() => {
    const originalPostId = Number(props.post?.originalPostId ?? 0)
    return originalPostId > 0 && props.post?.originalPost === null
})
const postType = computed(() => String(props.post?.postType ?? ''))
const isVideoPost = computed(() => postType.value === POST_TYPE.VIDEO)
const isTextPost = computed(() => postType.value === POST_TYPE.TEXT)
const textCoverText = computed(() => String(props.post?.content ?? '').trim() || '暂无文字')

const TYPE_CONFIG: Record<string, { text: string; icon: string }> = {
    [POST_TYPE.TEXT]: { text: '文字', icon: 'mdi:format-text' },
    [POST_TYPE.IMAGE]: { text: '图文', icon: 'mdi:image-outline' },
    [POST_TYPE.VIDEO]: { text: '视频', icon: 'mdi:video-outline' }
}

const typeText = computed(() => TYPE_CONFIG[postType.value]?.text || '未知')
const typeIcon = computed(() => TYPE_CONFIG[postType.value]?.icon || 'mdi:help-circle-outline')

const parseMediaArray = (raw: any): any[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : [parsed]
        } catch {
            return raw
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
        }
    }
    return [raw]
}

const mediaRawList = computed(() => {
    const p = props.post
    return parseMediaArray(p?.mediaUrls || p?.originalPost?.mediaUrls || p?.files || p?.originalPost?.files)
})

const mediaFiles = computed(() => mediaRawList.value.map((item: any) => (typeof item === 'string' ? item : item?.url || item?.src || '')).filter(Boolean))

const resolveMediaUrl = (url: string) => {
    const raw = String(url || '').trim()
    if (!raw) return ''
    if (/^https?:\/\//i.test(raw)) return raw
    return getImgUrl(raw)
}

const resolveAvatar = (avatar: string) => resolveMediaUrl(avatar)

const isVideoUrl = (url: string) => /\.(mp4|mov|m3u8|webm)(\?|$)/i.test(url)

const coverUrl = computed(() => {
    const p = props.post
    const direct = p?.cover ?? p?.coverUrl ?? p?.thumbnail ?? p?.poster ?? p?.image
    if (direct) return resolveMediaUrl(direct)

    const candidates = mediaRawList.value.map((item: any) => (typeof item === 'object' ? item.cover || item.url : item)).filter(Boolean)
    const img = candidates.find(u => !isVideoUrl(u))
    if (img) return resolveMediaUrl(img)
    return candidates[0] ? resolveMediaUrl(candidates[0]) : ''
})

const canPreview = computed(() => isTextPost.value || Boolean(coverUrl.value || mediaFiles.value.length))

const textCoverStyle = computed(() => {
    if (!isTextPost.value) return {}
    const palette = resolveTextCoverPalette(String(currentPostId.value || textCoverText.value))
    return {
        '--card-accent': palette.accent,
        '--card-bg-gradient': `linear-gradient(135deg, ${palette.bg}, ${palette.accent}40)`
    } as Record<string, string>
})

const handleMediaClick = () => {
    if (isBatchMode.value) {
        emit('select', !props.checked)
    } else if (canPreview.value) {
        emit('preview', props.post)
    }
}

const handleCheckboxChange = (value: boolean) => {
    emit('select', value)
}

const handleTogglePin = () => {
    if (post.value?.isTop) {
        emit('unpin', post.value)
        return
    }
    emit('pin', post.value)
}
</script>

<style scoped lang="scss">
.feed-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
    border-radius: 18px;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--el-color-black) 4%, transparent);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    overflow: hidden;
    height: 100%;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 28px color-mix(in srgb, var(--el-color-black) 8%, transparent);
        border-color: var(--el-color-primary-light-7);
    }

    &.checked {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
    }
}

.card-media-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 9 / 14;
    background: var(--el-fill-color-lighter);
    overflow: hidden;
    cursor: default;

    &.is-clickable {
        cursor: pointer;
    }
}

.media-top-bar {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    z-index: 12;
}

.type-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: color-mix(in srgb, var(--el-color-black) 35%, transparent);
    color: var(--el-color-white);
    backdrop-filter: blur(4px);

    .tag-icon {
        font-size: 12px;
    }

    &[data-type='1'] {
        background: color-mix(in srgb, var(--el-color-primary) 78%, transparent);
    }
    &[data-type='2'] {
        background: color-mix(in srgb, var(--el-color-success) 78%, transparent);
    }
    &[data-type='3'] {
        background: color-mix(in srgb, var(--el-color-warning) 78%, transparent);
    }
}

.media-image {
    width: 100%;
    height: 100%;
    display: block;
    transition: transform 0.3s ease;

    &:hover {
        transform: scale(1.03);
    }
}

.image-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 24px;

    .spin-icon {
        animation: spin 1s linear infinite;
    }
}

.media-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--el-text-color-disabled);
    font-size: 32px;
    background: var(--el-fill-color-light);
}

.text-cover {
    width: 100%;
    height: 100%;
    padding: 24px;
    background: var(--card-bg-gradient);
    color: var(--el-color-white);
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    text-shadow: 0 2px 4px color-mix(in srgb, var(--el-color-black) 10%, transparent);

    .quote-symbol {
        font-size: 32px;
        line-height: 1;
        opacity: 0.6;
        margin-bottom: 4px;
        font-family: serif;
    }

    .text-content-inner {
        font-size: 15px;
        line-height: 1.5;
        font-weight: 600;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .quote-symbol-end {
        font-size: 32px;
        line-height: 1;
        opacity: 0.6;
        align-self: flex-end;
        margin-top: 4px;
        font-family: serif;
    }
}

.play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--el-color-black) 20%, transparent);
    pointer-events: none;

    .play-button {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--el-color-white) 90%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-color-primary);
        font-size: 26px;
        box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-black) 20%, transparent);
        backdrop-filter: blur(4px);
    }
}

.admin-toolbar {
    display: flex;
    gap: 6px;
    z-index: 12;

    .tool-btn {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--el-color-white) 90%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-primary);
        cursor: pointer;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 12%, transparent);
        font-size: 14px;
        transition: all 0.2s;

        &:hover {
            background: var(--el-color-white);
            color: var(--el-color-primary);
            transform: scale(1.04);
        }

        &.active {
            background: var(--el-color-primary);
            color: var(--el-color-white);
        }

        &.danger:hover {
            color: var(--el-color-danger);
        }
    }
}

.batch-select-layer {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: color-mix(in srgb, var(--el-color-white) 15%, transparent);
    display: flex;
    padding: 12px;
    cursor: pointer;

    .checkbox-circle {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid var(--el-color-white);
        background: color-mix(in srgb, var(--el-color-black) 40%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-color-white);
        font-size: 16px;
        box-shadow: 0 2px 4px color-mix(in srgb, var(--el-color-black) 20%, transparent);
        transition: all 0.2s;

        &.active {
            background: var(--el-color-primary);
            border-color: var(--el-color-primary);
        }
    }
}

.card-bottom {
    flex: 1;
    background: color-mix(in srgb, var(--el-fill-color-light) 70%, var(--el-color-white));
    border-top: 1px solid var(--el-border-color-extra-light);
    padding: 12px 14px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .content-text {
        font-size: 13px;
        line-height: 1.5;
        color: var(--el-text-color-regular);
        display: -webkit-box;
        -webkit-line-clamp: 1;
        line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-all;

        &.is-empty {
            color: var(--el-text-color-placeholder);
            font-style: italic;
            font-size: 12px;
        }
    }
}

.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    .footer-user {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        cursor: pointer;

        .user-avatar {
            border: 1px solid var(--el-border-color);
            flex-shrink: 0;
        }

        .user-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    .footer-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }

    .action-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 1px solid var(--el-border-color);
        background: transparent;
        color: var(--el-text-color-secondary);
        cursor: pointer;
        transition: all 0.2s;
        font-size: 13px;

        &:hover {
            border-color: var(--el-text-color-secondary);
            background: transparent;
            color: var(--el-text-color-primary);
        }

        &.like-btn {
            width: auto;
            min-width: 28px;
            padding: 0 6px;
            border-radius: 999px;
            gap: 4px;

            &:hover {
                color: var(--el-color-danger);
                border-color: color-mix(in srgb, var(--el-color-danger) 55%, var(--el-border-color));
                background: transparent;
            }

            &.active {
                color: var(--el-color-danger);
                border-color: color-mix(in srgb, var(--el-color-danger) 55%, var(--el-border-color));

                .icon-anim-wrapper {
                    animation: heart-bounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
            }

            .count {
                font-size: 11px;
                font-weight: 600;
                line-height: 1;
            }
        }
    }
}

@keyframes heart-bounce {
    0% {
        transform: scale(1);
    }
    40% {
        transform: scale(1.4);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
