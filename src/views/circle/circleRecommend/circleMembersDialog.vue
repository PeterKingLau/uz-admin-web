<template>
    <el-dialog :model-value="modelValue" width="560px" class="members-dialog" :lock-scroll="false" @update:model-value="emit('update:modelValue', $event)">
        <template #header>
            <div class="dialog-header-title">
                <span class="title-text">圈子成员</span>
            </div>
        </template>
        <div class="members-list" v-loading="allMembersLoading && allMembers.length === 0">
            <div v-if="dialogManagers.length" class="members-section">
                <div class="section-title">主理人({{ dialogManagers.length }})</div>
                <div v-for="member in dialogManagers" :key="member.id" class="member-row">
                    <el-avatar :size="44" :src="getImgUrl(member.avatar || '')">{{ member.name?.charAt(0) }}</el-avatar>
                    <div class="member-meta">
                        <div class="member-name">
                            {{ member.name }}
                        </div>
                        <div class="member-desc">{{ member.description || '暂无简介' }}</div>
                    </div>
                    <div class="member-actions">
                        <el-button
                            v-if="isCircleOwner"
                            size="small"
                            round
                            plain
                            :type="member.isManager ? 'info' : 'warning'"
                            :disabled="member.isManager"
                            :loading="member.adminLoading"
                            @click="emit('set-admin', member)"
                        >
                            {{ member.isManager ? '管理员' : '设为管理员' }}
                        </el-button>
                        <el-button size="small" round plain :type="isSelf(member) ? 'info' : member.followed ? 'info' : 'primary'" :disabled="isSelf(member)">
                            {{ isSelf(member) ? '自己' : member.followed ? '已关注' : '+关注' }}
                        </el-button>
                    </div>
                </div>
            </div>

            <div class="members-section">
                <div class="section-title">其他成员({{ dialogOthers.length }})</div>
                <div v-for="member in dialogOthers" :key="member.id" class="member-row">
                    <el-avatar :size="44" :src="getImgUrl(member.avatar || '')">{{ member.name?.charAt(0) }}</el-avatar>
                    <div class="member-meta">
                        <div class="member-name">{{ member.name }}</div>
                        <div class="member-desc">{{ member.description || '暂无简介' }}</div>
                    </div>
                    <div class="member-actions">
                        <el-button
                            v-if="isCircleOwner"
                            size="small"
                            round
                            plain
                            :type="member.isManager ? 'info' : 'warning'"
                            :disabled="member.isManager"
                            :loading="member.adminLoading"
                            @click="emit('set-admin', member)"
                        >
                            {{ member.isManager ? '管理员' : '设为管理员' }}
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
    adminLoading?: boolean
}

const props = defineProps<{
    modelValue: boolean
    dialogManagers: MemberItem[]
    dialogOthers: MemberItem[]
    isCircleOwner: boolean
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

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'load-more'): void
    (e: 'set-admin', member: MemberItem): void
}>()
</script>

<style scoped lang="scss">
.members-dialog {
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
            color: var(--circle-text-main);
        }
    }
}

.members-section {
    margin-bottom: 24px;
    .section-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--circle-text-muted);
        margin-bottom: 12px;
    }
}

.member-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 8px;
    border-radius: 12px;
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--el-fill-color-light);
    }

    .member-meta {
        flex: 1;
        min-width: 0;

        .member-name {
            font-size: 15px;
            font-weight: 600;
            color: var(--circle-text-main);
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .member-desc {
            font-size: 13px;
            color: var(--circle-text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    .member-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
    }
}

.members-footer {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);

    .btn-load-more {
        padding: 8px 24px;
        border-radius: 99px;
    }

    .members-end {
        font-size: 13px;
        color: var(--circle-text-muted);
    }
}
</style>
