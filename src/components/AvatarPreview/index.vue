<template>
  <div class="avatar-preview">
    <el-tag v-if="deleted" type="danger" size="small">内容已删除</el-tag>

    <el-image
      v-else-if="finalSrc && !imageError"
      :src="finalSrc"
      :style="imageStyle"
      fit="cover"
      :preview-src-list="previewList"
      :preview-teleported="true"
      @error="onImageError"
    />

    <template v-if="imageError && finalSrc">
      <Icon icon="mdi:account-off" style="font-size: 40px; color: #100d0d" />
    </template>

    <span v-if="!finalSrc">无</span>
  </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  src: {
    type: String,
    default: "",
  },
  size: {
    type: Number,
    default: 40, // 列表 40，详情传 80
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

const { proxy } = getCurrentInstance() || {};

const imageError = ref(false); // 用于跟踪图片是否加载失败

const finalSrc = computed(() => {
  if (!props.src) return "";
  return proxy?.$imgUrl ? proxy.$imgUrl(props.src) : props.src;
});

const previewList = computed(() => {
  return finalSrc.value ? [finalSrc.value] : [];
});

const imageStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: "50%",
  cursor: "pointer",
}));

// 图片加载错误处理
function onImageError() {
  imageError.value = true; // 图片加载失败时设置为 true
}
</script>

<style scoped>
.avatar-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
