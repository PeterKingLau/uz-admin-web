<template>
    <div class="preview-sticky-wrapper circle-preview-wrapper">
        <div class="preview-header">
            <div class="header-left">
                <Icon icon="mdi:cellphone-screenshot" class="header-icon" />
                <span class="label">实时预览</span>
            </div>
            <div class="header-time">{{ currentTime }}</div>
        </div>

        <div class="mobile-frame">
            <div class="device-buttons">
                <div class="btn-mute"></div>
                <div class="btn-vol-up"></div>
                <div class="btn-vol-down"></div>
                <div class="btn-power"></div>
            </div>

            <div class="screen-content">
                <div class="status-bar">
                    <span class="time">{{ currentTime }}</span>
                    <div class="dynamic-island">
                        <div class="camera"></div>
                        <div class="sensor"></div>
                    </div>
                    <div class="status-icons">
                        <Icon icon="mdi:signal-cellular-3" />
                        <Icon icon="mdi:wifi" />
                        <Icon icon="mdi:battery-80" />
                    </div>
                </div>

                <div class="app-nav">
                    <Icon icon="mdi:chevron-left" class="nav-icon" />
                    <div class="user-brief">
                        <el-avatar :size="28" :src="props.userAvatar" class="nav-avatar" />
                        <span class="username">{{ props.userNickName }}</span>
                    </div>
                    <Icon icon="mdi:dots-horizontal" class="nav-icon" />
                </div>

                <div class="scroll-area circle-scroll-area">
                    <div class="circle-cover-card">
                        <el-image v-if="props.coverPreviewUrl" :src="props.coverPreviewUrl" fit="cover" class="circle-cover-image" />
                        <div v-else class="circle-cover-placeholder">
                            <Icon icon="mdi:image-outline" />
                        </div>
                        <div class="circle-cover-overlay"></div>
                    </div>

                    <div class="content-body circle-content-body">
                        <div class="circle-title-row">
                            <h1 class="post-title circle-title">{{ props.name || '圈子名称' }}</h1>
                            <el-tag size="small" effect="plain" class="circle-state-tag">新圈子</el-tag>
                        </div>

                        <div class="circle-meta-row">
                            <div class="circle-meta-card">
                                <Icon icon="mdi:account-group-outline" />
                                <span class="meta-value">{{ props.mockMemberCount }}</span>
                                <span class="meta-label">成员</span>
                            </div>
                            <div class="circle-meta-card">
                                <Icon icon="mdi:message-text-outline" />
                                <span class="meta-value">{{ props.mockPostCount }}</span>
                                <span class="meta-label">动态</span>
                            </div>
                        </div>

                        <p class="post-text" :class="{ placeholder: !props.description }">
                            {{ props.description || '这里将显示圈子的简介内容，帮助用户快速理解圈子的主题与氛围。' }}
                        </p>

                        <div class="tags-row circle-tags-row">
                            <span class="hash-tag"># 同好交流</span>
                            <span class="hash-tag"># 圈子互动</span>
                            <span class="hash-tag"># 内容分享</span>
                        </div>

                        <div class="meta-row circle-bottom-meta">
                            <span class="date">刚刚创建</span>
                            <span class="location">
                                <Icon icon="mdi:shield-check-outline" class="location-icon" />
                                官方推荐
                            </span>
                        </div>
                    </div>

                    <div class="mock-comments circle-highlights">
                        <div class="comment-count">圈子亮点</div>
                        <div class="circle-highlight-list">
                            <div class="circle-highlight-item">
                                <Icon icon="mdi:star-four-points-outline" class="highlight-icon" />
                                <div class="highlight-text">
                                    <div class="highlight-title">内容共创</div>
                                    <div class="highlight-desc">成员可以围绕同一主题持续发布与讨论。</div>
                                </div>
                            </div>
                            <div class="circle-highlight-item">
                                <Icon icon="mdi:account-multiple-outline" class="highlight-icon" />
                                <div class="highlight-text">
                                    <div class="highlight-title">成员互动</div>
                                    <div class="highlight-desc">在圈子里认识更多兴趣相近的人。</div>
                                </div>
                            </div>
                        </div>
                        <div class="circle-join-button">加入圈子</div>
                    </div>
                </div>

                <div class="app-tabbar">
                    <div class="input-fake">
                        <Icon icon="mdi:compass-outline" class="edit-icon" />
                        <span>发现更多圈子内容</span>
                    </div>
                    <div class="action-icons">
                        <div class="icon-item">
                            <Icon icon="mdi:heart-outline" />
                            <span class="count">关注</span>
                        </div>
                        <div class="icon-item">
                            <Icon icon="mdi:account-plus-outline" />
                            <span class="count">加入</span>
                        </div>
                        <div class="icon-item">
                            <Icon icon="mdi:share-outline" />
                            <span class="count">分享</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsCircleCircleManagementComponentsCirclePreviewPanel' })
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
    name: string
    description: string
    coverPreviewUrl: string
    mockMemberCount: string | number
    mockPostCount: string | number
    userAvatar: string
    userNickName: string
}>()

const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const updateTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    currentTime.value = `${hours}:${minutes}`
}

onMounted(() => {
    updateTime()
    timer = setInterval(updateTime, 1000)
})

onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
})
</script>

<style scoped lang="scss">
@use '../../../../assets/styles/content/mobile-post-preview.scss' as preview;

@include preview.mobile-post-preview();

.circle-preview-wrapper {
    padding-left: 20px;
    border-left: 1px dashed var(--el-border-color);
    --preview-primary: var(--el-color-primary);
}

.circle-scroll-area {
    background: var(--surface-muted);
}

.circle-cover-card {
    position: relative;
    margin: 16px 16px 0;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--surface-subtle);
    border: 1px solid var(--nav-border);
}

.circle-cover-image {
    width: 100%;
    height: 100%;
    display: block;
}

.circle-cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: var(--text-placeholder);
    background: var(--surface-subtle);
}

.circle-cover-overlay {
    position: absolute;
    inset: 0;
    border: 1px solid rgba(0, 0, 0, 0.04);
    pointer-events: none;
}

.circle-content-body {
    margin: -24px 16px 16px;
    padding: 20px 16px 16px;
    border-radius: 8px;
    position: relative;
    border: 1px solid var(--nav-border);
    background: var(--surface-card);
    box-shadow: 0 8px 20px -18px var(--tabbar-shadow);
}

.circle-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
}

.circle-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
}

.circle-state-tag {
    border-radius: 4px;
    flex-shrink: 0;
}

.circle-meta-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.circle-meta-card {
    background: var(--surface-subtle);
    border: 1px solid var(--nav-border);
    border-radius: 6px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-regular);

    .iconify {
        font-size: 16px;
        color: var(--preview-primary);
    }

    .meta-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .meta-label {
        font-size: 12px;
        color: var(--text-secondary);
    }
}

.circle-tags-row {
    margin-bottom: 16px;
}

.circle-bottom-meta {
    margin-top: 0;
    padding-top: 16px;
    border-top: 1px solid var(--nav-border);
}

.circle-highlights {
    margin: 0 16px 16px;
    padding: 16px;
    background: var(--surface-card);
    border-radius: 8px;
    border: 1px solid var(--nav-border);
    box-shadow: 0 8px 20px -18px var(--tabbar-shadow);
}

.circle-highlight-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}

.circle-highlight-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-radius: 6px;
    padding: 12px;
    background: var(--surface-subtle);
    border: 1px solid var(--nav-border);
}

.highlight-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
    color: var(--preview-primary);
    background: var(--primary-soft);
}

.highlight-text {
    min-width: 0;
}

.highlight-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.highlight-desc {
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-secondary);
}

.circle-join-button {
    width: 100%;
    height: 40px;
    border-radius: 4px;
    background: var(--preview-primary);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
}

:global(html.dark) .circle-preview-wrapper {
    border-left-color: var(--el-border-color-darker);

    .circle-cover-card,
    .circle-content-body,
    .circle-highlights,
    .circle-meta-card,
    .circle-highlight-item {
        border-color: rgba(255, 255, 255, 0.08);
    }

    .circle-cover-placeholder {
        background: #1d1e1f;
        color: rgba(255, 255, 255, 0.34);
    }

    .circle-cover-overlay {
        border-color: rgba(255, 255, 255, 0.04);
    }

    .circle-state-tag {
        background: rgba(var(--el-color-primary-rgb), 0.14);
        border-color: rgba(var(--el-color-primary-rgb), 0.45);
        color: var(--el-color-primary-light-3);
    }

    .circle-meta-card,
    .circle-highlight-item {
        background: rgba(255, 255, 255, 0.035);
    }

    .circle-join-button {
        background: var(--el-color-primary-light-3);
        color: #0f141d;
    }
}

@media screen and (max-width: 1200px) {
    .circle-preview-wrapper {
        border-left: none;
        padding-left: 0;
        margin-top: 40px;
        padding-top: 40px;
        border-top: 1px dashed var(--el-border-color);
    }
}
</style>
