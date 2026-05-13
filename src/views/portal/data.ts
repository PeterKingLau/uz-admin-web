import { platformContact } from '@/config/contact'
import { normalizeLocale, type SupportLocale } from '@/locales'

export interface PortalMetric {
    label: string
    value: string
    trend: string
}

export interface PortalDataMetric {
    label: string
    value: string
    desc: string
    icon: string
}

export interface PortalHeroSlide {
    key: string
    topic: string
    title: string
    desc: string
    primaryText: string
    primaryHref: string
    secondaryText: string
    secondaryHref: string
    boardLabel: string
    boardStatus: string
    tone: string
    sideCards: Array<{ label: string; value: string }>
}

export interface PortalNewsItem {
    type: string
    date: string
    title: string
    desc: string
    href: string
}

export interface PortalCapabilityModule {
    title: string
    icon: string
    desc: string
    points: string[]
    action: string
    route: string
}

export interface PortalCapabilityShowcaseItem {
    key: string
    nav: string
    icon: string
    kicker: string
    title: string
    desc: string
    points: string[]
    visualTitle: string
    visualStatus: string
    tone: string
    stats: Array<{ label: string; value: string }>
    lines: string[]
}

export interface PortalWorkItem {
    rank: string
    title: string
    author: string
    competition: string
    score: string
    updateText: string
    activityText: string
}

export interface PortalSolutionItem {
    title: string
    desc: string
    points: string[]
    href: string
}

export interface PortalFlowStep {
    title: string
    desc: string
}

export interface PortalFooterGroup {
    title: string
    items: Array<{ label: string; href?: string; icon?: string }>
}

export interface PortalUiText {
    header: {
        brandName: string
        navAriaLabel: string
        appDownload: string
        goClient: string
        goConsole: string
        menuToggleAria: string
    }
    hero: {
        enter: string
        carouselAriaLabel: string
        slideAriaPrefix: string
        boardAriaLabel: string
        imageAlt: string
    }
    sections: {
        news: {
            title: string
            desc: string
            prevAriaLabel: string
            nextAriaLabel: string
            linkText: string
        }
        capability: {
            title: string
            desc: string
        }
        showcase: {
            title: string
            desc: string
            playState: string
            navAriaLabel: string
        }
        metrics: {
            title: string
            desc: string
        }
        work: {
            title: string
            desc: string
            consoleButton: string
            itemSeparator: string
        }
        solution: {
            title: string
            desc: string
            linkText: string
        }
        flow: {
            title: string
            desc: string
        }
        partners: {
            title: string
            desc: string
            ariaLabel: string
        }
        bottomCta: {
            title: string
            desc: string
            download: string
            enter: string
            contact: string
        }
    }
    footer: {
        brandName: string
        intro: string
        copyright: string
        icpText: string
    }
    appDialog: {
        closeAriaLabel: string
        title: string
        desc: string
        qrAriaLabel: string
        currentVersion: string
        latestVersion: string
    }
    messages: {
        versionUnavailable: string
        versionFailed: string
    }
}

export interface PortalMockData {
    metrics: PortalMetric[]
    flow: string[]
    updates: PortalNewsItem[]
    works: PortalWorkItem[]
    partners: string[]
}

export interface PortalDataBundle {
    ui: PortalUiText
    navItems: Array<{ label: string; href: string }>
    heroSlides: PortalHeroSlide[]
    capabilityModules: PortalCapabilityModule[]
    capabilityShowcaseItems: PortalCapabilityShowcaseItem[]
    dataMetrics: PortalDataMetric[]
    solutionItems: PortalSolutionItem[]
    flowSteps: PortalFlowStep[]
    footerGroups: PortalFooterGroup[]
    mockData: PortalMockData
}

function formatRecentDate(daysAgo: number) {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const commonRoutes = {
    discover: '/discover',
    publish: '/publish',
    console: '/login?redirect=/index',
    content: '#content-service',
    competition: '#competition',
    works: '#works',
    solutions: '#solutions',
    guide: '#guide',
    partners: '#partners',
    about: '#about',
    contact: '#contact',
    hero: '#hero'
}
const hiddenPortalRoutes = new Set<string>([commonRoutes.partners])

const portalData: Record<SupportLocale, Omit<PortalDataBundle, 'mockData'> & { updates: Omit<PortalNewsItem, 'date'>[]; metrics: PortalMetric[]; flow: string[]; works: Omit<PortalWorkItem, 'rank'>[]; partners: string[] }> = {
    'zh-CN': {
        ui: {
            header: {
                brandName: '职场吧',
                navAriaLabel: '门户导航',
                appDownload: '下载 APP',
                goClient: '进入客户端',
                goConsole: '管理端登录',
                menuToggleAria: '展开导航'
            },
            hero: {
                enter: '立即进入',
                carouselAriaLabel: '首屏轮播切换',
                slideAriaPrefix: '切换到',
                boardAriaLabel: '平台能力概览',
                imageAlt: '职场吧内容与活动运营界面示意图'
            },
            sections: {
                news: {
                    title: '近期动态',
                    desc: '展示活动招募、功能更新和创作者指南，帮助访客快速了解平台近期运营进展。',
                    prevAriaLabel: '上一组资讯',
                    nextAriaLabel: '下一组资讯',
                    linkText: '查看相关入口'
                },
                capability: {
                    title: '主要服务入口',
                    desc: '按日常使用路径整理入口：用户浏览内容，作者发布作品，运营人员处理活动和后台待办。'
                },
                showcase: {
                    title: '日常工作流',
                    desc: '把内容提交、活动推进和后台处理放在同一套工作节奏里。',
                    playState: '自动切换',
                    navAriaLabel: '平台能力导航'
                },
                metrics: {
                    title: '运营数据概览',
                    desc: '围绕内容沉淀、活动组织、作品提交、创作者维护和互动反馈，呈现平台当前的核心运营基础。'
                },
                work: {
                    title: '活动征集与投稿动态',
                    desc: '适合小规模征集、评选和展示场景，重点呈现活动进度、投稿更新和近期互动反馈。',
                    consoleButton: '进入运营控制台',
                    itemSeparator: '·'
                },
                solution: {
                    title: '常见使用场景',
                    desc: '围绕内容更新、活动征集、作者维护和后台协同，整理出几类常见用法。',
                    linkText: '查看入口'
                },
                flow: {
                    title: '接入步骤',
                    desc: '从入口选择到资料维护，尽量保持简单、明确、便于执行。'
                },
                partners: {
                    title: '生态合作伙伴',
                    desc: '连接内容机构、活动组织方、校园团队和服务伙伴，共同完善内容与活动运营生态。',
                    ariaLabel: '合作伙伴展示'
                },
                bottomCta: {
                    title: '从一个清晰入口开始运营职场吧',
                    desc: '先承接浏览、投稿和后台待办，再根据真实数据逐步扩展服务能力。',
                    download: '下载 APP',
                    enter: '进入职场吧',
                    contact: '联系合作'
                }
            },
            footer: {
                brandName: '职场吧',
                intro: '用于承接职场吧官网展示、客户端入口和运营后台入口。',
                copyright: 'Copyright © 2026 职场吧. All Rights Reserved.',
                icpText: '蜀ICP备2026006423号-1'
            },
            appDialog: {
                closeAriaLabel: '关闭下载弹窗',
                title: '职场吧',
                desc: '扫码下载 App，随时查看内容与活动进展',
                qrAriaLabel: 'APP 下载二维码',
                currentVersion: '当前版本 v{version}',
                latestVersion: '当前最新版本'
            },
            messages: {
                versionUnavailable: '最新版本下载地址暂不可用',
                versionFailed: '获取最新版本失败，请稍后重试'
            }
        },
        navItems: [
            { label: '首页', href: commonRoutes.hero },
            { label: '内容服务', href: commonRoutes.content },
            { label: '赛事活动', href: commonRoutes.competition },
            { label: '作品展示', href: commonRoutes.works },
            { label: '社区互动', href: commonRoutes.solutions },
            { label: '合作伙伴', href: commonRoutes.partners },
            { label: '联系我们', href: commonRoutes.contact },
            { label: '关于平台', href: commonRoutes.about }
        ],
        heroSlides: [
            {
                key: 'overview',
                topic: '首页',
                title: '把内容、活动和用户入口整理清晰',
                desc: '职场吧承接内容浏览、活动投稿、作品展示和后台审核，让早期运营不再依赖分散表格和临时沟通。',
                primaryText: '查看赛事',
                primaryHref: commonRoutes.competition,
                secondaryText: '查看服务入口',
                secondaryHref: commonRoutes.content,
                boardLabel: '运营工作台',
                boardStatus: '概览视图',
                tone: 'tone-blue',
                sideCards: [
                    { label: '活动链路', value: '征集、评选、结果公示' },
                    { label: '创作沉淀', value: '主页、合集、互动记录' }
                ]
            },
            {
                key: 'competition',
                topic: '赛事活动',
                title: '把活动流程拆成可跟进的节点',
                desc: '从报名、投稿到评选和结果公布，每个阶段都能看到当前状态，方便运营人员及时处理。',
                primaryText: '查看赛事',
                primaryHref: commonRoutes.competition,
                secondaryText: '运营方案',
                secondaryHref: commonRoutes.solutions,
                boardLabel: '活动进度',
                boardStatus: '征集中',
                tone: 'tone-cyan',
                sideCards: [
                    { label: '阶段管理', value: '报名、评选、公示节奏' },
                    { label: '复盘指标', value: '参与、浏览、有效互动' }
                ]
            },
            {
                key: 'works',
                topic: '作品展示',
                title: '让投稿资料更容易查看和复盘',
                desc: '作品封面、媒体资料、作者来源和互动记录集中展示，方便用户浏览，也方便后续推荐判断。',
                primaryText: '作品展示',
                primaryHref: commonRoutes.works,
                secondaryText: '进入发布',
                secondaryHref: commonRoutes.publish,
                boardLabel: '投稿动态',
                boardStatus: '持续更新',
                tone: 'tone-indigo',
                sideCards: [
                    { label: '媒体资料', value: '封面、视频、图文信息' },
                    { label: '展示状态', value: '审核、推荐、互动进展' }
                ]
            },
            {
                key: 'content',
                topic: '发现入口',
                title: '让发现页保持可维护的更新节奏',
                desc: '围绕标签、推荐位和主页内容整理信息，让用户能看到近期更新，也让编辑更容易维护栏目。',
                primaryText: '进入发现',
                primaryHref: commonRoutes.discover,
                secondaryText: '接入指南',
                secondaryHref: commonRoutes.guide,
                boardLabel: '发现页维护',
                boardStatus: '更新中',
                tone: 'tone-violet',
                sideCards: [
                    { label: '更新节奏', value: '标签、专题、推荐位维护' },
                    { label: '后台支撑', value: '审核、权限、基础数据' }
                ]
            }
        ],
        capabilityModules: [
            { title: '内容推荐', icon: 'mdi:compass-outline', desc: '承接发现页更新，让新内容、专题和标签入口更容易被用户看到。', points: ['推荐位维护', '标签聚合', '搜索浏览'], action: '进入发现', route: commonRoutes.discover },
            { title: '赛事活动', icon: 'mdi:trophy-outline', desc: '适合征集、评选、投票和公示等活动，帮助运营人员掌握每个阶段。', points: ['活动排期', '投稿入口', '结果公示'], action: '进入控制台', route: commonRoutes.console },
            { title: '作品展示', icon: 'mdi:image-multiple-outline', desc: '把投稿资料、作者来源、最近更新和互动反馈放在同一个展示面板里。', points: ['投稿动态', '媒体预览', '互动状态'], action: '查看方案', route: commonRoutes.works },
            { title: '创作者中心', icon: 'mdi:account-star-outline', desc: '帮助创作者维护主页资料、归档作品，并持续接收用户反馈。', points: ['主页资料', '作品合集', '反馈沉淀'], action: '开始发布', route: commonRoutes.publish },
            { title: '运营管理', icon: 'mdi:view-dashboard-outline', desc: '覆盖审核、权限、基础资料和活动配置，满足日常后台维护需要。', points: ['审核待办', '权限角色', '资料维护'], action: '管理端登录', route: commonRoutes.console }
        ],
        capabilityShowcaseItems: [
            { key: 'content', nav: '内容服务', icon: 'mdi:compass-outline', kicker: '内容流转', title: '从发布到推荐，减少内容流转成本', desc: '编辑、标签、媒体资料与审核结果放在同一流程里，方便小团队保持稳定更新。', points: ['图文与视频资料维护', '标签匹配和推荐位管理', '审核、上下架和日常巡检'], visualTitle: '发布协同台', visualStatus: '今日更新', tone: 'tone-blue', stats: [{ label: '入库稿件', value: '186' }, { label: '今日更新', value: '7' }, { label: '待处理', value: '12' }], lines: ['资料提交', '标签整理', '推荐位维护', '互动回看'] },
            { key: 'event', nav: '赛事活动', icon: 'mdi:trophy-outline', kicker: '活动跟进', title: '活动进度、报名情况和结果公示同步推进', desc: '每场活动都能明确当前阶段、参与作品和后续动作，降低临时人工统计压力。', points: ['基础信息与时间节点', '投稿报名与评选记录', '结果公示和活动复盘'], visualTitle: '活动排期板', visualStatus: '征集中', tone: 'tone-cyan', stats: [{ label: '征集中', value: '6' }, { label: '报名作品', value: '54' }, { label: '今日互动', value: '32' }], lines: ['活动创建', '作品报名', '评选互动', '结果公示'] },
            { key: 'works', nav: '作品展示', icon: 'mdi:image-multiple-outline', kicker: '作品管理', title: '每条投稿都有可追踪的展示状态', desc: '运营人员可以看到作品来源、最近更新和当前反馈，避免只依赖单一票数判断质量。', points: ['封面、视频和图文预览', '更新频率与互动状态', '作者主页和作品关联'], visualTitle: '投稿观察窗', visualStatus: '动态滚动', tone: 'tone-indigo', stats: [{ label: '展示作品', value: '86' }, { label: '视频作品', value: '18' }, { label: '待推荐', value: '9' }], lines: ['封面检查', '作品详情', '互动记录', '作者主页'] },
            { key: 'creator', nav: '创作者生态', icon: 'mdi:account-star-outline', kicker: '作者主页', title: '把主页、合集和互动沉淀为作者资产', desc: '让创作者逐步积累主页内容、作品集合和用户反馈，不只是一次性提交作品。', points: ['个人主页资料展示', '合集和阶段性作品归档', '关注、收藏与评论反馈'], visualTitle: '作者成长视图', visualStatus: '持续积累', tone: 'tone-violet', stats: [{ label: '活跃作者', value: '58' }, { label: '内容合集', value: '24' }, { label: '回访率', value: '31%' }], lines: ['主页访问', '作品归档', '用户反馈', '合集维护'] },
            { key: 'console', nav: '运营管理', icon: 'mdi:view-dashboard-outline', kicker: '后台协同', title: '让后台处理更像日常工作流', desc: '审核、活动配置、用户权限和基础数据维护放在稳定的管理端里，减少临时表格和人工传递。', points: ['审核任务与状态维护', '活动配置和作品处理', '用户、角色和权限治理'], visualTitle: '后台待办台', visualStatus: '有序处理', tone: 'tone-slate', stats: [{ label: '待办任务', value: '18' }, { label: '业务模块', value: '9' }, { label: '权限角色', value: '6' }], lines: ['任务进入', '审核流转', '权限校验', '资料维护'] }
        ],
        dataMetrics: [
            { label: '内容沉淀', value: '620+', desc: '覆盖图文、视频、专题与活动相关内容', icon: 'mdi:file-document-outline' },
            { label: '活动项目', value: '12', desc: '包含征集、评选、公示等运营活动', icon: 'mdi:trophy-outline' },
            { label: '作品资料', value: '180+', desc: '沉淀可展示、可审核、可复盘的投稿作品', icon: 'mdi:image-multiple-outline' },
            { label: '创作者主页', value: '86', desc: '已维护主页资料与作品归档的创作者', icon: 'mdi:account-star-outline' },
            { label: '互动反馈', value: '1,800+', desc: '关注、收藏、评论等用户行为累计', icon: 'mdi:chart-line' }
        ],
        solutionItems: [
            { title: '发现页更新方案', desc: '适合需要保持栏目更新、专题沉淀和标签分发的内容团队。', points: ['资料入库', '栏目维护', '互动回看'], href: commonRoutes.content },
            { title: '活动征集方案', desc: '支持从活动配置、投稿收集到结果发布的完整流程。', points: ['阶段设置', '投稿管理', '结果公示'], href: commonRoutes.competition },
            { title: '创作者成长方案', desc: '围绕主页资料、作品合集和反馈记录，让作者成长过程可见。', points: ['主页展示', '作品归档', '反馈记录'], href: commonRoutes.content },
            { title: '社区互动方案', desc: '连接发现页、圈子、评论与收藏，帮助早期用户形成回访习惯。', points: ['发现入口', '收藏点赞', '评论反馈'], href: commonRoutes.solutions },
            { title: '后台协同方案', desc: '通过清晰的待办、权限和资料维护减少重复沟通。', points: ['用户管理', '审核流程', '权限治理'], href: commonRoutes.guide }
        ],
        flowSteps: [
            { title: '进入对应入口', desc: '普通用户进入客户端，运营人员进入管理端。' },
            { title: '配置栏目或活动', desc: '整理基础资料，设置展示位置、时间节点和参与规则。' },
            { title: '提交与审核', desc: '创作者提交图文或视频，后台完成审核和状态维护。' },
            { title: '复盘更新节奏', desc: '根据浏览、互动和投稿情况调整后续推荐与活动安排。' }
        ],
        footerGroups: [],
        metrics: [
            { label: '累计内容', value: '620+', trend: '本周新增 18' },
            { label: '进行中赛事', value: '8', trend: '2 个即将截止' },
            { label: '参赛作品', value: '180+', trend: '今日新增 6' },
            { label: '创作者', value: '86', trend: '24 位近期活跃' }
        ],
        flow: ['推荐位与话题维护', '活动投稿审核', '作者主页回访'],
        updates: [
            { type: '赛事', title: '城市职业故事影像征集启动', desc: '面向职场创作者开放视频、图文投稿，入选作品将获得推荐位展示。', href: commonRoutes.competition },
            { type: '推荐', title: '发现页新增兴趣标签聚合', desc: '根据关注、收藏和浏览行为整理入口，让用户更快找到相关话题。', href: commonRoutes.content },
            { type: '公告', title: '审核工作台完成视觉统一', desc: '待办、状态和处理结果集中呈现，减少后台页面之间的切换。', href: commonRoutes.solutions },
            { type: '指南', title: '视频封面截取指南更新', desc: '支持自动首帧和手动选帧，降低发布视频时的封面处理成本。', href: commonRoutes.guide },
            { type: '活动', title: '创作者成长计划开放报名', desc: '围绕主页维护、作品归档和互动反馈，提供更清晰的成长路径。', href: commonRoutes.guide },
            { type: '运营', title: '作品观察面板完成升级', desc: '新增更新时间、互动状态和展示进展，便于判断后续推荐优先级。', href: commonRoutes.works }
        ],
        works: [
            { title: '城市职业故事影像', author: '创作者 A', competition: '职场影像季', score: '18 票', updateText: '刚刚更新', activityText: '有新评论' },
            { title: '团队协作实践分享', author: '创作者 B', competition: '高效团队挑战', score: '16 票', updateText: '12 分钟前更新', activityText: '进入待推荐' },
            { title: '岗位成长路线图', author: '创作者 C', competition: '成长经验征集', score: '15 票', updateText: '28 分钟前更新', activityText: '等待复审' },
            { title: '我的第一份项目复盘', author: '创作者 D', competition: '新人实践计划', score: '13 票', updateText: '1 小时内更新', activityText: '封面已优化' },
            { title: '职场效率工具清单', author: '创作者 E', competition: '内容创作周', score: '12 票', updateText: '今日新增互动', activityText: '作者已补充说明' },
            { title: '新人入职观察日记', author: '创作者 F', competition: '社区共创活动', score: '11 票', updateText: '今日完成审核', activityText: '内容持续完善' }
        ],
        partners: ['青蓝内容工坊', '星火活动中心', '知行校园社', '云舫运营服务', '森合创作者联盟', '启程赛事组委会', '北辰企业服务', '微光职业社群']
    },
    'zh-TW': {} as any,
    'en-US': {} as any
}

portalData['zh-TW'] = {
    ...portalData['zh-CN'],
    ui: {
        header: {
            brandName: '職場吧',
            navAriaLabel: '門戶導覽',
            appDownload: '下載 APP',
            goClient: '進入客戶端',
            goConsole: '管理端登入',
            menuToggleAria: '展開導覽'
        },
        hero: {
            enter: '立即進入',
            carouselAriaLabel: '首屏輪播切換',
            slideAriaPrefix: '切換到',
            boardAriaLabel: '平台能力概覽',
            imageAlt: '職場吧內容與活動營運介面示意圖'
        },
        sections: {
            news: {
                title: '近期動態',
                desc: '展示活動招募、功能更新和創作者指南，協助訪客快速了解平台近期營運進展。',
                prevAriaLabel: '上一組資訊',
                nextAriaLabel: '下一組資訊',
                linkText: '查看相關入口'
            },
            capability: {
                title: '主要服務入口',
                desc: '按日常使用路徑整理入口：使用者瀏覽內容，作者發布作品，營運人員處理活動和後台待辦。'
            },
            showcase: {
                title: '日常工作流',
                desc: '把內容提交、活動推進和後台處理放在同一套工作節奏裡。',
                playState: '自動切換',
                navAriaLabel: '平台能力導覽'
            },
            metrics: {
                title: '營運數據概覽',
                desc: '圍繞內容沉澱、活動組織、作品提交、創作者維護和互動回饋，呈現平台目前的核心營運基礎。'
            },
            work: {
                title: '活動徵集與投稿動態',
                desc: '適合小規模徵集、評選和展示場景，重點呈現活動進度、投稿更新和近期互動回饋。',
                consoleButton: '進入營運控制台',
                itemSeparator: '·'
            },
            solution: {
                title: '常見使用場景',
                desc: '圍繞內容更新、活動徵集、作者維護和後台協同，整理出幾類常見用法。',
                linkText: '查看入口'
            },
            flow: {
                title: '接入步驟',
                desc: '從入口選擇到資料維護，盡量保持簡單、明確、便於執行。'
            },
            partners: {
                title: '生態合作夥伴',
                desc: '連接內容機構、活動組織方、校園團隊和服務夥伴，共同完善內容與活動營運生態。',
                ariaLabel: '合作夥伴展示'
            },
            bottomCta: {
                title: '從一個清晰入口開始營運職場吧',
                desc: '先承接瀏覽、投稿和後台待辦，再根據真實數據逐步擴展服務能力。',
                download: '下載 APP',
                enter: '進入職場吧',
                contact: '聯絡合作'
            }
        },
        footer: {
            brandName: '職場吧',
            intro: '用於承接職場吧官網展示、客戶端入口和營運後台入口。',
            copyright: 'Copyright © 2026 職場吧. All Rights Reserved.',
            icpText: '蜀ICP備2026006423號-1'
        },
        appDialog: {
            closeAriaLabel: '關閉下載彈窗',
            title: '職場吧',
            desc: '掃碼下載 App，隨時查看內容與活動進展',
            qrAriaLabel: 'APP 下載 QR Code',
            currentVersion: '目前版本 v{version}',
            latestVersion: '目前最新版本'
        },
        messages: {
            versionUnavailable: '最新版本下載地址暫不可用',
            versionFailed: '取得最新版本失敗，請稍後重試'
        }
    },
    navItems: [
        { label: '首頁', href: commonRoutes.hero },
        { label: '內容服務', href: commonRoutes.content },
        { label: '賽事活動', href: commonRoutes.competition },
        { label: '作品展示', href: commonRoutes.works },
        { label: '社群互動', href: commonRoutes.solutions },
        { label: '合作夥伴', href: commonRoutes.partners },
        { label: '聯絡我們', href: commonRoutes.contact },
        { label: '關於平台', href: commonRoutes.about }
    ],
    heroSlides: [
        { ...portalData['zh-CN'].heroSlides[0], topic: '首頁', title: '把內容、活動和使用者入口整理清楚', desc: '職場吧承接內容瀏覽、活動投稿、作品展示和後台審核，讓早期營運不再依賴分散表格和臨時溝通。', primaryText: '查看賽事', secondaryText: '查看服務入口', boardLabel: '營運工作台', boardStatus: '概覽視圖', sideCards: [{ label: '活動鏈路', value: '徵集、評選、結果公示' }, { label: '創作沉澱', value: '主頁、合集、互動記錄' }] },
        { ...portalData['zh-CN'].heroSlides[1], topic: '賽事活動', title: '把活動流程拆成可跟進的節點', desc: '從報名、投稿到評選和結果公布，每個階段都能看到目前狀態，方便營運人員及時處理。', primaryText: '查看賽事', secondaryText: '營運方案', boardLabel: '活動進度', boardStatus: '徵集中', sideCards: [{ label: '階段管理', value: '報名、評選、公示節奏' }, { label: '復盤指標', value: '參與、瀏覽、有效互動' }] },
        { ...portalData['zh-CN'].heroSlides[2], topic: '作品展示', title: '讓投稿資料更容易查看和復盤', desc: '作品封面、媒體資料、作者來源和互動記錄集中展示，方便使用者瀏覽，也方便後續推薦判斷。', primaryText: '作品展示', secondaryText: '進入發布', boardLabel: '投稿動態', boardStatus: '持續更新', sideCards: [{ label: '媒體資料', value: '封面、影片、圖文資訊' }, { label: '展示狀態', value: '審核、推薦、互動進展' }] },
        { ...portalData['zh-CN'].heroSlides[3], topic: '發現入口', title: '讓發現頁保持可維護的更新節奏', desc: '圍繞標籤、推薦位和主頁內容整理資訊，讓使用者能看到近期更新，也讓編輯更容易維護欄目。', primaryText: '進入發現', secondaryText: '接入指南', boardLabel: '發現頁維護', boardStatus: '更新中', sideCards: [{ label: '更新節奏', value: '標籤、專題、推薦位維護' }, { label: '後台支撐', value: '審核、權限、基礎資料' }] }
    ],
    metrics: [
        { label: '累計內容', value: '620+', trend: '本週新增 18' },
        { label: '進行中賽事', value: '8', trend: '2 個即將截止' },
        { label: '參賽作品', value: '180+', trend: '今日新增 6' },
        { label: '創作者', value: '86', trend: '24 位近期活躍' }
    ],
    flow: ['推薦位與話題維護', '活動投稿審核', '作者主頁回訪'],
    partners: ['青藍內容工坊', '星火活動中心', '知行校園社', '雲舫營運服務', '森合創作者聯盟', '啟程賽事組委會', '北辰企業服務', '微光職業社群']
}

portalData['en-US'] = {
    ...portalData['zh-CN'],
    ui: {
        header: {
            brandName: 'ZhiChangBa',
            navAriaLabel: 'Portal navigation',
            appDownload: 'Download App',
            goClient: 'Open Client',
            goConsole: 'Admin Login',
            menuToggleAria: 'Open navigation'
        },
        hero: {
            enter: 'Enter Now',
            carouselAriaLabel: 'Hero carousel',
            slideAriaPrefix: 'Switch to',
            boardAriaLabel: 'Platform capability overview',
            imageAlt: 'ZhiChangBa content and activity operations interface preview'
        },
        sections: {
            news: {
                title: 'Latest Updates',
                desc: 'Recent activity openings, product updates, and creator guidance for visitors to understand current platform progress.',
                prevAriaLabel: 'Previous updates',
                nextAriaLabel: 'Next updates',
                linkText: 'View Entry'
            },
            capability: {
                title: 'Primary Service Entries',
                desc: 'Entry points are organized by everyday use: users browse content, creators publish works, and operators handle activities and admin tasks.'
            },
            showcase: {
                title: 'Operational Workflow',
                desc: 'Content submission, activity progress, and admin processing are presented in one consistent working rhythm.',
                playState: 'Auto Playing',
                navAriaLabel: 'Capability navigation'
            },
            metrics: {
                title: 'Operations Overview',
                desc: 'A concise view of current operational foundations across content assets, activities, submissions, creators, and engagement.'
            },
            work: {
                title: 'Activity Submissions',
                desc: 'Designed for small-scale collections, reviews, and showcases, with focus on activity progress, submissions, and recent engagement.',
                consoleButton: 'Open Operations Console',
                itemSeparator: '·'
            },
            solution: {
                title: 'Common Use Cases',
                desc: 'Practical scenarios around content updates, activity collection, creator maintenance, and admin collaboration.',
                linkText: 'View Entry'
            },
            flow: {
                title: 'Onboarding Steps',
                desc: 'From choosing an entry to maintaining data, the workflow stays clear, simple, and executable.'
            },
            partners: {
                title: 'Ecosystem Partners',
                desc: 'Connect content organizations, event operators, campus teams, and service partners to support content and activity operations.',
                ariaLabel: 'Partner showcase'
            },
            bottomCta: {
                title: 'Start operating ZhiChangBa from a clear entry point',
                desc: 'Support browsing, submissions, and admin tasks first, then expand capabilities based on real operational data.',
                download: 'Download App',
                enter: 'Open ZhiChangBa',
                contact: 'Contact Us'
            }
        },
        footer: {
            brandName: 'ZhiChangBa',
            intro: 'The official portal for product presentation, client access, and operations console entry.',
            copyright: 'Copyright © 2026 ZhiChangBa. All Rights Reserved.',
            icpText: 'Shu ICP No. 2026006423-1'
        },
        appDialog: {
            closeAriaLabel: 'Close download dialog',
            title: 'ZhiChangBa',
            desc: 'Scan to download the app and check content and activity progress anytime.',
            qrAriaLabel: 'App download QR code',
            currentVersion: 'Current version v{version}',
            latestVersion: 'Latest version'
        },
        messages: {
            versionUnavailable: 'The latest version download link is unavailable.',
            versionFailed: 'Failed to get the latest version. Please try again later.'
        }
    },
    navItems: [
        { label: 'Home', href: commonRoutes.hero },
        { label: 'Content', href: commonRoutes.content },
        { label: 'Events', href: commonRoutes.competition },
        { label: 'Works', href: commonRoutes.works },
        { label: 'Community', href: commonRoutes.solutions },
        { label: 'Partners', href: commonRoutes.partners },
        { label: 'Contact', href: commonRoutes.contact },
        { label: 'About', href: commonRoutes.about }
    ],
    heroSlides: [
        { ...portalData['zh-CN'].heroSlides[0], topic: 'Home', title: 'Organize content, activities, and user entry points', desc: 'ZhiChangBa connects content browsing, activity submissions, work showcases, and operational review in one clear portal.', primaryText: 'View events', secondaryText: 'View services', boardLabel: 'Operations desk', boardStatus: 'Overview', sideCards: [{ label: 'Activity flow', value: 'Collection and results' }, { label: 'Creator assets', value: 'Profiles and records' }] },
        { ...portalData['zh-CN'].heroSlides[1], topic: 'Events', title: 'Break activity operations into trackable stages', desc: 'From registration and submission to review and result publishing, each stage has a clear status for operators.', primaryText: 'View events', secondaryText: 'Use cases', boardLabel: 'Event progress', boardStatus: 'Collecting', sideCards: [{ label: 'Stage control', value: 'Registration and review' }, { label: 'Review metrics', value: 'Views and engagement' }] },
        { ...portalData['zh-CN'].heroSlides[2], topic: 'Works', title: 'Make submissions easier to view and review', desc: 'Covers, media assets, creator sources, and engagement records are presented together for browsing and follow-up recommendations.', primaryText: 'View works', secondaryText: 'Start publishing', boardLabel: 'Submission updates', boardStatus: 'Updating', sideCards: [{ label: 'Media assets', value: 'Covers and videos' }, { label: 'Display status', value: 'Review and engagement' }] },
        { ...portalData['zh-CN'].heroSlides[3], topic: 'Discovery', title: 'Keep the discovery feed maintainable', desc: 'Tags, featured positions, and profile content are organized so users can see recent updates and editors can maintain sections efficiently.', primaryText: 'Open discovery', secondaryText: 'Guide', boardLabel: 'Discovery maintenance', boardStatus: 'Updating', sideCards: [{ label: 'Update rhythm', value: 'Tags and topics' }, { label: 'Admin support', value: 'Review and permissions' }] }
    ],
    capabilityModules: [
        { title: 'Content Feed', icon: 'mdi:compass-outline', desc: 'Maintain discovery updates and make new content, topics, and tags easier to find.', points: ['Featured slots', 'Tag grouping', 'Search and browse'], action: 'Open discovery', route: commonRoutes.discover },
        { title: 'Events', icon: 'mdi:trophy-outline', desc: 'Support collection, review, voting, and result publishing workflows.', points: ['Schedule', 'Submission entry', 'Result publishing'], action: 'Open console', route: commonRoutes.console },
        { title: 'Work Showcase', icon: 'mdi:image-multiple-outline', desc: 'Present submissions, creator sources, recent updates, and engagement feedback together.', points: ['Submission updates', 'Media preview', 'Engagement status'], action: 'View plan', route: commonRoutes.works },
        { title: 'Creator Center', icon: 'mdi:account-star-outline', desc: 'Help creators maintain profiles, archive works, and collect user feedback.', points: ['Profile data', 'Work collections', 'Feedback records'], action: 'Start publishing', route: commonRoutes.publish },
        { title: 'Operations', icon: 'mdi:view-dashboard-outline', desc: 'Cover review, permissions, base data, and activity configuration for daily work.', points: ['Review tasks', 'Roles', 'Data maintenance'], action: 'Admin login', route: commonRoutes.console }
    ],
    capabilityShowcaseItems: [
        {
            key: 'content',
            nav: 'Content',
            icon: 'mdi:compass-outline',
            kicker: 'Content Flow',
            title: 'Reduce operational cost from publishing to recommendation',
            desc: 'Editors, tags, media assets, and review results stay in one workflow, helping a small team maintain a stable update rhythm.',
            points: ['Maintain articles and videos', 'Manage tags and featured slots', 'Review, publish, and inspect content'],
            visualTitle: 'Publishing Desk',
            visualStatus: 'Updated Today',
            tone: 'tone-blue',
            stats: [
                { label: 'Content Items', value: '186' },
                { label: 'Updated Today', value: '7' },
                { label: 'Pending', value: '12' }
            ],
            lines: ['Asset submission', 'Tag organization', 'Featured slot maintenance', 'Engagement review']
        },
        {
            key: 'event',
            nav: 'Events',
            icon: 'mdi:trophy-outline',
            kicker: 'Activity Tracking',
            title: 'Move event progress, submissions, and results in sync',
            desc: 'Each event has a clear current stage, participating works, and follow-up actions, reducing temporary manual statistics.',
            points: ['Basic information and schedules', 'Submission and review records', 'Result publishing and event review'],
            visualTitle: 'Event Schedule',
            visualStatus: 'Collecting',
            tone: 'tone-cyan',
            stats: [
                { label: 'Collecting', value: '6' },
                { label: 'Submissions', value: '54' },
                { label: 'Engagement Today', value: '32' }
            ],
            lines: ['Create event', 'Collect submissions', 'Review interaction', 'Publish results']
        },
        {
            key: 'works',
            nav: 'Works',
            icon: 'mdi:image-multiple-outline',
            kicker: 'Work Management',
            title: 'Give each submission a trackable display status',
            desc: 'Operators can view source, recent updates, and current feedback, instead of judging quality only by a single vote count.',
            points: ['Preview covers, videos, and articles', 'Review update frequency and engagement', 'Connect creators with submitted works'],
            visualTitle: 'Submission View',
            visualStatus: 'Live Updates',
            tone: 'tone-indigo',
            stats: [
                { label: 'Visible Works', value: '86' },
                { label: 'Video Works', value: '18' },
                { label: 'To Recommend', value: '9' }
            ],
            lines: ['Cover check', 'Work details', 'Engagement record', 'Creator profile']
        },
        {
            key: 'creator',
            nav: 'Creators',
            icon: 'mdi:account-star-outline',
            kicker: 'Creator Profiles',
            title: 'Turn profiles, collections, and feedback into creator assets',
            desc: 'Creators can accumulate profile content, work collections, and user feedback over time instead of making one-off submissions.',
            points: ['Display creator profile data', 'Archive collections and staged works', 'Collect follows, favorites, and comments'],
            visualTitle: 'Creator Growth',
            visualStatus: 'Accumulating',
            tone: 'tone-violet',
            stats: [
                { label: 'Active Creators', value: '58' },
                { label: 'Collections', value: '24' },
                { label: 'Return Rate', value: '31%' }
            ],
            lines: ['Profile visits', 'Work archiving', 'User feedback', 'Collection maintenance']
        },
        {
            key: 'console',
            nav: 'Operations',
            icon: 'mdi:view-dashboard-outline',
            kicker: 'Admin Collaboration',
            title: 'Make admin processing work like a daily workflow',
            desc: 'Review, activity configuration, permissions, and base data maintenance are handled in a stable admin console to reduce ad-hoc spreadsheets.',
            points: ['Maintain review tasks and status', 'Configure activities and process works', 'Manage users, roles, and permissions'],
            visualTitle: 'Admin Tasks',
            visualStatus: 'In Progress',
            tone: 'tone-slate',
            stats: [
                { label: 'Pending Tasks', value: '18' },
                { label: 'Modules', value: '9' },
                { label: 'Roles', value: '6' }
            ],
            lines: ['Task intake', 'Review flow', 'Permission check', 'Data maintenance']
        }
    ],
    dataMetrics: [
        { label: 'Content assets', value: '620+', desc: 'Articles, videos, topics, and activity-related content', icon: 'mdi:file-document-outline' },
        { label: 'Activities', value: '12', desc: 'Collection, review, and result publishing activities', icon: 'mdi:trophy-outline' },
        { label: 'Work records', value: '180+', desc: 'Submissions available for display, review, and follow-up', icon: 'mdi:image-multiple-outline' },
        { label: 'Creator profiles', value: '86', desc: 'Creators with maintained profiles and archived works', icon: 'mdi:account-star-outline' },
        { label: 'Engagement', value: '1,800+', desc: 'Follows, favorites, comments, and related user actions', icon: 'mdi:chart-line' }
    ],
    solutionItems: [
        { title: 'Discovery update plan', desc: 'For teams maintaining sections, topics, and tag distribution.', points: ['Asset intake', 'Section maintenance', 'Engagement review'], href: commonRoutes.content },
        { title: 'Activity collection plan', desc: 'From activity setup and submission intake to result publishing.', points: ['Stage setup', 'Submission management', 'Results'], href: commonRoutes.competition },
        { title: 'Creator growth plan', desc: 'Make creator profiles, work collections, and feedback records visible.', points: ['Profiles', 'Archives', 'Feedback'], href: commonRoutes.content },
        { title: 'Community interaction plan', desc: 'Connect discovery, circles, comments, and favorites for early retention.', points: ['Discovery entry', 'Favorites', 'Comments'], href: commonRoutes.solutions },
        { title: 'Admin collaboration plan', desc: 'Reduce repeated communication through clear tasks, permissions, and data maintenance.', points: ['Users', 'Review flow', 'Permissions'], href: commonRoutes.guide }
    ],
    flowSteps: [
        { title: 'Choose an entry', desc: 'Users enter the client side; operators enter the admin console.' },
        { title: 'Configure sections or events', desc: 'Prepare base data, display positions, schedules, and participation rules.' },
        { title: 'Submit and review', desc: 'Creators submit articles or videos; admins maintain review status.' },
        { title: 'Review update rhythm', desc: 'Adjust recommendations and activities based on browsing, engagement, and submissions.' }
    ],
    metrics: [
        { label: 'Content', value: '620+', trend: '+18 this week' },
        { label: 'Active events', value: '8', trend: '2 closing soon' },
        { label: 'Submissions', value: '180+', trend: '+6 today' },
        { label: 'Creators', value: '86', trend: '24 active recently' }
    ],
    flow: ['Featured topics', 'Submission review', 'Creator profile revisit'],
    updates: [
        { type: 'Event', title: 'Workplace Story Collection opens', desc: 'Video and article submissions are open for workplace creators, with selected works displayed in featured slots.', href: commonRoutes.competition },
        { type: 'Feed', title: 'Discovery adds interest tag groups', desc: 'Entries are organized by follows, favorites, and browsing behavior to help users find related topics faster.', href: commonRoutes.content },
        { type: 'Notice', title: 'Review console visual update completed', desc: 'Tasks, status, and results are now presented together to reduce admin switching.', href: commonRoutes.solutions },
        { type: 'Guide', title: 'Video cover guide updated', desc: 'Automatic first-frame and manual frame selection reduce publishing overhead.', href: commonRoutes.guide },
        { type: 'Activity', title: 'Creator Growth Program opens', desc: 'A clearer growth path around profiles, archives, and engagement feedback.', href: commonRoutes.guide },
        { type: 'Ops', title: 'Work insight panel upgraded', desc: 'Adds update time, engagement status, and display progress for recommendation decisions.', href: commonRoutes.works }
    ],
    works: [
        { title: 'Urban Workplace Stories', author: 'Creator A', competition: 'Workplace Video Season', score: '18 votes', updateText: 'Updated just now', activityText: 'New comment' },
        { title: 'Team Collaboration Practice', author: 'Creator B', competition: 'Efficient Team Challenge', score: '16 votes', updateText: 'Updated 12 min ago', activityText: 'Pending recommendation' },
        { title: 'Career Growth Roadmap', author: 'Creator C', competition: 'Growth Experience Collection', score: '15 votes', updateText: 'Updated 28 min ago', activityText: 'Waiting for review' },
        { title: 'My First Project Review', author: 'Creator D', competition: 'Newcomer Practice Plan', score: '13 votes', updateText: 'Updated within 1 hour', activityText: 'Cover optimized' },
        { title: 'Workplace Efficiency Tools', author: 'Creator E', competition: 'Content Creation Week', score: '12 votes', updateText: 'New engagement today', activityText: 'Creator added notes' },
        { title: 'Newcomer Onboarding Notes', author: 'Creator F', competition: 'Community Co-creation', score: '11 votes', updateText: 'Reviewed today', activityText: 'Content improving' }
    ],
    partners: ['Qinglan Content Studio', 'Spark Activity Center', 'Zhixing Campus Club', 'Yunfang Ops Service', 'Senhe Creator Alliance', 'Qicheng Event Committee', 'Beichen Enterprise Service', 'Glimmer Career Community']
}

function createFooterGroups(locale: SupportLocale): PortalFooterGroup[] {
    const isEnglish = locale === 'en-US'
    const isTraditional = locale === 'zh-TW'
    const contactAddress = isEnglish ? 'Chengdu, Sichuan, China' : platformContact.address
    const groups: PortalFooterGroup[] = [
        {
            title: isEnglish ? 'Quick Links' : isTraditional ? '快速入口' : '快速入口',
            items: [
                { label: isEnglish ? 'Client' : isTraditional ? '進入客戶端' : '进入客户端', href: commonRoutes.discover },
                { label: isEnglish ? 'Admin Login' : isTraditional ? '管理端登入' : '管理端登录', href: commonRoutes.console },
                { label: isEnglish ? 'Profile' : isTraditional ? '個人主頁' : '个人主页', href: '/profile' }
            ]
        },
        {
            title: isEnglish ? 'Content' : isTraditional ? '內容服務' : '内容服务',
            items: [
                { label: isEnglish ? 'Content Feed' : isTraditional ? '內容推薦' : '内容推荐', href: commonRoutes.content },
                { label: isEnglish ? 'Publish' : isTraditional ? '內容發布' : '内容发布', href: commonRoutes.publish },
                { label: isEnglish ? 'Creator Center' : isTraditional ? '創作者中心' : '创作者中心', href: commonRoutes.content }
            ]
        },
        {
            title: isEnglish ? 'Events' : isTraditional ? '賽事活動' : '赛事活动',
            items: [
                { label: isEnglish ? 'Events' : isTraditional ? '賽事活動' : '赛事活动', href: commonRoutes.competition },
                { label: isEnglish ? 'Works' : isTraditional ? '作品展示' : '作品展示', href: commonRoutes.works },
                { label: isEnglish ? 'Partners' : isTraditional ? '合作夥伴' : '合作伙伴', href: commonRoutes.partners }
            ]
        },
        {
            title: isEnglish ? 'Cooperation' : isTraditional ? '聯絡合作' : '联系合作',
            items: [
                { label: isEnglish ? 'Partners' : isTraditional ? '合作夥伴' : '合作伙伴', href: commonRoutes.partners },
                { label: isEnglish ? 'Business Cooperation' : isTraditional ? '商務合作' : '商务合作', href: commonRoutes.partners },
                { label: isEnglish ? 'About' : isTraditional ? '關於平台' : '关于平台', href: commonRoutes.about }
            ]
        },
        {
            title: isEnglish ? 'Contact' : isTraditional ? '聯絡方式' : '联系方式',
            items: [
                { label: platformContact.email, href: `mailto:${platformContact.email}`, icon: 'mdi:email-outline' },
                { label: contactAddress, icon: 'mdi:map-marker-outline' }
            ]
        }
    ]

    return groups
        .filter(group => group.title !== (isEnglish ? 'Cooperation' : isTraditional ? '聯絡合作' : '联系合作'))
        .map(group => ({ ...group, items: group.items.filter(item => !item.href || !hiddenPortalRoutes.has(item.href)) }))
        .filter(group => group.items.length > 0)
}

function buildMockData(data: (typeof portalData)[SupportLocale]): PortalMockData {
    return {
        metrics: data.metrics,
        flow: data.flow,
        updates: data.updates.map((item, index) => ({ ...item, date: formatRecentDate(index + 1) })),
        works: data.works.map((item, index) => ({ ...item, rank: String(index + 1).padStart(2, '0') })),
        partners: data.partners
    }
}

export function getPortalData(locale?: string | null): PortalDataBundle {
    const normalizedLocale = normalizeLocale(locale)
    const data = portalData[normalizedLocale]
    return {
        ui: data.ui,
        navItems: data.navItems.filter(item => !hiddenPortalRoutes.has(item.href)),
        heroSlides: data.heroSlides,
        capabilityModules: data.capabilityModules,
        capabilityShowcaseItems: data.capabilityShowcaseItems,
        dataMetrics: data.dataMetrics,
        solutionItems: data.solutionItems,
        flowSteps: data.flowSteps,
        footerGroups: createFooterGroups(normalizedLocale),
        mockData: buildMockData(data)
    }
}

const defaultPortalData = getPortalData('zh-CN')
export const navItems = defaultPortalData.navItems
export const heroSlides = defaultPortalData.heroSlides
export const capabilityModules = defaultPortalData.capabilityModules
export const capabilityShowcaseItems = defaultPortalData.capabilityShowcaseItems
export const dataMetrics = defaultPortalData.dataMetrics
export const solutionItems = defaultPortalData.solutionItems
export const flowSteps = defaultPortalData.flowSteps
export const footerGroups = defaultPortalData.footerGroups
export function createPortalMockData() {
    return defaultPortalData.mockData
}
