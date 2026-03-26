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
                            <el-tag size="small" effect="dark" class="circle-state-tag">新圈子</el-tag>
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

<script setup name="ViewsCircleCircleManagementComponentsCirclePreviewPanel" lang="ts">
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
}

.circle-scroll-area {
    background: radial-gradient(circle at top, color-mix(in srgb, var(--el-color-primary-light-9) 62%, transparent), transparent 42%), var(--surface-muted);
}

.circle-cover-card {
    position: relative;
    margin: 16px 16px 0;
    height: 220px;
    border-radius: 24px;
    overflow: hidden;
    background: var(--surface-subtle);
    box-shadow:
        0 18px 36px -22px color-mix(in srgb, var(--el-color-black) 28%, transparent),
        inset 0 0 0 1px color-mix(in srgb, var(--el-color-white) 16%, transparent);
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
    font-size: 48px;
    color: var(--text-placeholder);
    background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary-light-9) 80%, var(--surface-subtle)), var(--surface-card));
}

.circle-cover-overlay {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(to top, color-mix(in srgb, var(--el-color-black) 32%, transparent), transparent 55%),
        linear-gradient(to bottom, color-mix(in srgb, var(--el-color-white) 8%, transparent), transparent 24%);
}

.circle-content-body {
    margin: -28px 16px 8px;
    border-radius: 28px 28px 20px 20px;
    position: relative;
    box-shadow: 0 16px 30px -24px color-mix(in srgb, var(--el-color-black) 22%, transparent);
}

.circle-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.circle-title {
    margin: 0;
}

.circle-state-tag {
    border-radius: 999px;
    padding: 0 10px;
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
    border-radius: 16px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-regular);

    .iconify {
        font-size: 18px;
        color: var(--preview-primary);
    }

    .meta-value {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-primary);
    }

    .meta-label {
        font-size: 12px;
        color: var(--text-secondary);
    }
}

.circle-tags-row {
    margin-bottom: 14px;
}

.circle-bottom-meta {
    margin-top: 2px;
}

.circle-highlights {
    margin: 0 16px 16px;
    min-height: auto;
    border-radius: 24px;
    box-shadow: 0 16px 30px -24px color-mix(in srgb, var(--el-color-black) 22%, transparent);
}

.circle-highlight-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 18px;
}

.circle-highlight-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.highlight-icon {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
    color: var(--preview-primary);
    background: var(--el-color-primary-light-9);
}

.highlight-text {
    min-width: 0;
}

.highlight-title {
    font-size: 13px;
    font-weight: 700;
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
    border-radius: 999px;
    background: linear-gradient(135deg, var(--preview-primary), color-mix(in srgb, var(--preview-primary) 72%, #7cafff));
    color: var(--el-color-white);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.2px;
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
