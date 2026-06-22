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
                brandName: '测吧',
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
                imageAlt: '测吧职业测评与分析报告界面示意图'
            },
            sections: {
                news: {
                    title: '测评动态',
                    desc: '展示职业测评说明、报告解读和成长建议更新，帮助大学生快速了解测吧的测评体验。',
                    prevAriaLabel: '上一组资讯',
                    nextAriaLabel: '下一组资讯',
                    linkText: '查看相关入口'
                },
                capability: {
                    title: '内容与测评服务',
                    desc: '围绕免费职业性格测评、职业画像、情景化探索和报告解读，帮助用户更清楚地认识适合自己的方向。'
                },
                showcase: {
                    title: '测评体验流程',
                    desc: '从免费开测到生成职业画像，再到解锁个性化分析报告，让职业探索过程更轻松、更有反馈。',
                    playState: '自动切换',
                    navAriaLabel: '平台能力导航'
                },
                metrics: {
                    title: '职业画像维度',
                    desc: '围绕性格倾向、能力偏好、兴趣动机、情景选择和成长建议，呈现更立体的个人职业画像。'
                },
                work: {
                    title: '测评报告与成长路径',
                    desc: '展示职业性格测评后的画像结果、方向建议和阶段性成长记录，让用户持续看见自己的变化。',
                    consoleButton: '进入测评后台',
                    itemSeparator: '·'
                },
                solution: {
                    title: '适用场景',
                    desc: '面向大学生职业探索、就业指导、专业方向选择和自我认知提升，整理出更贴近实际使用的测评场景。',
                    linkText: '查看入口'
                },
                flow: {
                    title: '免费测评步骤',
                    desc: '下载测吧即可免费进行职业性格测评，按引导完成题目后生成专属分析报告。'
                },
                partners: {
                    title: '校园与职业发展合作',
                    desc: '连接高校就业指导、职业发展课程、校园社团和服务伙伴，共同完善面向大学生的职业探索体验。',
                    ariaLabel: '合作伙伴展示'
                },
                bottomCta: {
                    title: '点测吧，免费测',
                    desc: '下载测吧，免费进行职业性格测评，解锁你的职业测评分析报告，让职业方向更明确。',
                    download: '下载 APP',
                    enter: '进入测吧',
                    contact: '联系合作'
                }
            },
            footer: {
                brandName: '测吧',
                intro: '用于展示测吧职业测评系统、客户端下载入口和测评后台入口。',
                copyright: 'Copyright © 2026 测吧. All Rights Reserved.',
                icpText: '蜀ICP备2026006423号-1'
            },
            appDialog: {
                closeAriaLabel: '关闭下载弹窗',
                title: '测吧',
                desc: '扫码下载 App，免费完成职业性格测评并查看专属分析报告',
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
            { label: '免费测评', href: commonRoutes.competition },
            { label: '报告展示', href: commonRoutes.works },
            { label: '成长建议', href: commonRoutes.solutions },
            { label: '合作伙伴', href: commonRoutes.partners },
            { label: '联系我们', href: commonRoutes.contact },
            { label: '关于平台', href: commonRoutes.about }
        ],
        heroSlides: [
            {
                key: 'overview',
                topic: '首页数据',
                title: '点测吧，免费测，解锁职业测评分析报告',
                desc: '只要下载测吧，就能免费进行职业性格测评，基于多维度、情景化和体验优先的方式，构建属于你的职业画像。',
                primaryText: '免费开测',
                primaryHref: commonRoutes.competition,
                secondaryText: '查看报告',
                secondaryHref: commonRoutes.content,
                boardLabel: '职业画像',
                boardStatus: '免费测评',
                tone: 'tone-blue',
                sideCards: [
                    { label: '核心原则', value: '社会性、实用性、具象化' },
                    { label: '体验方向', value: '多样性、中国化、体验优先' }
                ]
            },
            {
                key: 'competition',
                topic: '查看赛事',
                title: '上测吧测一测，职业方向更明确',
                desc: '针对当代大学生职业探索需求，测吧以更贴近真实选择的情景题和测评活动，帮助你理解兴趣、性格与职业方向的关系。',
                primaryText: '参与测评',
                primaryHref: commonRoutes.competition,
                secondaryText: '了解流程',
                secondaryHref: commonRoutes.solutions,
                boardLabel: '测评进度',
                boardStatus: '进行中',
                tone: 'tone-cyan',
                sideCards: [
                    { label: '探索方式', value: '情景题、兴趣题、性格题' },
                    { label: '结果反馈', value: '职业倾向、优势短板、发展建议' }
                ]
            },
            {
                key: 'works',
                topic: '作品展示',
                title: '全面立体的个人职业画像',
                desc: '测评报告会把性格倾向、能力偏好、兴趣动机和情景选择集中呈现，帮助你从多个角度理解自己。',
                primaryText: '报告展示',
                primaryHref: commonRoutes.works,
                secondaryText: '开始测评',
                secondaryHref: commonRoutes.publish,
                boardLabel: '分析报告',
                boardStatus: '持续生成',
                tone: 'tone-indigo',
                sideCards: [
                    { label: '画像内容', value: '性格、能力、兴趣、动机' },
                    { label: '报告价值', value: '方向参考、成长建议、行动提示' }
                ]
            },
            {
                key: 'content',
                topic: '进入发现',
                title: '专属你的职业成长道路',
                desc: '测吧基于你的测评结果，提供科学且有趣的个性化发展建议，让职业探索不再停留在模糊感觉里。',
                primaryText: '进入发现',
                primaryHref: commonRoutes.discover,
                secondaryText: '查看建议',
                secondaryHref: commonRoutes.guide,
                boardLabel: '成长建议',
                boardStatus: '个性化',
                tone: 'tone-violet',
                sideCards: [
                    { label: '建议形式', value: '方向、岗位、能力提升' },
                    { label: '体验目标', value: '清晰、有趣、可行动' }
                ]
            }
        ],
        capabilityModules: [
            { title: '内容服务', icon: 'mdi:compass-outline', desc: '围绕职业测评说明、报告解读、成长建议和职业探索内容，帮助用户在测评前后都能获得清晰信息。', points: ['测评说明', '报告解读', '成长内容'], action: '查看内容服务', route: commonRoutes.content },
            { title: '多维职业画像', icon: 'mdi:account-details-outline', desc: '从性格、兴趣、能力偏好和情景选择等维度，构建立体的个人职业画像。', points: ['性格倾向', '能力偏好', '兴趣动机'], action: '查看画像', route: commonRoutes.works },
            { title: '情景化探索', icon: 'mdi:map-search-outline', desc: '用更贴近大学生真实选择的情景任务，降低传统测评工具的抽象感。', points: ['场景题目', '具象选择', '体验优先'], action: '了解流程', route: commonRoutes.competition },
            { title: '个性化分析报告', icon: 'mdi:file-chart-outline', desc: '生成专属职业测评分析报告，帮助用户理解优势、风险和可能的发展方向。', points: ['方向分析', '优势解读', '行动建议'], action: '报告展示', route: commonRoutes.works },
            { title: '成长路径建议', icon: 'mdi:route-variant', desc: '结合测评结果给出可执行的成长建议，让职业探索逐步走向清晰。', points: ['岗位参考', '能力提升', '阶段规划'], action: '进入发现', route: commonRoutes.discover }
        ],
        capabilityShowcaseItems: [
            { key: 'content', nav: '内容服务', icon: 'mdi:compass-outline', kicker: 'CONTENT SERVICE', title: '把测评说明、报告解读和成长内容组织清晰', desc: '内容服务承接测吧的职业探索知识、测评说明、报告解读和成长建议，让用户在开测前后都有内容可参考。', points: ['职业探索知识内容', '测评流程与报告说明', '成长建议与行动参考'], visualTitle: '内容服务台', visualStatus: '持续更新', tone: 'tone-blue', stats: [{ label: '内容专题', value: '36+' }, { label: '报告解读', value: '多类' }, { label: '成长建议', value: '200+' }], lines: ['测评说明', '报告解读', '方向参考', '成长内容'] },
            { key: 'event', nav: '情景探索', icon: 'mdi:map-search-outline', kicker: 'SCENE TEST', title: '用情景化题目替代空泛判断', desc: '围绕学习、协作、决策和压力等真实场景设置题目，让用户在具体选择中理解自己的偏好。', points: ['具象化职业场景', '贴近大学生体验', '减少传统测评距离感'], visualTitle: '情景探索台', visualStatus: '沉浸体验', tone: 'tone-cyan', stats: [{ label: '情景任务', value: '120+' }, { label: '选择路径', value: '多样' }, { label: '反馈方式', value: '即时' }], lines: ['进入场景', '做出选择', '识别偏好', '汇总倾向'] },
            { key: 'works', nav: '分析报告', icon: 'mdi:file-chart-outline', kicker: 'REPORT', title: '解锁你的职业测评分析报告', desc: '报告以职业画像为核心，呈现性格倾向、能力偏好、兴趣动机和发展建议，帮助用户获得更清晰的自我理解。', points: ['职业画像总览', '优势与风险解读', '个性化成长建议'], visualTitle: '分析报告', visualStatus: '专属生成', tone: 'tone-indigo', stats: [{ label: '画像标签', value: '60+' }, { label: '建议库', value: '200+' }, { label: '报告模块', value: '4' }], lines: ['画像汇总', '方向分析', '优势解读', '行动建议'] },
            { key: 'creator', nav: '成长道路', icon: 'mdi:route-variant', kicker: 'GROWTH PATH', title: '专属你的职业成长道路', desc: '测吧把测评结果转化为更可执行的成长建议，帮助用户逐步确认职业方向、能力提升重点和下一步行动。', points: ['职业方向参考', '能力提升建议', '阶段性成长路径'], visualTitle: '成长路径', visualStatus: '持续更新', tone: 'tone-violet', stats: [{ label: '方向参考', value: '多类' }, { label: '能力建议', value: '个性化' }, { label: '行动提示', value: '可执行' }], lines: ['理解自己', '确认方向', '提升能力', '持续复盘'] },
            { key: 'console', nav: '测评管理', icon: 'mdi:view-dashboard-outline', kicker: 'ADMIN', title: '让测评内容和报告配置更易维护', desc: '后台用于维护题库、报告规则、用户测评记录和基础资料，支撑测评系统稳定运行。', points: ['题库与维度维护', '报告规则配置', '用户测评记录'], visualTitle: '测评后台', visualStatus: '稳定管理', tone: 'tone-slate', stats: [{ label: '题库模块', value: '5' }, { label: '报告规则', value: '多套' }, { label: '数据记录', value: '可追踪' }], lines: ['题库维护', '维度配置', '报告生成', '记录回看'] }
        ],
        dataMetrics: [
            { label: '测评维度', value: '6', desc: '围绕社会性、实用性、具象化、多样性、中国化和体验优先展开', icon: 'mdi:hexagon-multiple-outline' },
            { label: '情景题库', value: '120+', desc: '覆盖学习、协作、选择、压力和职业兴趣等典型场景', icon: 'mdi:clipboard-text-outline' },
            { label: '画像标签', value: '60+', desc: '用于描述性格倾向、能力偏好和兴趣动机', icon: 'mdi:tag-multiple-outline' },
            { label: '分析报告', value: '4 章', desc: '从画像总览、优势解读、方向参考到成长建议逐步展开', icon: 'mdi:file-chart-outline' },
            { label: '成长建议', value: '200+', desc: '沉淀可执行的职业探索、能力提升和行动提示', icon: 'mdi:chart-line' }
        ],
        solutionItems: [
            { title: '大学生职业探索', desc: '适合在专业选择、实习准备和求职前期进行自我认知梳理。', points: ['兴趣识别', '方向参考', '行动建议'], href: commonRoutes.content },
            { title: '职业性格测评', desc: '帮助用户了解自己的沟通方式、决策偏好和适合的工作情境。', points: ['性格倾向', '协作偏好', '压力反应'], href: commonRoutes.competition },
            { title: '测评报告解读', desc: '把抽象结果转成更易理解的职业画像和成长建议。', points: ['画像总览', '优势短板', '方向分析'], href: commonRoutes.works },
            { title: '校园就业指导', desc: '为课程、社团和就业辅导提供更有趣的职业探索工具。', points: ['班级测评', '团体活动', '辅导参考'], href: commonRoutes.solutions },
            { title: '测评后台管理', desc: '维护题库、维度、报告规则和用户测评记录，让系统长期可运营。', points: ['题库管理', '报告配置', '数据回看'], href: commonRoutes.guide }
        ],
        flowSteps: [
            { title: '下载测吧', desc: '通过 APP 入口进入测吧，开始你的职业探索。' },
            { title: '免费开始测评', desc: '按照引导完成职业性格与情景化题目。' },
            { title: '生成职业画像', desc: '系统汇总你的选择，形成多维度个人职业画像。' },
            { title: '解锁分析报告', desc: '查看职业方向、优势解读和个性化成长建议。' }
        ],
        footerGroups: [],
        metrics: [
            { label: '测评维度', value: '6', trend: '覆盖核心职业探索原则' },
            { label: '情景题库', value: '120+', trend: '持续补充大学生场景' },
            { label: '画像标签', value: '60+', trend: '用于生成个人职业画像' },
            { label: '成长建议', value: '200+', trend: '按结果个性化推荐' }
        ],
        flow: ['免费职业性格测评', '生成个人职业画像', '解锁成长分析报告'],
        updates: [
            { type: '测评', title: '职业性格测评免费开放', desc: '下载测吧即可开始测评，完成后查看专属职业画像和分析报告。', href: commonRoutes.competition },
            { type: '报告', title: '职业测评分析报告升级', desc: '新增优势解读、方向参考和成长建议，让报告更容易看懂、也更容易行动。', href: commonRoutes.works },
            { type: '题库', title: '情景化题库持续补充', desc: '围绕大学生学习、协作、求职和选择场景，提升测评体验的真实感。', href: commonRoutes.content },
            { type: '指南', title: '如何看懂你的职业画像', desc: '从性格倾向、能力偏好和兴趣动机三个角度理解测评结果。', href: commonRoutes.guide },
            { type: '成长', title: '专属职业成长道路上线', desc: '基于测评结果推荐职业方向、能力提升重点和下一步行动。', href: commonRoutes.discover },
            { type: '原则', title: '六大测评原则说明更新', desc: '围绕社会性、实用性、具象化、多样性、中国化和体验优先完善产品说明。', href: commonRoutes.solutions }
        ],
        works: [
            { title: '职业性格分析报告', author: '测评用户 A', competition: '职业探索测评', score: '匹配度 92%', updateText: '刚刚生成', activityText: '已解锁建议' },
            { title: '个人职业画像总览', author: '测评用户 B', competition: '多维画像分析', score: '画像完整', updateText: '12 分钟前更新', activityText: '补充情景结果' },
            { title: '职业方向参考清单', author: '测评用户 C', competition: '方向探索计划', score: '3 类方向', updateText: '28 分钟前更新', activityText: '生成行动提示' },
            { title: '能力提升建议卡', author: '测评用户 D', competition: '成长路径分析', score: '5 条建议', updateText: '1 小时内更新', activityText: '建议已细化' },
            { title: '兴趣动机解读', author: '测评用户 E', competition: '兴趣偏好测评', score: '高匹配', updateText: '今日新增反馈', activityText: '报告已完善' },
            { title: '大学生职业探索记录', author: '测评用户 F', competition: '校园职业测评', score: '持续追踪', updateText: '今日完成测评', activityText: '路径持续更新' }
        ],
        partners: ['青蓝职业发展中心', '星火校园成长营', '知行就业指导社', '云舫测评服务', '森合心理与职业研究', '启程职业探索营', '北辰高校服务', '微光成长社群']
    },
    'zh-TW': {} as any,
    'en-US': {} as any
}

portalData['zh-TW'] = {
    ...portalData['zh-CN'],
    ui: {
        header: {
            brandName: '測吧',
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
            imageAlt: '測吧職業測評與分析報告介面示意圖'
        },
        sections: {
            news: {
                title: '近期動態',
                desc: '展示職業測評說明、報告解讀和成長建議更新，協助大學生快速了解測吧的測評體驗。',
                prevAriaLabel: '上一組資訊',
                nextAriaLabel: '下一組資訊',
                linkText: '查看相關入口'
            },
            capability: {
                    title: '內容與測評服務',
                desc: '圍繞免費職業性格測評、職業畫像、情境化探索和報告解讀，幫助使用者更清楚地認識適合自己的方向。'
            },
            showcase: {
                title: '測評體驗流程',
                desc: '從免費開測到生成職業畫像，再到解鎖個人化分析報告，讓職業探索過程更輕鬆、更有回饋。',
                playState: '自動切換',
                navAriaLabel: '平台能力導覽'
            },
            metrics: {
                title: '職業畫像維度',
                desc: '圍繞性格傾向、能力偏好、興趣動機、情境選擇和成長建議，呈現更立體的個人職業畫像。'
            },
            work: {
                title: '測評報告與成長路徑',
                desc: '展示職業性格測評後的畫像結果、方向建議和階段性成長記錄，讓使用者持續看見自己的變化。',
                consoleButton: '進入測評後台',
                itemSeparator: '·'
            },
            solution: {
                title: '常見使用場景',
                desc: '面向大學生職業探索、就業指導、專業方向選擇和自我認知提升，整理出更貼近實際使用的測評場景。',
                linkText: '查看入口'
            },
            flow: {
                title: '接入步驟',
                desc: '從入口選擇到資料維護，盡量保持簡單、明確、便於執行。'
            },
            partners: {
                title: '生態合作夥伴',
                desc: '連接高校就業指導、職業發展課程、校園社團和服務夥伴，共同完善面向大學生的職業探索體驗。',
                ariaLabel: '合作夥伴展示'
            },
            bottomCta: {
                title: '點測吧，免費測',
                desc: '下載測吧，免費進行職業性格測評，解鎖你的職業測評分析報告，讓職業方向更明確。',
                download: '下載 APP',
                enter: '進入測吧',
                contact: '聯絡合作'
            }
        },
        footer: {
            brandName: '測吧',
            intro: '用於展示測吧職業測評系統、客戶端下載入口和測評後台入口。',
            copyright: 'Copyright © 2026 測吧. All Rights Reserved.',
            icpText: '蜀ICP備2026006423號-1'
        },
        appDialog: {
            closeAriaLabel: '關閉下載彈窗',
            title: '測吧',
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
        { ...portalData['zh-CN'].heroSlides[0], topic: '首頁資料', title: '點測吧，免費測，解鎖職業測評分析報告', desc: '只要下載測吧，就能免費進行職業性格測評，基於多維度、情境化和體驗優先的方式，構建屬於你的職業畫像。', primaryText: '免費開測', secondaryText: '查看報告', boardLabel: '職業畫像', boardStatus: '免費測評', sideCards: [{ label: '核心原則', value: '社會性、實用性、具象化' }, { label: '體驗方向', value: '多樣性、中國化、體驗優先' }] },
        { ...portalData['zh-CN'].heroSlides[1], topic: '查看賽事', title: '上測吧測一測，職業方向更明確', desc: '針對當代大學生職業探索需求，測吧以更貼近真實選擇的情境題和測評活動，幫助你理解興趣、性格與職業方向的關係。', primaryText: '參與測評', secondaryText: '了解流程', boardLabel: '測評進度', boardStatus: '進行中', sideCards: [{ label: '探索方式', value: '情境題、興趣題、性格題' }, { label: '結果回饋', value: '職業傾向、優勢短板、發展建議' }] },
        { ...portalData['zh-CN'].heroSlides[2], topic: '作品展示', title: '全面立體的個人職業畫像', desc: '測評報告會把性格傾向、能力偏好、興趣動機和情境選擇集中呈現，幫助你從多個角度理解自己。', primaryText: '報告展示', secondaryText: '開始測評', boardLabel: '分析報告', boardStatus: '持續生成', sideCards: [{ label: '畫像內容', value: '性格、能力、興趣、動機' }, { label: '報告價值', value: '方向參考、成長建議、行動提示' }] },
        { ...portalData['zh-CN'].heroSlides[3], topic: '進入發現', title: '讓發現頁保持可維護的更新節奏', desc: '圍繞標籤、推薦位和主頁內容整理資訊，讓使用者能看到近期更新，也讓編輯更容易維護欄目。', primaryText: '進入發現', secondaryText: '接入指南', boardLabel: '發現頁維護', boardStatus: '更新中', sideCards: [{ label: '更新節奏', value: '標籤、專題、推薦位維護' }, { label: '後台支撐', value: '審核、權限、基礎資料' }] }
    ],
    metrics: [
        { label: '累計內容', value: '620+', trend: '本週新增 18' },
        { label: '進行中賽事', value: '8', trend: '2 個即將截止' },
        { label: '參賽作品', value: '180+', trend: '今日新增 6' },
        { label: '創作者', value: '86', trend: '24 位近期活躍' }
    ],
    flow: ['免費職業性格測評', '生成個人職業畫像', '解鎖成長分析報告'],
    partners: ['青藍職業發展中心', '星火校園成長營', '知行就業指導社', '雲舫測評服務', '森合心理與職業研究', '啟程職業探索營', '北辰高校服務', '微光成長社群']
}

portalData['en-US'] = {
    ...portalData['zh-CN'],
    ui: {
        header: {
            brandName: 'CeBa',
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
            imageAlt: 'CeBa content and activity operations interface preview'
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
                title: 'Start operating CeBa from a clear entry point',
                desc: 'Support browsing, submissions, and admin tasks first, then expand capabilities based on real operational data.',
                download: 'Download App',
                enter: 'Open CeBa',
                contact: 'Contact Us'
            }
        },
        footer: {
            brandName: 'CeBa',
            intro: 'The official portal for product presentation, client access, and operations console entry.',
            copyright: 'Copyright © 2026 CeBa. All Rights Reserved.',
            icpText: 'Shu ICP No. 2026006423-1'
        },
        appDialog: {
            closeAriaLabel: 'Close download dialog',
            title: 'CeBa',
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
        { ...portalData['zh-CN'].heroSlides[0], topic: 'Home Data', title: 'Organize content, activities, and user entry points', desc: 'CeBa connects content browsing, activity submissions, work showcases, and operational review in one clear portal.', primaryText: 'View events', secondaryText: 'View services', boardLabel: 'Operations desk', boardStatus: 'Overview', sideCards: [{ label: 'Activity flow', value: 'Collection and results' }, { label: 'Creator assets', value: 'Profiles and records' }] },
        { ...portalData['zh-CN'].heroSlides[1], topic: 'View Events', title: 'Break activity operations into trackable stages', desc: 'From registration and submission to review and result publishing, each stage has a clear status for operators.', primaryText: 'View events', secondaryText: 'Use cases', boardLabel: 'Event progress', boardStatus: 'Collecting', sideCards: [{ label: 'Stage control', value: 'Registration and review' }, { label: 'Review metrics', value: 'Views and engagement' }] },
        { ...portalData['zh-CN'].heroSlides[2], topic: 'Works', title: 'Make submissions easier to view and review', desc: 'Covers, media assets, creator sources, and engagement records are presented together for browsing and follow-up recommendations.', primaryText: 'View works', secondaryText: 'Start publishing', boardLabel: 'Submission updates', boardStatus: 'Updating', sideCards: [{ label: 'Media assets', value: 'Covers and videos' }, { label: 'Display status', value: 'Review and engagement' }] },
        { ...portalData['zh-CN'].heroSlides[3], topic: 'Open Discovery', title: 'Keep the discovery feed maintainable', desc: 'Tags, featured positions, and profile content are organized so users can see recent updates and editors can maintain sections efficiently.', primaryText: 'Open discovery', secondaryText: 'Guide', boardLabel: 'Discovery maintenance', boardStatus: 'Updating', sideCards: [{ label: 'Update rhythm', value: 'Tags and topics' }, { label: 'Admin support', value: 'Review and permissions' }] }
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
            title: isEnglish ? 'Content Service' : isTraditional ? '內容服務' : '内容服务',
            items: [
                { label: isEnglish ? 'Assessment Content' : isTraditional ? '測評內容' : '测评内容', href: commonRoutes.content },
                { label: isEnglish ? 'Career Report' : isTraditional ? '分析報告' : '分析报告', href: commonRoutes.works },
                { label: isEnglish ? 'Growth Advice' : isTraditional ? '成長建議' : '成长建议', href: commonRoutes.discover }
            ]
        },
        {
            title: isEnglish ? 'Career Growth' : isTraditional ? '職業成長' : '职业成长',
            items: [
                { label: isEnglish ? 'Career Exploration' : isTraditional ? '職業探索' : '职业探索', href: commonRoutes.competition },
                { label: isEnglish ? 'Personal Profile' : isTraditional ? '職業畫像' : '职业画像', href: commonRoutes.works },
                { label: isEnglish ? 'Campus Partners' : isTraditional ? '校園合作' : '校园合作', href: commonRoutes.partners }
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
