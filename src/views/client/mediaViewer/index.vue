<template>
    <div class="client-media-viewer-page">
        <VarAppBar title="内容预览" fixed placeholder safe-area-top color="rgba(15, 23, 42, 0.96)" text-color="#f8fafc" :elevation="false">
            <template #left>
                <button type="button" class="viewer-back" aria-label="返回" @click="handleClose">
                    <Icon icon="mdi:chevron-left" />
                </button>
            </template>
        </VarAppBar>

        <main class="viewer-main">
            <section v-if="images.length" class="media-panel">
                <VarSwipe class="media-swipe" :loop="images.length > 1" :indicator="images.length > 1" @change="activeImageIndex = $event">
                    <VarSwipeItem v-for="(image, index) in images" :key="`${image}-${index}`">
                        <VarImage :src="image" fit="contain" class="media-image" />
                    </VarSwipeItem>
                </VarSwipe>
                <div v-if="images.length > 1" class="media-count">{{ activeImageIndex + 1 }}/{{ images.length }}</div>
            </section>

            <VarResult v-else class="empty-panel" type="error" title="内容暂不可预览">
                <template #footer>
                    <VarButton type="primary" size="small" class="viewer-action-button" @click="handleClose">返回</VarButton>
                </template>
            </VarResult>

            <section v-if="post" class="content-panel">
                <div class="author-row">
                    <VarImage v-if="authorAvatar" :src="authorAvatar" radius="50%" fit="cover" width="36" height="36" />
                    <div v-else class="avatar-fallback">{{ authorName.slice(0, 1) }}</div>
                    <div>
                        <strong>{{ authorName }}</strong>
                        <span>{{ createTimeText }}</span>
                    </div>
                </div>
                <p class="content-text">{{ contentText }}</p>
                <div v-if="tags.length" class="tag-row">
                    <VarChip v-for="tag in tags" :key="tag" plain round size="mini" type="primary">#{{ tag }}</VarChip>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VarAppBar from '@varlet/ui/es/app-bar'
import VarButton from '@varlet/ui/es/button'
import VarChip from '@varlet/ui/es/chip'
import VarImage from '@varlet/ui/es/image'
import VarResult from '@varlet/ui/es/result'
import VarSwipe from '@varlet/ui/es/swipe'
import VarSwipeItem from '@varlet/ui/es/swipe-item'
import '@varlet/ui/es/app-bar/style'
import '@varlet/ui/es/button/style'
import '@varlet/ui/es/chip/style'
import '@varlet/ui/es/image/style'
import '@varlet/ui/es/result/style'
import '@varlet/ui/es/swipe/style'
import '@varlet/ui/es/swipe-item/style'
import { decodeRouteId } from '@/router/routeParams'
import { resolveMediaUrl } from '@/utils/content/common'

defineOptions({ name: 'ViewsClientMediaViewer' })

const CLIENT_MEDIA_VIEWER_CACHE_KEY = 'client-media-viewer-payload'

const route = useRoute()
const router = useRouter()
const images = ref<string[]>([])
const activeImageIndex = ref(0)
const post = ref<Record<string, any> | null>(null)
const fromPath = ref('')

const authorName = computed(() => String(post.value?.nickName || post.value?.userName || '用户'))
const authorAvatar = computed(() => resolveMediaUrl(String(post.value?.avatar || post.value?.userAvatar || '')))
const contentText = computed(() => String(post.value?.content || '').trim() || '分享了一条内容')
const createTimeText = computed(() => String(post.value?.createTime || post.value?.createDate || ''))
const tags = computed(() => {
    const value = post.value?.tags
    if (Array.isArray(value)) return value.map((item: any) => String(item?.tagName || item?.name || item?.label || '').trim()).filter(Boolean)
    return String(post.value?.tagStr || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
})

function readPayload() {
    const postId = decodeRouteId(route.params.id)
    const rawPayload = sessionStorage.getItem(`${CLIENT_MEDIA_VIEWER_CACHE_KEY}:${postId}`)
    if (!rawPayload) return
    try {
        const payload = JSON.parse(rawPayload)
        if (!payload || typeof payload !== 'object') return
        images.value = Array.isArray(payload.images) ? payload.images.map((item: unknown) => String(item || '').trim()).filter(Boolean) : []
        activeImageIndex.value = 0
        post.value = payload.post && typeof payload.post === 'object' ? payload.post : null
        fromPath.value = String(payload.from || '')
    } catch {
        images.value = []
        post.value = null
    }
}

function handleClose() {
    router.replace(fromPath.value || (typeof route.query.from === 'string' && route.query.from ? route.query.from : '/discover'))
}

onMounted(() => {
    readPayload()
})
</script>

<style scoped lang="scss">
.client-media-viewer-page {
    min-height: 100svh;
    background: #0f172a;
    color: #f8fafc;
}

.viewer-back {
    width: 42px;
    height: 42px;
    padding: 0;
    border: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: #f8fafc;
    font-size: 24px;
}

.viewer-main {
    padding: 14px 14px 28px;
}

.media-panel {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    background: #020617;
}

.media-swipe {
    height: min(72vh, 560px);
    background: #020617;

    :deep(.var-swipe__indicator) {
        background: rgba(248, 250, 252, 0.55);
    }

    :deep(.var-swipe--indicator-active) {
        background: #f8fafc;
    }
}

.media-image {
    width: 100%;
    height: 100%;
}

.media-image :deep(.var-image__image) {
    width: 100%;
    height: 100%;
}

.media-count {
    position: absolute;
    right: 12px;
    bottom: 16px;
    padding: 4px 9px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.72);
    color: #e2e8f0;
    font-size: 12px;
}

.content-panel {
    margin-top: 14px;
    padding: 18px;
    border-radius: 18px;
    background: #ffffff;
    color: #0f172a;
}

.author-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar-fallback {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #e2e8f0;
    color: #475569;
    font-weight: 700;
}

.author-row strong,
.author-row span {
    display: block;
}

.author-row strong {
    font-size: 14px;
}

.author-row span {
    margin-top: 3px;
    color: #64748b;
    font-size: 12px;
}

.content-text {
    margin: 16px 0 0;
    color: #1e293b;
    font-size: 15px;
    line-height: 1.75;
    white-space: pre-wrap;
}

.tag-row {
    margin-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.empty-panel {
    min-height: calc(100svh - 108px);
    color: #f8fafc;
}

.viewer-action-button {
    min-width: 96px;
    border-radius: 999px;
}
</style>
