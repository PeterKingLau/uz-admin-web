<template>
    <div class="navbar">
        <div class="left-menu">
            <hamburger id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />
            <breadcrumb v-if="!settingsStore.topNav" id="breadcrumb-container" class="breadcrumb-container" />
            <top-nav v-if="settingsStore.topNav" id="topmenu-container" class="topmenu-container" />
        </div>

        <div class="right-menu">
            <template v-if="appStore.device !== 'mobile'">
                <header-search id="header-search" class="right-menu-item hover-effect" />

                <screenfull id="screenfull" class="right-menu-item hover-effect" />

                <el-tooltip content="主题模式" effect="dark" placement="bottom">
                    <div class="right-menu-item hover-effect theme-switch-wrapper" @click="toggleTheme">
                        <Icon v-if="settingsStore.isDark" icon="ep:sunny" class="theme-icon" />
                        <Icon v-else icon="ep:moon" class="theme-icon" />
                    </div>
                </el-tooltip>

                <el-tooltip content="布局大小" effect="dark" placement="bottom">
                    <size-select id="size-select" class="right-menu-item hover-effect" />
                </el-tooltip>
            </template>

            <el-dropdown @command="handleCommand" class="right-menu-item hover-effect avatar-container" trigger="click">
                <div class="avatar-wrapper">
                    <img :src="userStore.avatar" class="user-avatar" />
                    <span class="user-nickname">{{ userStore.nickName }}</span>
                    <Icon icon="ep:caret-bottom" class="el-icon--right" />
                </div>
                <template #dropdown>
                    <el-dropdown-menu>
                        <router-link to="/user/profile">
                            <el-dropdown-item> <Icon icon="ep:user" class="mr-1" />个人中心 </el-dropdown-item>
                        </router-link>
                        <el-dropdown-item divided command="logout"> <Icon icon="ep:switch-button" class="mr-1" />退出登录 </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

            <div class="right-menu-item hover-effect setting" @click="setLayout" v-if="settingsStore.showSettings">
                <Icon icon="mdi:dots-vertical" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { getCurrentInstance } from 'vue'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import SizeSelect from '@/components/SizeSelect'
import HeaderSearch from '@/components/HeaderSearch'
import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'

const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const { proxy } = getCurrentInstance() || {}

function toggleSideBar() {
    appStore.toggleSideBar()
}

function handleCommand(command) {
    switch (command) {
        case 'setLayout':
            setLayout()
            break
        case 'logout':
            logout()
            break
    }
}

function logout() {
    proxy?.$modal
        ?.confirm?.('确定注销并退出系统吗？')
        .then(() => {
            userStore.logOut().then(() => {
                location.href = '/index'
            })
        })
        .catch(() => {})
}

const emits = defineEmits(['setLayout'])
function setLayout() {
    emits('setLayout')
}

function toggleTheme() {
    settingsStore.toggleTheme()
}
</script>

<style lang="scss" scoped>
.navbar {
    height: 50px;
    overflow: hidden;
    position: relative;
    background: var(--el-bg-color); // 使用 Element Plus 变量适配暗黑模式
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 15px; // 右侧留白

    .left-menu {
        display: flex;
        align-items: center;
        height: 100%;

        .hamburger-container {
            line-height: 46px;
            height: 100%;
            cursor: pointer;
            transition: background 0.3s;
            -webkit-tap-highlight-color: transparent;
            padding: 0 15px;

            &:hover {
                background: rgba(0, 0, 0, 0.025);
            }
        }

        .breadcrumb-container {
            margin-left: 8px;
        }
    }

    .right-menu {
        height: 100%;
        display: flex;
        align-items: center;

        &:focus {
            outline: none;
        }

        .right-menu-item {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 8px;
            height: 100%;
            font-size: 18px;
            color: var(--el-text-color-regular); // 适配暗黑模式文字颜色
            vertical-align: text-bottom;
            cursor: pointer;
            transition: background 0.3s;

            &.hover-effect {
                &:hover {
                    background: var(--el-fill-color-light); // 适配暗黑模式悬停背景
                }
            }

            // 主题切换图标动画
            &.theme-switch-wrapper {
                .theme-icon {
                    transition: transform 0.5s;
                }
                &:hover .theme-icon {
                    transform: rotate(180deg);
                }
            }
        }

        .avatar-container {
            margin-right: 0;

            .avatar-wrapper {
                display: flex;
                align-items: center;
                height: 100%;
                gap: 8px;
                padding: 0 4px;
                user-select: none;

                .user-avatar {
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 1px solid var(--el-border-color-lighter); // 增加边框提升质感
                }

                .user-nickname {
                    font-size: 14px;
                    font-weight: 500; // 不用 bold，500 更现代
                    white-space: nowrap;
                    color: var(--el-text-color-primary);
                }

                .el-icon--right {
                    font-size: 12px;
                    color: var(--el-text-color-secondary);
                }
            }
        }
    }
}
</style>
