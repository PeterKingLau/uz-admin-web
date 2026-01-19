<template>
    <div class="feed-card" :class="{ checked }" @click.capture="handleCardClick">
        <div class="card-top">
            <div class="top-left" @click="handleTopLeftClick">
                <el-checkbox v-if="isBatchMode" :model-value="checked" data-stop-card-click @change="handleCheckboxChange" />
                <div class="type-badge" :data-type="String(post?.postType ?? '')">
                    <Icon :icon="typeIcon" class="type-icon" />
                    <span class="type-text">{{ typeText }}</span>
                </div>
            </div>

            <div class="top-right" @click.stop>
                <el-tag :type="getStatusType(post.auditStatus)" size="small" effect="light" class="audit-tag">
                    {{ getAuditStatusName(post.auditStatus) }}
                </el-tag>

                <el-tooltip content="编辑标签" placement="top">
                    <button type="button" class="icon-btn" data-stop-card-click @click="emit('edit-tag', post)">
                        <Icon icon="mdi:tag-outline" />
                    </button>
                </el-tooltip>

                <el-tooltip content="人工置顶" placement="top">
                    <button type="button" class="icon-btn" data-stop-card-click @click="emit('pin', post)">
                        <Icon icon="mdi:pin-outline" />
                    </button>
                </el-tooltip>

                <el-tooltip content="取消置顶" placement="top">
                    <button type="button" class="icon-btn" data-stop-card-click @click="emit('unpin', post)">
                        <Icon icon="mdi:pin-off-outline" />
                    </button>
                </el-tooltip>

                <el-tooltip content="删除该条" placement="top">
                    <button type="button" class="icon-btn danger" data-stop-card-click @click="handleDelete">
                        <Icon icon="mdi:trash-can-outline" />
                    </button>
                </el-tooltip>
            </div>
        </div>

        <div class="card-user">
            <el-avatar :size="36" :src="fullAvatar(post.avatar)" class="avatar">
                {{ post.nickName?.charAt(0).toUpperCase() || 'U' }}
            </el-avatar>

            <div class="user-meta">
                <div class="user-name">{{ post.nickName || '未知用户' }}</div>
                <div class="user-time">{{ post.createTime || '-' }}</div>
            </div>
        </div>

        <div class="card-content">
            <div v-if="post.content" class="text">{{ post.content }}</div>
            <div v-else class="text empty">（无正文内容）</div>

            <div v-if="mediaFiles.length > 0" class="media" @click.stop>
                <MediaPreview :post-type="post.postType" :media-urls="mediaFiles" :audit-status="post.auditStatus" />
            </div>

            <div v-if="post.tags && post.tags.length > 0" class="tags" @click.stop>
                <span v-for="tag in post.tags" :key="tag.tagId" class="tag-chip">#{{ tag.tagName }}</span>
            </div>
        </div>

        <div class="card-footer" @click.stop>
            <div class="stat">
                <Icon icon="mdi:thumb-up-outline" />
                <span>{{ post.likeCount ?? 0 }}</span>
            </div>
            <div class="stat">
                <Icon icon="mdi:comment-outline" />
                <span>{{ post.commentCount ?? 0 }}</span>
            </div>
            <div class="stat">
                <Icon icon="mdi:share-variant-outline" />
                <span>{{ post.repostCount ?? 0 }}</span>
            </div>
            <div class="stat">
                <Icon :icon="(post.bookmarkCount ?? 0) > 0 ? 'mdi:bookmark' : 'mdi:bookmark-outline'" />
                <span>{{ post.bookmarkCount ?? 0 }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MediaPreview from '@/components/MediaPreview/index.vue'
import { AUDIT_STATUS, ENUM_TAG_CONFIG, POST_TYPE } from '@/utils/enum'

const props = defineProps<{
    post: any
    checked?: boolean
    batchMode?: boolean
}>()

const emit = defineEmits<{
    (e: 'select', value: boolean): void
    (e: 'delete', id: number | string): void
    (e: 'edit-tag', post: any): void
    (e: 'pin', post: any): void
    (e: 'unpin', post: any): void
    (e: 'preview', post: any): void
}>()

const checked = computed(() => Boolean(props.checked))
const isBatchMode = computed(() => Boolean(props.batchMode))

const typeText = computed(() => {
    const t = String(props.post?.postType)
    return t === POST_TYPE.TEXT ? '文字' : t === POST_TYPE.IMAGE ? '图文' : '视频'
})

const typeIcon = computed(() => {
    const t = String(props.post?.postType)
    return t === POST_TYPE.TEXT ? 'mdi:format-text' : t === POST_TYPE.IMAGE ? 'mdi:image' : 'mdi:video'
})

const mediaFiles = computed(() => {
    let rawList: any[] = []
    if (props.post.mediaUrls) {
        if (Array.isArray(props.post.mediaUrls)) rawList = props.post.mediaUrls
        else if (typeof props.post.mediaUrls === 'string') {
            try {
                const parsed = JSON.parse(props.post.mediaUrls)
                rawList = Array.isArray(parsed) ? parsed : [props.post.mediaUrls]
            } catch {
                rawList = [props.post.mediaUrls]
            }
        }
    } else if (props.post.files && Array.isArray(props.post.files)) {
        rawList = props.post.files
    }

    return rawList
        .map(item => {
            if (typeof item === 'string') return item
            return item?.url || item?.src || item?.path || ''
        })
        .filter(Boolean)
})

const fullAvatar = (avatar: string) => {
    if (!avatar) return ''
    if (/^https?:\/\//.test(avatar)) return avatar
    return (import.meta.env.VITE_APP_BASE_API || '') + avatar
}

const auditStatusAlias: Record<string, string> = {
    PENDING: AUDIT_STATUS.PENDING,
    APPROVED: AUDIT_STATUS.APPROVED,
    REJECTED: AUDIT_STATUS.REJECTED
}

function resolveAuditStatusKey(status: string) {
    const key = String(status ?? '')
    if (ENUM_TAG_CONFIG.AUDIT_STATUS[key]) return key
    return auditStatusAlias[key] || key
}

function getStatusType(status: string) {
    const key = resolveAuditStatusKey(status)
    return ENUM_TAG_CONFIG.AUDIT_STATUS[key]?.type || 'warning'
}

function getAuditStatusName(status: string) {
    const key = resolveAuditStatusKey(status)
    return ENUM_TAG_CONFIG.AUDIT_STATUS[key]?.label || status
}

function handleDelete() {
    emit('delete', props.post.id)
}

function handleCardClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null
    if (target?.closest('[data-stop-card-click]')) return

    if (isBatchMode.value) {
        emit('select', !checked.value)
        event.stopPropagation()
        return
    }

    const postType = String(props.post?.postType ?? '')
    if (postType !== POST_TYPE.IMAGE) return

    emit('preview', props.post)
    event.stopPropagation()
}

function handleCheckboxChange(value: boolean) {
    if (!isBatchMode.value) return
    emit('select', value)
}

function handleTopLeftClick(event: MouseEvent) {
    if (isBatchMode.value) event.stopPropagation()
}
</script>

<style scoped lang="scss">
.feed-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 18px;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    overflow: hidden;
    cursor: pointer;
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease;
    display: flex;
    flex-direction: column;
    min-height: 280px;
}

.feed-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
    border-color: var(--el-border-color);
}

.feed-card.checked {
    border-color: var(--el-color-primary);
    box-shadow: 0 16px 44px rgba(64, 158, 255, 0.16);
}

.card-top {
    padding: 12px 12px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.top-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.type-badge {
    height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-extra-light);
    user-select: none;
    white-space: nowrap;
}

.type-badge .type-icon {
    font-size: 16px;
}

.type-badge[data-type='1'] {
    background: rgba(64, 158, 255, 0.12);
    border-color: rgba(64, 158, 255, 0.22);
    color: var(--el-color-primary);
}

.type-badge[data-type='2'] {
    background: rgba(103, 194, 58, 0.12);
    border-color: rgba(103, 194, 58, 0.22);
    color: var(--el-color-success);
}

.type-badge[data-type='3'] {
    background: rgba(230, 162, 60, 0.12);
    border-color: rgba(230, 162, 60, 0.22);
    color: var(--el-color-warning);
}

.top-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
}

.audit-tag {
    border-radius: 999px;
}

.icon-btn {
    width: 30px;
    height: 30px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition:
        background 0.16s ease,
        color 0.16s ease,
        border-color 0.16s ease;
    padding: 0;
    cursor: pointer;
}

.icon-btn:hover {
    background: var(--el-fill-color-dark);
    color: var(--el-text-color-primary);
    border-color: var(--el-border-color);
}

.icon-btn.danger:hover {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    border-color: rgba(245, 108, 108, 0.35);
}

.card-user {
    padding: 0 14px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar {
    flex-shrink: 0;
}

.user-meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.user-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.card-content {
    padding: 0 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
}

.text {
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.text.empty {
    color: var(--el-text-color-placeholder);
    font-style: italic;
}

.media {
    border-radius: 14px;
    overflow: hidden;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-extra-light);
}

.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.tag-chip {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid rgba(64, 158, 255, 0.18);
    white-space: nowrap;
}

.card-footer {
    padding: 12px 14px;
    border-top: 1px solid var(--el-border-color-extra-light);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    background: var(--el-bg-color);
}

.stat {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    padding: 6px 8px;
    border-radius: 12px;
    background: var(--el-fill-color-extra-light);
    transition:
        background 0.16s ease,
        color 0.16s ease;
}

.stat:hover {
    background: var(--el-fill-color);
    color: var(--el-text-color-primary);
}
</style>
