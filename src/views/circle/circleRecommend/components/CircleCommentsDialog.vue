<template>
    <el-dialog v-model="visible" width="720px" append-to-body destroy-on-close :show-close="false" class="modern-comment-dialog">
        <div class="comments-dialog">
            <div class="comments-header">
                <div class="comments-header-title">
                    <span class="comments-title-text">全部评论</span>
                    <span class="comments-count-badge" v-if="commentCount > 0">{{ commentCount }}</span>
                </div>
                <div class="comments-header-actions">
                    <button type="button" class="comments-close-btn" @click="visible = false">
                        <el-icon><Close /></el-icon>
                    </button>
                </div>
            </div>

            <div class="comments-content">
                <LoadingState v-if="loading" class="comments-state" :min-height="220" />
                <div v-else-if="!comments.length" class="comments-state comments-empty-state">
                    <Icon icon="mdi:comment-outline" class="comments-empty-icon" />
                    <p class="comments-empty-title">暂无评论</p>
                    <p class="comments-empty-desc">来发表第一条吧</p>
                </div>
                <div v-else class="comments-list-wrapper">
                    <div class="comments-list">
                        <div v-for="item in comments" :key="resolveCommentId(item)" class="comments-card">
                            <div class="comments-avatar-column">
                                <el-avatar :size="40" :src="resolveCommentAvatar(item)">
                                    {{ resolveCommentUser(item)?.charAt(0) }}
                                </el-avatar>
                            </div>
                            <div class="comments-content-column">
                                <div class="comments-card-header">
                                    <span class="comments-username">{{ resolveCommentUser(item) }}</span>
                                    <span class="comments-time">{{ formatTimeSafe(resolveCommentTime(item)) }}</span>
                                </div>
                                <div class="comments-card-body">{{ resolveCommentText(item) || '-' }}</div>
                                <div class="comments-card-actions">
                                    <button type="button" class="comments-action-btn" @click="emit('reply-comment', item)">回复</button>
                                    <button
                                        v-if="canDeleteComment(item)"
                                        type="button"
                                        class="comments-action-btn is-danger"
                                        :disabled="isDeleteCommentLoading(item)"
                                        @click="emit('delete-comment', item)"
                                    >
                                        删除
                                    </button>
                                    <button
                                        v-if="getCommentReplyCount(item) > 0"
                                        type="button"
                                        class="comments-action-btn is-primary"
                                        @click="emit('toggle-replies', item)"
                                    >
                                        {{ stateOf(item).open ? '收起回复' : `展开 ${getCommentReplyCount(item)} 条回复` }}
                                    </button>
                                </div>

                                <div v-if="stateOf(item).open" class="comments-replies">
                                    <LoadingState v-if="stateOf(item).loading" class="comments-reply-status" size="small" />
                                    <div v-else>
                                        <div v-for="reply in stateOf(item).list" :key="resolveCommentId(reply)" class="comments-reply-item">
                                            <el-avatar :size="28" :src="resolveCommentAvatar(reply)">
                                                {{ resolveCommentUser(reply)?.charAt(0) }}
                                            </el-avatar>
                                            <div class="comments-reply-body">
                                                <div class="comments-reply-head">
                                                    <span class="comments-reply-user">{{ resolveCommentUser(reply) }}</span>
                                                    <span class="comments-reply-time">{{ formatTimeSafe(resolveCommentTime(reply)) }}</span>
                                                </div>
                                                <div class="comments-reply-text">
                                                    <span v-if="resolveReplyUserName(reply)" class="comments-reply-to"
                                                        >回复 @{{ resolveReplyUserName(reply) }}：</span
                                                    >
                                                    {{ resolveCommentText(reply) || '-' }}
                                                </div>
                                                <div class="comments-reply-actions">
                                                    <button type="button" class="comments-action-btn" @click="emit('reply-reply', reply, item)">回复</button>
                                                    <button
                                                        v-if="canDeleteComment(reply)"
                                                        type="button"
                                                        class="comments-action-btn is-danger"
                                                        :disabled="isDeleteCommentLoading(reply)"
                                                        @click="emit('delete-comment', reply, item)"
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-if="!stateOf(item).noMore" class="comments-reply-more">
                                            <button
                                                type="button"
                                                class="comments-action-btn is-primary"
                                                :disabled="stateOf(item).loading"
                                                @click="emit('load-replies', item)"
                                            >
                                                {{ stateOf(item).loading ? '加载中...' : '查看更多回复' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="comments-footer">
                <div v-if="replyingToName" class="comments-replying-tip">
                    <span>正在回复 @{{ replyingToName }}</span>
                    <button type="button" class="comments-action-btn" @click="emit('cancel-reply')">取消</button>
                </div>
                <div class="comments-input-area" :class="{ 'is-focused': isInputFocused }">
                    <el-avatar :size="32" :src="resolvedUserAvatar" class="comments-current-user-avatar">
                        {{ resolvedUserName?.charAt(0) }}
                    </el-avatar>
                    <div class="comments-input-wrapper">
                        <el-input
                            ref="commentInputRef"
                            v-model="commentDraft"
                            type="textarea"
                            :autosize="{ minRows: 1, maxRows: 4 }"
                            :placeholder="commentPlaceholder || '写下你的想法...'"
                            class="comments-textarea"
                            resize="none"
                            @focus="isInputFocused = true"
                            @blur="isInputFocused = false"
                            @keydown.enter.exact.prevent="submitComment"
                        />
                        <div class="comments-action-bar">
                            <el-button
                                type="primary"
                                round
                                size="small"
                                :disabled="!canSubmit"
                                :loading="submitting"
                                class="comments-submit-btn"
                                @click="submitComment"
                            >
                                发送
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsCircleCircleRecommendComponentsCircleCommentsDialog' })
import { computed, ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import LoadingState from '@/components/LoadingState/index.vue'

type ReplyState = {
    open: boolean
    loading: boolean
    list: any[]
    noMore: boolean
}

const props = withDefaults(
    defineProps<{
        modelValue: boolean
        post?: any
        comments: any[]
        loading: boolean
        submitting?: boolean
        commentPlaceholder?: string
        replyingToName?: string
        getImgUrl?: (url: string) => string
        formatTime?: (time?: string) => string
        userAvatar?: string
        userName?: string
        getCommentReplyCount?: (comment: any) => number
        resolveReplyState?: (comment: any) => ReplyState
        canDeleteComment?: (comment: any) => boolean
        isDeleteCommentLoading?: (comment: any) => boolean
    }>(),
    {
        post: null,
        submitting: false,
        commentPlaceholder: '写下你的想法...',
        replyingToName: '',
        getCommentReplyCount: () => 0,
        resolveReplyState: () => ({ open: false, loading: false, list: [], noMore: true }),
        canDeleteComment: () => false,
        isDeleteCommentLoading: () => false
    }
)

const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'submit', content: string): void
    (event: 'reply-comment', comment: any): void
    (event: 'reply-reply', reply: any, parent: any): void
    (event: 'toggle-replies', comment: any): void
    (event: 'load-replies', comment: any): void
    (event: 'delete-comment', comment: any, parent?: any): void
    (event: 'cancel-reply'): void
}>()

const visible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const userStore = useUserStore()
const commentDraft = ref('')
const isInputFocused = ref(false)
const commentInputRef = ref<any | null>(null)

const canSubmit = computed(() => Boolean(commentDraft.value?.trim()))
const commentCount = computed(() => {
    const count = Number(props.post?.commentCount)
    if (Number.isFinite(count)) return count
    return props.comments.length
})

const resolvedUserAvatar = computed(() => {
    const avatar = userStore.avatar || props.userAvatar || ''
    if (!avatar) return ''
    if (/^(https?:)?\/\//.test(avatar) || avatar.startsWith('data:') || avatar.startsWith('blob:') || avatar.startsWith('/')) {
        return avatar
    }
    return props.getImgUrl ? props.getImgUrl(avatar) : avatar
})

const resolvedUserName = computed(() => userStore.nickName || userStore.name || props.userName || '')
const replyingToName = computed(() => props.replyingToName || '')

const formatTimeSafe = (value?: string) => {
    if (!value) return ''
    return props.formatTime ? props.formatTime(value) : value
}

const resolveCommentId = (item: any) => item?.id ?? item?.commentId ?? item?._id ?? item?.cid ?? item?.uuid ?? `${item?.userId}-${item?.createTime}`

const resolveCommentUser = (item: any) =>
    item?.userName || item?.nickName || item?.authorName || item?.username || item?.user?.nickName || item?.user?.name || '用户'

const resolveReplyUserName = (item: any) => item?.replyUserNickName || item?.replyUserName || item?.replyNickName || item?.toUserName || ''

const resolveCommentAvatar = (item: any) => {
    const url = item?.avatar || item?.userAvatar || item?.authorAvatar || item?.user?.avatar || ''
    if (!url) return ''
    if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) return url
    return props.getImgUrl ? props.getImgUrl(url) : url
}

const resolveCommentText = (item: any) => item?.content || item?.comment || item?.commentContent || item?.commentText || item?.text || item?.message || ''

const resolveCommentTime = (item: any) => item?.createTime || item?.createdAt || item?.time || item?.date || ''

const stateOf = (item: any): ReplyState => {
    return props.resolveReplyState?.(item) || { open: false, loading: false, list: [], noMore: true }
}

const submitComment = () => {
    const content = String(commentDraft.value || '').trim()
    if (!content) return
    emit('submit', content)
    commentDraft.value = ''
}

const focusInput = () => {
    commentInputRef.value?.focus?.()
}

watch(
    () => props.modelValue,
    value => {
        if (!value) {
            commentDraft.value = ''
            isInputFocused.value = false
        }
    }
)

defineExpose({ focusInput })
</script>

<style scoped lang="scss">
.comments-dialog {
    display: flex;
    flex-direction: column;
    height: clamp(460px, 72vh, 760px);
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-light) 28%, transparent), transparent 18%), var(--el-bg-color-overlay);
}

.comments-header {
    height: 58px;
    padding: 0 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: color-mix(in srgb, var(--el-bg-color-overlay) 94%, var(--el-fill-color-light));
}

.comments-header-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.comments-title-text {
    font-size: 17px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    letter-spacing: 0.2px;
}

.comments-count-badge {
    min-width: 22px;
    height: 22px;
    padding: 0 7px;
    border-radius: 11px;
    border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, transparent);
    background: color-mix(in srgb, var(--el-color-primary-light-9) 80%, var(--el-bg-color-overlay));
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.comments-close-btn {
    width: 32px;
    height: 32px;
    border: 1px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    background: transparent;
    color: var(--el-text-color-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.comments-close-btn:hover {
    background: color-mix(in srgb, var(--el-fill-color-light) 90%, var(--el-bg-color-overlay));
    border-color: var(--el-border-color-lighter);
    color: var(--el-text-color-primary);
}

.comments-content {
    flex: 1;
    overflow-y: auto;
    padding: 14px 18px 16px;
    background: color-mix(in srgb, var(--el-fill-color-lighter) 52%, transparent);
}

.comments-state {
    min-height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
}

.comments-empty-state {
    flex-direction: column;
    gap: 8px;
    text-align: center;

    .comments-empty-icon {
        font-size: 34px;
        color: color-mix(in srgb, var(--el-text-color-placeholder) 76%, var(--el-color-primary-light-5));
    }

    .comments-empty-title {
        margin: 0;
        color: var(--el-text-color-primary);
        font-size: 14px;
        font-weight: 600;
    }

    .comments-empty-desc {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.comments-card {
    display: flex;
    gap: 10px;
    border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 78%, transparent);
    background: var(--el-bg-color-overlay);
    border-radius: 14px;
    padding: 12px;
    box-shadow: 0 6px 14px -12px color-mix(in srgb, var(--el-color-black) 20%, transparent);
}

.comments-avatar-column {
    padding-top: 1px;
}

.comments-content-column {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.comments-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
}

.comments-username {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.comments-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-left: auto;
    white-space: nowrap;
}

.comments-card-body {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
}

.comments-card-actions,
.comments-reply-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.comments-action-btn {
    border: 1px solid transparent;
    background: color-mix(in srgb, var(--el-fill-color-light) 72%, transparent);
    color: var(--el-text-color-secondary);
    font-size: 12px;
    cursor: pointer;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 999px;
    transition:
        border-color 0.2s ease,
        background 0.2s ease,
        color 0.2s ease;
}

.comments-action-btn.is-primary {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 26%, transparent);
    background: color-mix(in srgb, var(--el-color-primary-light-9) 72%, var(--el-bg-color-overlay));
}

.comments-action-btn.is-danger {
    color: var(--el-color-danger);
    border-color: color-mix(in srgb, var(--el-color-danger) 24%, transparent);
    background: color-mix(in srgb, var(--el-color-danger-light-9) 70%, var(--el-bg-color-overlay));
}

.comments-action-btn:hover:not(:disabled) {
    border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
}

.comments-action-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.comments-replies {
    margin-top: 8px;
    padding-left: 10px;
    border-left: 2px solid var(--el-border-color-lighter);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.comments-reply-item {
    display: flex;
    gap: 8px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--el-fill-color-light) 66%, transparent);
    padding: 8px;
}

.comments-reply-body {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.comments-reply-head {
    display: flex;
    align-items: center;
    gap: 8px;
}

.comments-reply-user {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.comments-reply-time {
    font-size: 11px;
    color: var(--el-text-color-secondary);
}

.comments-reply-text {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.45;
    word-break: break-word;
}

.comments-reply-to {
    color: var(--el-color-primary);
}

.comments-reply-status,
.comments-reply-more {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.comments-footer {
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 12px 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: color-mix(in srgb, var(--el-bg-color-overlay) 95%, var(--el-fill-color-light));
}

.comments-replying-tip {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-color-primary);
}

.comments-input-area {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 14px;
    padding: 10px;
}

.comments-input-area.is-focused {
    background: var(--el-bg-color);
    border-color: color-mix(in srgb, var(--el-color-primary) 34%, var(--el-border-color-lighter));
    box-shadow: 0 8px 18px -14px color-mix(in srgb, var(--el-color-primary) 38%, transparent);
}

.comments-current-user-avatar {
    flex-shrink: 0;
}

.comments-input-wrapper {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

:deep(.comments-textarea .el-textarea__inner) {
    box-shadow: none !important;
    background: transparent !important;
    border: none !important;
    padding: 0;
    min-height: 26px !important;
}

.comments-action-bar {
    display: flex;
    justify-content: flex-end;
}

.comments-submit-btn {
    min-width: 78px;
}

@media (max-width: 768px) {
    .comments-dialog {
        height: min(76vh, 680px);
    }

    .comments-content {
        padding: 12px 12px 14px;
    }

    .comments-footer {
        padding: 10px 12px 12px;
    }
}
</style>

<style lang="scss">
.el-dialog.modern-comment-dialog {
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 24px 52px -28px color-mix(in srgb, var(--el-color-black) 34%, transparent);

    .el-dialog__header {
        display: none !important;
        padding: 0 !important;
        margin-right: 0 !important;
    }

    .el-dialog__body {
        padding: 0 !important;
    }
}
</style>
