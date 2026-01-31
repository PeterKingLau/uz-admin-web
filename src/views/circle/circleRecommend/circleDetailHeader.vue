<template>
    <div class="cover-area">
        <div class="cover-image-wrapper">
            <el-image v-if="circleInfo.coverUrl" :src="getImgUrl(circleInfo.coverUrl || '')" fit="cover" class="cover-img" />
            <div v-else class="cover-placeholder">
                <div class="placeholder-pattern"></div>
            </div>
            <div class="cover-mask"></div>
        </div>

        <div class="header-content">
            <div class="header-main">
                <div class="avatar-wrapper">
                    <el-avatar :size="96" :src="getImgUrl(circleInfo.avatar || circleInfo.coverUrl || '')" class="main-avatar">
                        {{ circleInfo.name?.charAt(0) }}
                    </el-avatar>
                </div>
                <div class="info-wrapper">
                    <div class="title-row">
                        <h1 class="circle-name">{{ circleInfo.name }}</h1>
                    </div>
                    <div class="stats-row">
                        <span class="stat-item">
                            <span class="stat-num">{{ formatNumber(circleInfo.memberCount) }}</span>
                            <span class="stat-label">{{ circleInfo.memberLabel || '成员' }}</span>
                        </span>
                        <span class="stat-divider"></span>
                        <span class="stat-item">
                            <span class="stat-num">{{ formatNumber(circleInfo.postCount) }}</span>
                            <span class="stat-label">讨论</span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="header-actions">
                <el-button
                    :type="circleInfo.joined ? 'default' : 'primary'"
                    round
                    class="btn-action btn-join"
                    :class="{ 'is-joined': circleInfo.joined }"
                    :loading="joinLoading"
                    @click="emit('join')"
                >
                    <template v-if="!circleInfo.joined"> <Icon icon="mdi:plus" /> 加入圈子 </template>
                    <template v-else>
                        <span class="text-joined">已加入</span>
                        <span class="text-hover">退出圈子</span>
                    </template>
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface CircleInfoHeader {
    name?: string
    coverUrl?: string
    avatar?: string
    joined?: boolean
    memberCount?: number
    postCount?: number
    memberLabel?: string
}

defineProps<{
    circleInfo: CircleInfoHeader
    joinLoading: boolean
    getImgUrl: (url: string) => string
    formatNumber: (num?: number) => string
}>()

const emit = defineEmits<{
    (e: 'join'): void
}>()
</script>

<style scoped lang="scss">
.cover-area {
    position: relative;
    padding-bottom: 24px;
    margin-bottom: 16px;
    background: var(--circle-card-bg);
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    overflow: hidden;
}

.cover-image-wrapper {
    height: 200px;
    position: relative;
    overflow: hidden;

    .cover-img {
        width: 100%;
        height: 100%;
    }

    .cover-placeholder {
        width: 100%;
        height: 100%;
        background: var(--el-fill-color-dark);
        position: relative;
    }

    .cover-mask {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
    }
}

.header-content {
    padding: 0 32px;
    margin-top: -48px;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    .header-main {
        display: flex;
        align-items: flex-end;
        gap: 24px;
        flex: 1;
        min-width: 0;
    }

    .avatar-wrapper {
        padding: 4px;
        background: var(--circle-card-bg);
        border-radius: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

        .main-avatar {
            display: block;
            border-radius: 16px;
            background: var(--el-fill-color-light);
            border: 1px solid var(--el-border-color-lighter);
        }
    }

    .info-wrapper {
        padding-bottom: 6px;
        flex: 1;
        min-width: 0;

        .title-row {
            margin-bottom: 8px;

            .circle-name {
                margin: 0;
                font-size: 26px;
                font-weight: 700;
                color: var(--circle-text-main);
                line-height: 1.2;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }

        .stats-row {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: var(--circle-text-sub);

            .stat-item {
                display: flex;
                align-items: baseline;
                gap: 4px;

                .stat-num {
                    font-weight: 600;
                    color: var(--circle-text-main);
                    font-family: var(--el-font-family);
                }

                .stat-label {
                    font-size: 13px;
                    color: var(--circle-text-muted);
                }
            }

            .stat-divider {
                width: 1px;
                height: 12px;
                background: var(--el-border-color);
                margin: 0 16px;
            }
        }
    }

    .header-actions {
        display: flex;
        gap: 12px;
        padding-bottom: 6px;
        flex-shrink: 0;

        .btn-action {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            padding: 10px 24px;
            border-radius: 99px;
            transition: all 0.2s;

            &.btn-join {
                min-width: 100px;
                box-shadow: 0 4px 12px var(--el-color-primary-light-5);

                &.is-joined {
                    background-color: var(--el-fill-color);
                    color: var(--circle-text-muted);
                    border-color: transparent;
                    box-shadow: none;

                    .text-hover {
                        display: none;
                    }

                    &:hover {
                        background-color: var(--el-color-danger-light-9);
                        color: var(--el-color-danger);
                        .text-joined {
                            display: none;
                        }
                        .text-hover {
                            display: inline;
                        }
                    }
                }
            }
        }
    }
}

@media screen and (max-width: 768px) {
    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        margin-top: -30px;

        .header-actions {
            width: 100%;
            justify-content: flex-end;
        }
    }
}
</style>
