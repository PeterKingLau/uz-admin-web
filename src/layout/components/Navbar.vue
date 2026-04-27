<template>
    <div class="navbar">
        <div class="left-menu" :class="{ 'is-client': isClientMode }">
            <template v-if="!isClientMode">
                <hamburger id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />
                <breadcrumb v-if="!settingsStore.topNav" id="breadcrumb-container" class="breadcrumb-container" />
                <top-nav v-if="settingsStore.topNav" id="topmenu-container" class="topmenu-container" />
            </template>
            <div v-else class="client-title">{{ currentClientTitle }}</div>
        </div>

        <div class="right-menu">
            <template v-if="appStore.device !== 'mobile' && !isClientMode">
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
                    <img :src="displayAvatar" class="user-avatar" @error="handleAvatarError" />
                    <span class="user-nickname">{{ displayName }}</span>
                    <Icon icon="ep:caret-bottom" class="action-icon el-icon--right" />
                </div>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item v-if="canEnterClient" command="goClient">
                            <Icon icon="mdi:cellphone-link" class="dropdown-icon" />
                            进入客户端
                        </el-dropdown-item>
                        <el-dropdown-item v-if="profileRoute" command="profile">
                            <Icon icon="ep:user" class="dropdown-icon" />
                            {{ profileMenuLabel }}
                        </el-dropdown-item>
                        <el-dropdown-item v-if="passwordRoute" command="password">
                            <Icon icon="ep:lock" class="dropdown-icon" />
                            修改密码
                        </el-dropdown-item>
                        <el-dropdown-item divided command="logout" class="logout-item">
                            <Icon icon="ep:switch-button" class="dropdown-icon" />
                            退出登录
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

            <div class="right-menu-item hover-effect setting" @click="setLayout" v-if="settingsStore.showSettings && !isClientMode">
                <Icon icon="mdi:dots-vertical" class="action-icon" />
            </div>
        </div>
    </div>
</template>

<script setup>
defineOptions({ name: 'LayoutComponentsNavbar' })
import { computed, getCurrentInstance, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import SizeSelect from '@/components/SizeSelect'
import HeaderSearch from '@/components/HeaderSearch'
import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import defaultAvatar from '@/assets/images/profile.jpg'
import { getClientBaseUrl, getClientHomeRoute, resolvePersonalRoute } from '@/utils/routeAccess'

const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance() || {}
const avatarLoadFailed = ref(false)
const isClientMode = computed(() => userStore.isCommonClient === true)
const canEnterClient = computed(() => !isClientMode.value && userStore.canAccessClientEntry)
const currentClientTitle = computed(() => String(route.meta?.title || '推荐'))
const displayName = computed(() => String(userStore.nickName || userStore.name || '用户'))
const displayAvatar = computed(() => (avatarLoadFailed.value ? defaultAvatar : String(userStore.avatar || defaultAvatar)))
const profileRoute = computed(() => resolvePersonalRoute({ id: userStore.id, roles: userStore.roles, admin: userStore.admin }, 'profile'))
const passwordRoute = computed(() => resolvePersonalRoute({ id: userStore.id, roles: userStore.roles, admin: userStore.admin }, 'password'))
const profileMenuLabel = computed(() => (isClientMode.value ? '个人主页' : '个人中心'))

function toggleSideBar() {
    appStore.toggleSideBar()
}

function handleAvatarError() {
    avatarLoadFailed.value = true
}

function navigateTo(target) {
    if (!target) return
    router.push(target)
}

function goClient() {
    const clientBaseUrl = getClientBaseUrl()
    if (clientBaseUrl) {
        window.location.href = clientBaseUrl
        return
    }
    router.push(getClientHomeRoute())
}

function handleCommand(command) {
    switch (command) {
        case 'setLayout':
            setLayout()
            break
        case 'logout':
            logout()
            break
        case 'goClient':
            goClient()
            break
        case 'profile':
            navigateTo(profileRoute.value)
            break
        case 'password':
            navigateTo(passwordRoute.value)
            break
    }
}

function logout() {
    proxy?.$modal
        ?.confirm?.('确认注销并退出系统吗？')
        .then(() => {
            userStore.logOut().then(() => {
                location.href = '/index'
            })
        })
        .catch(() => {})
}

watch(
    () => userStore.avatar,
    () => {
        avatarLoadFailed.value = false
    }
)

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
    box-shadow: 0 1px 4px color-mix(in srgb, var(--el-color-black) 8%, transparent);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 16px;
    transition: background 0.3s;

    .left-menu {
        display: flex;
        align-items: center;
        height: 100%;

        &.is-client {
            padding-left: 16px;
        }

        .client-title {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.3px;
            color: var(--el-text-color-primary);
            line-height: 1;
        }

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
            height: 100%;
            display: flex;
            align-items: center;
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
            transition:
                background-color var(--app-motion-fast),
                color var(--app-motion-fast);

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
                    transition: border-color var(--app-motion-fast);
                    background: var(--el-fill-color-light);
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
                    border-color: var(--el-color-primary-light-5);
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
    box-shadow: 0 4px 20px color-mix(in srgb, var(--el-color-black) 8%, transparent) !important;
    border: 1px solid var(--el-border-color-lighter) !important;

    .el-dropdown-menu__item {
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        color: var(--el-text-color-regular);
        transition:
            background-color var(--app-motion-fast),
            color var(--app-motion-fast);
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
}
</style>
