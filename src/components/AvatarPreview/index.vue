<template>
  <div class="avatar-preview">
    <el-tag v-if="deleted" type="danger" size="small">内容已删除</el-tag>

    <!-- 正常头像预览 -->
    <el-image
      v-else-if="finalSrc"
      :src="finalSrc"
      :style="imageStyle"
      fit="cover"
      :preview-src-list="previewList"
      :preview-teleported="true"
    />

    <!-- 无值兜底 -->
    <span v-else>-</span>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from "vue";

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
</script>

<style scoped>
.avatar-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
