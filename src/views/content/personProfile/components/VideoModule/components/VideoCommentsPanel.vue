<template>
    <div class="comment-panel" :class="{ open: visible, 'with-collection': showCollectionTab }" @click.stop>
        <div class="comment-panel-header">
            <div class="header-left">
                <el-tabs v-model="activeTabModel" class="panel-tabs" @tab-click="emit('tab-click', $event)">
                    <el-tab-pane name="detail" label="详情" />
                    <el-tab-pane name="comments" :label="`评论 ${formatCount(localCommentCount)}`" />
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
                    <div v-for="(comment, index) in commentItems" :key="comment.id ?? index" class="comment-item">
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

                                <div v-if="Number(comment.replyCount || 0) > 0" class="expand-reply-btn" @click="emit('toggle-replies', comment)">
                                    <span class="line"></span>
                                    <span>{{ resolveReplyState(comment).open ? '收起回复' : `展开 ${comment.replyCount} 条回复` }}</span>
                                    <Icon :icon="resolveReplyState(comment).open ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="icon-chevron" />
                                </div>
                            </div>

                            <div v-if="resolveReplyState(comment).open" class="comment-replies">
                                <div v-for="(reply, rIndex) in resolveReplyState(comment).list" :key="reply.id ?? rIndex" class="reply-item">
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

                                <div v-if="!resolveReplyState(comment).noMore" class="load-more-replies">
                                    <span class="load-more-text" @click="emit('load-replies', comment)">
                                        {{ resolveReplyState(comment).loading ? '正在加载...' : '查看更多回复' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <LoadingState v-if="commentLoading" class="comment-loading" theme="inverse" :min-height="200" />
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
import { computed, ref, type PropType } from 'vue'
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
    'reply-comment',
    'reply-reply',
    'delete-comment',
    'toggle-replies',
    'load-replies',
    'clear-reply',
    'submit-comment',
    'select-collection'
])

const commentBodyRef = ref<HTMLElement | null>(null)
const commentInputRef = ref<{ focus?: () => void } | null>(null)

const visibleModel = computed({
    get: () => props.visible,
    set: value => emit('update:visible', value)
})

const activeTabModel = computed({
    get: () => props.activeTab,
    set: value => emit('update:activeTab', value)
})

const handleBodyScroll = () => {
    if (props.activeTab !== 'comments') return
    const element = commentBodyRef.value
    if (!element || props.commentLoading || props.commentNoMore) return
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 60) {
        emit('load-more-comments')
    }
}

const focusInput = () => {
    commentInputRef.value?.focus?.()
}

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
    backdrop-filter: blur(40px) saturate(180%);
    border-left: 1px solid $color-border;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

    &.open {
        width: 420px;
    }

    &.with-collection.open {
        width: 480px;
    }
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
    gap: 20px;
}

.comment-item {
    display: flex;
    gap: 12px;

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
        margin-bottom: 6px;
    }

    .comment-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--vm-white-85);
    }

    .comment-time {
        font-size: 11px;
        color: $color-text-muted;
    }

    .comment-content {
        font-size: 14px;
        line-height: 1.5;
        color: $color-text-primary;
        margin-bottom: 8px;
        white-space: pre-wrap;
        cursor: pointer;
    }
}

.comment-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .footer-actions {
        display: flex;
        gap: 16px;
    }

    .action-btn {
        font-size: 12px;
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
    margin-top: 12px;
    padding: 12px;
    background: $color-bg-soft;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .reply-item {
        display: flex;
        gap: 10px;
    }

    .reply-avatar {
        flex-shrink: 0;
    }

    .reply-main {
        flex: 1;
    }

    .reply-header {
        font-size: 12px;
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
        font-size: 13px;
        color: $color-text-primary;
        margin-bottom: 6px;
        line-height: 1.4;
        cursor: pointer;
    }

    .reply-footer {
        display: flex;
        gap: 12px;
        font-size: 11px;
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
    padding-top: 4px;
    font-size: 12px;
    color: $color-accent;
    cursor: pointer;
    font-weight: 500;

    &:hover {
        text-decoration: underline;
    }
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
