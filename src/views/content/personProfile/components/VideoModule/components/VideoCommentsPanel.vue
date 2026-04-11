<template>
    <div class="comment-panel" :class="{ open: visible, 'with-collection': showCollectionTab, 'with-works': showAuthorWorksTab }" @click.stop>
        <div class="comment-panel-header">
            <div class="header-left">
                <el-tabs v-model="activeTabModel" class="panel-tabs" @tab-click="emit('tab-click', $event)">
                    <el-tab-pane name="detail" label="详情" />
                    <el-tab-pane v-if="showAuthorWorksTab" name="authorWorks" label="TA的作品" />
                    <el-tab-pane name="comments" label="评论" />
                    <el-tab-pane v-if="showCollectionTab" name="collection" label="合集" />
                </el-tabs>
            </div>
            <div class="panel-close" @click="visibleModel = false">
                <Icon icon="ep:close" />
            </div>
        </div>

        <div ref="commentBodyRef" class="comment-panel-body" @scroll="handleBodyScroll">
            <template v-if="activeTab === 'comments'">
                <div v-if="commentItems.length === 0 && !commentLoading" class="comment-empty">
                    <Icon icon="mdi:comment-outline" class="empty-icon" />
                    <span>暂无评论，快来抢沙发~</span>
                </div>

                <div class="comment-list-wrapper">
                    <div v-for="(comment, index) in renderedCommentItems" :key="getCommentId(comment) ?? index" class="comment-item">
                        <el-avatar :size="32" :src="getCommentAvatar(comment)" class="comment-avatar" />
                        <div class="comment-main">
                            <div class="comment-header">
                                <span class="comment-name">{{ getCommentName(comment) }}</span>
                                <span class="comment-time">{{ formatCommentTime(comment.createTime) }}</span>
                            </div>
                            <div class="comment-content" @click="emit('reply-comment', comment)">
                                {{ comment.content }}
                            </div>

                            <div class="comment-footer">
                                <div class="footer-actions">
                                    <span class="action-btn" @click="emit('reply-comment', comment)">回复</span>
                                    <span v-if="canDeleteComment(comment)" class="action-btn delete" @click.stop="emit('delete-comment', comment)">删除</span>
                                </div>

                                <div
                                    v-if="Number(comment.replyCount || 0) > 0 || resolveReplyState(comment).list?.length > 0"
                                    class="expand-reply-btn"
                                    @click="handleToggleReplies(comment)"
                                >
                                    <span class="line"></span>
                                    <span>{{ resolveReplyToggleText(comment) }}</span>
                                    <Icon :icon="resolveReplyState(comment).open ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="icon-chevron" />
                                </div>
                            </div>

                            <div v-if="resolveReplyState(comment).open" class="comment-replies">
                                <div v-for="(reply, rIndex) in getRenderedReplies(comment)" :key="getCommentId(reply) ?? rIndex" class="reply-item">
                                    <el-avatar :size="24" :src="getCommentAvatar(reply)" class="reply-avatar" />
                                    <div class="reply-main">
                                        <div class="reply-header">
                                            <span class="reply-name">{{ getCommentName(reply) }}</span>
                                            <span v-if="reply.replyUserNickName" class="reply-target">
                                                <Icon icon="mdi:menu-right" class="arrow-icon" />
                                                <span>{{ reply.replyUserNickName }}</span>
                                            </span>
                                        </div>
                                        <div class="reply-content" @click="emit('reply-reply', reply, comment)">
                                            {{ reply.content }}
                                        </div>
                                        <div class="reply-footer">
                                            <span class="reply-time">{{ formatCommentTime(reply.createTime) }}</span>
                                            <span class="action-btn" @click="emit('reply-reply', reply, comment)">回复</span>
                                            <span v-if="canDeleteComment(reply)" class="action-btn delete" @click.stop="emit('delete-comment', reply, comment)">
                                                删除
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="resolveLoadMoreReplyText(comment)" class="load-more-replies">
                                    <span class="load-more-text" @click="handleLoadMoreReplies(comment)">
                                        {{ resolveLoadMoreReplyText(comment) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <LoadingState v-if="commentLoading" class="comment-loading" theme="inverse" :min-height="200" />
                <div
                    v-if="activeTab === 'comments' && (hasMoreRenderedComments || !commentNoMore)"
                    ref="commentLoadTriggerRef"
                    class="scroll-load-trigger"
                    aria-hidden="true"
                ></div>
                <div v-if="commentNoMore && commentItems.length > 0" class="comment-end">- 没有更多评论了 -</div>
            </template>

            <template v-else-if="activeTab === 'detail'">
                <div class="detail-panel">
                    <div class="detail-section">
                        <div class="detail-label">正文</div>
                        <div v-if="detailContent" class="detail-content-text">{{ detailContent }}</div>
                        <div v-else class="detail-empty">暂无正文内容</div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-label">标签</div>
                        <div v-if="detailTags.length" class="detail-tags">
                            <span v-for="tag in detailTags" :key="tag" class="detail-tag">#{{ tag }}</span>
                        </div>
                        <div v-else class="detail-empty">暂无标签</div>
                    </div>
                </div>
            </template>

            <template v-else-if="activeTab === 'authorWorks'">
                <div class="author-works-panel">
                    <div class="author-summary-card">
                        <el-avatar :size="52" :src="authorAvatar" class="author-summary-avatar" />
                        <div class="author-summary-main">
                            <div class="author-summary-top">
                                <div class="author-summary-name">@{{ authorName || '未知用户' }}</div>
                                <button
                                    v-if="showFollowButton"
                                    type="button"
                                    class="author-follow-btn"
                                    :class="{ active: followButtonActive }"
                                    @click="emit('toggle-follow-author')"
                                >
                                    {{ followButtonLabel || '+ 关注' }}
                                </button>
                            </div>
                            <div class="author-summary-stats">
                                <span>{{ formatCount(authorFollowers) }}粉丝</span>
                                <span class="dot">|</span>
                                <span>{{ formatCount(authorLikedCount) }}获赞</span>
                            </div>
                            <div v-if="authorSignature" class="author-summary-signature">{{ authorSignature }}</div>
                        </div>
                    </div>

                    <LoadingState v-if="authorWorksLoading && authorVideoPosts.length === 0" class="collection-loading" theme="inverse" :min-height="200" />
                    <div v-else-if="authorVideoPosts.length === 0" class="collection-empty">暂无作品</div>
                    <div v-else class="author-works-grid">
                        <button
                            v-for="item in renderedAuthorVideoPosts"
                            :key="getPostId(item) ?? item.id"
                            type="button"
                            class="author-work-card"
                            :class="{ active: isCurrentCollectionPost(item) }"
                            @click="emit('select-collection', item)"
                        >
                            <div class="author-work-cover">
                                <el-image v-if="resolveCollectionCover(item)" :src="resolveCollectionCover(item)" fit="cover" class="author-work-image" />
                                <div v-else class="collection-thumb-empty">
                                    <Icon icon="mdi:video-outline" />
                                </div>
                                <div class="author-work-overlay">
                                    <div class="author-work-like">
                                        <Icon icon="mdi:heart-outline" />
                                        <span>{{ formatCount(item.likeCount) }}</span>
                                    </div>
                                </div>
                                <div v-if="isCurrentCollectionPost(item)" class="playing-overlay">
                                    <div class="bar-anim"><span></span><span></span><span></span></div>
                                </div>
                            </div>
                            <div class="author-work-title">{{ resolveCollectionTitle(item) }}</div>
                        </button>
                    </div>
                    <LoadingState v-if="authorWorksLoading && authorVideoPosts.length > 0" class="comment-loading" theme="inverse" :min-height="120" />
                    <div
                        v-if="activeTab === 'authorWorks' && (hasMoreRenderedAuthorWorks || !authorWorksNoMore)"
                        ref="worksLoadTriggerRef"
                        class="scroll-load-trigger"
                        aria-hidden="true"
                    ></div>
                    <div v-if="authorWorksNoMore && authorVideoPosts.length > 0" class="comment-end">- 没有更多作品了 -</div>
                </div>
            </template>

            <template v-else>
                <div class="collection-panel-title">
                    <Icon icon="mdi:playlist-play" class="collection-icon" />
                    合集 · {{ activeCollectionName || '未命名合集' }}
                </div>
                <LoadingState v-if="collectionLoading" class="collection-loading" theme="inverse" :min-height="200" />
                <div v-else-if="collectionVideoPosts.length === 0" class="collection-empty">暂无合集视频</div>
                <div v-else class="collection-list">
                    <button
                        v-for="item in collectionVideoPosts"
                        :key="getPostId(item) ?? item.id"
                        type="button"
                        class="collection-item"
                        :class="{ active: isCurrentCollectionPost(item) }"
                        @click="emit('select-collection', item)"
                    >
                        <div class="collection-thumb">
                            <el-image v-if="resolveCollectionCover(item)" :src="resolveCollectionCover(item)" fit="cover" class="collection-cover" />
                            <div v-else class="collection-thumb-empty">
                                <Icon icon="mdi:video-outline" />
                            </div>
                            <div v-if="isCurrentCollectionPost(item)" class="playing-overlay">
                                <div class="bar-anim"><span></span><span></span><span></span></div>
                            </div>
                        </div>
                        <div class="collection-info">
                            <div class="collection-title">{{ resolveCollectionTitle(item) }}</div>
                            <div class="collection-meta">{{ formatDate(item.createTime) }}</div>
                        </div>
                    </button>
                </div>
            </template>
        </div>

        <div v-if="activeTab === 'comments'" class="comment-panel-footer">
            <transition name="fade">
                <div v-if="replyTarget" class="reply-context-bar">
                    <div class="reply-info">
                        <span class="prefix">回复</span>
                        <span class="name">@{{ replyTarget.replyUserName }}</span>
                    </div>
                    <div class="cancel-reply" @click="emit('clear-reply')">
                        <Icon icon="ep:close" />
                    </div>
                </div>
            </transition>
            <div class="input-area">
                <el-input
                    ref="commentInputRef"
                    :model-value="commentDraft"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 4 }"
                    maxlength="200"
                    :placeholder="commentPlaceholder"
                    class="comment-input"
                    @update:modelValue="emit('update:commentDraft', String($event ?? ''))"
                    @keydown.enter.exact.prevent="emit('submit-comment')"
                />
                <div class="send-btn" :class="{ disabled: !commentDraft.trim() }" @click="emit('submit-comment')">
                    <Icon icon="mdi:send" class="send-icon" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsContentPersonProfileComponentsVideoModuleComponentsVideoCommentsPanel' })
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue'
import LoadingState from '@/components/LoadingState/index.vue'
import {
    formatCommentTime,
    formatCount,
    formatDate,
    getCommentAvatar,
    getCommentName,
    getPostId,
    resolveCollectionCover,
    resolveCollectionTitle
} from '@/features/content/personProfile/videoModule/helpers'

const props = defineProps({
    visible: { type: Boolean, default: false },
    activeTab: { type: String, default: 'comments' },
    localCommentCount: { type: Number, default: 0 },
    showAuthorWorksTab: { type: Boolean, default: false },
    authorName: { type: String, default: '' },
    authorAvatar: { type: String, default: '' },
    authorSignature: { type: String, default: '' },
    authorFollowers: { type: Number, default: 0 },
    authorLikedCount: { type: Number, default: 0 },
    authorWorksLoading: { type: Boolean, default: false },
    authorWorksNoMore: { type: Boolean, default: false },
    authorVideoPosts: { type: Array as PropType<Record<string, any>[]>, default: () => [] },
    showFollowButton: { type: Boolean, default: false },
    followButtonLabel: { type: String, default: '' },
    followButtonActive: { type: Boolean, default: false },
    showCollectionTab: { type: Boolean, default: false },
    commentItems: { type: Array as PropType<Record<string, any>[]>, default: () => [] },
    commentLoading: { type: Boolean, default: false },
    commentNoMore: { type: Boolean, default: false },
    detailContent: { type: String, default: '' },
    detailTags: { type: Array as PropType<string[]>, default: () => [] },
    activeCollectionName: { type: String, default: '' },
    collectionLoading: { type: Boolean, default: false },
    collectionVideoPosts: { type: Array as PropType<Record<string, any>[]>, default: () => [] },
    commentDraft: { type: String, default: '' },
    commentPlaceholder: { type: String, default: '' },
    replyTarget: { type: Object as PropType<Record<string, any> | null>, default: null },
    canDeleteComment: { type: Function as PropType<(item: Record<string, any>) => boolean>, required: true },
    resolveReplyState: { type: Function as PropType<(item: Record<string, any>) => Record<string, any>>, required: true },
    isCurrentCollectionPost: { type: Function as PropType<(item: Record<string, any>) => boolean>, required: true }
})

const emit = defineEmits([
    'update:visible',
    'update:activeTab',
    'update:commentDraft',
    'tab-click',
    'load-more-comments',
    'load-more-author-works',
    'reply-comment',
    'reply-reply',
    'delete-comment',
    'toggle-replies',
    'load-replies',
    'clear-reply',
    'submit-comment',
    'toggle-follow-author',
    'select-collection'
])

const commentBodyRef = ref<HTMLElement | null>(null)
const commentInputRef = ref<{ focus?: () => void } | null>(null)
const commentLoadTriggerRef = ref<HTMLElement | null>(null)
const worksLoadTriggerRef = ref<HTMLElement | null>(null)

const COMMENT_RENDER_CHUNK = 16
const REPLY_INITIAL_COUNT = 2
const REPLY_RENDER_STEP = 3
const WORKS_RENDER_CHUNK = 15
const SCROLL_LOAD_GAP = 80

const renderedCommentCount = ref(COMMENT_RENDER_CHUNK)
const renderedAuthorWorkCount = ref(WORKS_RENDER_CHUNK)
const renderedReplyCountMap = ref<Record<string, number>>({})

let commentLoadObserver: IntersectionObserver | null = null
let worksLoadObserver: IntersectionObserver | null = null

const visibleModel = computed({
    get: () => props.visible,
    set: value => emit('update:visible', value)
})

const activeTabModel = computed({
    get: () => props.activeTab,
    set: value => emit('update:activeTab', value)
})

const getCommentId = (item: Record<string, any> | null | undefined) => item?.id ?? item?.commentId ?? null
const getCommentKey = (item: Record<string, any> | null | undefined) => String(getCommentId(item) ?? '')

const renderedCommentItems = computed(() => props.commentItems.slice(0, renderedCommentCount.value))
const renderedAuthorVideoPosts = computed(() => props.authorVideoPosts.slice(0, renderedAuthorWorkCount.value))
const hasMoreRenderedComments = computed(() => renderedCommentItems.value.length < props.commentItems.length)
const hasMoreRenderedAuthorWorks = computed(() => renderedAuthorVideoPosts.value.length < props.authorVideoPosts.length)

const resetCommentRenderState = () => {
    renderedCommentCount.value = COMMENT_RENDER_CHUNK
    renderedReplyCountMap.value = {}
}

const resetAuthorWorksRenderState = () => {
    renderedAuthorWorkCount.value = WORKS_RENDER_CHUNK
}

const increaseRenderedComments = () => {
    if (!hasMoreRenderedComments.value) return false
    renderedCommentCount.value = Math.min(props.commentItems.length, renderedCommentCount.value + COMMENT_RENDER_CHUNK)
    return true
}

const increaseRenderedAuthorWorks = () => {
    if (!hasMoreRenderedAuthorWorks.value) return false
    renderedAuthorWorkCount.value = Math.min(props.authorVideoPosts.length, renderedAuthorWorkCount.value + WORKS_RENDER_CHUNK)
    return true
}

const getReplyList = (comment: Record<string, any>) => {
    const state = props.resolveReplyState(comment)
    return Array.isArray(state?.list) ? state.list : []
}

const ensureReplyRenderCount = (comment: Record<string, any>) => {
    const key = getCommentKey(comment)
    if (!key) return REPLY_INITIAL_COUNT
    if (!renderedReplyCountMap.value[key]) {
        renderedReplyCountMap.value[key] = REPLY_INITIAL_COUNT
    }
    return renderedReplyCountMap.value[key]
}

const getRenderedReplies = (comment: Record<string, any>) => {
    return getReplyList(comment).slice(0, ensureReplyRenderCount(comment))
}

const hasMoreRenderedReplies = (comment: Record<string, any>) => {
    return getRenderedReplies(comment).length < getReplyList(comment).length
}

const resolveReplyToggleText = (comment: Record<string, any>) => {
    const state = props.resolveReplyState(comment)
    const loadedCount = getReplyList(comment).length
    const totalCount = Math.max(0, Number(comment?.replyCount ?? loadedCount))
    const displayCount = Math.max(totalCount, loadedCount)
    if (state?.open) return '收起回复'
    return `展开 ${displayCount} 条回复`
}

const resolveLoadMoreReplyText = (comment: Record<string, any>) => {
    const state = props.resolveReplyState(comment)
    if (!state?.open) return ''
    if (state.loading) return '正在加载...'

    if (hasMoreRenderedReplies(comment)) {
        const total = getReplyList(comment).length
        const rendered = getRenderedReplies(comment).length
        return `展开 ${Math.max(0, total - rendered)} 条回复`
    }

    if (!state.noMore) return '查看更多回复'
    return ''
}

const handleToggleReplies = (comment: Record<string, any>) => {
    const key = getCommentKey(comment)
    if (key) {
        renderedReplyCountMap.value[key] = REPLY_INITIAL_COUNT
    }
    emit('toggle-replies', comment)
}

const handleLoadMoreReplies = (comment: Record<string, any>) => {
    const state = props.resolveReplyState(comment)

    if (hasMoreRenderedReplies(comment)) {
        const key = getCommentKey(comment)
        if (!key) return
        renderedReplyCountMap.value[key] = ensureReplyRenderCount(comment) + REPLY_RENDER_STEP
        return
    }

    if (!state?.loading && !state?.noMore) {
        emit('load-replies', comment)
    }
}

const tryLoadMoreComments = () => {
    if (props.activeTab !== 'comments') return
    if (increaseRenderedComments()) return
    if (!props.commentLoading && !props.commentNoMore) {
        emit('load-more-comments')
    }
}

const tryLoadMoreAuthorWorks = () => {
    if (props.activeTab !== 'authorWorks') return
    if (increaseRenderedAuthorWorks()) return
    if (!props.authorWorksLoading && !props.authorWorksNoMore) {
        emit('load-more-author-works')
    }
}

const handleBodyScroll = () => {
    const element = commentBodyRef.value
    if (!element) return
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - SCROLL_LOAD_GAP) {
        if (props.activeTab === 'comments') {
            tryLoadMoreComments()
        } else if (props.activeTab === 'authorWorks') {
            tryLoadMoreAuthorWorks()
        }
    }
}

const disconnectLoadObservers = () => {
    commentLoadObserver?.disconnect()
    worksLoadObserver?.disconnect()
    commentLoadObserver = null
    worksLoadObserver = null
}

const handleCommentLoadIntersect: IntersectionObserverCallback = entries => {
    if (!entries.some(entry => entry.isIntersecting)) return
    tryLoadMoreComments()
}

const handleWorksLoadIntersect: IntersectionObserverCallback = entries => {
    if (!entries.some(entry => entry.isIntersecting)) return
    tryLoadMoreAuthorWorks()
}

const setupLoadObservers = async () => {
    disconnectLoadObservers()
    if (!props.visible || typeof IntersectionObserver === 'undefined') return
    await nextTick()
    const root = commentBodyRef.value
    if (!root) return

    if (props.activeTab === 'comments' && commentLoadTriggerRef.value) {
        commentLoadObserver = new IntersectionObserver(handleCommentLoadIntersect, {
            root,
            rootMargin: '0px 0px 120px 0px',
            threshold: 0.01
        })
        commentLoadObserver.observe(commentLoadTriggerRef.value)
    }

    if (props.activeTab === 'authorWorks' && worksLoadTriggerRef.value) {
        worksLoadObserver = new IntersectionObserver(handleWorksLoadIntersect, {
            root,
            rootMargin: '0px 0px 120px 0px',
            threshold: 0.01
        })
        worksLoadObserver.observe(worksLoadTriggerRef.value)
    }
}

watch(
    () => [props.visible, props.activeTab],
    async ([visible]) => {
        if (!visible) {
            disconnectLoadObservers()
            return
        }
        await setupLoadObservers()
    },
    { immediate: true }
)

watch(
    () => props.commentItems,
    (next, prev) => {
        const nextList = Array.isArray(next) ? next : []
        const prevList = Array.isArray(prev) ? prev : []
        const nextFirst = getCommentId(nextList[0])
        const prevFirst = getCommentId(prevList[0])
        if (nextFirst !== prevFirst || nextList.length < prevList.length) {
            resetCommentRenderState()
        }
    },
    { deep: false }
)

watch(
    () => props.authorVideoPosts.length,
    (next, prev) => {
        if (next < prev) {
            resetAuthorWorksRenderState()
        }
    }
)

watch(
    () => [
        props.activeTab,
        props.commentItems.length,
        props.commentLoading,
        props.commentNoMore,
        props.authorVideoPosts.length,
        props.authorWorksLoading,
        props.authorWorksNoMore
    ],
    async () => {
        if (!props.visible) return
        await setupLoadObservers()
    }
)

const focusInput = () => {
    commentInputRef.value?.focus?.()
}

onMounted(() => {
    setupLoadObservers()
})

onBeforeUnmount(() => {
    disconnectLoadObservers()
})

defineExpose({ focusInput })
</script>

<style scoped lang="scss">
$color-bg-panel: var(--vm-panel-bg-soft);
$color-bg-soft: var(--vm-white-5);
$color-bg-input: var(--vm-white-8);
$color-text-primary: var(--vm-white-90);
$color-text-secondary: var(--vm-white-70);
$color-text-muted: var(--vm-white-40);
$color-border: var(--vm-white-8);
$color-accent: var(--vm-color-accent);

.comment-panel {
    position: relative;
    width: 0;
    height: 100%;
    background: $color-bg-panel;
    backdrop-filter: blur(28px) saturate(155%);
    border-left: 1px solid $color-border;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 0 0 auto;
    opacity: 0;
    pointer-events: none;
    will-change: width, opacity;
    contain: layout paint style;
    backface-visibility: hidden;
    transition:
        width 0.3s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.18s ease,
        box-shadow 0.3s ease;
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);

    &.open {
        width: var(--comment-panel-width, 420px);
        opacity: 1;
        pointer-events: auto;
        box-shadow: -20px 0 48px var(--vm-black-30);
    }

    &.with-collection {
        --comment-panel-width: 480px;
    }

    &.with-works {
        --comment-panel-width: 560px;
    }
}

.comment-panel-header,
.comment-panel-body,
.comment-panel-footer {
    opacity: 0;
    transform: translate3d(12px, 0, 0);
    transition:
        opacity 0.2s ease,
        transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.comment-panel.open .comment-panel-header,
.comment-panel.open .comment-panel-body,
.comment-panel.open .comment-panel-footer {
    opacity: 1;
    transform: translate3d(0, 0, 0);
}

.comment-panel-header {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid $color-border;
    background: var(--vm-panel-bg-soft);
    flex-shrink: 0;

    .panel-tabs {
        :deep(.el-tabs__item) {
            color: $color-text-secondary;
            font-weight: 500;
            font-size: 15px;
            padding: 0 16px;
            transition: color 0.2s;

            &.is-active {
                color: $color-text-primary;
                font-weight: 600;
            }

            &:hover {
                color: var(--vm-color-white);
            }
        }

        :deep(.el-tabs__active-bar) {
            background-color: $color-accent;
            height: 3px;
            border-radius: 3px;
        }

        :deep(.el-tabs__nav-wrap::after) {
            display: none;
        }
    }

    .panel-close {
        color: $color-text-secondary;
        font-size: 20px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: transparent;
        transition: all 0.2s;

        &:hover {
            background: var(--vm-white-10);
            color: var(--vm-color-white);
        }
    }
}

.comment-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    scrollbar-width: thin;
    scrollbar-color: var(--vm-white-20) transparent;
    display: flex;
    flex-direction: column;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background: var(--vm-white-20);
        border-radius: 3px;
    }
}

.comment-list-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comment-item {
    display: flex;
    gap: 12px;
    content-visibility: auto;
    contain-intrinsic-size: 132px;

    .comment-avatar {
        flex-shrink: 0;
        border: 1px solid var(--vm-white-10);
    }

    .comment-main {
        flex: 1;
        min-width: 0;
    }

    .comment-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 4px;
    }

    .comment-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--vm-white-85);
    }

    .comment-time {
        font-size: 12px;
        color: $color-text-muted;
    }

    .comment-content {
        font-size: 15px;
        line-height: 1.55;
        color: $color-text-primary;
        margin-bottom: 6px;
        white-space: pre-wrap;
        cursor: pointer;
    }
}

.comment-footer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;

    .footer-actions {
        display: flex;
        gap: 14px;
    }

    .action-btn {
        font-size: 13px;
        color: $color-text-secondary;
        cursor: pointer;
        font-weight: 500;

        &:hover {
            color: var(--vm-color-white);
        }

        &.delete:hover {
            color: $color-accent;
        }
    }

    .expand-reply-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: $color-text-secondary;
        cursor: pointer;
        background: var(--vm-white-5);
        padding: 2px 8px;
        border-radius: 12px;
        transition: background 0.2s;

        &:hover {
            background: var(--vm-white-10);
            color: var(--vm-color-white);
        }

        .line {
            width: 12px;
            height: 1px;
            background: $color-text-muted;
        }
    }
}

.comment-replies {
    margin-top: 8px;
    padding: 2px 0 0 6px;
    background: transparent;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .reply-item {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        content-visibility: auto;
        contain-intrinsic-size: 86px;
    }

    .reply-avatar {
        flex-shrink: 0;
    }

    .reply-main {
        flex: 1;
        min-width: 0;
        background: $color-bg-soft;
        border: 1px solid var(--vm-white-6);
        border-radius: 10px;
        padding: 8px 10px;
    }

    .reply-header {
        font-size: 13px;
        margin-bottom: 4px;
    }

    .reply-name {
        font-weight: 600;
        color: var(--vm-white-75);
    }

    .reply-target {
        color: $color-text-muted;
        display: inline-flex;
        align-items: center;
        margin-left: 6px;

        .arrow-icon {
            font-size: 14px;
            margin: 0 2px;
        }

        span {
            color: $color-text-secondary;
        }
    }

    .reply-content {
        font-size: 14px;
        color: $color-text-primary;
        margin-bottom: 6px;
        line-height: 1.5;
        cursor: pointer;
        word-break: break-word;
    }

    .reply-footer {
        display: flex;
        gap: 10px;
        font-size: 12px;
        color: $color-text-muted;

        .action-btn {
            cursor: pointer;

            &:hover {
                color: var(--vm-color-white);
            }
        }

        .delete:hover {
            color: $color-accent;
        }
    }
}

.load-more-replies {
    padding: 2px 0 0 32px;
    font-size: 12px;
    color: $color-accent;
    cursor: pointer;
    font-weight: 500;

    &:hover {
        text-decoration: underline;
    }
}

.scroll-load-trigger {
    width: 100%;
    height: 1px;
    margin-top: 2px;
    pointer-events: none;
}

.comment-panel-footer {
    padding: 16px 20px;
    background: var(--vm-panel-bg-soft);
    border-top: 1px solid $color-border;
    flex-shrink: 0;
}

.reply-context-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--vm-white-10);
    padding: 8px 12px;
    border-radius: 8px;
    margin-bottom: 12px;
    font-size: 12px;
    color: var(--vm-white-85);

    .name {
        font-weight: 600;
        margin-left: 4px;
    }

    .cancel-reply {
        cursor: pointer;
        color: $color-text-muted;

        &:hover {
            color: var(--vm-color-white);
        }
    }
}

.input-area {
    display: flex;
    gap: 12px;
    align-items: flex-end;

    .comment-input {
        :deep(.el-textarea__inner) {
            background: $color-bg-input;
            border: 1px solid transparent;
            border-radius: 20px;
            padding: 10px 16px;
            color: var(--vm-color-white);
            font-size: 14px;
            line-height: 1.5;
            box-shadow: none;
            transition: all 0.2s;

            &:focus {
                background: var(--vm-white-10);
                border-color: var(--vm-white-20);
            }
        }
    }

    .send-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, $color-accent, var(--vm-color-accent-hover));
        color: var(--vm-color-white);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
        flex-shrink: 0;
        transition:
            transform 0.2s,
            opacity 0.2s;

        &:hover {
            transform: scale(1.05);
        }

        &.disabled {
            background: var(--vm-white-10);
            color: var(--vm-white-30);
            cursor: default;
            transform: none;
        }
    }
}

.collection-panel-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--vm-color-white);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;

    .collection-icon {
        color: $color-accent;
        font-size: 18px;
    }
}

.author-works-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.author-summary-card {
    display: flex;
    gap: 14px;
    padding: 16px;
    border-radius: 16px;
    background: linear-gradient(180deg, var(--vm-white-8), var(--vm-white-4));
    border: 1px solid var(--vm-white-10);
}

.author-summary-avatar {
    flex-shrink: 0;
    border: 1px solid var(--vm-white-12);
}

.author-summary-main {
    min-width: 0;
    flex: 1;
}

.author-summary-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
}

.author-summary-name {
    font-size: 18px;
    line-height: 1.2;
    font-weight: 700;
    color: var(--vm-color-white);
}

.author-follow-btn {
    border: none;
    padding: 0 16px;
    height: 34px;
    border-radius: 999px;
    background: linear-gradient(135deg, #ff4d6d, #ff355d);
    color: var(--vm-color-white);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;

    &.active {
        background: var(--vm-white-12);
        color: var(--vm-color-white);
        border: 1px solid var(--vm-white-20);
    }
}

.author-summary-stats {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--vm-white-75);

    .dot {
        color: var(--vm-white-40);
    }
}

.author-summary-signature {
    font-size: 13px;
    line-height: 1.5;
    color: var(--vm-white-85);
    white-space: pre-wrap;
}

.author-works-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.author-work-card {
    border: none;
    padding: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
    content-visibility: auto;
    contain-intrinsic-size: 250px;

    &.active .author-work-cover {
        box-shadow: 0 0 0 2px var(--vm-color-accent);
    }
}

.author-work-cover {
    position: relative;
    aspect-ratio: 0.72;
    border-radius: 12px;
    overflow: hidden;
    background: var(--vm-white-10);
}

.author-work-image {
    width: 100%;
    height: 100%;
    display: block;
}

.author-work-overlay {
    position: absolute;
    inset: auto 0 0 0;
    padding: 12px 10px 10px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.72), transparent);
}

.author-work-like {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--vm-color-white);
    font-size: 12px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.author-work-title {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.45;
    color: var(--vm-white-90);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 34px;
}

.collection-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .collection-item {
        display: flex;
        gap: 12px;
        padding: 8px;
        border-radius: 8px;
        background: transparent;
        border: 1px solid transparent;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: var(--vm-white-5);
        }

        &.active {
            background: var(--vm-accent-soft-light);
            border-color: var(--vm-accent-soft-strong);
        }
    }

    .collection-thumb {
        width: 88px;
        height: 50px;
        border-radius: 6px;
        overflow: hidden;
        background: var(--vm-white-15);
        position: relative;
    }

    .collection-cover {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .playing-overlay {
        position: absolute;
        inset: 0;
        background: var(--vm-black-50);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .bar-anim {
        display: flex;
        gap: 2px;
        height: 12px;
        align-items: flex-end;

        span {
            width: 3px;
            background: $color-accent;
            animation: soundbar 0.8s ease-in-out infinite;

            &:nth-child(1) {
                height: 60%;
                animation-delay: 0s;
            }

            &:nth-child(2) {
                height: 100%;
                animation-delay: 0.2s;
            }

            &:nth-child(3) {
                height: 50%;
                animation-delay: 0.4s;
            }
        }
    }

    .collection-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .collection-title {
        font-size: 13px;
        color: var(--vm-white-90);
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .collection-meta {
        font-size: 11px;
        color: $color-text-muted;
    }
}

.detail-panel {
    .detail-section {
        margin-bottom: 20px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .detail-label {
        font-size: 12px;
        font-weight: 700;
        color: $color-text-muted;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .detail-content-text {
        font-size: 14px;
        line-height: 1.6;
        color: $color-text-secondary;
    }

    .detail-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .detail-tag {
        font-size: 12px;
        color: $color-accent;
        background: var(--vm-accent-soft-light);
        padding: 4px 10px;
        border-radius: 4px;
    }
}

.comment-empty,
.collection-empty,
.collection-loading,
.comment-loading,
.comment-end {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    min-height: 200px;
    color: $color-text-muted;
    font-size: 13px;
    gap: 12px;

    .empty-icon {
        font-size: 48px;
        opacity: 0.3;
    }
}

@keyframes soundbar {
    0%,
    100% {
        height: 30%;
    }

    50% {
        height: 100%;
    }
}

@media (max-width: 768px) {
    .comment-panel {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100% !important;
        height: 75%;
        border-radius: 16px 16px 0 0;
        transform: translateY(100%);
        opacity: 1;

        &.open {
            transform: translateY(0);
        }
    }
}
</style>

