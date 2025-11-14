<template>
  <el-tag :type="tagType" :size="size">
    <!-- 默认用配置里的 label，支持外部自定义 slot 覆盖 -->
    <slot>
      {{ text }}
    </slot>
  </el-tag>
</template>

<script setup>
import { computed } from "vue";
import { POST_TYPE, AUDIT_STATUS, CONTENT_STATUS } from "@/utils/enum";

// 枚举类型 + 值 -> 显示配置
const TAG_CONFIG = {
  POST_TYPE: {
    [POST_TYPE.TEXT]: { label: "文字", type: "info" },
    [POST_TYPE.IMAGE]: { label: "图片", type: "success" },
    [POST_TYPE.VIDEO]: { label: "视频", type: "warning" },
  },
  AUDIT_STATUS: {
    [AUDIT_STATUS.PENDING]: { label: "待审核", type: "warning" },
    [AUDIT_STATUS.APPROVED]: { label: "审核通过", type: "success" },
    [AUDIT_STATUS.REJECTED]: { label: "审核未通过", type: "danger" },
  },
  CONTENT_STATUS: {
    [CONTENT_STATUS.NORMAL]: { label: "正常", type: "success" },
    [CONTENT_STATUS.DELETED]: { label: "删除", type: "info" },
  },
};

const props = defineProps({
  // 枚举种类：POST_TYPE / AUDIT_STATUS / CONTENT_STATUS ...
  enumType: {
    type: String,
    required: true,
  },
  // 枚举值："1" / "0" / "2" 之类
  value: {
    type: [String, Number],
    default: "",
  },
  // el-tag 大小
  size: {
    type: String,
    default: "small",
  },
  // 如果当前枚举没配置 type，用这个兜底
  defaultType: {
    type: String,
    default: "info",
  },
  // 未知值时的默认文本
  fallbackLabel: {
    type: String,
    default: "未知",
  },
});

const config = computed(() => {
  const group = TAG_CONFIG[props.enumType] || {};
  return group[props.value] || null;
});

const tagType = computed(
  () => (config.value && config.value.type) || props.defaultType
);

const text = computed(
  () => (config.value && config.value.label) || props.fallbackLabel
);
</script>
