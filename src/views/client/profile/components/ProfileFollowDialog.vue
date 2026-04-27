<template>
    <el-dialog
        :model-value="modelValue"
        title="关注与粉丝"
        width="540px"
        append-to-body
        destroy-on-close
        class="client-profile-follow-dialog"
        @update:model-value="handleVisibleChange"
    >
        <div class="follow-dialog-body">
            <div class="follow-tabs" role="tablist" aria-label="关注与粉丝">
                <button
                    v-for="item in tabItems"
                    :key="item.key"
                    type="button"
                    class="follow-tab"
                    :class="{ active: item.key === activeTabValue }"
                    @click="handleTabChange(item.key)"
                >
                    <span>{{ item.label }}</span>
                    <em>{{ formatCount(item.count) }}</em>
                </button>
            </div>

            <div ref="followListRef" class="follow-list" @scroll="handleListScroll">
                <div
                    v-for="(item, index) in followList"
                    :key="getTargetUserId(item) ?? index"
                    class="follow-row"
                    role="button"
                    tabindex="0"
                    @click="emit('select-user', item)"
                    @keydown.enter.prevent="emit('select-user', item)"
                >
                    <el-avatar :size="44" :src="resolveAvatarSrc(item.avatar || item.userAvatar)">
                        <Icon icon="mdi:account-outline" class="avatar-icon" />
                    </el-avatar>

                    <span class="follow-info">
                        <strong>{{ item.nickName || item.nickname || item.userName || item.username || '用户' }}</strong>
                        <small>{{ item.signature || item.remark || '暂时还没有个人简介' }}</small>
                    </span>

                    <button
                        v-if="!isSelfRelation(item)"
                        type="button"
                        class="follow-action"
                        :class="{ 'is-following': isFollowedRelation(item) }"
                        :disabled="isFollowActionLoading(item)"
                        @click.stop="toggleFollow(item)"
                    >
                        {{ getRelationActionText(item) }}
                    </button>
                </div>

                <LoadingState v-if="followLoading" class="loading-state" size="small" />
                <div v-else-if="!followList.length" class="empty-state">暂无相关用户</div>
                <div v-else-if="followNoMore" class="no-more-state">没有更多了</div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientProfileComponentsProfileFollowDialog' })
import { computed, ref } from 'vue'
import LoadingState from '@/components/LoadingState/index.vue'

type FollowTabKey = 'following' | 'followers'

const props = defineProps<{
    modelValue: boolean
    activeTab: FollowTabKey
    followStats: {
        following: number
        followers: number
    }
    followList: Array<Record<string, any>>
    followLoading: boolean
    followNoMore: boolean
    isFollowActionLoading: (item: Record<string, any>) => boolean
    toggleFollow: (item: Record<string, any>) => void
    resolveAvatar: (avatar: string) => string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'update:activeTab', value: FollowTabKey): void
    (e: 'tab-change', value: FollowTabKey): void
    (e: 'select-user', item: Record<string, any>): void
    (e: 'load-more'): void
}>()

const followListRef = ref<HTMLElement | null>(null)

const activeTabValue = computed({
    get: () => props.activeTab,
    set: value => emit('update:activeTab', value)
})

const tabItems = computed(() => [
    { key: 'following' as const, label: '关注', count: props.followStats.following },
    { key: 'followers' as const, label: '粉丝', count: props.followStats.followers }
])

const formatCount = (value: unknown) => {
    const num = Number(value || 0)
    if (!Number.isFinite(num) || num <= 0) return '0'
    if (num >= 10000) return `${(num / 10000).toFixed(num >= 100000 ? 0 : 1).replace(/\.0$/, '')}w`
    return String(num)
}

const getTargetUserId = (item: Record<string, any>) => item?.userId ?? item?.id ?? item?.targetUserId
const normalizeRelationType = (item: Record<string, any>) => String(item?.relationType || item?.relation || item?.followRelation || 'NONE').toUpperCase()
const isSelfRelation = (item: Record<string, any>) => normalizeRelationType(item) === 'SELF'
const isFollowedRelation = (item: Record<string, any>) =>
    Boolean(item?.isFollowing) || normalizeRelationType(item) === 'FOLLOWING' || normalizeRelationType(item) === 'MUTUAL'

const resolveAvatarSrc = (avatar: string) => {
    const value = props.resolveAvatar(String(avatar || ''))
    return value || undefined
}

const getRelationActionText = (item: Record<string, any>) => {
    const relationType = normalizeRelationType(item)
    if (relationType === 'MUTUAL') return '互相关注'
    if (relationType === 'FOLLOWING') return '已关注'
    if (relationType === 'FOLLOWER') return '回关'
    return '关注'
}

const handleVisibleChange = (value: boolean) => {
    emit('update:modelValue', value)
}

const handleTabChange = (key: FollowTabKey) => {
    if (key === activeTabValue.value) return
    activeTabValue.value = key
    emit('tab-change', key)
}

const handleListScroll = () => {
    const el = followListRef.value
    if (!el || props.followLoading || props.followNoMore) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) emit('load-more')
}
</script>

<style lang="scss">
.client-profile-follow-dialog {
    border-radius: 16px !important;
    overflow: hidden;
    background: var(--client-surface) !important;

    .el-dialog__header {
        padding: 22px 24px 10px;
        margin-right: 0;
        margin: 0;
    }

    .el-dialog__title {
        color: var(--text-main);
        font-size: 18px;
        font-weight: 800;
    }

    .el-dialog__body {
        padding: 10px 0 0;
    }

    .el-dialog__headerbtn {
        top: 16px;
        right: 18px;
        width: 34px;
        height: 34px;
        border-radius: 8px;

        &:hover {
            background: var(--client-surface-muted);
        }
    }
}

@media screen and (max-width: 768px) {
    .client-profile-follow-dialog {
        width: calc(100vw - 24px) !important;
    }
}
</style>

<style scoped lang="scss">
.follow-dialog-body {
    height: min(620px, 72vh);
    display: flex;
    flex-direction: column;
    background: var(--client-surface);
}

.follow-tabs {
    display: flex;
    gap: 22px;
    padding: 0 22px;
    border-bottom: 1px solid var(--client-border-soft);
}

.follow-tab {
    position: relative;
    height: 50px;
    padding: 0;
    border: 0;
    background: transparent;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--text-regular);
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
}

.follow-tab em {
    font-style: normal;
    font-size: 12px;
    color: var(--text-minor);
}

.follow-tab::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    border-radius: 999px 999px 0 0;
    background: var(--primary-color);
    opacity: 0;
    transform: scaleX(0.6);
    transition:
        opacity var(--app-motion-fast),
        transform var(--app-motion-fast);
}

.follow-tab.active {
    color: var(--primary-color);
    font-weight: 700;
}

.follow-tab.active::after {
    opacity: 1;
    transform: scaleX(1);
}

.follow-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 6px 0;
}

.follow-row {
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 22px;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: background-color var(--app-motion-fast);
}

.follow-row:hover {
    background: var(--client-surface-muted);
}

.follow-row:focus,
.follow-row:focus-visible {
    outline: none;
}

.follow-row:focus-visible {
    box-shadow: inset var(--client-focus-ring);
}

.avatar-icon {
    font-size: 21px;
    color: var(--text-minor);
}

.follow-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.follow-info strong {
    min-width: 0;
    color: var(--text-main);
    font-size: 15px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.follow-info small {
    min-width: 0;
    color: var(--text-minor);
    font-size: 12px;
    line-height: 1.45;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.follow-action {
    flex: 0 0 auto;
    min-width: 70px;
    height: 30px;
    padding: 0 13px;
    border: 1px solid color-mix(in srgb, var(--primary-color) 18%, transparent);
    border-radius: 999px;
    background: var(--client-active-bg);
    color: var(--client-active-text);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition:
        background-color var(--app-motion-fast),
        color var(--app-motion-fast),
        border-color var(--app-motion-fast),
        opacity var(--app-motion-fast);
}

.follow-action.is-following {
    background: var(--client-surface-muted);
    border-color: var(--client-border-soft);
    color: var(--text-regular);
}

.follow-action:hover {
    background: var(--client-primary-muted);
}

.follow-action.is-following:hover {
    background: var(--client-danger-soft);
    border-color: color-mix(in srgb, var(--client-danger-text) 28%, transparent);
    color: var(--client-danger-text);
}

.follow-action:disabled {
    cursor: wait;
    opacity: 0.7;
}

.loading-state,
.empty-state,
.no-more-state {
    padding: 34px 0;
    color: var(--text-minor);
    font-size: 13px;
    text-align: center;
}

button:focus,
button:focus-visible {
    outline: none;
}

button:focus-visible {
    box-shadow: var(--client-focus-ring);
}

@media screen and (max-width: 768px) {
    .follow-dialog-body {
        height: min(560px, 74vh);
    }

    .follow-tabs,
    .follow-row {
        padding-left: 16px;
        padding-right: 16px;
    }

    .follow-action {
        min-width: 62px;
        padding: 0 10px;
    }
}
</style>
