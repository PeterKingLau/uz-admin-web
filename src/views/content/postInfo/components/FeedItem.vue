<template>
    <div v-if="!isOriginalMissing" class="feed-card" :class="{ checked }">
        <div class="card-media" :class="{ 'is-clickable': canPreview }" @click="handleMediaClick">
            <div v-if="isTextPost" class="text-cover" :style="textCoverStyle">
                <span class="text-cover-quote">“</span>
                <div class="text-cover-text">{{ textCoverText }}</div>
                <span class="text-cover-accent"></span>
            </div>
            <el-image v-else-if="coverUrl" :src="coverUrl" fit="cover" class="media-image" loading="lazy">
                <template #placeholder>
                    <div class="media-placeholder">
                        <Icon icon="mdi:loading" class="placeholder-icon" />
                    </div>
                </template>
                <template #error>
                    <div class="media-placeholder">
                        <Icon icon="mdi:image-broken-variant" class="placeholder-icon" />
                    </div>
                </template>
            </el-image>
            <div v-else class="media-placeholder">
                <Icon icon="mdi:image-off-outline" class="placeholder-icon" />
                <span>暂无图片</span>
            </div>

            <div class="media-overlay" @click.stop>
                <div class="overlay-left">
                    <div class="batch-checkbox" :class="{ 'is-hidden': !isBatchMode }">
                        <el-checkbox :model-value="checked" @change="handleCheckboxChange" />
                    </div>
                    <div class="type-badge" :data-type="String(post?.postType ?? '')">
                        <Icon :icon="typeIcon" class="type-icon" />
                        <span class="type-text">{{ typeText }}</span>
                    </div>
                </div>

                <div class="overlay-right">
                    <el-tooltip content="编辑标签" placement="top">
                        <button type="button" class="icon-btn" @click="emit('edit-tag', post)">
                            <Icon icon="mdi:tag-outline" />
                        </button>
                    </el-tooltip>

                    <el-tooltip content="人工置顶" placement="top">
                        <button type="button" class="icon-btn" @click="emit('pin', post)">
                            <Icon icon="mdi:pin-outline" />
                        </button>
                    </el-tooltip>

                    <el-tooltip content="取消置顶" placement="top">
                        <button type="button" class="icon-btn" @click="emit('unpin', post)">
                            <Icon icon="mdi:pin-off-outline" />
                        </button>
                    </el-tooltip>

                    <el-tooltip content="删除该条" placement="top">
                        <button type="button" class="icon-btn danger" @click="handleDelete">
                            <Icon icon="mdi:trash-can-outline" />
                        </button>
                    </el-tooltip>
                </div>
            </div>

            <div v-if="isVideoPost" class="media-play">
                <Icon icon="mdi:play" />
            </div>
        </div>

        <div class="card-body">
            <div v-if="post.content" class="content-text">{{ post.content }}</div>
            <div v-else class="content-text empty">（无正文内容）</div>

            <div class="card-meta">
                <el-button link class="author" @click="handleProfileClick">
                    <el-avatar :size="24" :src="fullAvatar(post.avatar)" class="avatar">
                        {{ post.nickName?.charAt(0).toUpperCase() || 'U' }}
                    </el-avatar>
                    <span class="author-name">{{ post.nickName || '未知用户' }}</span>
                </el-button>

                <div class="like-count" :class="{ 'is-liked': isLiked }">
                    <Icon :icon="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" />
                    <span>{{ post.likeCount ?? 0 }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AUDIT_STATUS, ENUM_TAG_CONFIG, POST_TYPE } from '@/utils/enum'
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
}>()

const checked = computed(() => Boolean(props.checked))
const isBatchMode = computed(() => Boolean(props.batchMode))
const isOriginalMissing = computed(() => props.post?.originalPostId != null && props.post?.originalPost === null)
const isVideoPost = computed(() => String(props.post?.postType ?? '') === POST_TYPE.VIDEO)
const isTextPost = computed(() => String(props.post?.postType ?? '') === POST_TYPE.TEXT)
const textCoverText = computed(() => String(props.post?.content ?? '').trim() || '暂无文字')
const isLiked = computed(() => {
    const value = props.post?.like ?? props.post?.isLiked ?? props.post?.liked ?? props.post?.likeStatus ?? props.post?.isLike
    if (typeof value === 'boolean') return value
    return value != null ? String(value) === '1' : false
})

const typeText = computed(() => {
    const t = String(props.post?.postType)
    return t === POST_TYPE.TEXT ? '文字' : t === POST_TYPE.IMAGE ? '图文' : '视频'
})

const typeIcon = computed(() => {
    const t = String(props.post?.postType)
    return t === POST_TYPE.TEXT ? 'mdi:format-text' : t === POST_TYPE.IMAGE ? 'mdi:image' : 'mdi:video'
})

const parseMediaRaw = (raw: any) => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (!trimmed) return []
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed)
                return Array.isArray(parsed) ? parsed : [parsed]
            } catch {
                return trimmed
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean)
            }
        }
        return trimmed
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
    }
    if (typeof raw === 'object') return [raw]
    return []
}

const resolveMediaList = (...sources: any[]) => {
    for (const source of sources) {
        const list = parseMediaRaw(source)
        if (list.length) return list
    }
    return []
}

const mediaRawList = computed(() =>
    resolveMediaList(props.post?.mediaUrls, props.post?.originalPost?.mediaUrls, props.post?.files, props.post?.originalPost?.files)
)

const mediaFiles = computed(() =>
    mediaRawList.value
        .map(item => {
            if (typeof item === 'string') return item
            return item?.url || item?.src || item?.path || ''
        })
        .filter(Boolean)
)

const resolveMediaUrl = (url: string) => {
    if (!url) return ''
    return getImgUrl(url)
}

const resolveCoverCandidate = (item: any) => {
    if (!item) return ''
    if (typeof item === 'string') return item
    if (typeof item !== 'object') return ''
    return item.cover || item.coverUrl || item.thumbnail || item.thumb || item.poster || item.image || item.url || item.src || item.path || ''
}

const fullAvatar = (avatar: string) => resolveMediaUrl(avatar)
const isVideoUrl = (url: string) => {
    if (!url) return false
    return /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(url)
}

const coverUrl = computed(() => {
    const fallback =
        props.post?.cover ?? props.post?.coverUrl ?? props.post?.thumbnail ?? props.post?.poster ?? props.post?.image ?? props.post?.coverImage ?? ''
    if (fallback) return resolveMediaUrl(fallback)

    const candidates = mediaRawList.value.map(resolveCoverCandidate).filter(Boolean)
    const imageCandidate = candidates.find(url => url && !isVideoUrl(resolveMediaUrl(url)))
    if (imageCandidate) return resolveMediaUrl(imageCandidate)
    if (candidates.length > 0 && !isVideoUrl(resolveMediaUrl(candidates[0]))) return resolveMediaUrl(candidates[0])

    const mediaCover = mediaFiles.value.map(resolveMediaUrl).find(url => url && !isVideoUrl(url))
    if (mediaCover) return mediaCover
    return ''
})
const canPreview = computed(() => {
    if (isTextPost.value) return Boolean(textCoverText.value)
    return Boolean(coverUrl.value || mediaFiles.value.length > 0)
})

const textCoverStyle = computed(() => {
    if (!isTextPost.value) return {}
    const seed = String(props.post?.id ?? props.post?.postId ?? textCoverText.value)
    const palette = resolveTextCoverPalette(seed)
    return {
        '--text-cover-bg': palette.bg,
        '--text-cover-accent': palette.accent,
        '--text-cover-quote': palette.quote
    }
})

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

function handleMediaClick() {
    if (isBatchMode.value) {
        emit('select', !checked.value)
        return
    }

    if (!canPreview.value) return

    emit('preview', props.post)
}

function handleCheckboxChange(value: boolean) {
    if (!isBatchMode.value) return
    emit('select', value)
}

function handleProfileClick() {
    emit('view-profile', props.post)
}
</script>

<style scoped lang="scss">
.feed-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 18px;
    box-shadow: 0 12px 30px color-mix(in srgb, var(--el-color-black) 8%, transparent);
    overflow: hidden;
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease;
    display: flex;
    flex-direction: column;
}

.feed-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 40px color-mix(in srgb, var(--el-color-black) 12%, transparent);
    border-color: var(--el-border-color);
}

.feed-card.checked {
    border-color: var(--el-border-color-lighter);
    box-shadow: 0 12px 30px color-mix(in srgb, var(--el-color-black) 8%, transparent);
}

.card-media {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    background: var(--el-fill-color-light);
    overflow: hidden;
}

.card-media.is-clickable {
    cursor: pointer;
}

.media-image {
    width: 100%;
    height: 100%;
    display: block;
}

.text-cover {
    width: 100%;
    height: 100%;
    padding: 18px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-white) 22%, transparent), transparent)
        var(--text-cover-bg, var(--el-color-primary-light-8));
    color: var(--el-text-color-primary);
    text-align: center;
    overflow: hidden;
}

.text-cover-quote {
    position: absolute;
    top: 42px;
    left: 16px;
    font-size: 28px;
    line-height: 1;
    color: var(--text-cover-quote, color-mix(in srgb, var(--el-color-white) 45%, transparent));
    font-weight: 700;
}

.text-cover-text {
    font-size: 24px;
    line-height: 1.6;
    font-weight: 600;
    letter-spacing: 0.4px;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: pre-wrap;
}

.text-cover-accent {
    position: absolute;
    bottom: 14px;
    right: 14px;
    width: 28px;
    height: 4px;
    border-radius: 999px;
    background: var(--text-cover-accent, var(--el-color-primary));
    opacity: 0.9;
}

.media-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--el-text-color-placeholder);
    background: var(--el-fill-color-light);
    font-size: 13px;
}

.placeholder-icon {
    font-size: 22px;
}

.media-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    z-index: 2;
}

.overlay-left,
.overlay-right {
    display: flex;
    align-items: center;
    gap: 6px;
}

.batch-checkbox {
    width: 0;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    transition:
        width 0.16s ease,
        margin-right 0.16s ease,
        opacity 0.16s ease;
}

.batch-checkbox.is-hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    width: 0;
    margin-right: 0;
}

.batch-checkbox:not(.is-hidden) {
    width: 22px;
    margin-right: 6px;
}

.media-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-white);
    font-size: 24px;
    background: color-mix(in srgb, var(--el-color-black) 18%, transparent);
    z-index: 1;
    pointer-events: none;
}

.type-badge {
    height: 24px;
    padding: 0 8px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-extra-light);
    user-select: none;
    white-space: nowrap;
}

.type-badge .type-icon {
    font-size: 12px;
}

.type-badge[data-type='1'] {
    background: rgba(var(--el-color-primary-rgb), 0.12);
    border-color: rgba(var(--el-color-primary-rgb), 0.22);
    color: var(--el-color-primary);
}

.type-badge[data-type='2'] {
    background: rgba(var(--el-color-success-rgb), 0.12);
    border-color: rgba(var(--el-color-success-rgb), 0.22);
    color: var(--el-color-success);
}

.type-badge[data-type='3'] {
    background: rgba(var(--el-color-warning-rgb), 0.12);
    border-color: rgba(var(--el-color-warning-rgb), 0.22);
    color: var(--el-color-warning);
}

.audit-tag {
    border-radius: 999px;
}

.icon-btn {
    width: 22px;
    height: 22px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition:
        background 0.16s ease,
        color 0.16s ease,
        border-color 0.16s ease;
    padding: 0;
    cursor: pointer;
}

.icon-btn:hover {
    background: var(--el-fill-color-dark);
    color: var(--el-text-color-primary);
    border-color: var(--el-border-color);
}

.icon-btn.danger:hover {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    border-color: rgba(var(--el-color-danger-rgb), 0.35);
}

.card-body {
    padding: 10px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.content-text {
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.content-text.empty {
    color: var(--el-text-color-placeholder);
    font-style: italic;
}

.card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.author {
    display: inline-flex;
    align-items: center;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--el-text-color-primary);
    min-width: 0;
    height: auto;
}

.author :deep(.el-button__content) {
    display: inline-flex;
    align-items: center;
    gap: 0;
    min-width: 0;
}

.avatar {
    flex-shrink: 0;
}

.author-name {
    font-size: 12px;
    font-weight: 600;
    margin-left: 6px;
    max-width: 90px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.like-count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.like-count :deep(svg) {
    font-size: 12px;
}

.like-count.is-liked {
    color: var(--el-color-danger);
}
</style>
