<template>
    <div class="legal-page">
        <div class="legal-hero">
            <div class="hero-inner">
                <div class="eyebrow">USER AGREEMENT</div>
                <h1 class="hero-title">用户协议</h1>
                <p class="hero-summary">
                    本协议适用于 {{ serviceName }} 移动应用程序。为保障你与平台双方的合法权益，请在使用服务前认真阅读并充分理解本协议内容。
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
            </main>
        </div>
    </div>
</template>

<script setup name="ViewsH5Agreement" lang="ts">
import { onMounted } from 'vue'

const serviceName = '职场吧'
const version = 'v1.0'
const effectiveDate = '2026年3月11日'
const updatedAt = '2026年3月11日'

const sections = [
    {
        id: 'general',
        title: '一、协议范围',
        paragraphs: [
            '本《用户协议》是你与职场吧之间就你下载、安装、注册、登录、使用职场吧产品及相关服务所订立的协议。',
            '你在注册、登录、访问或使用本产品前，应当认真阅读并理解本协议全部内容；一旦你使用本产品，即视为你已同意接受本协议约束。'
        ],
        items: []
    },
    {
        id: 'account',
        title: '二、账号注册与使用',
        paragraphs: [
            '你在注册和使用账号时，应保证提交的信息真实、准确、合法、有效，并及时更新。',
            '账号仅限你本人使用，请妥善保管账号信息及验证码、密码等身份验证资料。因你保管不善造成的损失，由你自行承担。'
        ],
        items: ['不得冒用他人身份注册账号。', '不得转让、出租、出借、售卖账号。', '如发现账号异常或被他人使用，请及时联系平台处理。']
    },
    {
        id: 'content',
        title: '三、内容发布规范',
        paragraphs: [
            '你在平台发布的文字、图片、视频、评论等内容，应当遵守法律法规、公序良俗及平台规则，不得制作、复制、发布、传播违法违规信息。',
            '平台有权依据法律法规及平台规则，对涉嫌违规的内容进行审核、删除、屏蔽、下架，并视情节对账号采取限制功能、禁言、封禁等措施。'
        ],
        items: [
            '不得发布虚假、诈骗、低俗、暴力、侵权、诽谤、违法内容。',
            '不得恶意刷量、作弊、批量发布垃圾信息或干扰平台正常运营。',
            '不得侵犯他人的知识产权、肖像权、名誉权、隐私权等合法权益。'
        ]
    },
    {
        id: 'rights',
        title: '四、平台服务与权利义务',
        paragraphs: [
            '平台将尽合理努力保障服务稳定、安全运行，但不对因不可抗力、网络故障、系统升级、第三方原因等导致的服务中断或数据异常承担责任。',
            '为持续优化体验，平台有权对产品功能、服务内容、运营策略进行调整。'
        ],
        items: [
            '平台有权根据监管要求、业务需要更新规则和功能。',
            '平台有权对违规账号和内容采取管理措施。',
            '用户有权按照平台提供的功能发布内容、管理资料、申请注销账号。'
        ]
    },
    {
        id: 'privacy',
        title: '五、隐私与个人信息保护',
        paragraphs: [
            '平台重视你的个人信息和隐私保护，具体规则详见《隐私政策》。',
            '当本协议与《隐私政策》存在不一致时，就个人信息处理事项以《隐私政策》为准。'
        ],
        items: []
    },
    {
        id: 'liability',
        title: '六、违约责任与协议变更',
        paragraphs: [
            '如你违反本协议或平台规则，平台有权视情节采取内容处置、限制功能、暂停服务、封禁账号等措施，并保留追究相关法律责任的权利。',
            '平台可根据法律法规、业务变化对本协议进行修订，修订后的协议将在相关页面公示；如你继续使用服务，视为接受修订后的协议。'
        ],
        items: []
    }
] as const

onMounted(() => {
    document.title = '用户协议'
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
}
</style>
