<template>
    <el-dialog v-model="visible" width="680px" append-to-body destroy-on-close :show-close="false" class="modern-comment-dialog">
        <div class="dialog-container">
            <div class="dialog-header">
                <div class="header-title">
                    <span class="title-text">全部评论</span>
                    <span class="count-badge" v-if="comments.length">{{ comments.length }}</span>
                </div>
                <div class="header-actions">
                    <div class="close-btn" @click="visible = false">
                        <el-icon><Close /></el-icon>
                    </div>
                </div>
            </div>

            <div class="dialog-content">
                <div v-if="loading" class="state-container">
                    <div class="loading-spinner">
                        <div class="spinner-dot"></div>
                        <div class="spinner-dot"></div>
                        <div class="spinner-dot"></div>
                    </div>
                </div>

                <div v-else-if="!comments.length" class="state-container empty-state">
                    <el-empty description=" " :image-size="100">
                        <template #description>
                            <div class="empty-text">
                                <h3>暂无评论</h3>
                                <p>这里有点冷清，发布第一条评论吧</p>
                            </div>
                        </template>
                    </el-empty>
                </div>

                <div v-else class="comment-list-wrapper">
                    <TransitionGroup name="staggered-fade" tag="div" class="comment-list">
                        <div v-for="item in comments" :key="resolveCommentId(item)" class="comment-card">
                            <div class="avatar-column">
                                <el-avatar :size="40" :src="resolveCommentAvatar(item)" class="user-avatar-display">
                                    {{ resolveCommentUser(item)?.charAt(0) }}
                                </el-avatar>
                            </div>
                            <div class="content-column">
                                <div class="card-header">
                                    <span class="username">{{ resolveCommentUser(item) }}</span>
                                    <span class="time">{{ formatTimeSafe(resolveCommentTime(item)) }}</span>
                                </div>
                                <div class="card-body">
                                    {{ resolveCommentText(item) }}
                                </div>
                            </div>
                        </div>
                    </TransitionGroup>
                </div>
            </div>

            <div class="dialog-footer">
                <div class="input-area" :class="{ 'is-focused': isInputFocused, 'has-content': !!commentDraft }">
                    <el-avatar :size="32" :src="resolvedUserAvatar" class="current-user-avatar">
                        {{ resolvedUserName?.charAt(0) }}
                    </el-avatar>
                    <div class="input-wrapper">
                        <el-input
                            v-model="commentDraft"
                            type="textarea"
                            :autosize="{ minRows: 1, maxRows: 4 }"
                            placeholder="写下你的想法..."
                            class="modern-textarea"
                            resize="none"
                            @focus="isInputFocused = true"
                            @blur="isInputFocused = false"
                        />
                        <div class="action-bar">
                            <transition name="fade-scale">
                                <el-button
                                    v-show="isInputFocused || commentDraft"
                                    type="primary"
                                    round
                                    size="small"
                                    :disabled="!canSubmit"
                                    class="submit-btn"
                                    @click="submitComment"
                                >
                                    发送
                                </el-button>
                            </transition>
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

const props = defineProps<{
    modelValue: boolean
    post?: any
    comments: any[]
    loading: boolean
    getImgUrl?: (url: string) => string
    formatTime?: (time?: string) => string
    userAvatar?: string
    userName?: string
}>()

const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'submit', content: string): void
}>()

const visible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const commentDraft = ref('')
const isInputFocused = ref(false)

const canSubmit = computed(() => Boolean(commentDraft.value?.trim()))

const userStore = useUserStore()

const resolvedUserAvatar = computed(() => {
    const avatar = userStore.avatar || props.userAvatar || ''
    if (!avatar) return ''
    if (/^(https?:)?\/\//.test(avatar) || avatar.startsWith('data:') || avatar.startsWith('blob:') || avatar.startsWith('/')) {
        return avatar
    }
    return props.getImgUrl ? props.getImgUrl(avatar) : avatar
})

const resolvedUserName = computed(() => userStore.nickName || userStore.name || props.userName || '')

const formatTimeSafe = (value?: string) => {
    if (!value) return ''
    return props.formatTime ? props.formatTime(value) : value
}

const resolveCommentId = (item: any) => item?.id ?? item?.commentId ?? item?._id ?? item?.cid ?? item?.uuid ?? `${item?.userId}-${item?.createTime}`

const resolveCommentUser = (item: any) =>
    item?.userName || item?.nickName || item?.authorName || item?.username || item?.user?.nickName || item?.user?.name || '用户'

const resolveCommentAvatar = (item: any) => {
    const url = item?.avatar || item?.userAvatar || item?.authorAvatar || item?.user?.avatar || ''
    if (!url) return ''
    if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
    return props.getImgUrl ? props.getImgUrl(url) : url
}

const resolveCommentText = (item: any) => item?.content || item?.comment || item?.commentContent || item?.commentText || item?.text || item?.message || ''

const resolveCommentTime = (item: any) => item?.createTime || item?.createdAt || item?.time || item?.date || ''

const submitComment = () => {
    const content = String(commentDraft.value || '').trim()
    if (!content) return
    emit('submit', content)
    commentDraft.value = ''
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
</script>

<style scoped lang="scss">
:deep(.el-dialog.modern-comment-dialog) {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--el-box-shadow-dark);
    background: transparent;

    .el-dialog__header {
        display: none;
    }
    .el-dialog__body {
        padding: 0;
        background: var(--el-bg-color-overlay);
        height: 100%;
    }
}

.dialog-container {
    display: flex;
    flex-direction: column;
    height: 75vh;
    max-height: 800px;
    background: var(--el-bg-color-overlay);
}

.dialog-header {
    flex-shrink: 0;
    height: 50px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    background: var(--el-bg-color-overlay);
    z-index: 10;

    .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
        padding-left: 12px;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 16px;
            background: var(--el-color-primary);
            border-radius: 4px;
        }

        .title-text {
            font-size: 16px;
            font-weight: 700;
            color: var(--el-text-color-primary);
        }

        .count-badge {
            background: var(--el-fill-color-darker);
            color: var(--el-text-color-secondary);
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 600;
        }
    }

    .close-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--el-text-color-regular);
        transition: all 0.2s;

        &:hover {
            background: var(--el-fill-color);
            color: var(--el-text-color-primary);
        }
    }
}

.dialog-content {
    flex: 1;
    overflow-y: auto;
    position: relative;
    scroll-behavior: smooth;

    &::-webkit-scrollbar {
        width: 6px;
    }
    &::-webkit-scrollbar-thumb {
        background: transparent;
        border-radius: 3px;
    }
    &:hover::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
    }
}

.state-container {
    height: 100%;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-spinner {
    display: flex;
    gap: 6px;

    .spinner-dot {
        width: 10px;
        height: 10px;
        background: var(--el-color-primary);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out both;

        &:nth-child(1) {
            animation-delay: -0.32s;
        }
        &:nth-child(2) {
            animation-delay: -0.16s;
        }
    }
}

.empty-state {
    .empty-text {
        text-align: center;
        h3 {
            margin: 0 0 8px;
            font-size: 16px;
            color: var(--el-text-color-primary);
            font-weight: 600;
        }
        p {
            margin: 0;
            font-size: 14px;
            color: var(--el-text-color-secondary);
        }
    }
}

.comment-list {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.comment-card {
    display: flex;
    gap: 16px;
    align-items: flex-start;

    .avatar-column {
        flex-shrink: 0;
        padding-top: 2px;
    }

    .content-column {
        flex: 1;
        min-width: 0;

        .card-header {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 6px;

            .username {
                font-size: 14px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }
            .time {
                font-size: 12px;
                color: var(--el-text-color-placeholder);
            }
        }

        .card-body {
            font-size: 15px;
            line-height: 1.6;
            color: var(--el-text-color-regular);
            white-space: pre-wrap;
            word-break: break-all;
        }
    }
}

.dialog-footer {
    flex-shrink: 0;
    padding: 16px 24px 24px;
    background: var(--el-bg-color-overlay);
    border-top: 1px solid var(--el-border-color-extra-light);
}

.input-area {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: var(--el-fill-color-lighter);
    border-radius: 18px;
    padding: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* 移除所有边框 */
    border: none;

    &.is-focused {
        background: var(--el-bg-color);
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    }

    .current-user-avatar {
        flex-shrink: 0;
        margin-top: 2px;
        border: 2px solid var(--el-bg-color);
    }

    .input-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
}

/* 强制覆盖Element Plus默认样式，去除蓝色对焦框 */
:deep(.modern-textarea) {
    .el-textarea__inner {
        box-shadow: none !important;
        background: transparent !important;
        padding: 0;
        border: none !important;
        outline: none !important;
        color: var(--el-text-color-primary);
        font-size: 14px;
        line-height: 1.5;
        min-height: 32px !important;

        /* 针对不同状态的强制覆盖 */
        &:hover,
        &:focus,
        &:active {
            box-shadow: none !important;
            outline: none !important;
            border: none !important;
            background: transparent !important;
        }

        &::placeholder {
            color: var(--el-text-color-placeholder);
        }
    }
}

.action-bar {
    display: flex;
    justify-content: flex-end;
    height: 0;
    overflow: hidden;
    transition: height 0.3s ease;
}

.input-area.is-focused .action-bar,
.input-area.has-content .action-bar {
    height: 36px;
    margin-top: 8px;
}

.submit-btn {
    font-weight: 600;
    padding: 8px 20px;
    height: 32px;
}

.staggered-fade-enter-active,
.staggered-fade-leave-active {
    transition: all 0.4s ease;
}
.staggered-fade-enter-from,
.staggered-fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: all 0.2s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

@keyframes bounce {
    0%,
    80%,
    100% {
        transform: scale(0);
    }
    40% {
        transform: scale(1);
    }
}
</style>
