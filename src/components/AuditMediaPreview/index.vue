<template>
  <div class="audit-media-preview">
    <template v-if="isAuditRejected">
      <el-tag type="danger" size="small">内容已删除</el-tag>
    </template>

    <template v-else-if="normalizedList.length === 0">
      <el-tag type="info" size="small">无数据</el-tag>
    </template>

    <template v-else>
      <template v-if="isImagePost">
        <el-image
          v-if="isCellMode"
          :src="imageList[0]"
          fit="cover"
          style="width: 80px; height: 80px; border-radius: 4px; cursor: pointer"
          :preview-src-list="imageList"
          :preview-teleported="true"
        />
        <el-image
          v-else
          :src="imageList[0]"
          fit="cover"
          style="
            width: 140px;
            height: 140px;
            border-radius: 4px;
            cursor: pointer;
          "
          :preview-src-list="imageList"
          :preview-teleported="true"
        />
      </template>

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

      <template v-else>
        <span class="text-gray-500">无数据</span>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from "vue";
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
    // 这里不要再用 MODE.CELL，当它可选，让逻辑里兜底
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

// 统一带默认值的 mode
const modeValue = computed(() => props.mode || MODE.CELL);
const isCellMode = computed(() => modeValue.value === MODE.CELL);

const normalizedList = computed(() => {
  if (isAuditRejected.value) {
    return [];
  }

  let list = props.mediaUrls;
  if (!list) return [];

  const transformUrl = (url) => (proxy?.$imgUrl ? proxy.$imgUrl(url) : url);

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

const imageList = computed(() => {
  if (!isImagePost.value) return [];
  return normalizedList.value;
});

const videoThumb = computed(() => {
  if (!isVideoPost.value) return "";
  return normalizedList.value[0] || "";
});

const videoSrc = computed(() => {
  if (!isVideoPost.value) return "";
  return normalizedList.value[1] || normalizedList.value[0] || "";
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
</style>
