<template>
    <div class="circle-plaza-page">
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">圈子广场</h1>
                <p class="page-subtitle">发现感兴趣的社区，与志同道合的人一起成长</p>
            </div>

            <div v-if="joinedCircles.length > 0" v-loading="loadingJoined" class="section-block joined-section">
                <div class="section-header">
                    <div class="title-wrapper">
                        <span class="section-title">我加入的圈子</span>
                    </div>
                </div>
                <div class="joined-grid">
                    <div v-for="item in joinedCircles" :key="item.id" class="joined-card" @click="handleCardClick(item)">
                        <div class="joined-card-inner">
                            <el-avatar :size="44" :src="getImgUrl(item.avatar || item.coverUrl)" class="joined-avatar">
                                {{ item.name?.charAt(0) }}
                            </el-avatar>
                            <div class="joined-info">
                                <el-tooltip :content="item.name" placement="top" :disabled="!isTextOverflow(item.name, 15)">
                                    <h4 class="joined-name">{{ item.name }}</h4>
                                </el-tooltip>
                                <div class="joined-meta">
                                    <span>{{ formatNumber(item.memberCount) }} 成员</span>
                                    <span class="dot">·</span>
                                    <span>{{ formatNumber(item.postCount) }} 动态</span>
                                </div>
                            </div>
                            <div class="joined-arrow">
                                <Icon icon="mdi:chevron-right" />
                            </div>
                        </div>
                        <div v-if="item.latestPost" class="latest-dynamic">
                            <span class="dynamic-tag">最新</span>
                            <span class="dynamic-text">{{ item.latestPost }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-block recommend-section">
                <div class="section-header">
                    <div class="title-wrapper">
                        <span class="section-title">推荐圈子</span>
                    </div>
                </div>

                <div v-loading="loading" class="circle-grid">
                    <div v-for="item in circleList" :key="item.id" class="circle-card" @click="handleCardClick(item)">
                        <div class="card-cover">
                            <el-image v-if="item.coverUrl" :src="getImgUrl(item.coverUrl)" fit="cover" class="cover-img" loading="lazy" />
                            <div v-else class="cover-placeholder">
                                <Icon icon="mdi:image-filter-hdr" />
                            </div>
                            <div class="card-overlay"></div>
                        </div>

                        <div class="card-body">
                            <div class="avatar-container">
                                <el-avatar :size="52" :src="getImgUrl(item.avatar || item.coverUrl)" class="avatar-img">
                                    {{ item.name?.charAt(0) }}
                                </el-avatar>
                            </div>

                            <div class="card-main">
                                <div class="header-row">
                                    <el-tooltip :content="item.name" placement="top" :disabled="!isTextOverflow(item.name, 20)">
                                        <h3 class="circle-name">{{ item.name }}</h3>
                                    </el-tooltip>
                                    <el-button
                                        :type="item.joined ? 'info' : 'primary'"
                                        :plain="item.joined"
                                        size="small"
                                        round
                                        class="action-btn"
                                        :loading="item._loading"
                                        @click.stop="handleJoin(item)"
                                    >
                                        <div class="btn-inner">
                                            <template v-if="!item.joined">
                                                <Icon icon="mdi:plus" class="btn-icon" />
                                                <span>加入</span>
                                            </template>
                                            <template v-else>
                                                <span class="txt-status">已加入</span>
                                                <span class="txt-hover">退出</span>
                                            </template>
                                        </div>
                                    </el-button>
                                </div>

                                <div class="data-row">
                                    <div class="data-item">
                                        <span class="num">{{ formatNumber(item.memberCount) }}</span>
                                        <span class="label">成员</span>
                                    </div>
                                    <div class="divider"></div>
                                    <div class="data-item">
                                        <span class="num">{{ formatNumber(item.postCount) }}</span>
                                        <span class="label">讨论</span>
                                    </div>
                                </div>

                                <p class="circle-desc">{{ item.description || '暂无简介' }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="circleList.length > 0" class="load-more-container">
                    <el-button v-if="hasMore" :loading="loadingMore" text bg class="btn-load" @click="loadMore">
                        <div class="btn-inner">
                            {{ loadingMore ? '加载中...' : '探索更多圈子' }}
                            <Icon v-if="!loadingMore" icon="mdi:arrow-down" />
                        </div>
                    </el-button>
                    <div v-else class="text-nomore">
                        <span class="line"></span>
                        <span>到底啦，去创建属于你的圈子吧</span>
                        <span class="line"></span>
                    </div>
                </div>

                <el-empty v-else-if="!loading" description="暂无推荐圈子" class="empty-state" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" name="CirclePlaza">
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { getImgUrl } from '@/utils/img'
import { listCircles, listMyJoinedCircles, parseCircleRows, joinCircle, exitCircle, getCircleInfo, type CircleItem } from '@/api/content/circleManagement'
import useUserStore from '@/store/modules/user'
import { useCircleJoinStore } from '@/store/modules/circleJoin'

const router = useRouter()
const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()
const circleJoinStore = useCircleJoinStore()

interface CircleItemExtended extends CircleItem {
    joined?: boolean
    memberCount?: number
    postCount?: number
    memberLabel?: string
    postLabel?: string
    avatar?: string
    latestPost?: string
    _loading?: boolean
}

const loading = ref(false)
const loadingMore = ref(false)
const loadingJoined = ref(false)
const hasMore = ref(true)
const cursorId = ref<number | string>(0)
const pageSize = 12

const circleList = ref<CircleItemExtended[]>([])
const joinedCircles = ref<CircleItemExtended[]>([])

function formatNumber(num?: number): string {
    if (!num) return '0'
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w'
    }
    return String(num)
}

function isTextOverflow(text?: string, maxLength: number = 20): boolean {
    if (!text) return false
    return text.length > maxLength
}

function resolvePersistedJoinState(circleId: string | number | null | undefined): boolean | null {
    if (!circleId) return null
    return circleJoinStore.getJoined(userStore.id, circleId)
}

function persistJoinState(circleId: string | number | null | undefined, joined: boolean) {
    if (!circleId) return
    circleJoinStore.setJoined(userStore.id, circleId, joined)
}

async function fetchCircleDetail(item: CircleItemExtended) {
    try {
        const res = await getCircleInfo(item.id)
        const detail = res?.data as any
        if (detail) {
            Object.assign(item, detail)
            const joinedFromApi = detail?.member ?? detail?.joined
            const persistedJoined = resolvePersistedJoinState(item.id)
            if (persistedJoined != null) {
                item.joined = persistedJoined
            } else if (joinedFromApi != null) {
                item.joined = Boolean(joinedFromApi)
                persistJoinState(item.id, item.joined)
            }
        }
    } catch (error) {
        console.error(error)
    }
}

async function fetchAllCircleDetails(items: CircleItemExtended[]) {
    await Promise.all(items.map(item => fetchCircleDetail(item)))
}

async function fetchJoinedCircles() {
    loadingJoined.value = true
    try {
        const res = await listMyJoinedCircles()
        const rows = parseCircleRows(res) as CircleItemExtended[]
        joinedCircles.value = rows
        if (rows.length > 0) {
            await fetchAllCircleDetails(rows)
        }
    } catch (error) {
        console.error(error)
    } finally {
        loadingJoined.value = false
    }
}

async function fetchRecommendedCircles(isLoadMore = false) {
    if (isLoadMore) {
        loadingMore.value = true
    } else {
        loading.value = true
        cursorId.value = 0
        circleList.value = []
    }

    try {
        const res = await listCircles({
            cursorId: cursorId.value,
            pageSize
        })
        const rows = parseCircleRows(res) as CircleItemExtended[]

        if (isLoadMore) {
            circleList.value.push(...rows)
        } else {
            circleList.value = rows
        }

        if (rows.length > 0) {
            cursorId.value = rows[rows.length - 1].id
            await fetchAllCircleDetails(rows)
        }

        hasMore.value = rows.length >= pageSize
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('获取推荐圈子失败')
    } finally {
        loading.value = false
        loadingMore.value = false
    }
}

function loadMore() {
    if (loadingMore.value || !hasMore.value) return
    fetchRecommendedCircles(true)
}

function handleCardClick(item: CircleItem) {
    router.push({
        path: `/circle-manage/circle-data/index/${item.id}`
    })
}

async function handleJoin(item: CircleItemExtended) {
    if (item._loading) return

    try {
        if (item.joined) {
            await proxy?.$modal?.confirm?.(`确认退出「${item.name}」吗？`)
            item._loading = true
            await exitCircle(item.id)
            proxy?.$modal?.msgSuccess?.('已退出')
        } else {
            item._loading = true
            await joinCircle(item.id)
            proxy?.$modal?.msgSuccess?.('加入成功')
        }

        const nextJoined = !item.joined
        item.joined = nextJoined
        persistJoinState(item.id, nextJoined)

        await Promise.all([fetchCircleDetail(item), fetchJoinedCircles(), fetchRecommendedCircles()])
    } catch (error: any) {
        if (error === 'cancel' || error === 'close') return
        proxy?.$modal?.msgError?.('操作失败')
    } finally {
        item._loading = false
    }
}

onMounted(() => {
    fetchJoinedCircles()
    fetchRecommendedCircles()
})
</script>

<style scoped lang="scss">
.circle-plaza-page {
    width: 100%;
    padding: 24px 32px;
    background-color: var(--el-bg-color-page);
    box-sizing: border-box;
}

.page-container {
    width: 100%;
}

.page-header {
    margin-bottom: 32px;

    .page-title {
        margin: 0 0 8px 0;
        font-size: 26px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.2;
        letter-spacing: -0.5px;
    }

    .page-subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        display: block;
    }
}

.section-block {
    margin-bottom: 40px;
}

.section-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .title-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;

        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            line-height: 1;
        }
    }
}

.joined-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.joined-card {
    background: var(--el-bg-color);
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;

    &:hover {
        border-color: var(--el-color-primary-light-5);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);

        .joined-arrow {
            color: var(--el-color-primary);
            transform: translateX(4px);
        }
    }

    .joined-card-inner {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .joined-avatar {
        flex-shrink: 0;
        border: 1px solid var(--el-border-color-lighter);
        background: var(--el-fill-color-light);
    }

    .joined-info {
        flex: 1;
        min-width: 0;

        .joined-name {
            margin: 0 0 6px;
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
        }

        .joined-meta {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            display: flex;
            align-items: center;

            .dot {
                margin: 0 6px;
                color: var(--el-border-color);
            }
        }
    }

    .joined-arrow {
        color: var(--el-text-color-placeholder);
        font-size: 18px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .latest-dynamic {
        background: var(--el-fill-color-lighter);
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        color: var(--el-text-color-regular);
        display: flex;
        align-items: center;
        gap: 8px;

        .dynamic-tag {
            color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            flex-shrink: 0;
            line-height: 1.2;
            display: inline-block;
        }

        .dynamic-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            line-height: 1.4;
        }
    }
}

.circle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
}

.circle-card {
    background: var(--el-bg-color);
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    border: 1px solid transparent;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;

    &:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
        border-color: var(--el-border-color-lighter);

        .cover-img {
            transform: scale(1.05);
        }
    }
}

.card-cover {
    height: 140px;
    position: relative;
    overflow: hidden;
    background-color: var(--el-fill-color-light);

    .cover-img {
        width: 100%;
        height: 100%;
        transition: transform 0.5s ease;
    }

    .cover-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        color: var(--el-text-color-placeholder);
        background: linear-gradient(135deg, var(--el-fill-color) 0%, var(--el-fill-color-light) 100%);

        .iconify {
            display: block;
        }
    }

    .card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.02), transparent);
        pointer-events: none;
    }
}

.card-body {
    position: relative;
    padding: 16px 24px 24px;
    flex: 1;
    display: flex;
    flex-direction: column;

    .avatar-container {
        position: absolute;
        top: -26px;
        left: 20px;
        padding: 4px;
        background: var(--el-bg-color);
        border-radius: 50%;
        z-index: 2;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        .avatar-img {
            display: block;
            border: 1px solid var(--el-border-color-lighter);
        }
    }

    .card-main {
        margin-top: 32px;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;

        .circle-name {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            padding-top: 4px;
            cursor: pointer;
        }

        .action-btn {
            height: 32px;
            padding: 0 16px;
            font-size: 13px;
            font-weight: 500;
            flex-shrink: 0;

            .btn-inner {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                height: 100%;
                width: 100%;
            }

            .btn-icon {
                font-size: 16px;
                display: block;
            }

            &.el-button--info {
                background: var(--el-fill-color-light);
                border: none;
                color: var(--el-text-color-secondary);

                .txt-hover {
                    display: none;
                }

                &:hover {
                    background: var(--el-color-danger-light-9);
                    color: var(--el-color-danger);
                    .txt-status {
                        display: none;
                    }
                    .txt-hover {
                        display: inline;
                    }
                }
            }
        }
    }

    .data-row {
        display: flex;
        align-items: center;
        background: var(--el-fill-color-lighter);
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 16px;

        .data-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;

            .num {
                font-size: 16px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                font-family: var(--el-font-family);
                line-height: 1.2;
            }

            .label {
                font-size: 11px;
                color: var(--el-text-color-secondary);
                line-height: 1.2;
            }
        }

        .divider {
            width: 1px;
            height: 20px;
            background: var(--el-border-color-lighter);
        }
    }

    .circle-desc {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-regular);
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-top: auto;
    }
}

.load-more-container {
    padding: 40px 0 20px;
    text-align: center;
    width: 100%;

    .btn-load {
        padding: 12px 32px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        transition: all 0.3s;

        .btn-inner {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        &:hover {
            color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
            transform: translateY(-2px);
        }
    }

    .text-nomore {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        font-size: 13px;
        color: var(--el-text-color-placeholder);

        .line {
            width: 40px;
            height: 1px;
            background: var(--el-border-color-lighter);
        }
    }
}

@media screen and (max-width: 768px) {
    .circle-plaza-page {
        padding: 20px;
    }

    .page-header {
        margin-bottom: 24px;
    }

    .circle-grid,
    .joined-grid {
        grid-template-columns: 1fr;
    }

    .card-body {
        padding: 16px;
    }
}
</style>
