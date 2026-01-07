<template>
    <div class="error-page-container">
        <div class="content-card">
            <el-row :gutter="40" align="middle">
                <el-col :xs="24" :md="12">
                    <div class="image-wrapper">
                        <img :src="errGif" alt="401 Error" />
                    </div>
                </el-col>
                <el-col :xs="24" :md="12">
                    <div class="text-wrapper">
                        <el-button class="back-btn" @click="back" text>
                            <template #icon>
                                <Icon icon="mdi:arrow-left" />
                            </template>
                            返回上一页
                        </el-button>

                        <h1 class="error-code">401</h1>
                        <h2 class="error-title">您没有访问权限</h2>
                        <p class="error-desc">
                            抱歉，您当前无法访问此页面。<br />
                            可能是因为凭证过期或权限不足，请联系管理员或返回首页。
                        </p>

                        <div class="action-buttons">
                            <router-link to="/">
                                <el-button type="primary" size="large" class="home-btn">
                                    <template #icon>
                                        <Icon icon="mdi:home-outline" />
                                    </template>
                                    返回首页
                                </el-button>
                            </router-link>
                        </div>
                    </div>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue'
import errImage from '@/assets/401_images/401.gif'

const { proxy } = getCurrentInstance()

const errGif = ref(errImage + '?' + +new Date())

function back() {
    if (proxy.$route.query.noGoBack) {
        proxy.$router.push({ path: '/' })
    } else {
        proxy.$router.go(-1)
    }
}
</script>

<style lang="scss" scoped>
.error-page-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: var(--el-bg-color-page);
    padding: 20px;

    .content-card {
        width: 900px;
        max-width: 100%;
        background: var(--el-bg-color-overlay);
        border-radius: 16px;
        box-shadow: var(--el-box-shadow-light);
        padding: 60px 40px;
        overflow: hidden;
        transition: transform 0.3s;
        border: 1px solid var(--el-border-color-light);

        &:hover {
            box-shadow: var(--el-box-shadow);
        }
    }

    .image-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;

        img {
            width: 100%;
            max-width: 350px;
            height: auto;
            object-fit: contain;
        }
    }

    .text-wrapper {
        padding: 20px;

        .back-btn {
            margin-bottom: 24px;
            color: var(--el-text-color-regular);

            &:hover {
                color: var(--el-color-primary);
                background-color: var(--el-color-primary-light-9);
            }
        }

        .error-code {
            font-size: 72px;
            font-weight: 800;
            color: var(--el-color-primary);
            line-height: 1;
            margin: 0 0 16px 0;
            letter-spacing: -2px;
        }

        .error-title {
            font-size: 24px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 12px;
        }

        .error-desc {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            line-height: 1.6;
            margin-bottom: 32px;
        }

        .action-buttons {
            .home-btn {
                background-color: var(--el-color-primary);
                border-color: var(--el-color-primary);
                padding: 12px 36px;
                border-radius: 8px;
                font-weight: 500;
                font-size: 15px;
                transition: all 0.3s;

                &:hover {
                    background-color: var(--el-color-primary-light-3);
                    border-color: var(--el-color-primary-light-3);
                    transform: translateY(-1px);
                    box-shadow: var(--el-box-shadow);
                }

                &:active {
                    transform: translateY(0);
                }
            }
        }
    }
}

@media screen and (max-width: 768px) {
    .error-page-container {
        align-items: flex-start;
        padding-top: 40px;

        .content-card {
            padding: 30px 20px;
        }

        .text-wrapper {
            text-align: center;
            margin-top: 30px;
            padding: 0;

            .back-btn {
                display: none;
            }

            .error-code {
                font-size: 60px;
            }

            .error-title {
                font-size: 20px;
            }
        }
    }
}
</style>
