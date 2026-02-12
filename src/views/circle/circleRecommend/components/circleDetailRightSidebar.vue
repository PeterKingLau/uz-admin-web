<template>
    <aside class="right-sidebar">
        <div class="sidebar-sticky">
            <div class="sidebar-widget widget-publish">
                <div class="publish-content">
                    <div class="user-welcome">
                        <el-avatar :size="48" :src="userAvatar" class="user-avatar">
                            {{ userName?.charAt(0) }}
                        </el-avatar>
                        <div class="welcome-text">
                            <span class="hi">Hi, {{ userName }}</span>
                            <span class="sub">分享你的新鲜事</span>
                        </div>
                    </div>
                    <el-button type="primary" class="btn-publish" @click="emit('publish')">
                        <Icon icon="mdi:fountain-pen-tip" class="btn-icon" />
                        立即发布
                    </el-button>
                </div>
            </div>

            <div class="sidebar-widget widget-info">
                <div class="widget-header">
                    <span class="widget-title">
                        <Icon icon="mdi:information-slab-circle-outline" class="title-icon" />
                        关于圈子
                    </span>
                </div>
                <div class="widget-body">
                    <p class="circle-desc">{{ circleInfo.description || '暂无简介' }}</p>
                    <div v-if="circleInfo.rules?.length" class="circle-rules">
                        <div class="rules-header">圈规必读</div>
                        <div class="rules-list">
                            <div v-for="(rule, idx) in circleInfo.rules.slice(0, 3)" :key="idx" class="rule-item">
                                <span class="rule-badge">{{ idx + 1 }}</span>
                                <span class="rule-text">{{ rule }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sidebar-widget widget-members">
                <div class="widget-header">
                    <span class="widget-title">
                        <Icon icon="mdi:account-group" class="title-icon" />
                        活跃成员
                    </span>
                    <span class="link-more" @click="emit('show-all')">
                        查看全部
                        <Icon icon="mdi:arrow-right" />
                    </span>
                </div>
                <div class="widget-body">
                    <div v-if="managers.length || otherMembers.length" class="members-container">
                        <div v-if="managers.length" class="member-group group-managers">
                            <div class="group-label group-label-with-count">
                                <span>主理人</span>
                                <span class="group-count">{{ managers.length }}人</span>
                            </div>
                            <div class="manager-list">
                                <div
                                    v-for="member in showAllManagers ? managers : managers.slice(0, MANAGER_COLLAPSE_LIMIT)"
                                    :key="member.id"
                                    class="manager-row"
                                >
                                    <el-avatar :size="32" :src="getImgUrl(member.avatar || '')" class="manager-avatar">
                                        {{ member.name?.charAt(0) }}
                                    </el-avatar>
                                    <div class="manager-main">
                                        <span class="manager-name">{{ member.name }}</span>
                                        <span class="role-badge"><Icon icon="mdi:crown" /> 管理员</span>
                                    </div>
                                </div>
                            </div>
                            <div v-if="managers.length > MANAGER_COLLAPSE_LIMIT" class="manager-fold" @click="showAllManagers = !showAllManagers">
                                <span>{{ showAllManagers ? '收起' : `展开全部（${managers.length}）` }}</span>
                                <Icon :icon="showAllManagers ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
                            </div>
                        </div>

                        <div v-if="otherMembers.length" class="member-group group-others">
                            <div class="group-label group-label-with-count">
                                <span>其余成员</span>
                                <span class="group-count">{{ otherMembers.length }}人</span>
                            </div>
                            <div class="others-grid">
                                <div v-for="member in otherMembers.slice(0, 10)" :key="member.id" class="other-card">
                                    <el-tooltip :content="member.name" placement="top" :show-after="500">
                                        <div class="avatar-wrapper">
                                            <el-avatar :size="34" :src="getImgUrl(member.avatar || '')">
                                                {{ member.name?.charAt(0) }}
                                            </el-avatar>
                                        </div>
                                    </el-tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="empty-state">
                        <Icon icon="mdi:account-off-outline" class="empty-icon" />
                        <span>暂无活跃成员</span>
                    </div>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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

const MANAGER_COLLAPSE_LIMIT = 3
const showAllManagers = ref(false)
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
        gap: 20px;
    }
}

.sidebar-widget {
    background: var(--circle-card-bg);
    border-radius: 16px;
    box-shadow: var(--circle-card-shadow);
    border: 1px solid var(--circle-border-color);
    overflow: hidden;
    transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;

    &:hover {
        box-shadow: 0 8px 20px color-mix(in srgb, var(--el-color-black) 10%, transparent);
    }
}

.widget-publish {
    background: linear-gradient(180deg, var(--circle-card-bg) 0%, var(--el-fill-color-lighter) 100%);
    border: 1px solid var(--circle-border-color);

    .publish-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .user-welcome {
        display: flex;
        align-items: center;
        gap: 12px;

        .user-avatar {
            border: 2px solid var(--circle-card-bg);
            box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 8%, transparent);
        }

        .welcome-text {
            display: flex;
            flex-direction: column;
            line-height: 1.3;

            .hi {
                font-size: 15px;
                font-weight: 700;
                color: var(--circle-text-main);
            }
            .sub {
                font-size: 12px;
                color: var(--circle-text-muted);
            }
        }
    }

    .btn-publish {
        width: 100%;
        height: 40px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: var(--el-box-shadow-light);
        transition: all 0.2s;

        &:hover {
            transform: translateY(-1px);
            box-shadow: var(--el-box-shadow);
        }

        .btn-icon {
            margin-right: 6px;
            font-size: 16px;
        }
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
    padding-bottom: 12px;
    border-bottom: 1px solid var(--circle-border-color);

    .widget-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--circle-text-main);
        display: flex;
        align-items: center;
        gap: 6px;

        .title-icon {
            color: var(--circle-primary-color);
            font-size: 18px;
        }
    }

    .link-more {
        font-size: 12px;
        color: var(--circle-text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 2px;
        transition: color 0.2s;

        &:hover {
            color: var(--circle-primary-color);
        }
    }
}

.circle-desc {
    font-size: 14px;
    color: var(--circle-text-sub);
    line-height: 1.6;
    margin-bottom: 20px;
    text-align: justify;
}

.circle-rules {
    background: var(--el-fill-color);
    padding: 16px;
    border-radius: 12px;
    border: 1px dashed var(--circle-border-color);

    .rules-header {
        font-size: 12px;
        font-weight: 700;
        color: var(--circle-text-main);
        margin-bottom: 10px;
        text-transform: uppercase;
        opacity: 0.8;
    }

    .rules-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .rule-item {
        display: flex;
        gap: 10px;
        font-size: 13px;
        line-height: 1.4;
        color: var(--circle-text-sub);

        .rule-badge {
            background: var(--circle-card-bg);
            color: var(--circle-primary-color);
            border: 1px solid var(--el-color-primary-light-8);
            font-weight: 700;
            font-size: 11px;
            min-width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            margin-top: 1px;
        }
    }
}

.members-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.member-group {
    .group-label {
        font-size: 12px;
        color: var(--circle-text-muted);
        margin-bottom: 10px;
        font-weight: 600;
    }

    .group-label-with-count {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .group-count {
        font-size: 12px;
        color: var(--circle-text-muted);
        font-weight: 500;
    }
}

.manager-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.manager-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: var(--el-fill-color-lighter);
    border-radius: 10px;
    transition: background 0.2s ease;

    &:hover {
        background: var(--el-fill-color);
    }
}

.manager-avatar {
    border: 1px solid var(--circle-border-color);
    flex-shrink: 0;
}

.manager-main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.manager-name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--circle-text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.role-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: var(--circle-primary-color);
    background: var(--el-color-primary-light-9);
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 600;
    flex-shrink: 0;
}

.manager-fold {
    margin-top: 8px;
    height: 30px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 12px;
    color: var(--circle-text-muted);
    background: var(--el-fill-color-lighter);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        color: var(--circle-primary-color);
        background: var(--el-fill-color);
    }
}

.others-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px 8px;
}

.other-card {
    display: flex;
    justify-content: center;

    .avatar-wrapper {
        transition: transform 0.2s;
        cursor: pointer;

        &:hover {
            transform: scale(1.1);
        }
    }
}

.empty-state {
    padding: 30px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--circle-text-muted);
    gap: 8px;

    .empty-icon {
        font-size: 48px;
        opacity: 0.5;
    }

    span {
        font-size: 13px;
    }
}

@media screen and (max-width: 992px) {
    .right-sidebar {
        width: 100%;
        margin-top: 20px;
    }

    .sidebar-sticky {
        position: static;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
}

@media screen and (max-width: 520px) {
    .sidebar-sticky {
        display: flex;
    }

    .others-grid {
        grid-template-columns: repeat(5, 1fr);
    }
}
</style>
