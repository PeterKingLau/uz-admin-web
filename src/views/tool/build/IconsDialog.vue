<template>
  <div class="icon-dialog">
    <el-dialog
      v-model="value"
      width="980px"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      @open="onOpen"
      @close="onClose"
    >
      <template #header>
        选择图标
        <div class="header-tools">
          <el-segmented v-model="activeSet" :options="setTabs" size="small" />
          <el-input
            v-model="keyword"
            size="small"
            style="width: 260px"
            placeholder="输入关键字过滤(如 user / home ...)"
            :prefix-icon="Search"
            clearable
          />
        </div>
      </template>

      <ul class="icon-ul">
        <li
          v-for="name in filteredIcons"
          :key="name"
          :class="active === fullName(name) ? 'active-item' : ''"
          @click="onSelect(name)"
        >
          <div>
            <Icon :icon="fullName(name)" width="30" height="30" />
            <div class="icon-name">{{ fullName(name) }}</div>
          </div>
        </li>
      </ul>

      <el-empty
        v-if="filteredIcons.length === 0"
        description="没有匹配的图标"
      />
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * Iconify 版图标选择器：
 * - 动态加载 @iconify-json/ep 与 @iconify-json/mdi 的图标名列表
 * - 失败时回退到 @element-plus/icons-vue 的组件名（可选）
 * - 选择后 emit('select', 'ep:user') 这种完整 icon 名
 */
import { ref, computed, watch, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { Search } from "@element-plus/icons-vue"; // 仅作输入框前缀图标，可去掉
// 回退方案：如果没有装 @iconify-json/*，尝试用 element-plus 的组件名顶上
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

const emit = defineEmits(["select"]);
const value = defineModel(); // v-model
const keyword = ref("");
const active = ref("");

// 已支持的图标集（可扩展）
const setTabs = [
  { label: "ElementPlus(ep)", value: "ep" },
  { label: "Material(mdi)", value: "mdi" },
];
const activeSet = ref("ep");

// 原始图标集合：{ ep: string[], mdi: string[] }
const originMap = ref({ ep: [], mdi: [] });

// 计算当前集合的图标名
const currentList = computed(() => originMap.value[activeSet.value] || []);

// 过滤
const filteredIcons = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return currentList.value;
  return currentList.value.filter((n) => n.toLowerCase().includes(k));
});

// 组合完整 icon 名
const fullName = (name) => `${activeSet.value}:${name}`;

function onOpen() {}
function onClose() {}

// 选择
function onSelect(name) {
  const full = fullName(name);
  active.value = full;
  emit("select", full);
  value.value = false;
}

// 动态加载 Iconify JSON；失败则回退到 element-plus 的组件名
async function loadIconSets() {
  // ep
  try {
    const epMod = await import("@iconify-json/ep/icons.json");
    const epNames = Object.keys(epMod.default?.icons || {});
    originMap.value.ep = epNames;
  } catch (e) {
    // fallback：用 element-plus 的组件名转小写横线（不完全等价，但可用）
    const names = Object.keys(ElementPlusIconsVue || {}).map((k) => k);
    // 把驼峰名转成 Iconify 常见的短横线风（UserFilled -> user-filled）
    const trans = names.map((n) =>
      n.replace(/[A-Z]/g, (m, idx) => (idx ? "-" : "") + m.toLowerCase())
    );
    originMap.value.ep = Array.from(new Set(trans));
  }

  // mdi（可选）
  try {
    const mdiMod = await import("@iconify-json/mdi/icons.json");
    const mdiNames = Object.keys(mdiMod.default?.icons || {});
    originMap.value.mdi = mdiNames;
  } catch (e) {
    originMap.value.mdi = []; // 没装就空
  }
}

onMounted(loadIconSets);

// 当集合切换时，清空选中与搜索
watch(activeSet, () => {
  active.value = "";
  keyword.value = "";
});
</script>

<style lang="scss" scoped>
.header-tools {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
}

.icon-ul {
  margin: 0;
  padding: 0;
  font-size: 0;

  li {
    list-style: none;
    text-align: center;
    font-size: 12px;
    display: inline-flex;
    width: 16.66%;
    box-sizing: border-box;
    height: 108px;
    padding: 6px;
    cursor: pointer;
    overflow: hidden;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #f2f2f2;
    }
    &.active-item {
      background: #e1f3fb;
      color: #7a6df0;
    }
    .icon-name {
      margin-top: 8px;
      word-break: break-all;
      padding: 0 6px;
      color: #666;
    }
  }
}

.icon-dialog {
  :deep() {
    .el-dialog {
      border-radius: 8px;
      margin-top: 4vh !important;
      display: flex;
      flex-direction: column;
      max-height: 92vh;
      overflow: hidden;
      box-sizing: border-box;

      .el-dialog__header {
        padding-top: 14px;
      }
      .el-dialog__body {
        margin: 0 20px 20px 20px;
        padding: 0;
        overflow: auto;
      }
    }
  }
}
</style>
