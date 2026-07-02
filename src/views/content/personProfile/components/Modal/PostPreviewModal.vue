<template>
    <Transition name="preview-fade">
        <div v-if="visible" class="post-preview-mask" @click.self="handleClose">
            <button type="button" class="preview-close" @click="handleClose" aria-label="关闭">
                <Icon icon="mdi:close" />
            </button>

            <div class="post-preview-panel">
                <div v-if="post" class="post-preview-body">
                    <div class="preview-media-pane">
                        <div v-if="isTextPost" class="preview-text-cover">
                            <Icon icon="mdi:format-quote-open" class="preview-text-quote" />
                            <div class="preview-text-shell">
                                <div class="preview-text-value">{{ textPreviewText }}</div>
                            </div>
                            <i class="preview-text-accent" aria-hidden="true"></i>
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
                                <VideoPreviewPane v-if="isVideoUrl(url)" :src="url" :poster="videoPosterUrl" />
                                <el-image
                                    v-else
                                    :src="url"
                                    fit="contain"
                                    class="preview-media-img"
                                    :preview-src-list="imagePreviewList"
                                    :initial-index="getImagePreviewIndex(url)"
                                    preview-teleported
                                    hide-on-click-modal
                                    @show="handleImagePreviewShow"
                                    @close="handleImagePreviewClose"
                                />
                            </el-carousel-item>
                        </el-carousel>
                        <VideoPreviewPane v-else-if="mediaList.length === 1 && isVideoUrl(mediaList[0])" :src="mediaList[0]" :poster="videoPosterUrl" />
                        <el-image
                            v-else-if="mediaList.length === 1"
                            :src="mediaList[0]"
                            fit="contain"
                            class="preview-media-img single"
                            :preview-src-list="imagePreviewList"
                            :initial-index="0"
                            preview-teleported
                            hide-on-click-modal
                            @show="handleImagePreviewShow"
                            @close="handleImagePreviewClose"
                        />
                        <div v-else class="preview-media-empty">暂无媒体内容</div>
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
                                <div v-if="hasDetailContent" class="detail-text detail-title" v-html="safeDetailContent"></div>
                                <div v-else class="detail-text empty">暂无正文内容</div>
                            </div>

                            <div v-if="tags.length" class="detail-tags">
                                <span v-for="tag in tags" :key="tag" class="detail-tag">#{{ tag }}</span>
                            </div>

                            <div class="detail-meta">
                                <span class="detail-date">发布于 {{ formatPostCreateDate(post) || '-' }}</span>
                                <span class="detail-comment-total">评论 {{ post.commentCount ?? 0 }}</span>
                            </div>

                            <el-divider class="detail-divider" />

                            <div class="detail-comments">
                                <div class="comment-count">共 {{ post.commentCount ?? 0 }} 条评论</div>
                                <LoadingState v-if="commentsLoading" class="comment-loading" size="small" />
                                <div v-else-if="comments.length" class="comment-list">
                                    <div v-for="item in comments" :key="item.id || item.commentId || item._id" class="comment-item">
                                        <button
                                            type="button"
                                            class="comment-avatar-btn"
                                            :disabled="!resolveCommentProfileUserId(item)"
                                            :aria-label="`查看${resolveCommentUser(item)}的个人主页`"
                                            @click.stop="handleCommentProfileClick(item)"
                                        >
                                            <el-avatar :size="28" :src="resolveAvatar(item.avatar)" />
                                        </button>
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
                                                    {{ resolveReplyState(item).open ? '收起回复' : '查看 ' + getCommentReplyCount(item) + ' 条回复' }}
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
                                                        <button
                                                            type="button"
                                                            class="reply-avatar-btn"
                                                            :disabled="!resolveCommentProfileUserId(reply)"
                                                            :aria-label="`查看${resolveCommentUser(reply)}的个人主页`"
                                                            @click.stop="handleCommentProfileClick(reply)"
                                                        >
                                                            <el-avatar :size="24" :src="resolveAvatar(reply.avatar)" />
                                                        </button>
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
                                                </div>
                                                <div v-if="!resolveReplyState(item).noMore" class="reply-more" @click="emit('load-replies', item)">
                                                    {{ resolveReplyState(item).loading ? '加载中...' : '加载更多回复' }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="comment-empty">
                                    <Icon icon="mdi:message-reply-text-outline" />
                                    <span>第一个留下你的看法吧～</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-actions action-bar" :class="{ 'is-composing': isComposerActive }">
                            <div class="action-input">
                                <el-input
                                    ref="commentInputRef"
                                    v-model="commentDraftValue"
                                    class="action-input-inner"
                                    maxlength="200"
                                    :placeholder="commentPlaceholder"
                                    @keydown.enter.exact.prevent="handleSubmit"
                                    @focus="handleInputFocus"
                                    @blur="handleInputBlur"
                                />
                            </div>

                            <button type="button" class="action-send" :disabled="!canSubmit" @mousedown.prevent @click="handleSubmit">发送</button>

                            <div class="action-icons">
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

                                <button type="button" class="action-icon comment" @click="focusInput" aria-label="评论">
                                    <Icon icon="mdi:comment-outline" />
                                    <span class="num">{{ post?.commentCount ?? 0 }}</span>
                                </button>

                                <button
                                    type="button"
                                    class="action-icon share"
                                    :class="{ loading: repostLoading }"
                                    :disabled="repostLoading"
                                    @click="emit('action', 'share')"
                                    aria-label="分享"
                                >
                                    <Icon icon="mdi:share-variant-outline" />
                                    <span class="num">{{ post?.repostCount ?? 0 }}</span>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsContentPersonProfileComponentsModalPostPreviewModal' })
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import LoadingState from '@/components/LoadingState/index.vue'
import { usePageScrollLock } from '@/utils/scrollLock'
import VideoPreviewPane from './VideoPreviewPane.vue'
import { POST_TYPE } from '@/utils/enum'
import { getCommentUserId, sanitizeRichTextHtml, stripHtmlToText } from '@/utils/content/common'

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
    'view-comment-profile',
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

const pageScrollLock = usePageScrollLock()
const commentInputRef = ref<any | null>(null)
const imageViewerVisible = ref(false)
const isFocused = ref(false)
const canSubmit = computed(() => Boolean(commentDraftValue.value?.trim()))
const isComposerActive = computed(() => isFocused.value || canSubmit.value || props.isActionInputExpanded)
const currentMediaIndex = ref(0)
const displayMediaIndex = computed(() => Math.min(currentMediaIndex.value + 1, Math.max(props.mediaList?.length || 1, 1)))
const postType = computed(() => String(props.post?.postType ?? ''))
const isTextPost = computed(() => postType.value === POST_TYPE.TEXT)
const detailText = computed(() => stripHtmlToText(props.post?.content))
const hasDetailContent = computed(() => Boolean(detailText.value))
const safeDetailContent = computed(() => sanitizeRichTextHtml(props.post?.content))
const textPreviewText = computed(() => detailText.value || '暂无正文内容')
const isVideoUrl = (url: string) => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(String(url || ''))
const imagePreviewList = computed<string[]>(() =>
    ((props.mediaList || []) as unknown[]).map((url: unknown) => String(url || '')).filter((url: string) => Boolean(url) && !isVideoUrl(url))
)
const getImagePreviewIndex = (url: string) => {
    const index = imagePreviewList.value.findIndex((item: string) => item === String(url || ''))
    return index >= 0 ? index : 0
}
const videoPosterUrl = computed(() => {
    const post = props.post || {}
    const direct = post?.cover || post?.coverUrl || post?.thumbnail || post?.poster || post?.image || ''
    return String(direct || '').trim()
})
const IMAGE_VIEWER_LOCK_CLASS = 'el-image-viewer-parent--hidden'
let imageViewerRepairTimer: ReturnType<typeof setTimeout> | null = null

const formatDateOnly = (value: unknown) => {
    const raw = String(value || '').trim()
    if (!raw) return ''
    const date = new Date(raw.replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) return raw.slice(0, 10)
    const pad = (item: number) => String(item).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const formatPostCreateDate = (post: Record<string, any> | null | undefined) => formatDateOnly(post?.createTime || post?.createDate || post?.createdAt || post?.time)

const clearImageViewerRepairTimer = () => {
    if (!imageViewerRepairTimer) return
    clearTimeout(imageViewerRepairTimer)
    imageViewerRepairTimer = null
}

const cleanupImageViewerLockArtifacts = () => {
    if (typeof document === 'undefined') return
    document.body.classList.remove(IMAGE_VIEWER_LOCK_CLASS)
    document.querySelectorAll('.el-image-viewer__wrapper').forEach(element => {
        element.parentNode?.removeChild(element)
    })
}

const cleanupVideoPreviewArtifacts = () => {
    if (typeof document === 'undefined') return
    document.querySelectorAll<HTMLVideoElement>('.post-preview-panel video').forEach(video => {
        try {
            video.pause()
            video.removeAttribute('src')
            video.load()
        } catch {
            
        }
    })
}

const repairModalScrollLockAfterImagePreview = () => {
    if (!visible.value) {
        cleanupImageViewerLockArtifacts()
        return
    }
    cleanupImageViewerLockArtifacts()
    pageScrollLock.setLocked(false)
    nextTick(() => {
        if (visible.value) pageScrollLock.setLocked(true)
    })
}

const handleImagePreviewShow = () => {
    clearImageViewerRepairTimer()
    imageViewerVisible.value = true
}

const handleImagePreviewClose = () => {
    imageViewerVisible.value = false
    clearImageViewerRepairTimer()
    imageViewerRepairTimer = setTimeout(() => {
        imageViewerRepairTimer = null
        if (!imageViewerVisible.value) repairModalScrollLockAfterImagePreview()
    }, 360)
}

const handleClose = () => {
    isFocused.value = false
    imageViewerVisible.value = false
    clearImageViewerRepairTimer()
    cleanupImageViewerLockArtifacts()
    cleanupVideoPreviewArtifacts()
    emit('close')
}

const focusInput = () => {
    commentInputRef.value?.focus?.()
}

const handleInputFocus = () => {
    isFocused.value = true
    emit('focus-comment')
}

const handleInputBlur = () => {
    isFocused.value = false
    if (!canSubmit.value) emit('blur-comment')
}

const handleSubmit = () => {
    if (!canSubmit.value) return
    emit('submit-comment')
}

const handleCarouselChange = (index: number) => {
    currentMediaIndex.value = index
}

type CommentItem = Record<string, any>

const resolveCommentUser = (item: CommentItem) =>
    item?.nickName || item?.userName || item?.username || item?.authorName || item?.user?.nickName || item?.user?.name || '??'

const resolveCommentText = (item: CommentItem) =>
    item?.content || item?.comment || item?.commentContent || item?.commentText || item?.text || item?.message || ''

const resolveCommentTime = (item: CommentItem) => item?.createTime || item?.createDate || item?.createdAt || item?.time || item?.timestamp || ''

const resolveCommentProfileUserId = (item: CommentItem) => getCommentUserId(item)

const handleCommentProfileClick = (item: CommentItem) => {
    if (!resolveCommentProfileUserId(item)) return
    emit('view-comment-profile', item)
}

watch(
    () => props.mediaList,
    () => {
        currentMediaIndex.value = 0
    },
    { deep: true }
)

watch(
    visible,
    (value, oldValue) => {
        pageScrollLock.setLocked(Boolean(value))
        if (!value && oldValue) {
            isFocused.value = false
            imageViewerVisible.value = false
            clearImageViewerRepairTimer()
            cleanupImageViewerLockArtifacts()
            cleanupVideoPreviewArtifacts()
        }
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    imageViewerVisible.value = false
    clearImageViewerRepairTimer()
    cleanupImageViewerLockArtifacts()
    cleanupVideoPreviewArtifacts()
})

defineExpose({ focusInput })
</script>

<style scoped lang="scss">
@keyframes iconPop {
    0% {
        transform: scale(0.8);
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
}




.preview-fade-enter-active,
.preview-fade-leave-active {
    transition:
        opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
        backdrop-filter 0.3s ease;
}

.preview-fade-enter-active .post-preview-panel,
.preview-fade-leave-active .post-preview-panel {
    transition:
        transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
        opacity 0.3s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
    opacity: 0;
    backdrop-filter: blur(0);
    -webkit-backdrop-filter: blur(0);
}

.preview-fade-enter-from .post-preview-panel,
.preview-fade-leave-to .post-preview-panel {
    opacity: 0;
    transform: scale(0.96) translateY(20px);
}


@keyframes itemFadeIn {
    0% {
        opacity: 0;
        transform: translateY(6px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.post-preview-mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 2000;
}

.post-preview-panel {
    width: min(1240px, calc(100vw - 96px));
    background: var(--el-bg-color);
    border-radius: 24px;
    overflow: hidden;
    box-shadow:
        0 24px 64px rgba(0, 0, 0, 0.16),
        0 0 1px var(--el-border-color-light);
    position: relative;
}

.preview-close {
    position: fixed;
    top: 24px;
    right: 24px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(15, 23, 42, 0.32);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
        background-color var(--app-motion-fast),
        border-color var(--app-motion-fast),
        color var(--app-motion-fast);
    z-index: 2010;
}

.preview-close:hover {
    background: rgba(15, 23, 42, 0.48);
    border-color: rgba(255, 255, 255, 0.34);
}

.preview-close:active {
    background: rgba(15, 23, 42, 0.58);
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
    background: var(--el-fill-color-darker);
    min-height: 520px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.preview-text-cover {
    --preview-text-color: color-mix(in srgb, var(--el-text-color-primary) 88%, #2c3e50);
    --preview-text-muted: color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
    --preview-text-accent: color-mix(in srgb, var(--el-text-color-primary) 14%, transparent);

    position: relative;
    width: 100%;
    height: 100%;
    min-height: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    overflow: hidden;
    isolation: isolate;
    background:
        radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--el-color-white) 82%, transparent), transparent 30%),
        radial-gradient(circle at 82% 78%, color-mix(in srgb, var(--el-fill-color-darker) 36%, transparent), transparent 34%),
        linear-gradient(135deg, var(--el-fill-color-extra-light) 0%, var(--el-fill-color-light) 100%);
    color: var(--preview-text-color);
}

.preview-text-cover::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
        linear-gradient(160deg, color-mix(in srgb, var(--el-color-white) 24%, transparent) 0%, transparent 46%),
        radial-gradient(circle at 50% 52%, color-mix(in srgb, var(--el-color-white) 28%, transparent), transparent 40%);
}

.preview-text-shell {
    position: relative;
    z-index: 1;
    width: min(78%, 560px);
    min-height: 42%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--preview-text-color);
}

.preview-text-value {
    width: 100%;
    font-size: clamp(22px, 3vw, 34px);
    line-height: 1.65;
    font-weight: 600;
    white-space: pre-wrap;
    word-break: break-word;
}

.preview-text-quote {
    position: absolute;
    left: 50%;
    top: 44%;
    z-index: 0;
    transform: translate(-50%, -50%);
    font-size: clamp(112px, 15vw, 180px);
    line-height: 1;
    color: var(--preview-text-muted);
    pointer-events: none;
}

.preview-text-accent {
    position: absolute;
    left: 50%;
    bottom: 38px;
    z-index: 1;
    width: 44px;
    height: 4px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: var(--preview-text-accent);
}

.preview-media-count {
    position: absolute;
    top: 16px;
    right: 16px;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.5px;
    color: var(--el-color-white);
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    pointer-events: none;
    z-index: 2;
    border: 1px solid rgba(255, 255, 255, 0.1);
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
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.2);
    padding: 4px 8px;
    border-radius: 12px;
    backdrop-filter: blur(4px);
}

.preview-carousel :deep(.el-carousel__indicator--horizontal) {
    padding: 6px 4px;
}

.preview-carousel :deep(.el-carousel__indicator--horizontal .el-carousel__button) {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.6);
    transition:
        width var(--app-motion-normal),
        border-radius var(--app-motion-normal),
        background-color var(--app-motion-normal);
}

.preview-carousel :deep(.el-carousel__indicator--horizontal.is-active .el-carousel__button) {
    width: 20px;
    border-radius: 4px;
    background-color: var(--el-color-white);
}

.preview-media-img {
    width: 100%;
    height: 100%;
    display: block;
    cursor: zoom-in;
}

.preview-media-img :deep(.el-image__inner) {
    cursor: zoom-in;
}

.preview-media-empty {
    color: var(--el-text-color-secondary);
    font-size: 14px;
}

.preview-detail-pane {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 0;
    padding: 0;
    overflow: hidden;
    min-height: 0;
    background: var(--el-bg-color);
}

.detail-scroll-area {
    min-height: 0;
    overflow: hidden;
    padding: 0 30px;
    display: flex;
    flex-direction: column;
}

.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 28px 30px 18px;
}

.follow-btn {
    height: 32px;
    padding: 0 16px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, var(--el-color-danger) 0%, var(--el-color-danger-light-3) 100%);
    border: none;
    color: var(--el-color-white);
    box-shadow: 0 8px 16px rgba(245, 108, 108, 0.25);
    transition:
        background-color var(--app-motion-fast),
        box-shadow var(--app-motion-fast),
        opacity var(--app-motion-fast);
}

.follow-btn:hover {
    opacity: 0.94;
    box-shadow: 0 8px 18px rgba(245, 108, 108, 0.28);
    background: linear-gradient(135deg, var(--el-color-danger-dark-2) 0%, var(--el-color-danger) 100%);
}

.follow-btn:active {
    box-shadow: 0 4px 8px rgba(245, 108, 108, 0.2);
}

.follow-btn.is-following {
    background: var(--el-fill-color);
    color: var(--el-text-color-regular);
    box-shadow: none;
}

.follow-btn.is-following:hover {
    background: var(--el-fill-color-darker);
    color: var(--el-text-color-primary);
}

.author-block {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.author-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.author-meta .name {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.detail-content {
    font-size: 18px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    white-space: normal;
    text-align: left;
    margin-top: 0;
}

.detail-text {
    margin: 0;
    font-weight: 500;
    letter-spacing: 0;
    word-break: break-word;

    :deep(p),
    :deep(blockquote),
    :deep(ul),
    :deep(ol) {
        margin: 0 0 12px;
    }

    :deep(p:last-child),
    :deep(blockquote:last-child),
    :deep(ul:last-child),
    :deep(ol:last-child) {
        margin-bottom: 0;
    }

    :deep(strong),
    :deep(b) {
        font-weight: 700;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
        margin: 0 0 12px;
        color: var(--el-text-color-primary);
        line-height: 1.35;
        font-weight: 700;
    }

    :deep(h1) {
        font-size: 22px;
    }

    :deep(h2) {
        font-size: 20px;
    }

    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
        font-size: 17px;
    }

    :deep(ul),
    :deep(ol) {
        padding-left: 22px;
    }

    :deep(blockquote) {
        padding: 10px 12px;
        border-left: 3px solid var(--el-color-primary);
        border-radius: 0 8px 8px 0;
        background: var(--el-fill-color-light);
        color: var(--el-text-color-regular);
    }

    :deep(a) {
        color: var(--el-color-primary);
        text-decoration: none;
    }
}

.detail-title {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.5;
}

.detail-text.empty {
    color: var(--el-text-color-placeholder);
    font-style: italic;
}

.detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
}

.detail-tag {
    font-size: 13px;
    padding: 4px 8px;
    border-radius: 6px;
    color: var(--client-primary, #14b8a6);
    background: rgba(20, 184, 166, 0.08);
    border: 0;
    white-space: nowrap;
    transition:
        background-color var(--app-motion-fast),
        color var(--app-motion-fast);
    cursor: pointer;
}

.detail-tag:hover {
    background: rgba(20, 184, 166, 0.13);
}

.detail-meta {
    display: flex;
    justify-content: flex-start;
    gap: 16px;
    font-size: 12px;
    color: #94a3b8;
    margin-top: 16px;
}

.detail-divider {
    margin: 20px 0 16px;
    opacity: 0.6;
}

.detail-comments {
    min-height: 0;
    flex: 1;
    overflow: auto;
    padding-top: 8px;
    padding-bottom: 10px;
    padding-right: 12px;
    text-align: left;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.detail-comments::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
}

.comment-count {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
    margin-bottom: 16px;
}

.comment-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.comment-item {
    display: flex;
    gap: 12px;
    animation: itemFadeIn 0.4s ease forwards;
}

.comment-avatar-btn,
.reply-avatar-btn {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: max-content;
    height: max-content;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    transition:
        opacity var(--app-motion-fast),
        transform var(--app-motion-fast);
}

.comment-avatar-btn:hover,
.reply-avatar-btn:hover {
    transform: translateY(-1px);
}

.comment-avatar-btn:disabled,
.reply-avatar-btn:disabled {
    cursor: default;
    opacity: 1;
    transform: none;
}

.comment-avatar-btn:focus-visible,
.reply-avatar-btn:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--el-color-primary) 38%, transparent);
    outline-offset: 2px;
}

.comment-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
}

.comment-user {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
}

.comment-text {
    font-size: 14px;
    color: var(--el-text-color-primary);
    line-height: 1.6;
    margin-top: 2px;
}

.comment-meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    display: inline-flex;
    align-items: center;
    gap: 16px;
    margin-top: 6px;
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
    padding: 4px 8px;
    margin-left: -8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition:
        background-color var(--app-motion-fast),
        color var(--app-motion-fast);
}

.comment-action:hover,
.reply-action:hover {
    background: var(--el-fill-color);
    color: var(--el-text-color-primary);
}

.comment-action.toggle {
    color: var(--el-color-primary);
}

.comment-action.toggle:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.comment-action.delete,
.reply-action.delete {
    color: var(--el-color-danger);
}

.comment-action.delete:hover,
.reply-action.delete:hover {
    background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}

.comment-action:disabled {
    cursor: default;
    opacity: 0.5;
}

.comment-replies {
    margin-top: 14px;
    padding-left: 14px;
    border-left: 2px solid var(--el-border-color-lighter);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.reply-item {
    display: flex;
    gap: 10px;
    animation: itemFadeIn 0.3s ease forwards;
}

.reply-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
}

.reply-user {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
}

.reply-text {
    font-size: 13px;
    color: var(--el-text-color-primary);
    line-height: 1.6;
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
    padding: 4px 0;
}

.reply-more {
    cursor: pointer;
    color: var(--el-color-primary);
    transition: opacity 0.2s;
}

.reply-more:hover {
    opacity: 0.8;
}

.comment-empty {
    margin-top: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 13px;
    color: #94a3b8;
}

.comment-empty :deep(svg) {
    width: 38px;
    height: 38px;
    padding: 9px;
    border-radius: 999px;
    box-sizing: border-box;
    color: var(--client-primary, #14b8a6);
    background: rgba(20, 184, 166, 0.08);
}

.comment-loading {
    margin-top: 24px;
    display: flex;
    justify-content: center;
}

.detail-actions.action-bar {
    --bottom-bar-transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    display: flex;
    align-items: center;
    height: 60px;
    gap: 0;
    padding: 10px 30px;
    box-sizing: border-box;
    border-radius: 0;
    background: var(--el-bg-color);
    border-top: 1px solid #f1f5f9;
    box-shadow: none;
    transition: var(--bottom-bar-transition);
}

.detail-actions.action-bar.is-composing .action-icons {
    max-width: 0;
    margin-left: 0;
    opacity: 0;
    pointer-events: none;
}

.action-input {
    flex: 1;
    min-width: 0;
    transition: var(--bottom-bar-transition);
}

.action-input :deep(.el-input__wrapper) {
    height: 40px;
    padding: 0 16px;
    border: 0;
    border-radius: 20px;
    background: #f1f5f9;
    box-shadow: none;
    transition: var(--bottom-bar-transition);
}

.action-input :deep(.el-input__wrapper:hover) {
    background: #e2e8f0;
}

.action-input :deep(.el-input__wrapper.is-focus) {
    background: #f8fafc;
    box-shadow: none;
}

.action-input :deep(.el-input__inner) {
    font-size: 14px;
    color: #334155;
}

.action-icons {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    gap: 16px;
    max-width: 260px;
    margin-left: 18px;
    overflow: hidden;
    opacity: 1;
    white-space: nowrap;
    transition: var(--bottom-bar-transition);
}

.action-send {
    flex: 0 0 auto;
    max-width: 0;
    height: 40px;
    margin-left: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 20px;
    background: var(--client-primary, #14b8a6);
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    opacity: 0;
    cursor: pointer;
    white-space: nowrap;
    transition: var(--bottom-bar-transition);
}

.detail-actions.action-bar.is-composing .action-send {
    max-width: 96px;
    margin-left: 12px;
    padding: 6px 18px;
    opacity: 1;
}

.detail-actions.action-bar.is-composing .action-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.detail-actions.action-bar.is-composing .action-send:hover:not(:disabled) {
    background: #0f766e;
}

.action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 40px;
    padding: 0;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition:
        background-color var(--app-motion-fast),
        color var(--app-motion-fast),
        opacity var(--app-motion-fast);
    user-select: none;
}

.action-icon :deep(svg) {
    font-size: 21px;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.action-icon .num {
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    color: #334155;
}

.action-icon:hover {
    background: transparent;
    color: var(--client-primary, #14b8a6);
}

.action-icon:active :deep(svg) {
    transform: scale(0.85);
}

.action-icon.loading,
.action-icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-icon.active.like {
    color: var(--el-color-danger);
}

.action-icon.active.like :deep(svg) {
    animation: iconPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.action-icon.active.collect {
    color: var(--el-color-warning);
}

.action-icon.active.collect :deep(svg) {
    animation: iconPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.action-icon.active.like .num,
.action-icon.active.collect .num {
    color: currentColor;
}

@media screen and (max-width: 768px) {
    .post-preview-mask {
        padding: 0;
        align-items: flex-end;
    }

    .post-preview-panel {
        width: 100vw;
        border-radius: 24px 24px 0 0;
    }

    .preview-close {
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        background: rgba(0, 0, 0, 0.4);
    }

    .post-preview-body {
        grid-template-columns: 1fr;
        height: 90vh;
        max-height: 90vh;
        overflow-y: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .post-preview-body::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
    }

    .preview-media-pane {
        min-height: auto;
        aspect-ratio: 4/5;
    }

    .preview-text-cover {
        padding: 32px 24px;
    }

    .preview-text-shell {
        width: 100%;
        min-height: 48%;
    }

    .preview-text-value {
        font-size: clamp(18px, 6vw, 26px);
        line-height: 1.6;
    }

    .preview-text-quote {
        font-size: 108px;
    }

    .preview-text-accent {
        bottom: 24px;
    }

    .preview-detail-pane {
        gap: 16px;
        padding: 0;
        height: auto;
    }

    .detail-header {
        padding: 20px;
    }

    .detail-scroll-area {
        padding: 0 20px;
    }

    .detail-actions.action-bar {
        position: sticky;
        bottom: 0;
        margin: 0;
        border-radius: 0;
        padding: 12px 20px 24px;
        border-top: 1px solid #f1f5f9;
    }

    .action-icon .num {
        font-size: 13px;
    }

    .action-icon {
        padding: 0 8px;
    }
}
</style>
