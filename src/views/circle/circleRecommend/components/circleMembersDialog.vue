<template>
    <el-dialog :model-value="modelValue" width="560px" class="members-dialog" :lock-scroll="false" @update:model-value="emit('update:modelValue', $event)">
        <template #header>
            <div class="dialog-header-title">
                <span class="title-text">圈子成员</span>
            </div>
        </template>
        <div class="members-list" v-loading="allMembersLoading && allMembers.length === 0">
            <div v-if="dialogManagers.length" class="members-section">
                <div class="section-title">
                    <span class="section-title-text">管理员</span>
                    <span class="section-count">{{ dialogManagers.length }}</span>
                </div>
                <div v-for="member in dialogManagers" :key="member.id" class="member-row">
                    <el-avatar :size="44" :src="getImgUrl(member.avatar || '')">{{ member.name?.charAt(0) }}</el-avatar>
                    <div class="member-meta">
                        <div class="member-name">{{ member.name }}</div>
                        <div class="member-desc">{{ member.description || '暂无简介' }}</div>
                    </div>
                    <div class="member-actions">
                        <el-button
                            v-if="canManageMembers"
                            size="small"
                            round
                            plain
                            :type="member.isManager ? 'info' : 'warning'"
                            :disabled="member.isManager"
                            :loading="member._adminLoading"
                            @click="emit('set-admin', member)"
                        >
                            {{ member.isManager ? '管理员' : '设为管理员' }}
                        </el-button>
                        <el-button
                            v-if="canKickMember(member)"
                            size="small"
                            round
                            plain
                            type="danger"
                            :loading="member._kickLoading"
                            @click="emit('kick-member', member)"
                        >
                            踢出
                        </el-button>
                        <el-button size="small" round plain :type="isSelf(member) ? 'info' : member.followed ? 'info' : 'primary'" :disabled="isSelf(member)">
                            {{ isSelf(member) ? '自己' : member.followed ? '已关注' : '+关注' }}
                        </el-button>
                    </div>
                </div>
            </div>

            <div class="members-section">
                <div class="section-title">
                    <span class="section-title-text">其他成员</span>
                    <span class="section-count">{{ dialogOthers.length }}</span>
                </div>
                <div v-for="member in dialogOthers" :key="member.id" class="member-row">
                    <el-avatar :size="44" :src="getImgUrl(member.avatar || '')">{{ member.name?.charAt(0) }}</el-avatar>
                    <div class="member-meta">
                        <div class="member-name">{{ member.name }}</div>
                        <div class="member-desc">{{ member.description || '暂无简介' }}</div>
                    </div>
                    <div class="member-actions">
                        <el-button
                            v-if="canManageMembers"
                            size="small"
                            round
                            plain
                            :type="member.isManager ? 'info' : 'warning'"
                            :disabled="member.isManager"
                            :loading="member._adminLoading"
                            @click="emit('set-admin', member)"
                        >
                            {{ member.isManager ? '管理员' : '设为管理员' }}
                        </el-button>
                        <el-button
                            v-if="canKickMember(member)"
                            size="small"
                            round
                            plain
                            type="danger"
                            :loading="member._kickLoading"
                            @click="emit('kick-member', member)"
                        >
                            踢出
                        </el-button>
                        <el-button size="small" round plain :type="isSelf(member) ? 'info' : member.followed ? 'info' : 'primary'" :disabled="isSelf(member)">
                            {{ isSelf(member) ? '自己' : member.followed ? '已关注' : '+关注' }}
                        </el-button>
                    </div>
                </div>
            </div>
        </div>

        <div class="members-footer">
            <el-button v-if="!allMembersFinished" :loading="allMembersLoading" text bg class="btn-load-more" @click="emit('load-more')">加载更多</el-button>
            <span v-else class="members-end">没有更多了</span>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
interface MemberItem {
    id: string | number
    userId?: string | number
    name: string
    avatar?: string
    description?: string
    isManager?: boolean
    followed?: boolean
    isSelf?: boolean
    _adminLoading?: boolean
    _kickLoading?: boolean
}

const props = defineProps<{
    modelValue: boolean
    dialogManagers: MemberItem[]
    dialogOthers: MemberItem[]
    isCircleOwner: boolean
    canManageMembers: boolean
    currentUserId: string | number | null | undefined
    allMembersLoading: boolean
    allMembers: MemberItem[]
    allMembersFinished: boolean
    getImgUrl: (url: string) => string
}>()

const isSelf = (member: MemberItem) => {
    if (typeof member.isSelf === 'boolean') return member.isSelf
    const selfId = props.currentUserId
    if (selfId == null) return false
    const memberId = member.userId ?? member.id
    if (memberId == null) return false
    return String(memberId) === String(selfId)
}

const canKickMember = (member: MemberItem) => {
    if (!props.canManageMembers) return false
    if (isSelf(member)) return false
    return true
}

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'load-more'): void
    (e: 'set-admin', member: MemberItem): void
    (e: 'kick-member', member: MemberItem): void
}>()
</script>

<style scoped lang="scss">
.members-dialog {
    :deep(.el-dialog) {
        border-radius: 16px;
        overflow: hidden;
        background: var(--el-bg-color-overlay);
        border: 1px solid var(--el-border-color-lighter);
        box-shadow: 0 20px 48px color-mix(in srgb, var(--el-color-black) 12%, transparent);
    }

    :deep(.el-dialog__header) {
        padding: 18px 22px 16px;
        margin-right: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-dialog__body) {
        padding: 18px 18px 14px;
        background: var(--el-bg-color-overlay);
    }

    :deep(.el-dialog__headerbtn) {
        top: 18px;
        right: 18px;
    }

    :deep(.el-dialog__close) {
        color: var(--el-text-color-secondary);

        &:hover {
            color: var(--el-text-color-primary);
        }
    }

    .dialog-header-title {
        display: flex;
        align-items: center;
        padding-left: 12px;
        position: relative;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 16px;
            background: var(--el-color-primary);
            border-radius: 2px;
        }

        .title-text {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
        }
    }
}

.members-list {
    max-height: min(68vh, 560px);
    overflow-y: auto;
    padding-right: 4px;
}

.members-section {
    margin-bottom: 16px;
    padding: 14px;
    border-radius: 16px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-light) 72%, transparent) 0%, transparent 100%), var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);

    &:last-child {
        margin-bottom: 0;
    }

    .section-title {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
        padding-left: 10px;
        position: relative;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 14px;
            border-radius: 999px;
            background: var(--el-color-primary);
        }
    }

    .section-title-text {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .section-count {
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-fill-color-light));
        color: var(--el-color-primary);
        font-size: 12px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
}

.member-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 12px;
    border-radius: 12px;
    transition:
        background-color 0.2s ease,
        transform 0.2s ease,
        border-color 0.2s ease;
    border: 1px solid transparent;

    &:hover {
        background-color: var(--el-fill-color-light);
        border-color: var(--el-border-color-lighter);
        transform: translateY(-1px);
    }

    & + .member-row {
        margin-top: 8px;
    }

    :deep(.el-avatar) {
        flex-shrink: 0;
        border: 1px solid var(--el-border-color-lighter);
        background: var(--el-fill-color-light);
    }

    .member-meta {
        flex: 1;
        min-width: 0;

        .member-name {
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .member-desc {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
        }
    }

    .member-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;

        :deep(.el-button) {
            height: 30px;
            padding: 0 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
        }

        :deep(.el-button--info.is-plain) {
            background: var(--el-fill-color-light);
            border-color: var(--el-border-color);
            color: var(--el-text-color-secondary);
        }

        :deep(.el-button--primary.is-plain) {
            background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-fill-color-light));
            border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color));
            color: var(--el-color-primary);
        }

        :deep(.el-button--warning.is-plain) {
            background: color-mix(in srgb, var(--el-color-warning) 10%, var(--el-fill-color-light));
            border-color: color-mix(in srgb, var(--el-color-warning) 22%, var(--el-border-color));
        }

        :deep(.el-button--danger.is-plain) {
            background: color-mix(in srgb, var(--el-color-danger) 8%, var(--el-fill-color-light));
            border-color: color-mix(in srgb, var(--el-color-danger) 22%, var(--el-border-color));
        }
    }
}

.members-footer {
    display: flex;
    justify-content: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);

    .btn-load-more {
        padding: 8px 24px;
        border-radius: 99px;
    }

    .members-end {
        font-size: 13px;
        color: var(--el-text-color-secondary);
    }
}

@media (max-width: 768px) {
    .members-dialog {
        :deep(.el-dialog) {
            width: min(560px, calc(100vw - 24px)) !important;
        }

        :deep(.el-dialog__header) {
            padding-left: 16px;
            padding-right: 16px;
        }

        :deep(.el-dialog__body) {
            padding: 16px 12px 14px;
        }
    }

    .member-row {
        align-items: flex-start;

        .member-actions {
            flex-direction: column;
            align-items: stretch;
        }
    }
}
</style>
