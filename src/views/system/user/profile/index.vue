<template>
    <div class="app-container profile-container">
        <el-row :gutter="24">
            <el-col :span="7" :xs="24">
                <div class="profile-card">
                    <div class="card-header">
                        <div class="avatar-wrapper">
                            <userAvatar />
                        </div>
                        <div class="name-role">
                            <div class="user-name">{{ state.user.userName }}</div>
                            <div class="user-role">{{ state.roleGroup || '普通用户' }}</div>
                        </div>
                    </div>

                    <div class="info-list">
                        <div class="info-item">
                            <div class="label">
                                <Icon icon="ep:user" class="icon" />
                                <span>用户名称</span>
                            </div>
                            <div class="value">{{ state.user.userName }}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">
                                <Icon icon="ep:phone" class="icon" />
                                <span>手机号码</span>
                            </div>
                            <div class="value">{{ state.user.phonenumber }}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">
                                <Icon icon="ep:message" class="icon" />
                                <span>用户邮箱</span>
                            </div>
                            <div class="value">{{ state.user.email }}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">
                                <Icon icon="ep:office-building" class="icon" />
                                <span>所属部门</span>
                            </div>
                            <div class="value" v-if="state.user.dept">
                                {{ state.user.dept.deptName }} <span v-if="state.postGroup">/ {{ state.postGroup }}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="label">
                                <Icon icon="ep:user-filled" class="icon" />
                                <span>所属角色</span>
                            </div>
                            <div class="value">{{ state.roleGroup }}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">
                                <Icon icon="ep:calendar" class="icon" />
                                <span>创建日期</span>
                            </div>
                            <div class="value">{{ state.user.createTime }}</div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="17" :xs="24">
                <div class="settings-wrapper">
                    <div class="custom-tabs">
                        <div class="tab-item" :class="{ active: selectedTab === 'userinfo' }" @click="selectedTab = 'userinfo'">基本资料</div>
                        <div class="tab-item" :class="{ active: selectedTab === 'resetPwd' }" @click="selectedTab = 'resetPwd'">修改密码</div>
                    </div>

                    <div class="tab-content">
                        <transition name="fade-slide" mode="out-in">
                            <div v-if="selectedTab === 'userinfo'" key="userinfo">
                                <userInfo :user="state.user" />
                            </div>
                            <div v-else-if="selectedTab === 'resetPwd'" key="resetPwd">
                                <resetPwd />
                            </div>
                        </transition>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup name="Profile">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import userAvatar from './userAvatar.vue'
import userInfo from './userInfo.vue'
import resetPwd from './resetPwd.vue'
import { getUserProfile } from '@/api/system/user'

const route = useRoute()
const selectedTab = ref('userinfo')
const state = reactive({
    user: {},
    roleGroup: '',
    postGroup: ''
})

function getUser() {
    getUserProfile().then(response => {
        state.user = response.data || {}
        state.roleGroup = response.roleGroup || ''
        state.postGroup = response.postGroup || ''
    })
}

onMounted(() => {
    const activeTab = route.params && route.params.activeTab
    if (activeTab) {
        selectedTab.value = activeTab
    }
    getUser()
})
</script>

<style scoped lang="scss">
.profile-container {
    background-color: transparent;
    padding: 0;
}

.profile-card {
    background: var(--el-bg-color);
    border-radius: 16px;
    padding: 32px 24px;
    box-shadow: var(--el-box-shadow-light);
    height: 100%;

    .card-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 32px;

        .avatar-wrapper {
            margin-bottom: 16px;
            :deep(img),
            :deep(.el-avatar) {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                border: 4px solid var(--el-bg-color-page);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
        }

        .name-role {
            text-align: center;
            .user-name {
                font-size: 20px;
                font-weight: 700;
                color: var(--el-text-color-primary);
                margin-bottom: 4px;
            }
            .user-role {
                font-size: 13px;
                color: var(--el-text-color-secondary);
                background: var(--el-fill-color);
                padding: 2px 10px;
                border-radius: 12px;
                display: inline-block;
            }
        }
    }

    .info-list {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            padding-bottom: 16px;
            border-bottom: 1px dashed var(--el-border-color-lighter);

            &:last-child {
                border-bottom: none;
            }

            .label {
                display: flex;
                align-items: center;
                color: var(--el-text-color-regular);

                .icon {
                    margin-right: 8px;
                    font-size: 16px;
                    color: var(--el-text-color-secondary);
                }
            }

            .value {
                color: var(--el-text-color-primary);
                font-weight: 500;
            }
        }
    }
}

.settings-wrapper {
    background: var(--el-bg-color);
    border-radius: 16px;
    padding: 24px 32px;
    box-shadow: var(--el-box-shadow-light);
    min-height: 500px;

    .custom-tabs {
        display: flex;
        gap: 32px;
        border-bottom: 1px solid var(--el-border-color-light);
        margin-bottom: 24px;

        .tab-item {
            padding: 12px 0;
            font-size: 15px;
            font-weight: 500;
            color: var(--el-text-color-regular);
            cursor: pointer;
            position: relative;
            transition: all 0.3s;

            &:hover {
                color: var(--el-color-primary);
            }

            &.active {
                color: var(--el-color-primary);
                font-weight: 600;

                &::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: var(--el-color-primary);
                    border-radius: 3px 3px 0 0;
                }
            }
        }
    }

    .tab-content {
        padding-top: 8px;
    }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
}
.fade-slide-enter-from {
    opacity: 0;
    transform: translateX(10px);
}
.fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-10px);
}

@media screen and (max-width: 768px) {
    .profile-card {
        margin-bottom: 20px;
    }
    .custom-tabs {
        gap: 20px;
        justify-content: space-around;
    }
}
</style>
