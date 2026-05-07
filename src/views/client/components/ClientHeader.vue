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

                <button v-if="adminRoute" type="button" class="admin-entry" @click="navigateTo(adminRoute)">
                    <Icon icon="ep:monitor" class="admin-entry-icon" />
                    <span class="admin-entry-label-full">进入管理端</span>
                    <span class="admin-entry-label-short">管理端</span>
                </button>

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
    height: var(--header-height, 64px);
    background: var(--client-surface);
    border-bottom: 1px solid var(--border-color);
    z-index: 100;
    display: flex;
    justify-content: center;
    transition: background-color 0.3s ease;
}

.header-inner {
    width: 100%;
    max-width: var(--content-max-width, 1440px);
    height: 100%;
    padding: 0 24px;
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr) minmax(340px, auto);
    align-items: center;
    gap: 24px;
}

.brand {
    grid-column: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    width: fit-content;
    padding: 4px 8px 4px 0;
    transition: opacity 0.3s ease;
}

.brand:hover {
    opacity: 0.9;
}

.brand-logo {
    width: 30px;
    height: 30px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));
}

.brand-name {
    font-size: 19px;
    font-weight: 700;
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
    height: 40px;
    background-color: var(--bg-color);
    border-radius: 8px;
    display: flex;
    align-items: center;
    padding: 0 18px;
    gap: 12px;
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
    font-size: 15px;
    color: var(--text-main);
    font-weight: 500;
}

.search-submit {
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--text-minor);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.search-submit:hover {
    color: var(--primary-color);
    transform: scale(1.1);
}

.search-icon {
    font-size: 20px;
}

.search-bar input:focus,
.search-bar input:focus-visible {
    outline: 0;
    border: 0;
    box-shadow: none;
}

.search-bar input::placeholder {
    color: var(--text-minor);
    font-weight: 400;
}

.search-clear {
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--text-minor);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.search-clear:hover {
    color: var(--text-regular);
    transform: scale(1.1);
}

.header-actions {
    grid-column: 3;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    min-width: 0;
}

.admin-entry {
    height: 38px;
    padding: 0 16px;
    border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    color: var(--primary-color);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    transition:
        background-color var(--app-motion-fast),
        border-color var(--app-motion-fast),
        color var(--app-motion-fast),
        box-shadow var(--app-motion-fast);
}

.admin-entry:hover {
    border-color: color-mix(in srgb, var(--primary-color) 50%, transparent);
    background: var(--primary-color);
    color: #ffffff;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--primary-color) 30%, transparent);
}

.admin-entry:focus,
.admin-entry:focus-visible {
    outline: none;
}

.admin-entry-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.admin-entry-icon :deep(svg),
.admin-entry-icon :deep(.iconify) {
    width: 1em;
    height: 1em;
    display: block;
}

.admin-entry-label-short {
    display: none;
}

.user-dropdown {
    min-width: 0;
}

.user-entry {
    max-width: 100%;
    height: 42px;
    padding: 0 14px 0 6px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--text-main);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.user-entry:hover {
    background: color-mix(in srgb, var(--text-main) 4%, transparent);
    border-color: color-mix(in srgb, var(--text-main) 6%, transparent);
}

.user-entry:focus,
.user-entry:focus-visible {
    outline: none;
    border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    flex-shrink: 0;
    border: 1px solid color-mix(in srgb, var(--text-main) 8%, transparent);
    background: var(--client-fill);
}

.user-name {
    min-width: 0;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 600;
}

.user-caret {
    font-size: 12px;
    color: var(--text-minor);
    flex-shrink: 0;
    transition: transform 0.3s ease;
}

.user-entry:hover .user-caret {
    transform: translateY(2px);
    color: var(--text-main);
}

@media screen and (max-width: 1024px) {
    .header-inner {
        grid-template-columns: auto minmax(0, 1fr) auto;
    }

    .header-actions {
        justify-self: end;
    }
}

@media screen and (max-width: 1180px) {
    .admin-entry-label-full {
        display: none;
    }

    .admin-entry-label-short {
        display: inline;
    }

    .admin-entry {
        min-width: 0;
        padding: 0 10px;
        gap: 5px;
        justify-content: center;
        border-radius: 8px;
    }
}

@media screen and (max-width: 768px) {
    .header-inner {
        padding: 0 16px;
        grid-template-columns: auto auto;
        gap: 16px;
    }

    .header-actions {
        grid-column: 2;
        gap: 8px;
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

    .admin-entry {
        min-width: 0;
        flex-basis: auto;
        height: 34px;
        font-size: 12px;
    }
}

@media screen and (max-width: 420px) {
    .header-inner {
        padding: 0 12px;
        gap: 10px;
    }

    .header-actions {
        gap: 6px;
    }

    .user-entry {
        padding: 0 8px 0 4px;
        gap: 8px;
    }

    .user-name {
        max-width: 56px;
    }
}
</style>

<style lang="scss">
.client-header-dropdown {
    background: var(--client-surface) !important;
    border-radius: 8px !important;
    padding: 10px !important;
    min-width: 160px;
    border: 1px solid color-mix(in srgb, var(--text-main) 6%, transparent) !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08) !important;

    .el-dropdown-menu__item {
        display: flex;
        align-items: center;
        gap: 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-main);
        line-height: 1;
        padding: 12px 16px;
        transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .el-dropdown-menu__item:hover {
        background: color-mix(in srgb, var(--text-main) 4%, transparent);
        transform: translateX(4px);
    }

    .el-dropdown-menu__item--divided {
        margin-top: 4px;
        border-top: 1px solid color-mix(in srgb, var(--text-main) 6%, transparent);
    }

    .el-dropdown-menu__item--divided::before {
        display: none;
    }

    .dropdown-icon {
        font-size: 16px;
        color: var(--text-minor);
        transition: color 0.2s ease;
    }

    .el-dropdown-menu__item:hover .dropdown-icon {
        color: var(--text-main);
    }

    .logout-item {
        margin-top: 4px;
    }

    .logout-item:hover {
        background: color-mix(in srgb, var(--client-danger-text) 10%, transparent);
        color: var(--client-danger-text);
    }

    .logout-item:hover .dropdown-icon {
        color: var(--client-danger-text);
    }
}
</style>
