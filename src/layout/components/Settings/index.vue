<template>
  <el-drawer
    v-model="showSettings"
    :with-header="false"
    :lock-scroll="false"
    direction="rtl"
    size="300px"
  >
    <!-- 主题风格 -->
    <div class="setting-drawer-title">
      <h3 class="drawer-title">主题风格设置</h3>
    </div>

    <div class="setting-drawer-theme-list">
      <div
        v-for="item in themeOptions"
        :key="item.value"
        class="setting-drawer-theme-item"
        @click="handleTheme(item.value)"
      >
        <img :src="item.img" :alt="item.label" />
        <div
          v-if="isActiveTheme(item.value)"
          class="setting-drawer-theme-check"
        >
          <Icon icon="ep:check" :style="{ color: theme }" />
        </div>
      </div>
    </div>

    <div class="drawer-item">
      <span>主题颜色</span>
      <span class="comp-style">
        <el-color-picker
          v-model="theme"
          :predefine="predefineColors"
          @change="themeChange"
        />
      </span>
    </div>

    <el-divider />

    <!-- 布局配置 -->
    <h3 class="drawer-title">系统布局配置</h3>

    <div class="drawer-item">
      <span>开启 TopNav</span>
      <span class="comp-style">
        <el-switch
          v-model="settingsStore.topNav"
          @change="topNavChange"
          class="drawer-switch"
        />
      </span>
    </div>

    <div class="drawer-item">
      <span>开启 Tags-Views</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>显示页签图标</span>
      <span class="comp-style">
        <el-switch
          v-model="settingsStore.tagsIcon"
          :disabled="!settingsStore.tagsView"
          class="drawer-switch"
        />
      </span>
    </div>

    <div class="drawer-item">
      <span>固定 Header</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.fixedHeader" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>显示 Logo</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.sidebarLogo" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>动态标题</span>
      <span class="comp-style">
        <el-switch
          v-model="settingsStore.dynamicTitle"
          @change="dynamicTitleChange"
          class="drawer-switch"
        />
      </span>
    </div>

    <div class="drawer-item">
      <span>底部版权</span>
      <span class="comp-style">
        <el-switch
          v-model="settingsStore.footerVisible"
          class="drawer-switch"
        />
      </span>
    </div>

    <el-divider />

    <el-button type="primary" plain @click="saveSetting">
      <el-icon><Icon icon="ep:document" /></el-icon>
      保存配置
    </el-button>
    <el-button plain @click="resetSetting">
      <el-icon><Icon icon="ep:refresh" /></el-icon>
      重置配置
    </el-button>
  </el-drawer>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from "vue";
import { Icon } from "@iconify/vue";
import useAppStore from "@/store/modules/app";
import useSettingsStore from "@/store/modules/settings";
import usePermissionStore from "@/store/modules/permission";
import { handleThemeStyle } from "@/utils/theme";
import darkImg from "@/assets/images/dark.svg";
import lightImg from "@/assets/images/light.svg";

const { proxy } = getCurrentInstance();
const appStore = useAppStore();
const settingsStore = useSettingsStore();
const permissionStore = usePermissionStore();

const showSettings = ref(false);
const theme = ref(settingsStore.theme);
const sideTheme = ref(settingsStore.sideTheme);

const predefineColors = [
  "#409EFF",
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
];

// 主题卡片配置
const themeOptions = [
  { value: "theme-dark", img: darkImg, label: "暗色主题" },
  { value: "theme-light", img: lightImg, label: "亮色主题" },
];

const isActiveTheme = (value) => sideTheme.value === value;

/** 是否需要 topNav */
function topNavChange(val) {
  if (!val) {
    appStore.toggleSideBarHide(false);
    permissionStore.setSidebarRouters(permissionStore.defaultRoutes);
  }
}

/** 是否需要 dynamicTitle */
function dynamicTitleChange() {
  // 这里直接用同一个 settingsStore 实例即可
  settingsStore.setTitle && settingsStore.setTitle(settingsStore.title);
}

/** 主题色变化 */
function themeChange(val) {
  settingsStore.theme = val;
  handleThemeStyle(val);
}

/** 侧边主题（明/暗） */
function handleTheme(val) {
  settingsStore.sideTheme = val;
  sideTheme.value = val;
}

/** 保存配置到本地 */
function saveSetting() {
  proxy.$modal.loading("正在保存到本地，请稍候...");

  const layoutSetting = {
    topNav: settingsStore.topNav,
    tagsView: settingsStore.tagsView,
    tagsIcon: settingsStore.tagsIcon,
    fixedHeader: settingsStore.fixedHeader,
    sidebarLogo: settingsStore.sidebarLogo,
    dynamicTitle: settingsStore.dynamicTitle,
    footerVisible: settingsStore.footerVisible,
    sideTheme: settingsStore.sideTheme,
    theme: settingsStore.theme,
  };

  localStorage.setItem("layout-setting", JSON.stringify(layoutSetting));

  setTimeout(() => {
    proxy.$modal.closeLoading();
  }, 1000);
}

/** 重置配置 */
function resetSetting() {
  proxy.$modal.loading("正在清除设置缓存并刷新，请稍候...");
  localStorage.removeItem("layout-setting");
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

/** 暴露方法，外部可打开 Drawer */
function openSetting() {
  showSettings.value = true;
}

defineExpose({
  openSetting,
});
</script>

<style lang="scss" scoped>
.setting-drawer-title {
  margin-bottom: 12px;
  color: var(--el-text-color-primary, rgba(0, 0, 0, 0.85));
  line-height: 22px;
  font-weight: bold;

  .drawer-title {
    font-size: 14px;
  }
}

.setting-drawer-theme-list {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin: 10px 0 20px;

  .setting-drawer-theme-item {
    position: relative;
    margin-right: 16px;
    border-radius: 2px;
    cursor: pointer;

    img {
      width: 48px;
      height: 48px;
    }

    .setting-drawer-theme-check {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
    }
  }
}

.drawer-item {
  color: var(--el-text-color-regular, rgba(0, 0, 0, 0.65));
  padding: 12px 0;
  font-size: 14px;
  clear: both;

  .comp-style {
    float: right;
    margin: -3px 8px 0 0;
  }
}
</style>
