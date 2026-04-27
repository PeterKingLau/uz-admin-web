<template>
    <header class="page-header">
        <div class="header-inner">
            <div class="brand" @click="$emit('brand-click')">
                <img :src="brandLogo" alt="职场吧" class="brand-logo" />
                <span class="brand-name">职场吧</span>
            </div>
            <div v-if="showSearch" class="search-container">
                <div class="search-bar">
                    <button type="button" class="search-submit" aria-label="搜索" @click="submitSearch">
                        <Icon icon="mdi:magnify" class="search-icon" />
                    </button>
                    <input
                        v-model="searchText"
                        type="text"
                        :placeholder="placeholder"
                        @keydown.enter.prevent="submitSearch"
                        @compositionstart="isComposing = true"
                        @compositionend="handleCompositionEnd"
                    />
                    <button v-if="searchText" type="button" class="search-clear" aria-label="清除搜索" @click="clearSearch">
                        <Icon icon="mdi:close-circle" />
                    </button>
                </div>
            </div>
            <div class="header-actions">
                <slot name="actions" />

                <el-dropdown
                    v-if="isLoggedIn"
                    class="user-dropdown"
                    trigger="click"
                    placement="bottom-end"
                    popper-class="client-header-dropdown"
                    @command="handleCommand"
                >
                    <button type="button" class="user-entry">
                        <img :src="displayAvatar" alt="当前用户头像" class="user-avatar" @error="handleAvatarError" />
                        <span class="user-name">{{ displayName }}</span>
                        <Icon icon="ep:arrow-down" class="user-caret" />
                    </button>

                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item v-if="profileRoute" command="profile">
                                <Icon icon="ep:user" class="dropdown-icon" />
                                个人主页
                            </el-dropdown-item>
                            <el-dropdown-item v-if="passwordRoute" command="password">
                                <Icon icon="ep:lock" class="dropdown-icon" />
                                修改密码
                            </el-dropdown-item>
                            <el-dropdown-item v-if="adminRoute" command="admin">
                                <Icon icon="ep:monitor" class="dropdown-icon" />
                                进入管理端
                            </el-dropdown-item>
                            <el-dropdown-item command="logout" class="logout-item">
                                <Icon icon="ep:switch-button" class="dropdown-icon" />
                                退出登录
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientComponentsClientHeader' })
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import brandLogo from '@/assets/logo/logo.png'
import defaultAvatar from '@/assets/images/profile.jpg'
import useUserStore from '@/store/modules/user'
import { getAdminHomeRoute, getClientSelfProfileRoute } from '@/utils/routeAccess'

const props = withDefaults(
    defineProps<{
        placeholder?: string
        showSearch?: boolean
        searchValue?: string
    }>(),
    {
        placeholder: '搜索更多感兴趣的内容...',
        showSearch: true,
        searchValue: ''
    }
)

const emit = defineEmits<{
    (e: 'brand-click'): void
    (e: 'search', keyword: string): void
    (e: 'update:searchValue', keyword: string): void
}>()

const router = useRouter()
const userStore = useUserStore()
const { proxy } = getCurrentInstance() || {}
const avatarLoadFailed = ref(false)
const searchText = ref(props.searchValue)
const isComposing = ref(false)
const isLoggedIn = computed(() => Boolean(userStore.token))
const displayName = computed(() => String(userStore.nickName || userStore.name || '用户'))
const displayAvatar = computed(() => (avatarLoadFailed.value ? defaultAvatar : String(userStore.avatar || defaultAvatar)))
const profileRoute = computed(() => getClientSelfProfileRoute(userStore.id))
const passwordRoute = computed(() => null)
const adminRoute = computed(() => (userStore.roles.length > 0 && userStore.canAccessAdminRoutes ? getAdminHomeRoute() : null))

const handleAvatarError = () => {
    avatarLoadFailed.value = true
}

const normalizeSearchText = (value: string) => String(value || '').trim()

const submitSearch = () => {
    if (isComposing.value) return
    const keyword = normalizeSearchText(searchText.value)
    searchText.value = keyword
    emit('update:searchValue', keyword)
    emit('search', keyword)
}

const clearSearch = () => {
    searchText.value = ''
    emit('update:searchValue', '')
    emit('search', '')
}

const handleCompositionEnd = () => {
    isComposing.value = false
}

const navigateTo = (target: any) => {
    if (!target) return
    router.push(target)
}

const handleCommand = (command: string | number | object) => {
    switch (command) {
        case 'profile':
            navigateTo(profileRoute.value)
            break
        case 'password':
            navigateTo(passwordRoute.value)
            break
        case 'admin':
            navigateTo(adminRoute.value)
            break
        case 'logout':
            proxy?.$modal
                ?.confirm?.('确认退出当前账号吗？')
                .then(() => {
                    userStore.logOut().then(() => {
                        router.push('/login')
                    })
                })
                .catch(() => {})
            break
        default:
            break
    }
}

watch(
    () => userStore.avatar,
    () => {
        avatarLoadFailed.value = false
    }
)

watch(
    () => props.searchValue,
    value => {
        if (value === searchText.value) return
        searchText.value = value || ''
    }
)

onMounted(() => {
    if (!isLoggedIn.value) return
    userStore.ensureFreshProfile().catch(() => {})
})
</script>

<style scoped lang="scss">
.page-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: var(--header-height);
    background-color: var(--client-surface);
    border-bottom: 1px solid var(--border-color);
    z-index: 100;
    display: flex;
    justify-content: center;
}

.header-inner {
    width: 100%;
    max-width: var(--content-max-width);
    height: 100%;
    padding: 0 24px;
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr) 240px;
    align-items: center;
    gap: 24px;
}

.brand {
    grid-column: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    width: fit-content;
    padding: 4px 8px 4px 0;
    transition: opacity 0.2s;
}

.brand:hover {
    opacity: 0.85;
}

.brand-logo {
    width: 28px;
    height: 28px;
    object-fit: contain;
}

.brand-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-main);
    letter-spacing: 0.5px;
}

.search-container {
    grid-column: 2;
    min-width: 0;
    display: flex;
    justify-content: center;
}

.search-bar {
    width: 100%;
    max-width: 480px;
    height: 36px;
    background-color: var(--bg-color);
    border-radius: 18px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 10px;
    border: 1px solid transparent;
    transition:
        background-color var(--app-motion-normal),
        border-color var(--app-motion-normal),
        box-shadow var(--app-motion-normal);
}

.search-bar:focus-within {
    background-color: var(--client-surface);
    border-color: var(--primary-color);
    box-shadow: var(--client-focus-ring-soft);
}

.search-bar input {
    flex: 1;
    width: 100%;
    min-width: 0;
    border: 0;
    border-left: 0;
    background: transparent;
    outline: 0;
    box-shadow: none;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    padding: 0;
    margin: 0;
    font-size: 14px;
    color: var(--text-main);
}

.search-submit {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--text-minor);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
        color var(--app-motion-fast),
        background-color var(--app-motion-fast);
}

.search-submit:hover {
    color: var(--primary-color);
    background: var(--client-surface-muted);
}

.search-icon {
    font-size: 18px;
}

.search-bar input:focus,
.search-bar input:focus-visible {
    outline: 0;
    border: 0;
    box-shadow: none;
}

.search-bar input::placeholder {
    color: var(--text-minor);
}

.search-clear {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--text-minor);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
        color var(--app-motion-fast),
        background-color var(--app-motion-fast);
}

.search-clear:hover {
    color: var(--text-regular);
    background: var(--client-surface-muted);
}

.header-actions {
    grid-column: 3;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.user-dropdown {
    min-width: 0;
}

.user-entry {
    max-width: 100%;
    height: 40px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    color: var(--text-main);
    cursor: pointer;
    transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.user-entry:hover {
    background: var(--client-surface-muted);
    border-color: var(--client-border-soft);
}

.user-entry:focus,
.user-entry:focus-visible {
    outline: none;
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--client-focus-ring-soft);
}

.user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    flex-shrink: 0;
    border: 1px solid var(--client-border-soft);
    background: var(--client-fill);
}

.user-name {
    min-width: 0;
    max-width: 108px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
}

.user-caret {
    font-size: 12px;
    color: var(--text-minor);
    flex-shrink: 0;
}

@media screen and (max-width: 1024px) {
    .header-inner {
        grid-template-columns: auto minmax(0, 1fr) auto;
    }

    .header-actions {
        justify-self: end;
    }
}

@media screen and (max-width: 768px) {
    .header-inner {
        padding: 0 12px;
        grid-template-columns: auto auto;
        gap: 12px;
    }

    .header-actions {
        grid-column: 2;
    }

    .search-container {
        display: none;
    }

    .user-entry {
        padding: 0 10px;
    }

    .user-name {
        max-width: 72px;
    }
}
</style>

<style lang="scss">
.client-header-dropdown {
    border-radius: 12px !important;
    padding: 8px !important;
    min-width: 148px;
    border: 1px solid var(--border-color) !important;
    box-shadow: var(--app-hover-shadow-soft) !important;

    .el-dropdown-menu__item {
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 8px;
        font-size: 14px;
        color: var(--text-regular);
        line-height: 1;
        padding: 10px 14px;
        transition:
            background-color var(--app-motion-fast),
            color var(--app-motion-fast);
    }

    .el-dropdown-menu__item:hover {
        background: var(--client-surface-muted);
        color: var(--primary-color);
    }

    .el-dropdown-menu__item--divided {
        margin-top: 0;
        border-top: 0;
    }

    .el-dropdown-menu__item--divided::before {
        display: none;
    }

    .dropdown-icon {
        font-size: 15px;
        color: var(--text-minor);
    }

    .logout-item:hover {
        background: var(--client-danger-soft);
        color: var(--client-danger-text);
    }

    .logout-item:hover .dropdown-icon {
        color: var(--client-danger-text);
    }
}
</style>
