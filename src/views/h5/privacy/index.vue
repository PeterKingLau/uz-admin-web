<template>
    <div class="legal-page">
        <div class="legal-hero">
            <div class="hero-inner">
                <div class="eyebrow">PRIVACY POLICY</div>
                <h1 class="hero-title">隐私政策</h1>
                <p class="hero-summary">
                    《{{ serviceName }}隐私政策》适用于
                    {{ serviceName }} 移动应用程序。我们深知个人信息对你的重要性，并将按照法律法规要求保护你的个人信息及隐私安全。
                </p>
                <div class="hero-meta">
                    <div class="meta-tag">适用产品：{{ serviceName }}</div>
                    <div class="meta-tag">版本号：{{ version }}</div>
                    <div class="meta-tag">生效日期：{{ effectiveDate }}</div>
                    <div class="meta-tag">更新日期：{{ updatedAt }}</div>
                </div>
            </div>
        </div>

        <div class="legal-main">
            <aside class="toc-panel">
                <div class="toc-card">
                    <a v-for="section in sections" :key="section.id" class="toc-link" :href="`#${section.id}`">
                        {{ section.title.replace(/^[一二三四五六七八九十]+、/, '') }}
                    </a>
                    <a class="toc-link" href="#contact">联系我们</a>
                </div>
            </aside>

            <main class="content-panel">
                <section v-for="section in sections" :id="section.id" :key="section.id" class="content-card">
                    <div class="section-head">
                        <div class="section-badge">{{ section.title.split('、')[0] }}</div>
                        <h2>{{ section.title.split('、')[1] || section.title }}</h2>
                    </div>
                    <div class="section-body">
                        <p v-for="paragraph in section.paragraphs" :key="paragraph" class="section-paragraph">
                            {{ paragraph }}
                        </p>
                        <ul v-if="section.items?.length" class="section-list">
                            <li v-for="item in section.items" :key="item">
                                <Icon icon="mdi:check-circle" class="list-icon" />
                                <span>{{ item }}</span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section id="contact" class="content-card contact-card">
                    <div class="section-head">
                        <div class="section-badge"><Icon icon="mdi:phone" /></div>
                        <h2>联系我们</h2>
                    </div>
                    <div class="section-body">
                        <p class="section-paragraph">如你对本隐私政策有任何疑问、意见或建议，或希望行使个人信息相关权利，请通过以下方式与我们联系：</p>
                        <div class="contact-grid">
                            <div class="contact-item">
                                <span class="contact-label">主体名称</span>
                                <span class="contact-value">{{ companyName }}</span>
                            </div>
                            <div class="contact-item">
                                <span class="contact-label">客服邮箱</span>
                                <span class="contact-value">373392507@qq.com</span>
                            </div>
                            <div class="contact-item">
                                <span class="contact-label">联系地址</span>
                                <span class="contact-value">四川省成都市联通U谷2栋1单元1801</span>
                            </div>
                            <div class="contact-item">
                                <span class="contact-label">处理时效</span>
                                <span class="contact-value">我们将在 15 个工作日内回复你的请求</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const companyName = '职场吧'
const serviceName = '职场吧'
const version = 'v1.0'
const effectiveDate = '2026年3月11日'
const updatedAt = '2026年3月11日'

const sections = [
    {
        id: 'overview',
        title: '一、我们如何收集和使用你的个人信息',
        paragraphs: [
            `更新日期：${updatedAt}；生效日期：${effectiveDate}。${companyName}（以下简称“我们”）深知个人信息对你的重要性，我们将按照法律法规的规定，保护你的个人信息及隐私安全。本政策适用于“${serviceName}”移动应用程序。`,
            '我们遵循“合法、正当、必要”原则，仅收集实现功能所必需的信息。'
        ],
        items: [
            '账号注册 / 登录：当你注册时，我们会收集你的手机号码、验证码以用于创建账号。',
            '社区与短视频发布：当你上传视频、图片或评论时，我们需要调用你的相册 / 存储权限、相机权限、麦克风权限。',
            '设备信息与安全：为保障系统安全，我们会收集你的设备型号、操作系统、唯一设备标识符。'
        ]
    },
    {
        id: 'permission',
        title: '二、权限申请与使用说明',
        paragraphs: ['在你使用特定功能时，我们会动态申请以下权限。你有权拒绝，拒绝后仅影响相关功能的使用，不影响基本功能。'],
        items: ['存储权限：用于保存视频或读取相册素材。', '相机 / 麦克风：用于拍摄短视频。']
    },
    {
        id: 'sdk',
        title: '三、我们如何共享你的个人信息（第三方 SDK 清单）',
        paragraphs: ['为保障应用运行，我们嵌入了第三方 SDK。以下为《第三方共享个人信息清单》。'],
        items: [
            '阿里云：用于存储和读取视频、图片等信息，并可能收集崩溃日志。',
            '友盟：用于页面跳转、埋点记录等用户操作信息。',
            '个推：用于一键登录和消息推送。'
        ]
    },
    {
        id: 'rights',
        title: '四、你如何管理个人信息',
        paragraphs: ['你可以根据产品提供的功能入口或设备系统设置对你的个人信息及授权进行管理。'],
        items: ['撤回同意：你可以通过手机的隐私中心来撤回你的授权。', '查阅：你可以在“个人中心”查看你的个人资料。']
    },
    {
        id: 'minor',
        title: '五、儿童个人信息保护',
        paragraphs: [
            '本应用主要面向成人。若你是未成年人，请在监护人指导下阅读本政策。',
            '对于经监护人同意而收集的儿童个人信息，我们只会在法律允许、监护人明确同意或者保护儿童所必要的情况下进行处理。'
        ],
        items: []
    }
] as const

onMounted(() => {
    document.title = '隐私政策'
})
</script>

<style scoped lang="scss">
.legal-page {
    min-height: 100vh;
    background-color: var(--el-bg-color-page);
    background-image: linear-gradient(180deg, color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color-page)) 0%, var(--el-bg-color-page) 300px);
    color: var(--el-text-color-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', STHeiti, 'Microsoft Yahei', Tahoma, Simsun, sans-serif;
    padding-bottom: 40px;
}

.legal-hero {
    padding: 40px 20px 24px;
    display: flex;
    justify-content: center;
}

.hero-inner {
    max-width: 800px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.eyebrow {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 16px;
}

.hero-title {
    font-size: clamp(28px, 6vw, 36px);
    font-weight: 800;
    margin: 0 0 16px;
    color: var(--el-text-color-primary);
    line-height: 1.3;
}

.hero-summary {
    font-size: 15px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
    margin: 0 0 24px;
    max-width: 600px;
}

.hero-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    width: 100%;
}

.meta-tag {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    padding: 6px 12px;
    border-radius: 8px;
}

.legal-main {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
}

.toc-panel {
    position: sticky;
    top: 0;
    z-index: 50;
    margin: 0 -20px 20px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(html.dark) .toc-panel {
    background: rgba(20, 20, 20, 0.85);
}

.toc-card {
    display: flex;
    overflow-x: auto;
    gap: 10px;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
        display: none;
    }
}

.toc-link {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    text-decoration: none;
    padding: 8px 16px;
    background: var(--el-fill-color-light);
    border-radius: 20px;
    transition: all 0.2s ease;
    border: 1px solid transparent;

    &:active,
    &:hover {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-5);
    }
}

.content-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.content-card {
    background: var(--el-bg-color);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    border: 1px solid var(--el-border-color-lighter);
    scroll-margin-top: 80px;
}

.section-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px dashed var(--el-border-color-lighter);
}

.section-badge {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 30%, transparent);

    :deep(svg) {
        font-size: 16px;
    }
}

.section-head h2 {
    font-size: 18px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0;
}

.section-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.section-paragraph {
    font-size: 15px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
    margin: 0;
    text-align: justify;
}

.section-list {
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--el-fill-color-light);
    padding: 16px;
    border-radius: 12px;
}

.section-list li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-regular);

    .list-icon {
        margin-top: 2px;
        font-size: 16px;
        color: var(--el-color-primary);
        flex-shrink: 0;
    }
}

.contact-grid {
    margin-top: 4px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.contact-item {
    padding: 16px;
    border-radius: 16px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.contact-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.contact-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.4;
}

@media (max-width: 480px) {
    .legal-hero {
        padding: 30px 16px 20px;
    }

    .hero-title {
        font-size: 26px;
    }

    .hero-summary {
        font-size: 14px;
        text-align: left;
    }

    .hero-meta {
        justify-content: flex-start;
    }

    .legal-main {
        padding: 0 16px;
    }

    .toc-panel {
        margin: 0 -16px 16px;
        padding: 12px 16px;
    }

    .content-card {
        padding: 20px 16px;
        border-radius: 16px;
    }

    .section-head h2 {
        font-size: 17px;
    }

    .section-paragraph {
        font-size: 14px;
    }

    .section-list {
        padding: 12px;
    }

    .contact-grid {
        grid-template-columns: 1fr;
    }
}
</style>
