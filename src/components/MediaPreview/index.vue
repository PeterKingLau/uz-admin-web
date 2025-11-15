<template>
  <div class="audit-media-preview">
    <!-- 内容已删除 -->
    <template v-if="isAuditRejected">
      <el-tag type="danger" size="small">内容已删除</el-tag>
    </template>

    <!-- 无数据 -->
    <template v-else-if="limitedList.length === 0">
      <el-tag type="info" size="small">无数据</el-tag>
    </template>

    <!-- 正常内容展示 -->
    <template v-else>
      <!-- 图片类型 -->
      <template v-if="isImagePost">
        <el-image
          :src="imageList[0]"
          fit="cover"
          style="
            width: 140px;
            height: 140px;
            border-radius: 4px;
            cursor: pointer;
          "
          :preview-src-list="imageList"
          :initial-index="0"
          show-progress
          :infinite="false"
          preview-teleported
          @error="onImageError"
        />

        <template v-if="imageError">
          <Icon icon="ep:picture-filled" style="font-size: 40px; color: #ccc" />
        </template>
      </template>

      <!-- 视频类型 -->
      <template v-else-if="isVideoPost">
        <template v-if="isCellMode">
          <div
            class="video-thumb"
            style="
              position: relative;
              display: inline-block;
              width: 120px;
              height: 80px;
              cursor: pointer;
            "
            @click="openVideo"
          >
            <el-image
              :src="videoThumb"
              fit="cover"
              style="width: 100%; height: 100%; border-radius: 4px"
            />
            <div
              style="
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.25);
                border-radius: 4px;
              "
            >
              <el-icon style="font-size: 28px; color: #fff">
                <Icon icon="ep:video-play" />
              </el-icon>
            </div>
          </div>

          <el-dialog
            title="视频预览"
            v-model="videoVisible"
            width="720px"
            append-to-body
            :destroy-on-close="true"
            @close="handleVideoClose"
          >
            <video
              v-if="videoSrc"
              ref="videoRef"
              :src="videoSrc"
              controls
              style="width: 100%; max-height: 480px; border-radius: 4px"
            />
            <template #footer>
              <div class="dialog-footer">
                <el-button @click="videoVisible = false">关 闭</el-button>
              </div>
            </template>
          </el-dialog>
        </template>

        <template v-else>
          <video
            v-if="videoSrc"
            :src="videoSrc"
            controls
            style="width: 100%; max-height: 280px; border-radius: 4px"
          />
          <span v-else>无数据</span>
        </template>
      </template>

      <!-- 默认无数据 -->
      <template v-else>
        <span class="text-gray-500">无数据</span>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from "vue";
import { isExternal } from "@/utils/validate";
import { Icon } from "@iconify/vue";
import {
  POST_TYPE,
  AUDIT_STATUS,
  AUDIT_MEDIA_MODE as MODE,
} from "@/utils/enum";

const props = defineProps({
  postType: {
    type: String,
    default: "",
  },
  mediaUrls: {
    type: [String, Array],
    default: () => [],
  },
  mode: {
    type: String,
  },
  auditStatus: {
    type: String,
    default: AUDIT_STATUS.PENDING,
  },
});

const videoVisible = ref(false);
const videoRef = ref(null);

const { proxy } = getCurrentInstance();

const isAuditRejected = computed(
  () => props.auditStatus === AUDIT_STATUS.REJECTED
);
const isImagePost = computed(() => props.postType === POST_TYPE.IMAGE);
const isVideoPost = computed(() => props.postType === POST_TYPE.VIDEO);

const maxCount = 9;
const normalizedList = computed(() => {
  if (isAuditRejected.value) return [];

  let list = props.mediaUrls;
  if (!list) return [];

  const transformUrl = (url) => {
    return !isExternal(url) && proxy?.$imgUrl ? proxy.$imgUrl(url) : url;
  };

  if (Array.isArray(list)) {
    return list.map(transformUrl).filter(Boolean);
  }

  if (typeof list === "string") {
    const trimmed = list.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(transformUrl).filter(Boolean);
        }
      } catch {}
    }

    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(transformUrl);
  }

  return [];
});

const limitedList = computed(() => normalizedList.value.slice(0, maxCount));

const imageList = computed(() => {
  if (!isImagePost.value) return [];
  return limitedList.value;
});

const currentImageIndex = ref(0);

const modeValue = computed(() => props.mode || MODE.CELL);
const isCellMode = computed(() => modeValue.value === MODE.CELL);

const isPreviewMode = ref(false);

// 处理图片加载失败
const imageError = ref(false);

function openPreview(index) {
  currentImageIndex.value = index;
  isPreviewMode.value = true;
}

function onImageError() {
  imageError.value = true; // 图片加载失败时设置为true
}

const videoThumb = computed(() => {
  if (!isVideoPost.value) return "";
  return limitedList.value[0] || "";
});

const videoSrc = computed(() => {
  if (!isVideoPost.value) return "";
  return limitedList.value[1] || limitedList.value[0] || "";
});

function openVideo() {
  if (!videoSrc.value) return;
  videoVisible.value = true;
}

function handleVideoClose() {
  if (videoRef.value) {
    try {
      videoRef.value.pause();
      videoRef.value.currentTime = 0;
    } catch (e) {}
  }
}
</script>

<style scoped>
.audit-media-preview {
  display: inline-block;
}

.image-count {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
</style>
