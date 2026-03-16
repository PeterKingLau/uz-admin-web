<template>
    <div v-if="visible" class="post-preview-mask" @click.self="handleClose">
        <button type="button" class="preview-close" @click="handleClose" aria-label="关闭">
            <Icon icon="mdi:close" />
        </button>

        <div class="post-preview-panel">
            <div v-if="post" class="post-preview-body">
                <div class="preview-media-pane">
                    <div v-if="isTextPost" class="preview-text-cover" :style="textPreviewStyle">
                        <div class="preview-text-shell" :class="textPreviewSizeClass">
                            <span class="preview-text-quote quote-start">“</span>
                            <div class="preview-text-value">{{ textPreviewText }}</div>
                            <span class="preview-text-quote quote-end">”</span>
                        </div>
                    </div>
                    <el-carousel
                        v-else-if="mediaList.length > 1"
                        height="100%"
                        :autoplay="false"
                        :loop="false"
                        class="preview-carousel"
                        @change="handleCarouselChange"
                    >
                        <el-carousel-item v-for="(url, index) in mediaList" :key="`${post.id}-${index}`">
                            <el-image :src="url" fit="contain" class="preview-media-img" />
                        </el-carousel-item>
                    </el-carousel>
                    <el-image v-else-if="mediaList.length === 1" :src="mediaList[0]" fit="contain" class="preview-media-img single" />
                    <div v-else class="preview-media-empty">暂无图片</div>
                    <div v-if="!isTextPost && mediaList.length" class="preview-media-count">{{ displayMediaIndex }}/{{ mediaList.length }}</div>
                </div>

                <div class="preview-detail-pane">
                    <div class="detail-header">
                        <div class="author-block">
                            <el-avatar :size="34" :src="resolveAvatar(post.avatar)">
                                {{ post.nickName?.charAt(0).toUpperCase() || 'U' }}
                            </el-avatar>
                            <div class="author-meta">
                                <div class="name">{{ post.nickName || '未知用户' }}</div>
                            </div>
                        </div>
                        <el-button
                            v-if="!isAuthorSelf"
                            round
                            size="small"
                            class="follow-btn"
                            :class="{ 'is-following': isFollowing }"
                            :loading="followLoading"
                            @click="emit('follow')"
                        >
                            {{ isFollowing ? '已关注' : '关注' }}
                        </el-button>
                    </div>

                    <div class="detail-scroll-area">
                        <div class="detail-content">
                            <div v-if="post.content" class="detail-text">{{ post.content }}</div>
                            <div v-else class="detail-text empty">（无正文内容）</div>
                        </div>

                        <div v-if="tags.length" class="detail-tags">
                            <span v-for="tag in tags" :key="tag" class="detail-tag">#{{ tag }}</span>
                        </div>

                        <div class="detail-meta">
                            <span>编辑于 {{ formatRelativeTime(post.createTime) || '-' }}</span>
                            <span>评论 {{ post.commentCount ?? 0 }}</span>
                        </div>

                        <el-divider class="detail-divider" />

                        <div class="detail-comments">
                            <div class="comment-count">共 {{ post.commentCount ?? 0 }} 条评论</div>
                            <LoadingState v-if="commentsLoading" class="comment-loading" size="small" />
                            <div v-else-if="comments.length" class="comment-list">
                                <div v-for="item in comments" :key="item.id || item.commentId || item._id" class="comment-item">
                                    <el-avatar :size="28" :src="resolveAvatar(item.avatar)" />
                                    <div class="comment-body">
                                        <div class="comment-user">{{ resolveCommentUser(item) }}</div>
                                        <div class="comment-text">{{ resolveCommentText(item) || '-' }}</div>
                                        <div class="comment-meta">
                                            <span class="comment-time">{{ formatRelativeTime(resolveCommentTime(item)) || '-' }}</span>
                                            <button type="button" class="comment-action reply" @click="emit('reply-comment', item)">
                                                <Icon icon="mdi:comment-outline" />
                                                <span>回复</span>
                                            </button>
                                            <button
                                                v-if="canDeleteComment(item)"
                                                type="button"
                                                class="comment-action delete"
                                                :disabled="isDeleteCommentLoading(item)"
                                                @click="emit('delete-comment', item)"
                                            >
                                                删除
                                            </button>
                                        </div>
                                        <div class="comment-actions">
                                            <button
                                                v-if="getCommentReplyCount(item) > 0"
                                                type="button"
                                                class="comment-action toggle"
                                                @click="emit('toggle-replies', item)"
                                            >
                                                {{ resolveReplyState(item).open ? '收起回复' : `展开 ${getCommentReplyCount(item)} 条回复` }}
                                            </button>
                                        </div>
                                        <div v-if="resolveReplyState(item).open" class="comment-replies">
                                            <LoadingState v-if="resolveReplyState(item).loading" class="reply-loading" size="small" />
                                            <div v-else>
                                                <div
                                                    v-for="reply in resolveReplyState(item).list"
                                                    :key="reply.id || reply.commentId || reply._id"
                                                    class="reply-item"
                                                >
                                                    <el-avatar :size="24" :src="resolveAvatar(reply.avatar)" />
                                                    <div class="reply-body">
                                                        <div class="reply-user">{{ resolveCommentUser(reply) }}</div>
                                                        <div class="reply-text">{{ resolveCommentText(reply) || '-' }}</div>
                                                        <div class="reply-meta">
                                                            <span class="reply-time">{{ formatRelativeTime(resolveCommentTime(reply)) || '-' }}</span>
                                                            <button type="button" class="reply-action" @click="emit('reply-reply', reply, item)">
                                                                <Icon icon="mdi:comment-outline" />
                                                                <span>回复</span>
                                                            </button>
                                                            <button
                                                                v-if="canDeleteComment(reply)"
                                                                type="button"
                                                                class="reply-action delete"
                                                                :disabled="isDeleteCommentLoading(reply)"
                                                                @click="emit('delete-comment', reply, item)"
                                                            >
                                                                删除
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div v-if="!resolveReplyState(item).noMore" class="reply-more" @click="emit('load-replies', item)">
                                                    {{ resolveReplyState(item).loading ? '加载中...' : '查看更多回复' }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="comment-empty">
                                <Icon icon="mdi:sofa-outline" />
                                <span>暂无评论，快来抢沙发~</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-actions action-bar" :class="{ 'is-input-expanded': isActionInputExpanded }">
                        <div class="action-input">
                            <el-input
                                ref="commentInputRef"
                                v-model="commentDraftValue"
                                class="action-input-inner"
                                :type="isActionInputExpanded ? 'textarea' : 'text'"
                                :autosize="isActionInputExpanded ? { minRows: 1, maxRows: 6 } : false"
                                maxlength="200"
                                :placeholder="commentPlaceholder"
                                @keydown.enter.exact.prevent="handleSubmit"
                                @focus="emit('focus-comment')"
                            />
                        </div>

                        <div class="action-icons" :class="{ hidden: isActionInputExpanded }">
                            <button
                                type="button"
                                class="action-icon like"
                                :class="{ active: isLiked, loading: likeLoading }"
                                :disabled="likeLoading"
                                @click="emit('action', 'like')"
                                aria-label="点赞"
                            >
                                <Icon :icon="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" />
                                <span class="num">{{ post?.likeCount ?? 0 }}</span>
                            </button>

                            <button
                                type="button"
                                class="action-icon collect"
                                :class="{ active: isCollected, loading: bookmarkLoading }"
                                :disabled="bookmarkLoading"
                                @click="emit('action', 'collect')"
                                aria-label="收藏"
                            >
                                <Icon :icon="isCollected ? 'mdi:star' : 'mdi:star-outline'" />
                                <span class="num">{{ post?.bookmarkCount ?? 0 }}</span>
                            </button>

                            <button type="button" class="action-icon comment" @click="emit('focus-comment')" aria-label="评论">
                                <Icon icon="mdi:comment-outline" />
                                <span class="num">{{ post?.commentCount ?? 0 }}</span>
                            </button>

                            <button
                                type="button"
                                class="action-icon share"
                                :class="{ loading: repostLoading }"
                                :disabled="repostLoading"
                                @click="emit('action', 'share')"
                                aria-label="转发"
                            >
                                <Icon icon="mdi:share-variant-outline" />
                                <span class="num">{{ post?.repostCount ?? 0 }}</span>
                            </button>
                        </div>

                        <div v-if="isActionInputExpanded" class="action-toolbar">
                            <div class="action-buttons">
                                <el-button type="primary" size="small" class="action-send" :disabled="!canSubmit" @mousedown.prevent @click="handleSubmit">
                                    发送
                                </el-button>
                                <el-button size="small" class="action-cancel" @mousedown.prevent @click="handleCancel">取消</el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LoadingState from '@/components/LoadingState/index.vue'
import { POST_TYPE } from '@/utils/enum'
import { resolveTextCoverPalette } from '@/utils/textCover'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    post: { type: Object as any, default: null },
    mediaList: { type: Array as any, default: () => [] },
    tags: { type: Array as any, default: () => [] },
    comments: { type: Array as any, default: () => [] },
    commentsLoading: { type: Boolean, default: false },
    isFollowing: { type: Boolean, default: false },
    isLiked: { type: Boolean, default: false },
    isCollected: { type: Boolean, default: false },
    followLoading: { type: Boolean, default: false },
    likeLoading: { type: Boolean, default: false },
    bookmarkLoading: { type: Boolean, default: false },
    repostLoading: { type: Boolean, default: false },
    isAuthorSelf: { type: Boolean, default: false },
    commentDraft: { type: String, default: '' },
    commentPlaceholder: { type: String, default: '' },
    isActionInputExpanded: { type: Boolean, default: false },
    canDeleteComment: { type: Function as any, default: () => false },
    isDeleteCommentLoading: { type: Function as any, default: () => false },
    formatRelativeTime: { type: Function as any, required: true },
    resolveAvatar: { type: Function as any, required: true },
    getCommentReplyCount: { type: Function as any, required: true },
    resolveReplyState: { type: Function as any, required: true }
})

const emit = defineEmits([
    'update:modelValue',
    'update:commentDraft',
    'close',
    'follow',
    'action',
    'reply-comment',
    'reply-reply',
    'toggle-replies',
    'load-replies',
    'delete-comment',
    'focus-comment',
    'blur-comment',
    'submit-comment'
])

const visible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const commentDraftValue = computed({
    get: () => props.commentDraft,
    set: value => emit('update:commentDraft', value)
})

const commentInputRef = ref<any | null>(null)
const canSubmit = computed(() => Boolean(commentDraftValue.value?.trim()))
const currentMediaIndex = ref(0)
const displayMediaIndex = computed(() => Math.min(currentMediaIndex.value + 1, Math.max(props.mediaList?.length || 1, 1)))
const postType = computed(() => String(props.post?.postType ?? ''))
const isTextPost = computed(() => postType.value === POST_TYPE.TEXT)
const textPreviewText = computed(() => String(props.post?.content ?? '').trim() || '暂无文字')
const textPreviewCharCount = computed(() => Array.from(textPreviewText.value).length)
const textPreviewSizeClass = computed(() => {
    const count = textPreviewCharCount.value
    if (count <= 12) return 'size-xl'
    if (count <= 32) return 'size-lg'
    if (count <= 72) return 'size-md'
    return 'size-sm'
})
const textPreviewStyle = computed(() => {
    if (!isTextPost.value) return {}
    const seed = String(props.post?.id ?? props.post?.postId ?? textPreviewText.value)
    const palette = resolveTextCoverPalette(seed)
    return {
        '--preview-text-bg': `linear-gradient(135deg, ${palette.bg}, ${palette.accent}40)`,
        '--preview-text-accent': palette.accent
    } as Record<string, string>
})

const handleClose = () => {
    visible.value = false
    emit('close')
}

const focusInput = () => {
    commentInputRef.value?.focus?.()
}

const handleSubmit = () => {
    if (!canSubmit.value) return
    emit('submit-comment')
}

const handleCancel = () => {
    commentDraftValue.value = ''
    emit('blur-comment')
    commentInputRef.value?.blur?.()
}

const handleCarouselChange = (index: number) => {
    currentMediaIndex.value = index
}

type CommentItem = Record<string, any>

const resolveCommentUser = (item: CommentItem) =>
    item?.nickName || item?.userName || item?.username || item?.authorName || item?.user?.nickName || item?.user?.name || '用户'

const resolveCommentText = (item: CommentItem) =>
    item?.content || item?.comment || item?.commentContent || item?.commentText || item?.text || item?.message || ''

const resolveCommentTime = (item: CommentItem) => item?.createTime || item?.createDate || item?.createdAt || item?.time || item?.timestamp || ''

watch(
    () => props.mediaList,
    () => {
        currentMediaIndex.value = 0
    },
    { deep: true }
)

defineExpose({ focusInput })
</script>

<style scoped lang="scss">
.post-preview-mask {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.48);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.post-preview-panel {
    width: min(1240px, calc(100vw - 96px));
    background: var(--el-bg-color);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.22);
    position: relative;
}

.preview-close {
    position: fixed;
    top: 24px;
    left: 24px;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
        color 0.16s ease,
        border-color 0.16s ease,
        background 0.16s ease,
        box-shadow 0.16s ease;
}

.preview-close:hover {
    color: var(--el-text-color-primary);
    border-color: var(--el-border-color);
    background: var(--el-fill-color);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.25);
}

.post-preview-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(440px, 480px);
    background: var(--el-bg-color);
    height: 78vh;
    max-height: 78vh;
}

.preview-media-pane {
    position: relative;
    background: var(--el-fill-color-light);
    min-height: 520px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.preview-text-cover {
    width: 100%;
    height: 100%;
    min-height: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    background: var(--preview-text-bg);
    color: var(--el-color-white);
}

.preview-text-shell {
    position: relative;
    width: min(78%, 560px);
    padding: 44px 54px;
    text-align: center;
    color: #243042;
    text-shadow: 0 2px 10px rgba(255, 255, 255, 0.08);

    &.size-xl .preview-text-value {
        font-size: clamp(34px, 4.3vw, 54px);
        line-height: 1.28;
        font-weight: 700;
    }

    &.size-lg .preview-text-value {
        font-size: clamp(28px, 3.4vw, 42px);
        line-height: 1.36;
        font-weight: 680;
    }

    &.size-md .preview-text-value {
        font-size: clamp(22px, 2.8vw, 32px);
        line-height: 1.48;
        font-weight: 640;
    }

    &.size-sm .preview-text-value {
        font-size: clamp(18px, 2.2vw, 24px);
        line-height: 1.62;
        font-weight: 600;
    }
}

.preview-text-value {
    white-space: pre-wrap;
    word-break: break-word;
}

.preview-text-quote {
    position: absolute;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(56px, 7vw, 96px);
    line-height: 1;
    color: color-mix(in srgb, var(--preview-text-accent) 48%, white);
    opacity: 0.85;
    pointer-events: none;
}

.preview-text-quote.quote-start {
    left: 0;
    top: 0;
    transform: translate(-8%, -18%);
}

.preview-text-quote.quote-end {
    right: 0;
    bottom: 0;
    transform: translate(8%, 22%);
}

.preview-media-count {
    position: absolute;
    top: 14px;
    right: 14px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    color: var(--el-color-white);
    background: rgba(15, 23, 42, 0.65);
    pointer-events: none;
    z-index: 2;
}

.preview-carousel {
    width: 100%;
    height: 100%;
}

.preview-carousel :deep(.el-carousel__container) {
    height: 100%;
}

.preview-carousel :deep(.el-carousel__indicators) {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
}

.preview-carousel :deep(.el-carousel__indicator--horizontal) {
    padding: 6px 4px;
}

.preview-carousel :deep(.el-carousel__indicator--horizontal .el-carousel__button) {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background-color: rgba(255, 255, 255, 0.8);
}

.preview-carousel :deep(.el-carousel__indicator--horizontal.is-active .el-carousel__button) {
    width: 8px;
    height: 8px;
    background-color: var(--el-color-primary);
}

.preview-media-img {
    width: 100%;
    height: 100%;
    display: block;
}

.preview-media-empty {
    color: var(--el-text-color-secondary);
    font-size: 14px;
}

.preview-detail-pane {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 22px;
    padding: 28px 30px 24px;
    overflow: hidden;
    min-height: 0;
    background: var(--el-bg-color);
}

.detail-scroll-area {
    min-height: 0;
    overflow: auto;
    padding-right: 12px;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.detail-scroll-area::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
}

.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 0;
}

.follow-btn {
    height: 30px;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.4px;
    background: linear-gradient(135deg, var(--el-color-danger) 0%, var(--el-color-danger-light-3) 100%);
    border-color: transparent;
    color: var(--el-color-white);
    box-shadow: 0 10px 22px rgba(245, 108, 108, 0.35);
}

.follow-btn.is-following {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
    color: var(--el-text-color-regular);
    box-shadow: none;
}

.follow-btn:hover,
.follow-btn:focus {
    background: linear-gradient(135deg, var(--el-color-danger-dark-2) 0%, var(--el-color-danger) 100%);
    border-color: transparent;
    color: var(--el-color-white);
}

.follow-btn.is-following:hover,
.follow-btn.is-following:focus {
    background: var(--el-fill-color);
    border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
}

.author-block {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.author-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.author-meta .name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.detail-content {
    font-size: 16px;
    line-height: 1.95;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
    max-width: 380px;
    margin-top: 6px;
}

.detail-text {
    margin: 0;
    font-weight: 500;
    letter-spacing: 0.01em;
}

.detail-text.empty {
    color: var(--el-text-color-placeholder);
    font-style: italic;
    font-weight: 400;
}

.detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
}

.detail-tag {
    font-size: 12px;
    padding: 5px 12px;
    border-radius: 999px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid rgba(64, 158, 255, 0.18);
    white-space: nowrap;
}

.detail-meta {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-top: 22px;
}

.detail-divider {
    margin: 20px 0 14px;
}

.detail-comments {
    min-height: 0;
    padding-top: 8px;
    padding-bottom: 10px;
}

.comment-count {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-placeholder);
    margin-bottom: 12px;
}

.comment-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 14px;
}

.comment-item {
    display: flex;
    gap: 12px;
}

.comment-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.comment-user {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.comment-text {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.72;
    margin-top: 1px;
}

.comment-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.comment-meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-top: 1px;
}

.comment-actions {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
}

.comment-action,
.reply-action {
    border: none;
    background: transparent;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    line-height: 1.4;
}

.comment-action.toggle {
    color: var(--el-color-primary);
}

.comment-action.delete,
.reply-action.delete {
    color: var(--el-color-danger);
}

.comment-action.delete:hover,
.reply-action.delete:hover {
    color: var(--el-color-danger-dark-2);
}

.comment-action:disabled {
    cursor: default;
    opacity: 0.7;
}

.comment-replies {
    margin-top: 12px;
    padding-left: 10px;
    border-left: 2px solid var(--el-border-color-lighter);
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reply-item {
    display: flex;
    gap: 10px;
}

.reply-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.reply-user {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.reply-text {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.65;
}

.reply-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.reply-meta {
    margin-top: 6px;
    display: inline-flex;
    align-items: center;
    gap: 12px;
}

.reply-loading,
.reply-more {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.reply-more {
    cursor: pointer;
    color: var(--el-color-primary);
}

.comment-empty {
    margin-top: 18px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: color-mix(in srgb, var(--el-text-color-placeholder) 82%, transparent);
}

.comment-loading {
    margin-top: 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.detail-actions.action-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 20px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}

.detail-actions.action-bar.is-input-expanded {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
    padding: 14px 14px 12px;
    border-radius: 20px;
    background: var(--el-bg-color);
    border-color: var(--el-border-color-light);
}

.action-input {
    flex: 1;
    min-width: 0;
}

.action-input :deep(.el-input__wrapper) {
    border-radius: 999px;
    background: var(--el-fill-color-light);
    box-shadow: none;
    border: none;
    padding: 0 14px;
    height: 38px;
    transition:
        background 0.16s ease,
        border-color 0.16s ease;
}

.action-input :deep(.el-input__wrapper:hover) {
    background: var(--el-fill-color);
}

.action-input :deep(.el-input__wrapper.is-focus) {
    background: var(--el-bg-color);
    border-color: transparent;
    box-shadow: none;
}

.action-input :deep(.el-input__inner) {
    font-size: 14px;
}

.action-input :deep(.el-textarea__inner) {
    border-radius: 18px;
    background: var(--el-fill-color-light);
    border: none;
    font-size: 14px;
    padding: 10px 14px;
    min-height: 64px;
    resize: none;
}

.detail-actions.action-bar.is-input-expanded .action-input :deep(.el-textarea__inner) {
    background: var(--el-bg-color);
    border-color: transparent;
    box-shadow: none;
}

.action-icons {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.action-icons.hidden {
    display: none;
}

.action-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.action-tools {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--el-text-color-secondary);
}

.tool-btn {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    border: 1px solid transparent;
    background: var(--el-fill-color-light);
    color: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
        background 0.16s ease,
        color 0.16s ease,
        border-color 0.16s ease;
}

.tool-btn:hover {
    background: var(--el-fill-color);
    border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
}

.action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.action-send {
    border-radius: 999px;
    padding: 0 18px;
    height: 32px;
    font-weight: 600;
    background: var(--el-color-danger);
    border-color: transparent;
    color: var(--el-color-white);
    box-shadow: 0 10px 22px rgba(255, 111, 142, 0.3);
}

.action-send:hover,
.action-send:focus {
    background: var(--el-color-danger-dark-2);
    border-color: transparent;
}

.action-cancel {
    border-radius: 999px;
    padding: 0 16px;
    height: 32px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    color: var(--el-text-color-regular);
}

.action-cancel:hover,
.action-cancel:focus {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
}

.action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 34px;
    padding: 0 10px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition:
        background 0.16s ease,
        color 0.16s ease,
        transform 0.16s ease;
    user-select: none;
}

.action-icon :deep(svg) {
    font-size: 18px;
}

.action-icon .num {
    font-size: 13px;
    line-height: 1;
    color: var(--el-text-color-secondary);
}

.action-icon:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
}

.action-icon:active {
    transform: scale(0.98);
}

.action-icon.loading,
.action-icon:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.action-icon.active.like {
    color: var(--el-color-danger);
}

.action-icon.active.collect {
    color: var(--el-color-warning);
}

.action-icon.active.like .num,
.action-icon.active.collect .num {
    color: currentColor;
}

@media screen and (max-width: 768px) {
    .post-preview-mask {
        padding: 12px;
        align-items: flex-start;
    }

    .post-preview-panel {
        width: 100%;
        border-radius: 18px;
    }

    .preview-close {
        top: 12px;
        left: 12px;
        width: 40px;
        height: 40px;
    }

    .post-preview-body {
        grid-template-columns: 1fr;
        height: auto;
        max-height: none;
    }

    .preview-media-pane {
        min-height: 260px;
    }

    .preview-text-cover {
        padding: 28px 20px;
    }

    .preview-text-shell {
        width: 100%;
        padding: 28px 30px;
    }

    .preview-detail-pane {
        gap: 14px;
        padding: 18px 18px 16px;
        max-height: none;
    }

    .detail-actions.action-bar {
        gap: 10px;
        padding: 10px;
    }

    .action-icon .num {
        display: none;
    }

    .action-icon {
        padding: 0 8px;
    }
}
</style>
