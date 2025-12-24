<template>
    <div class="audit-media-preview">
        <div v-if="isAuditRejected" class="status-wrapper">
            <el-tag type="danger" effect="plain" round> <Icon icon="mdi:alert-circle-outline" class="mr-1" /> 内容已删除 </el-tag>
        </div>

        <div v-else-if="normalizedList.length === 0" class="status-wrapper">
            <span class="text-gray">无媒体资源</span>
        </div>

        <div v-else class="media-content">
            <template v-if="isImagePost">
                <div class="image-grid">
                    <div v-for="(img, index) in displayImages" :key="index" class="image-item" @click="openPreview(index)">
                        <el-image :src="img" fit="cover" class="grid-img" loading="lazy">
                            <template #error>
                                <div class="image-error">
                                    <Icon icon="mdi:image-off-outline" />
                                </div>
                            </template>
                        </el-image>
                        <div v-if="index === displayImages.length - 1 && remainingCount > 0" class="more-overlay">+{{ remainingCount }}</div>
                    </div>
                </div>

                <el-image-viewer
                    v-if="showViewer"
                    :url-list="imageList"
                    :initial-index="initialIndex"
                    :z-index="4000"
                    :teleported="true"
                    :show-progress="imageList.length > 1"
                    @close="closeViewer"
                />
            </template>

            <template v-else-if="isVideoPost">
                <div class="video-wrapper" @click="openVideo">
                    <el-image :src="videoThumb" fit="cover" class="video-cover">
                        <template #error>
                            <div class="video-error-cover">
                                <Icon icon="mdi:video-off-outline" />
                            </div>
                        </template>
                    </el-image>
                    <div class="play-overlay">
                        <Icon icon="mdi:play-circle-outline" class="play-icon" />
                    </div>
                </div>

                <el-dialog v-model="videoVisible" title="视频预览" width="800px" append-to-body destroy-on-close @close="handleVideoClose" class="video-dialog">
                    <div class="video-player-container">
                        <video v-if="videoSrc" ref="videoRef" :src="videoSrc" controls autoplay class="preview-video" />
                    </div>
                </el-dialog>
            </template>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue'
import { isExternal } from '@/utils/validate'
import { POST_TYPE, AUDIT_STATUS } from '@/utils/enum'
import { Icon } from '@iconify/vue'

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
            } catch {}
        } else {
            result = trimmed.split(',').map(s => s.trim())
        }
    }
    return result.filter(Boolean).map(transformUrl)
})

// 所有图片列表（用于预览）
const imageList = computed(() => (isImagePost.value ? normalizedList.value : []))

// 列表展示的图片（最多3张）
const displayImages = computed(() => imageList.value.slice(0, Math.max(0, props.maxDisplayCount)))

// 剩余未显示的图片数量
const remainingCount = computed(() => Math.max(0, imageList.value.length - Math.max(0, props.maxDisplayCount)))

// 图片预览相关
const showViewer = ref(false)
const initialIndex = ref(0)

function openPreview(index) {
    initialIndex.value = index
    showViewer.value = true
}

function closeViewer() {
    showViewer.value = false
}

// 视频相关
const videoVisible = ref(false)
const videoRef = ref(null)

const videoThumb = computed(() => {
    if (!isVideoPost.value) return ''
    // 如果有专门的封面图逻辑可以在这里处理，这里默认取第一张作为封面
    return normalizedList.value[0] || ''
})

const videoSrc = computed(() => {
    if (!isVideoPost.value) return ''
    // 假设第二个地址是视频，或者第一个地址就是视频（取决于你的数据结构）
    return normalizedList.value[1] || normalizedList.value[0] || ''
})

function openVideo() {
    if (!videoSrc.value) return
    videoVisible.value = true
}

function handleVideoClose() {
    if (videoRef.value) {
        videoRef.value.pause()
    }
}
</script>

<style lang="scss" scoped>
.audit-media-preview {
    display: inline-flex;
    align-items: center;
}

.status-wrapper {
    display: flex;
    align-items: center;
    color: #909399;
    font-size: 13px;

    .mr-1 {
        margin-right: 4px;
    }
}

/* 图片九宫格样式 */
.image-grid {
    display: flex;
    gap: 8px;

    .image-item {
        position: relative;
        width: 80px;
        height: 80px;
        border-radius: 6px;
        overflow: hidden;
        cursor: zoom-in;
        border: 1px solid #eee;
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.05);
            z-index: 1;
        }

        .grid-img {
            width: 100%;
            height: 100%;
            display: block;
        }

        .image-error {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f7fa;
            color: #c0c4cc;
            font-size: 24px;
        }

        .more-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 600;
            backdrop-filter: blur(2px);
        }
    }
}

/* 视频封面样式 */
.video-wrapper {
    position: relative;
    width: 140px;
    height: 80px;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #eee;

    .video-cover {
        width: 100%;
        height: 100%;
        transition: transform 0.3s;
    }

    .video-error-cover {
        width: 100%;
        height: 100%;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        font-size: 24px;
    }

    .play-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s;

        .play-icon {
            font-size: 32px;
            color: rgba(255, 255, 255, 0.9);
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            transition: transform 0.3s;
        }
    }

    &:hover {
        .video-cover {
            transform: scale(1.05);
        }
        .play-overlay {
            background: rgba(0, 0, 0, 0.1);
            .play-icon {
                transform: scale(1.1);
            }
        }
    }
}

.video-player-container {
    background: #000;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    justify-content: center;

    .preview-video {
        width: 100%;
        max-height: 60vh;
        outline: none;
    }
}

.text-gray {
    color: #c0c4cc;
    font-size: 12px;
}
</style>
