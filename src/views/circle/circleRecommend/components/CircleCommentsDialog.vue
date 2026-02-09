<template>
    <el-dialog v-model="visible" width="720px" append-to-body destroy-on-close :show-close="false" class="modern-comment-dialog">
        <div class="dialog-container">
            <div class="dialog-header">
                <div class="header-title">
                    <span class="title-text">全部评论</span>
                    <span class="count-badge" v-if="commentCount > 0">{{ commentCount }}</span>
                </div>
                <div class="header-actions">
                    <button type="button" class="close-btn" @click="visible = false">
                        <el-icon><Close /></el-icon>
                    </button>
                </div>
            </div>

            <div class="dialog-content">
                <div v-if="loading" class="state-container">加载中...</div>
                <div v-else-if="!comments.length" class="state-container">暂无评论，来发表第一条吧</div>
                <div v-else class="comment-list-wrapper">
                    <div class="comment-list">
                        <div v-for="item in comments" :key="resolveCommentId(item)" class="comment-card">
                            <div class="avatar-column">
                                <el-avatar :size="40" :src="resolveCommentAvatar(item)">
                                    {{ resolveCommentUser(item)?.charAt(0) }}
                                </el-avatar>
                            </div>
                            <div class="content-column">
                                <div class="card-header">
                                    <span class="username">{{ resolveCommentUser(item) }}</span>
                                    <span class="time">{{ formatTimeSafe(resolveCommentTime(item)) }}</span>
                                </div>
                                <div class="card-body">{{ resolveCommentText(item) || '-' }}</div>
                                <div class="card-actions">
                                    <button type="button" class="action-btn" @click="emit('reply-comment', item)">回复</button>
                                    <button
                                        v-if="canDeleteComment(item)"
                                        type="button"
                                        class="action-btn danger"
                                        :disabled="isDeleteCommentLoading(item)"
                                        @click="emit('delete-comment', item)"
                                    >
                                        删除
                                    </button>
                                    <button
                                        v-if="getCommentReplyCount(item) > 0"
                                        type="button"
                                        class="action-btn primary"
                                        @click="emit('toggle-replies', item)"
                                    >
                                        {{ stateOf(item).open ? '收起回复' : `展开 ${getCommentReplyCount(item)} 条回复` }}
                                    </button>
                                </div>

                                <div v-if="stateOf(item).open" class="comment-replies">
                                    <div v-if="stateOf(item).loading" class="reply-status">加载中...</div>
                                    <div v-else>
                                        <div v-for="reply in stateOf(item).list" :key="resolveCommentId(reply)" class="reply-item">
                                            <el-avatar :size="28" :src="resolveCommentAvatar(reply)">
                                                {{ resolveCommentUser(reply)?.charAt(0) }}
                                            </el-avatar>
                                            <div class="reply-body">
                                                <div class="reply-head">
                                                    <span class="reply-user">{{ resolveCommentUser(reply) }}</span>
                                                    <span class="reply-time">{{ formatTimeSafe(resolveCommentTime(reply)) }}</span>
                                                </div>
                                                <div class="reply-text">
                                                    <span v-if="resolveReplyUserName(reply)" class="reply-to">回复 @{{ resolveReplyUserName(reply) }}：</span>
                                                    {{ resolveCommentText(reply) || '-' }}
                                                </div>
                                                <div class="reply-actions">
                                                    <button type="button" class="action-btn" @click="emit('reply-reply', reply, item)">回复</button>
                                                    <button
                                                        v-if="canDeleteComment(reply)"
                                                        type="button"
                                                        class="action-btn danger"
                                                        :disabled="isDeleteCommentLoading(reply)"
                                                        @click="emit('delete-comment', reply, item)"
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-if="!stateOf(item).noMore" class="reply-more">
                                            <button
                                                type="button"
                                                class="action-btn primary"
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

            <div class="dialog-footer">
                <div v-if="replyingToName" class="replying-tip">
                    <span>正在回复 @{{ replyingToName }}</span>
                    <button type="button" class="action-btn" @click="emit('cancel-reply')">取消</button>
                </div>
                <div class="input-area" :class="{ 'is-focused': isInputFocused }">
                    <el-avatar :size="32" :src="resolvedUserAvatar" class="current-user-avatar">
                        {{ resolvedUserName?.charAt(0) }}
                    </el-avatar>
                    <div class="input-wrapper">
                        <el-input
                            ref="commentInputRef"
                            v-model="commentDraft"
                            type="textarea"
                            :autosize="{ minRows: 1, maxRows: 4 }"
                            :placeholder="commentPlaceholder || '写下你的想法...'"
                            class="modern-textarea"
                            resize="none"
                            @focus="isInputFocused = true"
                            @blur="isInputFocused = false"
                            @keydown.enter.exact.prevent="submitComment"
                        />
                        <div class="action-bar">
                            <el-button type="primary" round size="small" :disabled="!canSubmit" :loading="submitting" class="submit-btn" @click="submitComment">
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
import { computed, ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'

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
:deep(.el-dialog.modern-comment-dialog) {
    border-radius: 18px;
    overflow: hidden;

    .el-dialog__header {
        display: none;
    }

    .el-dialog__body {
        padding: 0;
    }
}

.dialog-container {
    display: flex;
    flex-direction: column;
    height: 75vh;
    max-height: 820px;
    background: var(--el-bg-color-overlay);
}

.dialog-header {
    height: 52px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--el-border-color-extra-light);
}

.header-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-text {
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
}

.count-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--el-fill-color-dark);
    color: var(--el-text-color-primary);
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.close-btn {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    background: transparent;
    color: var(--el-text-color-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
}

.dialog-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
}

.state-container {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
}

.comment-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comment-card {
    display: flex;
    gap: 10px;
}

.content-column {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.username {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.card-body {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
}

.card-actions,
.reply-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.action-btn {
    border: none;
    background: transparent;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    cursor: pointer;
    padding: 0;
}

.action-btn.primary {
    color: var(--el-color-primary);
}

.action-btn.danger {
    color: var(--el-color-danger);
}

.action-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.comment-replies {
    margin-top: 6px;
    padding-left: 10px;
    border-left: 2px solid var(--el-border-color-lighter);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.reply-item {
    display: flex;
    gap: 8px;
}

.reply-body {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.reply-head {
    display: flex;
    align-items: center;
    gap: 8px;
}

.reply-user {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.reply-time {
    font-size: 11px;
    color: var(--el-text-color-secondary);
}

.reply-text {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.45;
    word-break: break-word;
}

.reply-to {
    color: var(--el-color-primary);
}

.reply-status,
.reply-more {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.dialog-footer {
    border-top: 1px solid var(--el-border-color-extra-light);
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.replying-tip {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-color-primary);
}

.input-area {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: var(--el-fill-color-lighter);
    border-radius: 14px;
    padding: 10px;
}

.input-area.is-focused {
    background: var(--el-bg-color);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.current-user-avatar {
    flex-shrink: 0;
}

.input-wrapper {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

:deep(.modern-textarea .el-textarea__inner) {
    box-shadow: none !important;
    background: transparent !important;
    border: none !important;
    padding: 0;
    min-height: 26px !important;
}

.action-bar {
    display: flex;
    justify-content: flex-end;
}

.submit-btn {
    min-width: 72px;
}
</style>
