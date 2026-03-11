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
                        <Icon v-if="settingsStore.isDark" icon="ep:sunny" class="action-icon theme-icon" />
                        <Icon v-else icon="ep:moon" class="action-icon theme-icon" />
                    </div>
                </el-tooltip>

                <el-tooltip content="布局大小" effect="dark" placement="bottom">
                    <div class="right-menu-item hover-effect">
                        <size-select id="size-select" class="size-select-container" />
                    </div>
                </el-tooltip>
            </template>

            <el-dropdown @command="handleCommand" class="right-menu-item hover-effect avatar-container" trigger="click" popper-class="navbar-dropdown">
                <div class="avatar-wrapper">
                    <img :src="userStore.avatar" class="user-avatar" />
                    <span class="user-nickname">{{ userStore.nickName }}</span>
                    <Icon icon="ep:caret-bottom" class="action-icon el-icon--right" />
                </div>
                <template #dropdown>
                    <el-dropdown-menu>
                        <router-link to="/user/profile" class="dropdown-link">
                            <el-dropdown-item> <Icon icon="ep:user" class="dropdown-icon" />个人中心 </el-dropdown-item>
                        </router-link>
                        <el-dropdown-item divided command="logout" class="logout-item">
                            <Icon icon="ep:switch-button" class="dropdown-icon" />退出登录
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

            <div class="right-menu-item hover-effect setting" @click="setLayout" v-if="settingsStore.showSettings">
                <Icon icon="mdi:dots-vertical" class="action-icon" />
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
    height: 56px;
    overflow: hidden;
    position: relative;
    background: var(--el-bg-color);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 16px;
    transition: background 0.3s;

    .left-menu {
        display: flex;
        align-items: center;
        height: 100%;

        .hamburger-container {
            height: 100%;
            cursor: pointer;
            transition: background 0.3s;
            -webkit-tap-highlight-color: transparent;
            padding: 0 16px;
            display: flex;
            align-items: center;

            &:hover {
                background: var(--el-fill-color-light);
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
        gap: 4px;

        &:focus {
            outline: none;
        }

        .right-menu-item {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 10px;
            height: 40px;
            min-width: 40px;
            font-size: 18px;
            color: var(--el-text-color-regular);
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s;

            .action-icon {
                font-size: 18px;
                width: 1em;
                height: 1em;
                display: block;
            }

            &.hover-effect {
                &:hover {
                    background: var(--el-fill-color-light);
                    color: var(--el-color-primary);
                }
            }

            &.theme-switch-wrapper {
                .theme-icon {
                    transition: transform 0.5s ease-in-out;
                }
                &:hover .theme-icon {
                    transform: rotate(180deg) scale(1.1);
                }
            }
        }

        .size-select-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
        }

        .avatar-container {
            margin-left: 8px;
            padding: 0 12px;
            min-width: auto;
            height: 40px;

            .avatar-wrapper {
                display: flex;
                align-items: center;
                height: 100%;
                gap: 8px;
                user-select: none;

                .user-avatar {
                    cursor: pointer;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 1px solid var(--el-border-color-lighter);
                    display: block;
                    transition: transform 0.3s;
                }

                .user-nickname {
                    font-size: 14px;
                    font-weight: 500;
                    white-space: nowrap;
                    color: var(--el-text-color-primary);
                    transition: color 0.3s;
                }

                .el-icon--right {
                    font-size: 12px;
                    color: var(--el-text-color-secondary);
                    transition: transform 0.3s;
                }
            }

            &:hover {
                .user-avatar {
                    transform: scale(1.05);
                }
            }
        }

        .setting {
            margin-left: 4px;
        }
    }
}
</style>

<style lang="scss">
.navbar-dropdown {
    border-radius: 12px !important;
    padding: 8px !important;
    min-width: 160px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
    border: 1px solid var(--el-border-color-lighter) !important;

    .el-dropdown-menu__item {
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        color: var(--el-text-color-regular);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 10px;
        line-height: 1;

        .dropdown-icon {
            font-size: 16px;
            color: var(--el-text-color-secondary);
            transition: color 0.2s;
        }

        &:hover {
            background-color: var(--el-fill-color-light);
            color: var(--el-color-primary);

            .dropdown-icon {
                color: var(--el-color-primary);
            }
        }

        &.logout-item {
            &:hover {
                background-color: var(--el-color-danger-light-9);
                color: var(--el-color-danger);

                .dropdown-icon {
                    color: var(--el-color-danger);
                }
            }
        }
    }

    .el-dropdown-menu__item--divided {
        margin-top: 6px;
        border-top-color: var(--el-border-color-extra-light);

        &::before {
            display: none;
        }
    }

    .dropdown-link {
        text-decoration: none;
        display: block;
        margin-bottom: 2px;
    }
}
</style>
