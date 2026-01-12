<template>
    <el-drawer v-model="showSettings" :with-header="false" :lock-scroll="false" direction="rtl" size="300px">
        <h3 class="drawer-title">主题风格设置</h3>

        <div class="setting-drawer-theme-list">
            <div v-for="item in themeOptions" :key="item.value" class="setting-drawer-theme-item" @click="handleTheme(item.value)">
                <img :src="item.img" :alt="item.label" />
                <div v-if="isActiveTheme(item.value)" class="setting-drawer-theme-check">
                    <Icon icon="ep:check" class="check-icon" :style="{ color: theme }" />
                </div>
            </div>
        </div>

        <div class="drawer-item">
            <span>主题颜色</span>
            <span class="comp-style">
                <el-color-picker v-model="theme" :predefine="predefineColors" @change="themeChange" />
            </span>
        </div>

        <el-divider />

        <h3 class="drawer-title">系统布局配置</h3>

        <div class="drawer-item">
            <span>开启 TopNav</span>
            <span class="comp-style">
                <el-switch v-model="settingsStore.topNav" @change="topNavChange" />
            </span>
        </div>

        <div class="drawer-item">
            <span>开启 Tags-Views</span>
            <span class="comp-style">
                <el-switch v-model="settingsStore.tagsView" />
            </span>
        </div>

        <div class="drawer-item">
            <span>显示页签图标</span>
            <span class="comp-style">
                <el-switch v-model="settingsStore.tagsIcon" :disabled="!settingsStore.tagsView" />
            </span>
        </div>

        <div class="drawer-item">
            <span>固定 Header</span>
            <span class="comp-style">
                <el-switch v-model="settingsStore.fixedHeader" />
            </span>
        </div>

        <div class="drawer-item">
            <span>显示 Logo</span>
            <span class="comp-style">
                <el-switch v-model="settingsStore.sidebarLogo" />
            </span>
        </div>

        <div class="drawer-item">
            <span>动态标题</span>
            <span class="comp-style">
                <el-switch v-model="settingsStore.dynamicTitle" @change="dynamicTitleChange" />
            </span>
        </div>

        <div class="drawer-item">
            <span>底部版权</span>
            <span class="comp-style">
                <el-switch v-model="settingsStore.footerVisible" />
            </span>
        </div>

        <el-divider />

        <div class="drawer-footer">
            <el-button type="primary" plain @click="saveSetting">
                <Icon icon="ep:document" class="mr-1" />
                保存配置
            </el-button>
            <el-button plain @click="resetSetting">
                <Icon icon="ep:refresh" class="mr-1" />
                重置配置
            </el-button>
        </div>
    </el-drawer>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import { handleThemeStyle } from '@/utils/theme'
import darkImg from '@/assets/images/dark.svg'
import lightImg from '@/assets/images/light.svg'

const { proxy } = getCurrentInstance()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const showSettings = ref(false)
const theme = ref(settingsStore.theme)
const sideTheme = ref(settingsStore.sideTheme)

const predefineColors = ['#409EFF', '#ff4500', '#ff8c00', '#ffd700', '#90ee90', '#00ced1', '#1e90ff', '#c71585']

const themeOptions = [
    { value: 'theme-dark', img: darkImg, label: '暗色主题' },
    { value: 'theme-light', img: lightImg, label: '亮色主题' }
]

const isActiveTheme = value => sideTheme.value === value

function topNavChange(val) {
    if (!val) {
        appStore.toggleSideBarHide(false)
        permissionStore.setSidebarRouters(permissionStore.defaultRoutes)
    }
}

function dynamicTitleChange() {
    settingsStore.setTitle && settingsStore.setTitle(settingsStore.title)
}

function themeChange(val) {
    settingsStore.theme = val
    handleThemeStyle(val)
}

function handleTheme(val) {
    settingsStore.sideTheme = val
    sideTheme.value = val
}

function saveSetting() {
    proxy.$modal.loading('正在保存到本地，请稍候...')
    const layoutSetting = {
        topNav: settingsStore.topNav,
        tagsView: settingsStore.tagsView,
        tagsIcon: settingsStore.tagsIcon,
        fixedHeader: settingsStore.fixedHeader,
        sidebarLogo: settingsStore.sidebarLogo,
        dynamicTitle: settingsStore.dynamicTitle,
        footerVisible: settingsStore.footerVisible,
        sideTheme: settingsStore.sideTheme,
        theme: settingsStore.theme
    }
    localStorage.setItem('layout-setting', JSON.stringify(layoutSetting))
    setTimeout(() => {
        proxy.$modal.closeLoading()
    }, 1000)
}

function resetSetting() {
    proxy.$modal.loading('正在清除设置缓存并刷新，请稍候...')
    localStorage.removeItem('layout-setting')
    setTimeout(() => {
        window.location.reload()
    }, 1000)
}

function openSetting() {
    showSettings.value = true
}

defineExpose({
    openSetting
})
</script>

<style lang="scss" scoped>
.setting-drawer-theme-list {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;

    .setting-drawer-theme-item {
        position: relative;
        cursor: pointer;
        border: 2px solid transparent;
        border-radius: 4px;
        transition: border-color 0.3s;

        &:hover {
            border-color: var(--el-color-primary-light-5);
        }

        img {
            width: 50px;
            height: 50px;
            display: block;
            border-radius: 2px;
        }

        .setting-drawer-theme-check {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;

            .check-icon {
                font-size: 20px;
                filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
            }
        }
    }
}

.drawer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    font-size: 14px;
    color: var(--el-text-color-regular);
}

.drawer-title {
    font-size: 14px;
    margin: 20px 0 12px;
    font-weight: bold;
    color: var(--el-text-color-primary);

    display: flex;
    align-items: center;

    &::before {
        content: '';
        width: 3px;
        height: 14px;
        background-color: var(--el-color-primary);
        margin-right: 8px;
        border-radius: 2px;
    }
}

.drawer-footer {
    display: flex;
    justify-content: space-between;
    gap: 10px;

    .el-button {
        flex: 1;
    }
}
</style>
