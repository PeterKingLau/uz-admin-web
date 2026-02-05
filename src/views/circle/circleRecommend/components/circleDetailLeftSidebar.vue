<template>
    <aside class="left-sidebar">
        <div class="sidebar-sticky">
            <nav class="nav-menu">
                <el-tooltip v-if="circleName && circleName.length > 8" :content="circleName" placement="right" effect="dark">
                    <div class="nav-item active">
                        <div class="icon-box">
                            <Icon icon="mdi:bullseye-arrow" />
                        </div>
                        <span class="nav-text">{{ circleName }}</span>
                    </div>
                </el-tooltip>
                <div v-else class="nav-item active">
                    <div class="icon-box">
                        <Icon icon="mdi:bullseye-arrow" />
                    </div>
                    <span class="nav-text">{{ circleName || '当前圈子' }}</span>
                </div>

                <div class="nav-item" @click="emit('go-back')">
                    <div class="icon-box">
                        <Icon icon="mdi:compass-outline" />
                    </div>
                    <span class="nav-text">广场首页</span>
                </div>
            </nav>
        </div>
    </aside>
</template>

<script setup lang="ts">
defineProps<{ circleName?: string }>()

const emit = defineEmits<{
    (e: 'go-back'): void
}>()
</script>

<style scoped lang="scss">
.left-sidebar {
    width: 220px;
    flex-shrink: 0;

    .sidebar-sticky {
        position: sticky;
        top: 24px;
    }

    .nav-menu {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 99px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: var(--circle-text-sub);
        height: 48px;
        box-sizing: border-box;

        .icon-box {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: var(--circle-text-muted);
            flex-shrink: 0;
        }

        .nav-text {
            font-size: 15px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1;
            flex: 1;
        }

        &:hover {
            background-color: var(--el-fill-color);
            color: var(--el-text-color-primary);

            .icon-box {
                color: var(--el-text-color-primary);
            }
        }

        &.active {
            background-color: var(--el-color-primary-light-9);
            color: var(--el-color-primary);

            .icon-box {
                color: var(--el-color-primary);
            }
        }
    }
}

@media screen and (max-width: 992px) {
    .left-sidebar {
        width: 100%;
    }

    .sidebar-sticky {
        position: static;
    }

    .nav-menu {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
    }

    .nav-item {
        height: 40px;
        padding: 8px 12px;
        border-radius: 12px;
        flex: 0 0 auto;

        .nav-text {
            max-width: 140px;
        }
    }
}
</style>
