<template>
    <aside class="right-sidebar">
        <div class="sidebar-sticky">
            <div class="sidebar-widget widget-publish">
                <div class="user-row">
                    <el-avatar :size="40" :src="userAvatar" class="current-avatar">
                        {{ userName?.charAt(0) }}
                    </el-avatar>
                    <span class="publish-hint">分享你的想法...</span>
                </div>
                <el-button type="primary" round block class="btn-publish-action" @click="emit('publish')">
                    <Icon icon="mdi:pencil-outline" /> 发布帖子
                </el-button>
            </div>

            <div class="sidebar-widget widget-info">
                <div class="widget-header">
                    <span class="widget-title">关于圈子</span>
                </div>
                <div class="widget-body">
                    <p class="circle-desc">{{ circleInfo.description || '暂无简介' }}</p>
                    <div v-if="circleInfo.rules?.length" class="circle-rules">
                        <div class="rules-label">圈规</div>
                        <div v-for="(rule, idx) in circleInfo.rules.slice(0, 3)" :key="idx" class="rule-row">
                            <span class="rule-idx">{{ idx + 1 }}</span>
                            <span class="rule-text">{{ rule }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sidebar-widget widget-members">
                <div class="widget-header">
                    <span class="widget-title">活跃成员</span>
                    <span class="link-more" @click="emit('show-all')">全部 <Icon icon="mdi:chevron-right" /></span>
                </div>
                <div class="widget-body">
                    <div v-if="managers.length" class="manager-list">
                        <div class="list-label">主理人</div>
                        <div v-for="member in managers" :key="member.id" class="manager-row">
                            <el-avatar :size="32" :src="getImgUrl(member.avatar || '')">{{ member.name?.charAt(0) }}</el-avatar>
                            <span class="manager-name">{{ member.name }}</span>
                        </div>
                    </div>

                    <div class="member-grid">
                        <el-tooltip v-for="member in otherMembers.slice(0, 10)" :key="member.id" :content="member.name" placement="top">
                            <el-avatar :size="36" :src="getImgUrl(member.avatar || '')" class="grid-avatar">
                                {{ member.name?.charAt(0) }}
                            </el-avatar>
                        </el-tooltip>
                    </div>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
interface CircleInfoSummary {
    description?: string
    rules?: string[]
}

interface MemberItem {
    id: string | number
    name: string
    avatar?: string
}

defineProps<{
    userAvatar: string
    userName: string
    circleInfo: CircleInfoSummary
    managers: MemberItem[]
    otherMembers: MemberItem[]
    getImgUrl: (url: string) => string
}>()

const emit = defineEmits<{
    (e: 'publish'): void
    (e: 'show-all'): void
}>()
</script>

<style scoped lang="scss">
.right-sidebar {
    width: 280px;
    flex-shrink: 0;

    .sidebar-sticky {
        position: sticky;
        top: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
}

.sidebar-widget {
    background: var(--circle-card-bg);
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    border: 1px solid transparent;
}

.widget-publish {
    padding: 20px;
    background: linear-gradient(180deg, var(--circle-card-bg) 0%, var(--el-fill-color-lighter) 100%);

    .user-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        .current-avatar {
            background: var(--el-fill-color-light);
            color: var(--el-text-color-placeholder);
            border: 1px solid var(--el-border-color-lighter);
        }

        .publish-hint {
            font-size: 14px;
            color: var(--el-text-color-placeholder);
        }
    }

    .btn-publish-action {
        font-weight: 500;
        height: 40px;
        box-shadow: 0 4px 12px var(--el-color-primary-light-3);
    }
}

.widget-info,
.widget-members {
    padding: 20px;
}

.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .widget-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--circle-text-main);
    }

    .link-more {
        font-size: 12px;
        color: var(--circle-text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: color 0.2s;

        &:hover {
            color: var(--el-color-primary);
        }
    }
}

.circle-desc {
    font-size: 14px;
    color: var(--circle-text-sub);
    line-height: 1.6;
    margin: 0 0 20px;
}

.circle-rules {
    background: var(--el-fill-color);
    padding: 16px;
    border-radius: 12px;

    .rules-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--circle-text-main);
        margin-bottom: 8px;
    }

    .rule-row {
        display: flex;
        gap: 8px;
        font-size: 13px;
        color: var(--circle-text-muted);
        margin-bottom: 6px;
        line-height: 1.5;

        .rule-idx {
            color: var(--el-color-primary);
            font-weight: 700;
            background: var(--el-color-primary-light-9);
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: 11px;
            margin-top: 2px;
            flex-shrink: 0;
        }
    }
}

.manager-list {
    margin-bottom: 20px;

    .list-label {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
        margin-bottom: 10px;
        font-weight: 500;
    }

    .manager-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;

        .manager-name {
            font-size: 14px;
            color: var(--circle-text-main);
            font-weight: 500;
        }
    }
}

.member-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .grid-avatar {
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s;

        &:hover {
            border-color: var(--el-color-primary);
            transform: scale(1.1);
            z-index: 2;
        }
    }
}

@media screen and (max-width: 768px) {
    .right-sidebar {
        width: 100%;
        padding: 0 16px;
    }
}
</style>
