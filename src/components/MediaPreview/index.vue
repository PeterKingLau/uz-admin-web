<template>
    <div class="audit-media-preview">
        <div v-if="isAuditRejected" class="status-container rejected">
            <el-tag type="danger" effect="plain" round class="status-tag">
                <Icon icon="mdi:alert-circle-outline" class="icon" />
                <span>内容已删除</span>
            </el-tag>
        </div>

        <div v-else-if="normalizedList.length === 0" class="status-container empty">
            <span class="empty-text">
                <Icon icon="mdi:image-off-outline" class="mr-1" />
                无媒体资源
            </span>
        </div>

        <div v-else class="media-container">
            <template v-if="isImagePost">
                <div class="image-grid">
                    <div v-for="(img, index) in displayImages" :key="index" class="image-item" @click="openPreview(index)">
                        <el-image :src="img" fit="cover" class="grid-img" loading="lazy">
                            <template #placeholder>
                                <div class="image-placeholder">
                                    <Icon icon="mdi:loading" class="animate-spin" />
                                </div>
                            </template>
                            <template #error>
                                <div class="image-error">
                                    <Icon icon="mdi:image-broken-variant" />
                                </div>
                            </template>
                        </el-image>

                        <div v-if="index === displayImages.length - 1 && remainingCount > 0" class="more-overlay">
                            <span class="count">+{{ remainingCount }}</span>
                        </div>

                        <div class="hover-overlay">
                            <Icon icon="mdi:magnify-plus-outline" />
                        </div>
                    </div>
                </div>

                <el-image-viewer
                    v-if="showViewer"
                    :url-list="imageList"
                    :initial-index="initialIndex"
                    :z-index="4000"
                    :teleported="true"
                    :hide-on-click-modal="true"
                    @switch="onViewerSwitch"
                    @close="closeViewer"
                />

                <teleport to="body">
                    <div v-if="showViewer" class="viewer-count-badge">{{ currentIndex + 1 }} / {{ imageList.length }}</div>
                </teleport>
            </template>

            <template v-else-if="isVideoPost">
                <VideoAssetPreview :poster="videoThumb" :src="videoSrc" />
            </template>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue'
import { isExternal } from '@/utils/validate'
import { POST_TYPE, AUDIT_STATUS } from '@/utils/enum'
import VideoAssetPreview from '@/components/VideoAssetPreview/index.vue'

const props = defineProps({
    postType: { type: String, default: '' },
    mediaUrls: { type: [String, Array], default: () => [] },
    auditStatus: { type: String, default: AUDIT_STATUS.PENDING },
    maxDisplayCount: { type: Number, default: 3 }
})

const { proxy } = getCurrentInstance()

const isAuditRejected = computed(() => props.auditStatus === AUDIT_STATUS.REJECTED)
const isImagePost = computed(() => props.postType === POST_TYPE.IMAGE)
const isVideoPost = computed(() => props.postType === POST_TYPE.VIDEO)

const normalizedList = computed(() => {
    if (isAuditRejected.value) return []
    let list = props.mediaUrls
    if (!list) return []

    const transformUrl = url => (!isExternal(url) && proxy?.$imgUrl ? proxy.$imgUrl(url) : url)

    let result = []
    if (Array.isArray(list)) {
        result = list
    } else if (typeof list === 'string') {
        const trimmed = list.trim()
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                result = JSON.parse(trimmed)
            } catch {
                result = []
            }
        } else {
            result = trimmed.split(',').map(s => s.trim())
        }
    }
    return result.filter(Boolean).map(transformUrl)
})

const imageList = computed(() => (isImagePost.value ? normalizedList.value : []))
const displayImages = computed(() => imageList.value.slice(0, Math.max(0, props.maxDisplayCount)))
const remainingCount = computed(() => Math.max(0, imageList.value.length - Math.max(0, props.maxDisplayCount)))

const showViewer = ref(false)
const initialIndex = ref(0)
const currentIndex = ref(0)

function openPreview(index) {
    initialIndex.value = index
    currentIndex.value = index
    showViewer.value = true
}

function closeViewer() {
    showViewer.value = false
}

function onViewerSwitch(index) {
    currentIndex.value = Number(index) || 0
}

const videoThumb = computed(() => {
    if (!isVideoPost.value) return ''
    return normalizedList.value[0] || ''
})

const videoSrc = computed(() => {
    if (!isVideoPost.value) return ''
    return normalizedList.value[1] || normalizedList.value[0] || ''
})
</script>

<style lang="scss" scoped>
.audit-media-preview {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
}

.status-container {
    display: flex;
    align-items: center;

    &.rejected {
        .status-tag {
            border: none;
            background-color: var(--el-color-danger-light-9);
            color: var(--el-color-danger);
            .icon {
                font-size: 16px;
                margin-right: 4px;
            }
        }
    }

    &.empty {
        .empty-text {
            display: inline-flex;
            align-items: center;
            color: var(--el-text-color-placeholder);
            font-size: 12px;
        }
    }
}

.image-grid {
    display: flex;
    gap: 8px;

    .image-item {
        position: relative;
        width: 70px;
        height: 70px;
        border-radius: 6px;
        overflow: hidden;
        cursor: zoom-in;
        border: 1px solid var(--el-border-color-lighter);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--el-fill-color-light);

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-color: var(--el-color-primary-light-5);

            .hover-overlay {
                opacity: 1;
            }
        }

        .grid-img {
            width: 100%;
            height: 100%;
            display: block;
            transition: transform 0.3s;
        }

        .image-placeholder,
        .image-error {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-secondary);
            font-size: 20px;
        }

        .animate-spin {
            animation: spin 1s linear infinite;
        }

        .more-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(2px);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            z-index: 2;
        }

        .hover-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
            color: #fff;
            font-size: 20px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>

<style lang="scss">
.viewer-count-badge {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 16px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    pointer-events: none;
    backdrop-filter: blur(4px);
    font-variant-numeric: tabular-nums;
    z-index: 4001;
}
</style>
