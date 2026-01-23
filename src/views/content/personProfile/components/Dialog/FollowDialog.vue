<template>
    <el-dialog v-model="dialogVisible" width="540px" append-to-body destroy-on-close class="follow-dialog custom-dialog-theme">
        <template #header>
            <div class="dialog-header-title">用户列表</div>
        </template>
        <div class="follow-dialog-body">
            <div class="sticky-tabs-header">
                <el-tabs v-model="activeTab" class="follow-tabs" :stretch="true" @tab-click="handleTabClick">
                    <el-tab-pane name="following">
                        <template #label>
                            <div class="tab-label">
                                <span class="text">关注</span>
                                <span class="count-badge" v-show="followStats.following > 0">{{ followStats.following }}</span>
                            </div>
                        </template>
                    </el-tab-pane>
                    <el-tab-pane name="followers">
                        <template #label>
                            <div class="tab-label">
                                <span class="text">粉丝</span>
                                <span class="count-badge" v-show="followStats.followers > 0">{{ followStats.followers }}</span>
                            </div>
                        </template>
                    </el-tab-pane>
                    <el-tab-pane v-if="showMutual" name="mutual">
                        <template #label>
                            <div class="tab-label">
                                <span class="text">互关</span>
                                <span class="count-badge" v-show="followStats.mutualCount > 0">{{ followStats.mutualCount }}</span>
                            </div>
                        </template>
                    </el-tab-pane>
                </el-tabs>
            </div>

            <div class="follow-list" ref="followListRef">
                <div v-for="item in followList" :key="item.id || item.userId" class="follow-user-row">
                    <div class="left-section">
                        <el-avatar :size="48" :src="item.avatar" class="row-avatar">
                            {{ item.nickName?.charAt(0)?.toUpperCase() || 'U' }}
                        </el-avatar>
                    </div>

                    <div class="middle-section">
                        <div class="info-top">
                            <span class="nickname" :title="item.nickName">{{ item.nickName || '用户' }}</span>
                        </div>
                        <div class="info-bottom" :title="item.signature">
                            {{ item.signature || '这个人很懒，什么都没有写' }}
                        </div>
                    </div>

                    <div class="right-section">
                        <el-button
                            v-if="!isSelfRelation(item)"
                            :type="getRelationActionType(item)"
                            :plain="isFollowedRelation(item)"
                            :class="['action-btn', { 'is-following': isFollowedRelation(item) }]"
                            size="small"
                            round
                            :loading="isFollowActionLoading(item)"
                            @click.stop="toggleFollow(item)"
                        >
                            {{ getRelationActionText(item) }}
                        </el-button>
                    </div>
                </div>

                <div v-if="followLoading" class="loading-state">
                    <el-icon class="is-loading"><Loading /></el-icon> 加载中...
                </div>

                <div v-if="followNoMore && followList.length > 0" class="no-more-state">- 暂时没有更多了 -</div>

                <el-empty v-if="!followLoading && followList.length === 0" description="暂无相关用户" :image-size="100" />
                <div ref="followTriggerRef" class="follow-load-trigger" aria-hidden="true"></div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { computed, ref, toRefs } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    activeTab: { type: String, default: 'following' },
    showMutual: { type: Boolean, default: true },
    followStats: {
        type: Object,
        default: () => ({
            following: 0,
            followers: 0,
            mutualCount: 0
        })
    },
    followList: { type: Array, default: () => [] },
    followLoading: { type: Boolean, default: false },
    followNoMore: { type: Boolean, default: false },
    isFollowActionLoading: { type: Function, default: () => false },
    toggleFollow: { type: Function, default: () => {} }
})

const emit = defineEmits(['update:modelValue', 'update:activeTab', 'tab-click'])

const { followStats, followList, followLoading, followNoMore, isFollowActionLoading, toggleFollow } = toRefs(props)

const dialogVisible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const activeTab = computed({
    get: () => props.activeTab,
    set: value => emit('update:activeTab', value)
})

const followListRef = ref(null)
const followTriggerRef = ref(null)

const handleTabClick = tab => emit('tab-click', tab)

const normalizeRelationType = item => (item?.relationType || 'NONE').toString().toUpperCase()

const isSelfRelation = item => normalizeRelationType(item) === 'SELF'

const isFollowedRelation = item => {
    const relationType = normalizeRelationType(item)
    return relationType === 'FOLLOWING' || relationType === 'MUTUAL'
}

const getRelationActionType = item => (isFollowedRelation(item) ? 'info' : 'primary')

const getRelationActionText = item => {
    const relationType = normalizeRelationType(item)
    if (relationType === 'MUTUAL') return '互相关注'
    if (relationType === 'FOLLOWING') return '已关注'
    if (relationType === 'FOLLOWER') return '回关'
    return '关注'
}

defineExpose({
    followListRef,
    followTriggerRef
})
</script>

<style lang="scss">
.custom-dialog-theme {
    border-radius: 12px;
    overflow: hidden;

    .el-dialog__header {
        margin-right: 0;
        padding: 16px 20px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .dialog-header-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            position: relative;
            padding-left: 12px;
            display: flex;
            align-items: center;
            line-height: 1;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 16px;
                background-color: var(--el-color-primary);
                border-radius: 2px;
            }
        }

        .el-dialog__headerbtn {
            top: 16px;
            right: 16px;
        }
    }

    .el-dialog__body {
        padding: 0;
        background-color: var(--el-bg-color);
        min-height: 500px;
    }

    .follow-tabs {
        --el-tabs-header-height: 44px;

        .el-tabs__header {
            margin: 0;
        }

        .el-tabs__nav-wrap::after {
            display: none;
        }

        .el-tabs__item {
            font-size: 15px;
            height: 44px;
            line-height: 44px;
            color: var(--el-text-color-regular);
            padding: 0 20px;
            transition: all 0.3s;

            &.is-active {
                font-weight: 600;
                color: var(--el-text-color-primary);

                .count-badge {
                    background-color: var(--el-color-primary-light-9);
                    color: var(--el-color-primary);
                }
            }
        }

        .el-tabs__active-bar {
            height: 3px;
            border-radius: 3px;
            background-color: var(--el-color-primary);
            bottom: 0;
        }

        .tab-label {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            position: relative;
            height: 100%;

            .count-badge {
                font-size: 12px;
                background-color: var(--el-fill-color);
                padding: 0 6px;
                border-radius: 10px;
                height: 18px;
                min-width: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--el-text-color-secondary);
                transition: all 0.3s;
                font-weight: 500;
                line-height: 1;
            }
        }
    }
}
</style>

<style scoped lang="scss">
.follow-dialog-body {
    height: 600px;
    display: flex;
    flex-direction: column;
    position: relative;

    .sticky-tabs-header {
        z-index: 10;
        background-color: var(--el-bg-color);
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .loading-state,
    .no-more-state {
        text-align: center;
        padding: 24px 0;
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }
}

.follow-list {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}

.follow-load-trigger {
    height: 1px;
}

.follow-user-row {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    transition: background-color 0.2s;
    cursor: default;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 80px;
        right: 0;
        height: 1px;
        background-color: var(--el-border-color-lighter);
        transform: scaleY(0.5);
    }

    &:last-child::after {
        display: none;
    }

    &:hover {
        background-color: var(--el-fill-color-light);

        &::after {
            opacity: 0;
        }
    }

    .left-section {
        flex-shrink: 0;
        margin-right: 14px;

        .row-avatar {
            border: 1px solid var(--el-border-color-lighter);
            transition: transform 0.2s;
            background-color: var(--el-fill-color-light);
        }
    }

    &:hover .row-avatar {
        transform: scale(1.05);
    }

    .middle-section {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;

        .info-top {
            display: flex;
            align-items: center;

            .nickname {
                font-size: 15px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                margin-right: 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 180px;
            }
        }

        .info-bottom {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 260px;
            line-height: 1.4;
        }
    }

    .right-section {
        flex-shrink: 0;
        margin-left: 16px;

        .action-btn {
            min-width: 72px;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;

            &.is-following {
                background-color: var(--el-fill-color);
                border-color: var(--el-border-color-light);
                color: var(--el-text-color-secondary);

                &:hover {
                    background-color: var(--el-fill-color-dark);
                    color: var(--el-text-color-regular);
                    border-color: var(--el-border-color);
                }
            }
        }
    }
}
</style>
