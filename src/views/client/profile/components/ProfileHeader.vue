<template>
    <section class="profile-header">
        <div class="cover">
            <img :src="coverSrc" alt="" @error="coverFailed = true" />
            <div class="cover-tint"></div>
        </div>

        <div class="profile-info">
            <div class="avatar-wrap">
                <img v-if="avatar && !avatarFailed" :src="avatar" alt="" class="avatar" @error="avatarFailed = true" />
                <div v-else class="avatar avatar-fallback">{{ name.charAt(0).toUpperCase() }}</div>
            </div>

            <div class="identity">
                <div class="title-row">
                    <div class="title-main">
                        <h1>{{ name }}</h1>
                    </div>
                    <div class="actions">
                        <button v-if="isSelf" type="button" class="action-btn primary" @click="emit('edit')">
                            <Icon icon="ep:edit" />
                            <span>编辑资料</span>
                        </button>
                        <template v-else>
                            <button
                                type="button"
                                class="action-btn primary"
                                :class="{ 'is-following': isFollowing, 'is-loading': followLoading }"
                                :disabled="followLoading"
                                @click="emit('follow')"
                            >
                                <Icon :icon="isFollowing ? 'mdi:check' : 'mdi:plus'" class="icon-default" />
                                <Icon v-if="isFollowing" icon="mdi:close" class="icon-hover" />
                                <span class="label-default">{{ isFollowing ? '已关注' : '关注' }}</span>
                                <span v-if="isFollowing" class="label-hover">取消关注</span>
                            </button>
                        </template>
                    </div>
                </div>

                <p class="bio">{{ bio }}</p>

                <div class="stats">
                    <button
                        v-for="item in stats"
                        :key="item.key"
                        type="button"
                        class="stat-item"
                        :class="{ 'is-clickable': item.clickable }"
                        :disabled="!item.clickable"
                        @click="emit('stat-click', item)"
                    >
                        <strong>{{ item.value }}</strong>
                        <span>{{ item.label }}</span>
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientProfileComponentsProfileHeader' })
import { computed, ref, watch } from 'vue'
import defaultProfileCover from '@/assets/images/bg_profile.jpeg'

const props = defineProps<{
    coverUrl: string
    avatar: string
    name: string
    bio: string
    isSelf: boolean
    isFollowing?: boolean
    followLoading?: boolean
    stats: Array<{ key: string; label: string; value: string | number; clickable?: boolean }>
}>()

const emit = defineEmits<{
    (e: 'edit'): void
    (e: 'follow'): void
    (e: 'message'): void
    (e: 'stat-click', item: { key: string; label: string; value: string | number; clickable?: boolean }): void
}>()

const avatarFailed = ref(false)
const coverFailed = ref(false)
const coverSrc = computed(() => (coverFailed.value ? defaultProfileCover : props.coverUrl || defaultProfileCover))

watch(
    () => props.avatar,
    () => {
        avatarFailed.value = false
    }
)

watch(
    () => props.coverUrl,
    () => {
        coverFailed.value = false
    }
)
</script>

<style scoped lang="scss">
.profile-header {
    overflow: hidden;
    border-radius: 12px;
    background: var(--client-surface);
    box-shadow: var(--client-shadow-soft);
}

.cover {
    position: relative;
    height: 210px;
    overflow: hidden;
    background: var(--client-cover-gradient);
}

.cover img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
}

.cover-tint {
    position: absolute;
    inset: 0;
    background: var(--client-cover-tint);
}

.profile-info {
    position: relative;
    display: flex;
    gap: 20px;
    padding: 0 24px 24px;
}

.avatar-wrap {
    margin-top: -42px;
    flex: 0 0 auto;
}

.avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    display: block;
    object-fit: cover;
    border: 4px solid var(--client-surface);
    background: var(--client-fill);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--text-main) 10%, transparent);
}

.avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-minor);
    font-size: 34px;
    font-weight: 800;
}

.identity {
    flex: 1;
    min-width: 0;
    padding-top: 16px;
}

.title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
}

.title-main {
    min-width: 0;
}

h1 {
    margin: 0;
    font-size: 26px;
    line-height: 1.25;
    color: var(--text-main);
    font-weight: 700;
}

.bio {
    margin: 10px 0 0;
    max-width: 720px;
    font-size: 14px;
    line-height: 1.65;
    color: var(--text-regular);
    word-break: break-word;
}

.actions {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}

.action-btn {
    height: 36px;
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition:
        background-color var(--app-motion-fast),
        color var(--app-motion-fast),
        box-shadow var(--app-motion-fast),
        opacity var(--app-motion-fast);
}

.action-btn.primary {
    background: var(--client-active-bg);
    color: var(--client-active-text);
    border-color: color-mix(in srgb, var(--primary-color) 18%, transparent);
    box-shadow: none;
}

.action-btn.primary:hover {
    opacity: 1;
    background: var(--client-primary-muted);
    border-color: color-mix(in srgb, var(--primary-color) 28%, transparent);
    box-shadow: none;
}

.action-btn.primary.is-following {
    background: var(--client-surface-muted);
    color: var(--text-regular);
    border-color: var(--client-border-soft);
}

.action-btn.primary.is-following:hover {
    background: var(--client-danger-soft);
    color: var(--client-danger-text);
    border-color: color-mix(in srgb, var(--client-danger-text) 28%, transparent);
}

.action-btn .label-hover {
    display: none;
}

.action-btn .icon-hover {
    display: none;
}

.action-btn.primary.is-following:hover .icon-default,
.action-btn.primary.is-following:hover .label-default {
    display: none;
}

.action-btn.primary.is-following:hover .icon-hover,
.action-btn.primary.is-following:hover .label-hover {
    display: inline;
}

.action-btn:disabled,
.action-btn.is-loading {
    cursor: wait;
    opacity: 0.72;
}

.action-btn.ghost {
    background: var(--client-surface-muted);
    color: var(--text-regular);
}

.action-btn.ghost:hover {
    background: var(--client-surface-hover);
    color: var(--text-main);
}

.stats {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.stat-item {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    padding: 4px 8px;
    margin: -4px -8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    cursor: default;
    font: inherit;
    transition:
        background-color var(--app-motion-fast),
        color var(--app-motion-fast);
}

.stat-item.is-clickable {
    cursor: pointer;
}

.stat-item.is-clickable:hover {
    background: var(--client-surface-muted);
}

.stat-item:disabled {
    opacity: 1;
}

.stat-item strong {
    color: var(--text-main);
    font-size: 18px;
    line-height: 1.2;
    font-weight: 700;
}

.stat-item span {
    color: var(--text-minor);
    font-size: 13px;
}

button:focus,
button:focus-visible {
    outline: none;
    box-shadow: var(--client-focus-ring);
}

@media screen and (max-width: 768px) {
    .cover {
        height: 140px;
    }

    .profile-info {
        display: block;
        padding: 0 16px 20px;
    }

    .avatar-wrap {
        margin-top: -38px;
    }

    .avatar {
        width: 78px;
        height: 78px;
        border-width: 3px;
    }

    .identity {
        padding-top: 12px;
    }

    .title-row {
        flex-direction: column;
        gap: 12px;
    }

    h1 {
        font-size: 21px;
    }

    .actions {
        width: 100%;
    }

    .action-btn {
        flex: 1;
    }

    .stats {
        gap: 14px;
        justify-content: space-between;
    }

    .stat-item {
        flex-direction: column;
        gap: 3px;
        align-items: flex-start;
    }
}
</style>
