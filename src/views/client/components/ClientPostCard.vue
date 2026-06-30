<template>
    <article class="client-post-card" :class="{ 'is-card-ready': isCardReady }" @click="$emit('click', post)">
        <div v-if="!isCardReady" class="card-fill-skeleton" aria-hidden="true">
            <div class="card-fill-cover">
                <span></span>
            </div>
            <div class="card-fill-body">
                <i class="wide"></i>
                <i></i>
                <b></b>
            </div>
        </div>
        <div class="cover-wrap">
            <div v-if="isTextPost" class="text-cover">
                <Icon icon="mdi:format-quote-open" class="text-cover-quote" />
                <div class="text-wrap">
                    <span>{{ contentText }}</span>
                </div>
                <i class="text-cover-accent" aria-hidden="true"></i>
            </div>

            <div v-else-if="coverUrl && !coverFailed" class="cover-media">
                <div v-if="coverLoading" class="cover-skeleton" aria-hidden="true">
                    <div class="skeleton-mark"></div>
                    <div class="skeleton-line wide"></div>
                    <div class="skeleton-line"></div>
                </div>
                <img
                    :src="coverUrl"
                    alt=""
                    class="cover-image"
                    :class="{ loaded: !coverLoading }"
                    loading="lazy"
                    @load="handleCoverLoad"
                    @error="handleCoverError"
                />
            </div>

            <div v-else class="cover-empty">暂无封面</div>

            <div v-if="isVideoPost" class="video-badge">
                <Icon icon="mdi:play" />
            </div>
        </div>

        <div class="card-content">
            <p class="content-text">{{ contentText }}</p>
            <div class="meta-row">
                <button
                    v-if="showAuthor"
                    type="button"
                    class="user-core"
                    :class="{ 'is-clickable': canResolveAuthorProfile, 'is-loading': authorResolving }"
                    :disabled="!canResolveAuthorProfile || authorResolving"
                    @click.stop="handleAuthorClick"
                >
                    <img v-if="authorAvatar && !avatarFailed" :src="authorAvatar" alt="" class="user-avatar" loading="lazy" @error="avatarFailed = true" />
                    <div v-else class="avatar-fallback">{{ authorName.charAt(0).toUpperCase() }}</div>
                    <span class="name">{{ authorName }}</span>
                </button>
                <div class="actions" :class="{ 'is-compact': !showAuthor }">
                    <span>
                        <Icon icon="mdi:heart-outline" />
                        {{ formatCount(post?.likeCount) }}
                    </span>
                    <span v-if="showCommentCount">
                        <Icon icon="mdi:comment-outline" />
                        {{ formatCount(post?.commentCount) }}
                    </span>
                </div>
            </div>
        </div>
    </article>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientComponentsClientPostCard' })
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { POST_TYPE } from '@/utils/enum'
import { getClientUserProfile } from '@/api/client/profile'
import { parseMediaRaw, resolveMediaUrl as resolveCommonMediaUrl } from '@/utils/content/common'
import { getClientUserProfileRoute } from '@/utils/routeAccess'
import useUserStore from '@/store/modules/user'

const props = withDefaults(
    defineProps<{
        post: Record<string, any>
        showAuthor?: boolean
        showCommentCount?: boolean
    }>(),
    {
        showAuthor: true,
        showCommentCount: false
    }
)

defineEmits<{
    (e: 'click', post: Record<string, any>): void
}>()

const coverFailed = ref(false)
const coverLoading = ref(false)
const contentReady = ref(false)
const avatarFailed = ref(false)
const authorResolving = ref(false)
const authorResolveError = ref('')
const router = useRouter()
const userStore = useUserStore()

const resolveMediaUrl = (url?: string) => resolveCommonMediaUrl(String(url || ''))
const postType = computed(() => String(props.post?.postType ?? ''))
const isTextPost = computed(() => postType.value === POST_TYPE.TEXT)
const isVideoPost = computed(() => postType.value === POST_TYPE.VIDEO)
const contentText = computed(() => String(props.post?.content || '').trim() || '分享了一条内容')
const authorName = computed(() => String(props.post?.nickName || props.post?.userName || '用户'))
const authorAvatar = computed(() => resolveMediaUrl(props.post?.avatar || props.post?.userAvatar))
const normalizeLookupValue = (value: unknown) => {
    const text = String(value ?? '').trim()
    if (!text || text === 'null' || text === 'undefined') return ''
    return text
}
const getUniqueLookupValues = (values: unknown[]) => {
    const seen = new Set<string>()
    return values
        .map(item => normalizeLookupValue(item))
        .filter(item => {
            if (!item || seen.has(item)) return false
            seen.add(item)
            return true
        })
}
const authorLookupValues = computed(() => {
    const post = props.post || {}
    return getUniqueLookupValues([
        post.targetUserId,
        post.authorId,
        post.userId,
        post.createBy,
        post.user?.userId,
        post.user?.id,
        post.author?.userId,
        post.author?.id
    ])
})
const currentUserId = computed(() => normalizeLookupValue(userStore.id))
const canResolveAuthorProfile = computed(() => authorLookupValues.value.length > 0)

const isVideoUrl = (url: string) => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(url || '')

const coverUrl = computed(() => {
    if (isTextPost.value) return ''
    const direct = props.post?.cover || props.post?.coverUrl || props.post?.thumbnail || props.post?.poster || props.post?.image
    if (direct) return resolveMediaUrl(direct)
    const list = parseMediaRaw(props.post?.mediaUrls || props.post?.files || [])
    const urls = list
        .map((media: any) => (typeof media === 'object' ? media?.cover || media?.thumbnail || media?.poster || media?.url : media))
        .map((url: string) => resolveMediaUrl(url))
        .filter(Boolean)
    return urls.find((url: string) => !isVideoUrl(url)) || urls[0] || ''
})
const isCardReady = computed(() => contentReady.value && (isTextPost.value || !coverUrl.value || coverFailed.value || !coverLoading.value))

const handleCoverLoad = () => {
    coverLoading.value = false
}

const handleCoverError = () => {
    coverFailed.value = true
    coverLoading.value = false
}

let contentReadyTimer: ReturnType<typeof setTimeout> | null = null

const clearContentReadyTimer = () => {
    if (!contentReadyTimer) return
    clearTimeout(contentReadyTimer)
    contentReadyTimer = null
}

const formatCount = (value: unknown) => {
    const num = Number(value || 0)
    if (!Number.isFinite(num) || num <= 0) return '0'
    if (num >= 10000) {
        const text = (num / 10000).toFixed(num >= 100000 ? 0 : 1)
        return `${text.replace(/\.0$/, '')}w`
    }
    return String(num)
}

const resolveProfileFromResponse = (response: any) => {
    const data = response?.data ?? response ?? {}
    const profile = data?.user ?? data?.profile ?? data?.userInfo ?? data?.userProfile ?? data
    return {
        profile,
        userId: normalizeLookupValue(profile?.userId ?? profile?.id ?? data?.userId ?? data?.id)
    }
}

const getProfileName = (profile: Record<string, any>) =>
    normalizeLookupValue(profile?.nickName ?? profile?.nickname ?? profile?.userName ?? profile?.username ?? profile?.name)

const isSameUser = (left: unknown, right: unknown) => {
    const leftText = normalizeLookupValue(left)
    const rightText = normalizeLookupValue(right)
    return Boolean(leftText && rightText && leftText === rightText)
}

const resolveAuthorProfileUserId = async () => {
    const candidates = authorLookupValues.value
    let fallbackUserId = ''
    let firstUserId = ''

    for (const candidate of candidates) {
        try {
            const response = await getClientUserProfile(candidate)
            const { profile, userId } = resolveProfileFromResponse(response)
            const resolvedUserId = userId || candidate
            const profileName = getProfileName(profile)

            if (!firstUserId) firstUserId = resolvedUserId
            if (!fallbackUserId && !isSameUser(resolvedUserId, currentUserId.value)) fallbackUserId = resolvedUserId

            if (profileName && profileName === authorName.value) return resolvedUserId
        } catch (error) {
            console.error(error)
        }
    }

    if (!fallbackUserId && firstUserId && isSameUser(firstUserId, currentUserId.value)) return ''

    return fallbackUserId || firstUserId
}

const handleAuthorClick = async () => {
    if (!canResolveAuthorProfile.value || authorResolving.value) return
    const targetWindow = window.open('', '_blank')
    if (targetWindow) {
        targetWindow.opener = null
    }
    authorResolveError.value = ''
    authorResolving.value = true
    try {
        const resolvedUserId = await resolveAuthorProfileUserId()
        if (!resolvedUserId) {
            targetWindow?.close()
            authorResolveError.value = '未找到该用户'
            return
        }
        const route = router.resolve(getClientUserProfileRoute(resolvedUserId))
        if (targetWindow) {
            targetWindow.location.href = route.href
        } else {
            window.open(route.href, '_blank', 'noopener')
        }
    } catch (error) {
        console.error(error)
        targetWindow?.close()
        authorResolveError.value = '未找到该用户'
    } finally {
        authorResolving.value = false
    }
}

watch(
    () => [props.post, coverUrl.value, isTextPost.value],
    () => {
        clearContentReadyTimer()
        contentReady.value = false
        coverFailed.value = false
        coverLoading.value = Boolean(coverUrl.value && !isTextPost.value)
        avatarFailed.value = false
        authorResolveError.value = ''
        authorResolving.value = false
        contentReadyTimer = setTimeout(() => {
            contentReady.value = true
            contentReadyTimer = null
        }, 90)
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    clearContentReadyTimer()
})
</script>

<style scoped lang="scss">
.client-post-card {
    position: relative;
    border-radius: var(--client-feed-card-radius);
    overflow: visible;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    box-shadow: none;
}

.client-post-card > .cover-wrap,
.client-post-card > .card-content {
    opacity: 0;
    transition:
        opacity 0.28s ease,
        transform 0.28s ease;
    transform: translateY(4px);
}

.client-post-card.is-card-ready > .cover-wrap,
.client-post-card.is-card-ready > .card-content {
    opacity: 1;
    transform: translateY(0);
}

.client-post-card:hover {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
}

.card-fill-skeleton {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    border-radius: var(--client-feed-card-radius);
    background: transparent;
    animation: card-fill-enter 0.2s ease both;
}

.card-fill-cover {
    position: relative;
    aspect-ratio: 3 / 4;
    overflow: hidden;
    border: 1px solid var(--client-border-soft);
    border-radius: var(--client-feed-card-radius);
    background:
        linear-gradient(90deg, var(--client-fill) 0 28%, transparent 28% 100%) 18px 18px / 68px 12px no-repeat,
        linear-gradient(90deg, var(--client-surface-hover) 0 42%, transparent 42% 100%) 18px 38px / 96px 10px no-repeat,
        linear-gradient(145deg, var(--client-fill) 0%, var(--client-surface-muted) 100%);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-main) 3%, transparent);
}

.card-fill-cover::before {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-110%);
    background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--client-surface-hover) 56%, transparent) 50%, transparent 100%);
    animation: card-fill-sweep 1.25s ease-in-out infinite;
}

.card-fill-cover span {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    height: 48px;
    border-radius: 10px;
    background:
        linear-gradient(90deg, var(--client-surface-hover) 0 46%, transparent 46% 100%) 12px 12px / 70% 8px no-repeat,
        linear-gradient(90deg, var(--client-fill) 0 34%, transparent 34% 100%) 12px 29px / 52% 7px no-repeat,
        color-mix(in srgb, var(--client-fill) 82%, var(--client-surface-muted));
    box-shadow: none;
}

.card-fill-body {
    padding: 10px 2px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.card-fill-body i,
.card-fill-body b {
    display: block;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--client-fill), var(--client-surface-hover), var(--client-fill));
    background-size: 220% 100%;
    animation: card-fill-text 1.18s ease-in-out infinite;
}

.card-fill-body i {
    width: 58%;
    height: 12px;
}

.card-fill-body i.wide {
    width: 84%;
}

.card-fill-body b {
    width: 42%;
    height: 10px;
    margin-top: 4px;
}

@keyframes card-fill-enter {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

@keyframes card-fill-sweep {
    100% {
        transform: translateX(110%);
    }
}

@keyframes card-fill-text {
    0% {
        background-position: 120% 50%;
    }
    100% {
        background-position: -120% 50%;
    }
}

.cover-wrap {
    position: relative;
    aspect-ratio: 3 / 4;
    background: var(--client-fill);
    overflow: hidden;
    border: 1px solid var(--client-border-soft);
    border-radius: var(--client-feed-card-radius);
}

.cover-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--client-media-mask);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--app-motion-normal);
}

.client-post-card:hover .cover-wrap::after {
    opacity: 1;
}

.cover-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    opacity: 0;
    transition: opacity var(--app-motion-normal);
}

.cover-image.loaded {
    opacity: 1;
}

.cover-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--client-empty-text);
    background: var(--client-empty-gradient);
    font-size: 13px;
}

.cover-media {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--client-fill);
}

.cover-skeleton {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 10px;
    padding: 18px;
    overflow: hidden;
    background:
        linear-gradient(90deg, var(--client-fill) 0 30%, transparent 30% 100%) 18px 18px / 74px 12px no-repeat,
        linear-gradient(90deg, var(--client-surface-hover) 0 44%, transparent 44% 100%) 18px 38px / 104px 10px no-repeat,
        linear-gradient(135deg, var(--client-fill) 0%, var(--client-surface-muted) 100%);
}

.cover-skeleton::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--client-surface-hover) 56%, transparent) 50%, transparent 100%);
    animation: skeletonSweep 1.35s ease-in-out infinite;
}

.skeleton-mark,
.skeleton-line {
    position: relative;
    z-index: 1;
    border-radius: 8px;
    background: var(--client-surface-hover);
}

.skeleton-mark {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    margin-bottom: auto;
}

.skeleton-line {
    width: 54%;
    height: 10px;
}

.skeleton-line.wide {
    width: 76%;
}

@keyframes skeletonSweep {
    100% {
        transform: translateX(100%);
    }
}

.text-cover {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 28px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--client-text-cover-bg);
    isolation: isolate;
}

.text-cover::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--client-text-cover-texture);
    pointer-events: none;
    z-index: 0;
}

.text-wrap {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 184px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 42%;
    text-align: center;
}

.text-wrap span {
    width: 100%;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.65;
    color: var(--client-text-cover-color);
    text-shadow: none;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
}

.text-cover-quote {
    position: absolute;
    left: 50%;
    top: 44%;
    transform: translate(-50%, -50%);
    z-index: 0;
    font-size: 112px;
    color: var(--client-text-cover-muted);
    pointer-events: none;
}

.text-cover-accent {
    position: absolute;
    left: 50%;
    bottom: 20px;
    width: 34px;
    height: 4px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: var(--client-text-cover-accent);
}

.video-badge {
    position: absolute;
    right: 8px;
    top: 8px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: var(--client-on-overlay);
    background: var(--client-overlay);
    z-index: 1;
}

.card-content {
    padding: 10px 2px 0;
    background: transparent;
}

.content-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-main);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.meta-row {
    margin-top: 9px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.user-core {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: default;
    transition:
        color var(--app-motion-fast),
        opacity var(--app-motion-fast);
}

.user-core.is-clickable {
    cursor: pointer;
}

.user-core.is-loading {
    cursor: wait;
}

.user-core.is-clickable:hover .name {
    color: var(--primary-color);
}

.user-core:disabled {
    opacity: 1;
}

.user-core:focus,
.user-core:focus-visible {
    outline: none;
}

.user-core:focus-visible {
    border-radius: 999px;
    box-shadow: var(--client-focus-ring-soft);
}

.user-avatar,
.avatar-fallback {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    flex-shrink: 0;
    display: block;
}

.user-avatar {
    object-fit: cover;
}

.avatar-fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--client-fill);
    color: var(--text-minor);
    font-size: 11px;
    font-weight: 700;
}

.name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--text-regular);
    max-width: 120px;
}

.actions {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
    color: var(--text-minor);
}

.actions.is-compact {
    width: 100%;
    justify-content: space-between;
}

.actions span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-minor);
    white-space: nowrap;
}

@media screen and (max-width: 768px) {
    .card-content {
        padding: 9px 0 0;
    }

    .content-text {
        font-size: 14px;
    }

    .text-cover {
        padding: 24px 18px;
    }

    .text-wrap {
        max-width: 154px;
        min-height: 44%;
    }

    .text-wrap span {
        font-size: 16px;
        line-height: 1.6;
        -webkit-line-clamp: 5;
        line-clamp: 5;
    }

    .text-cover-quote {
        top: 44%;
        font-size: 92px;
    }

    .text-cover-accent {
        bottom: 16px;
    }
}
</style>
