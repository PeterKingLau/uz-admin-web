import { platformContact } from '@/config/contact'
import { normalizeLocale, type SupportLocale } from '@/locales'
import type { LegalContactLabels, LegalDocumentContent, LegalMetaItem, LegalNavLabels, LegalSection } from './types'

type LegalBundle = {
    privacy: LegalDocumentContent
    agreement: LegalDocumentContent
    contact: LegalContactLabels
    nav: LegalNavLabels
}

const dateText: Record<SupportLocale, string> = {
    'zh-CN': '2026 年 05 月 12 日',
    'zh-TW': '2026 年 05 月 12 日',
    'en-US': 'May 12, 2026'
}

const serviceName: Record<SupportLocale, string> = {
    'zh-CN': platformContact.serviceName,
    'zh-TW': '測吧',
    'en-US': 'CeBa'
}

const companyName: Record<SupportLocale, string> = {
    'zh-CN': platformContact.companyName,
    'zh-TW': '四川高榜教育信息諮詢有限公司',
    'en-US': 'Sichuan Gaobang Education Information Consulting Co., Ltd.'
}

const addressText: Record<SupportLocale, string> = {
    'zh-CN': platformContact.address,
    'zh-TW': '四川省成都市聯東 U 谷相關辦公地址',
    'en-US': 'Liandong U Valley, Chengdu, Sichuan, China'
}

const responseTime: Record<SupportLocale, string> = {
    'zh-CN': platformContact.responseTime,
    'zh-TW': '我們將在 15 個工作日內回覆你的請求',
    'en-US': 'We will respond to your request within 15 business days.'
}

function productMeta(locale: SupportLocale): LegalMetaItem {
    const label = locale === 'en-US' ? 'Product' : locale === 'zh-TW' ? '適用產品' : '适用产品'
    return { label, value: serviceName[locale] }
}

function createPrivacyContent(locale: SupportLocale): LegalDocumentContent {
    const product = serviceName[locale]
    if (locale === 'en-US') {
        return {
            title: 'Privacy Policy',
            documentTitle: `Privacy Policy - ${product}`,
            summary:
                'This Privacy Policy explains how CeBa collects, uses, stores, shares, and protects personal information when providing content browsing, publishing, activity participation, creator profiles, interaction feedback, and operational services.',
            metas: [
                productMeta(locale),
                { label: 'Effective date', value: dateText[locale] },
                { label: 'Last updated', value: dateText[locale] },
                { label: 'Applies to', value: 'Web, mobile web, app, and related services' }
            ],
            sections: [
                {
                    id: 'scope',
                    badge: '01',
                    title: 'Scope and Principles',
                    shortTitle: 'Scope',
                    paragraphs: [
                        'This policy applies when you access or use CeBa web pages, mobile web pages, the app, content services, activity services, work display, creator profiles, and related operation management capabilities.',
                        'We process personal information under the principles of legality, legitimacy, necessity, good faith, specific purpose, minimum necessity, and transparency, and apply security measures appropriate to the processing activity.',
                        'If a specific feature provides separate privacy notices, authorization prompts, or third-party service rules, those notices form part of the personal information processing rules for that feature.'
                    ]
                },
                {
                    id: 'collection',
                    badge: '02',
                    title: 'Information We Collect and Use',
                    shortTitle: 'Collection',
                    paragraphs: [
                        'To provide basic services, protect account security, complete content display, and manage activities, we may process the following information within a necessary scope.'
                    ],
                    items: [
                        'Account and identity information: used for registration, login, verification, account security, creator profile display, and necessary service notices.',
                        'Profile and content information: used for avatars, nicknames, profile materials, posts, videos, covers, works, collections, submissions, review, display, and management.',
                        'Interaction and activity information: used for comments, favorites, follows, sign-ups, votes, browsing records, activity progress, result publication, and feedback statistics.',
                        'Device and log information: used for service operation, security risk control, troubleshooting, basic analytics, and prevention of abnormal account or system use.',
                        'Customer service and appeal information: used for inquiries, complaints, feedback, rights requests, account disputes, and necessary identity verification.'
                    ]
                },
                {
                    id: 'permission',
                    badge: '03',
                    title: 'Device Permissions and Sensitive Information',
                    shortTitle: 'Permissions',
                    paragraphs: [
                        'When you use image upload, video publishing, scanning, notifications, or similar features, we may request system permissions such as photos, camera, microphone, and notifications. You may disable permissions in system settings; doing so only affects the corresponding feature.',
                        'If a feature involves sensitive personal information or system permissions, we will provide a separate prompt describing the purpose, method, and scope, and use it after obtaining your authorization.'
                    ],
                    items: [
                        'Photos or storage permission is used to select images, videos, cover materials, and save necessary files.',
                        'Camera permission is used for shooting content, scanning, or actions you initiate.',
                        'Microphone permission is used for video recording or features that need audio input.',
                        'Notification permission is used for activity updates, review results, interaction reminders, and system notices.'
                    ]
                },
                {
                    id: 'cookies-sdk',
                    badge: '04',
                    title: 'Cookies, Similar Technologies, and Third-Party Services',
                    shortTitle: 'Third parties',
                    paragraphs: [
                        'We may use cookies or similar technologies for web access, login status, basic statistics, and security risk control. You may manage these capabilities through browser settings, although some settings may affect the service experience.',
                        'To provide file storage, push notifications, analytics, security protection, QR code generation, and other necessary capabilities, we may integrate third-party services or SDKs. We evaluate partners where necessary and require them to process information only for agreed purposes and scopes.'
                    ],
                    items: [
                        'We do not require third parties to use personal information for purposes unrelated to this product or service.',
                        'When third-party pages, services, or links are involved, please also read the applicable third-party rules.',
                        'If the third-party service list changes materially, we will update the relevant notice in a reasonable manner.'
                    ]
                },
                {
                    id: 'share',
                    badge: '05',
                    title: 'Sharing, Entrusted Processing, and Public Display',
                    shortTitle: 'Sharing',
                    paragraphs: [
                        'We do not sell your personal information. When service delivery, technical support, customer service, security protection, or legal compliance requires sharing or entrusted processing, we follow legal, legitimate, and necessary principles and bind partners by agreement.',
                        'Content you publish, creator profiles, submitted works, activity rankings, comments, and interactions may be displayed to other users based on product features and activity rules. Please avoid disclosing unnecessary personal information in public areas.'
                    ]
                },
                {
                    id: 'storage-security',
                    badge: '06',
                    title: 'Retention and Security',
                    shortTitle: 'Security',
                    paragraphs: [
                        'We retain personal information only for the period necessary to achieve the processing purpose. Where laws, dispute handling, or security audits require retention, we will retain it within the necessary scope and delete or anonymize it afterward.',
                        'We protect information through access control, permission levels, transmission encryption, log audit, backup recovery, and security monitoring. You should also keep your account, password, verification code, and login device secure.'
                    ]
                },
                {
                    id: 'rights',
                    badge: '07',
                    title: 'Your Personal Information Rights',
                    shortTitle: 'Your rights',
                    paragraphs: [
                        'Within the scope provided by law, you may exercise rights to access, copy, correct, supplement, delete, withdraw consent, close your account, request explanations, and submit complaints or feedback.'
                    ],
                    items: [
                        'You may maintain account information, profile information, work materials, and certain display information through product features.',
                        'You may submit rights requests through the contact methods on this page. We will process requests after verifying your identity as required by law.',
                        'For information that cannot be deleted immediately due to compliance, security, audit, or dispute handling needs, we will restrict processing within a necessary scope.'
                    ]
                },
                {
                    id: 'minor',
                    badge: '08',
                    title: 'Protection of Minors',
                    shortTitle: 'Minors',
                    paragraphs: [
                        'We value the protection of minors’ personal information. Minors should obtain guardian consent and use the service under guardian guidance.',
                        'If a guardian finds that a minor’s information has been improperly processed or needs to exercise relevant rights, the guardian may contact us through this page.'
                    ]
                },
                {
                    id: 'change',
                    badge: '09',
                    title: 'Policy Updates',
                    shortTitle: 'Updates',
                    paragraphs: [
                        'We may update this policy when product functions, business scenarios, personal information processing rules, or legal requirements change.',
                        'For material changes, we will notify you through page prompts, announcements, or other reasonable methods. The updated policy takes effect from the date stated in the notice or publication.'
                    ]
                }
            ]
        }
    }

    if (locale === 'zh-TW') {
        return {
            title: '隱私政策',
            documentTitle: `隱私政策 - ${product}`,
            summary: `本隱私政策說明${product}在提供內容瀏覽、作品發布、活動參與、創作者主頁、互動回饋及營運管理服務時，如何收集、使用、保存、共享和保護你的個人資訊，以及你依法享有的相關權利。`,
            metas: [
                productMeta(locale),
                { label: '生效日期', value: dateText[locale] },
                { label: '更新日期', value: dateText[locale] },
                { label: '適用場景', value: '網頁端、行動端網頁、App 及相關服務' }
            ],
            sections: [
                {
                    id: 'scope',
                    badge: '01',
                    title: '適用範圍與處理原則',
                    shortTitle: '適用範圍',
                    paragraphs: [
                        `本政策適用於你訪問或使用${product}提供的網頁端、行動端網頁、App、內容服務、活動服務、作品展示、創作者主頁以及相關營運管理能力的場景。`,
                        '我們遵循合法、正當、必要、誠信、目的明確、最小必要和公開透明的原則處理個人資訊，並採取與處理活動相匹配的安全保護措施。',
                        '如果某項具體功能另行提供隱私說明、授權提示或第三方服務規則，相關說明將與本政策共同構成該功能的個人資訊處理規則。'
                    ]
                },
                {
                    id: 'collection',
                    badge: '02',
                    title: '我們如何收集和使用個人資訊',
                    shortTitle: '資訊收集',
                    paragraphs: ['為了向你提供基礎服務、保障帳號安全、完成內容展示和活動管理，我們會在必要範圍內處理以下類型的資訊。'],
                    items: [
                        '帳號與身分資訊：用於註冊、登入、身分驗證、帳號安全、創作者主頁展示和必要的服務通知。',
                        '資料與內容資訊：用於頭像、暱稱、主頁資料、圖文、影片、封面、作品、合集、投稿記錄等內容的發布、審核、展示和管理。',
                        '互動與活動資訊：用於評論、收藏、關注、報名、投票、瀏覽記錄、活動進度、結果公示和回饋統計。',
                        '設備與日誌資訊：用於服務運行、安全風控、異常排查、基礎統計分析以及防止帳號或系統被異常使用。',
                        '客服與申訴資訊：用於處理諮詢、投訴、回饋、權利請求、帳號爭議和必要的身分驗證。'
                    ]
                },
                {
                    id: 'permission',
                    badge: '03',
                    title: '設備權限與敏感資訊說明',
                    shortTitle: '設備權限',
                    paragraphs: [
                        '當你使用圖片上傳、影片發布、掃碼、訊息提醒等功能時，我們可能向你申請相簿、相機、麥克風、通知等系統權限。你可以在系統設定中關閉相關權限，關閉後僅影響對應功能。',
                        '如某項功能涉及敏感個人資訊或系統權限，我們會在具體場景中單獨提示處理目的、方式和範圍，並在取得你的授權後使用。'
                    ],
                    items: [
                        '相簿或儲存權限用於選擇圖片、影片、封面素材以及保存必要文件。',
                        '相機權限用於拍攝內容、掃碼或完成你主動發起的相關操作。',
                        '麥克風權限用於影片錄製或其他需要採集聲音的功能。',
                        '通知權限用於接收活動進展、審核結果、互動提醒和系統公告。'
                    ]
                },
                {
                    id: 'cookies-sdk',
                    badge: '04',
                    title: 'Cookie、同類技術與第三方服務',
                    shortTitle: '第三方服務',
                    paragraphs: [
                        '為保障網頁訪問、登入狀態、基礎統計和安全風控，我們可能使用 Cookie 或同類技術。你可以透過瀏覽器設定管理相關能力，但部分設定可能影響服務體驗。',
                        '為實現文件儲存、訊息推送、統計分析、安全防護、QR Code 生成等必要能力，我們可能接入第三方服務或 SDK。我們會對合作方進行必要評估，並要求其按照約定目的和範圍處理資訊。'
                    ],
                    items: [
                        '我們不會要求第三方將個人資訊用於與本產品服務無關的目的。',
                        '涉及第三方頁面、服務或連結時，請同時閱讀對應第三方規則。',
                        '如第三方服務清單發生重要變化，我們將透過合理方式更新說明。'
                    ]
                },
                {
                    id: 'share',
                    badge: '05',
                    title: '資訊共享、委託處理與公開展示',
                    shortTitle: '共享展示',
                    paragraphs: [
                        '我們不會出售你的個人資訊。因服務實現、技術支援、客服處理、安全保障或依法合規需要與合作方共享或委託處理資訊時，我們會遵循合法、正當、必要原則，並透過協議約束合作方。',
                        '你主動發布的內容、創作者主頁、投稿作品、活動榜單、評論及互動資訊，可能根據產品功能和活動規則向其他使用者展示。請避免在公開區域主動披露不必要的個人資訊。'
                    ]
                },
                {
                    id: 'storage-security',
                    badge: '06',
                    title: '資訊保存與安全保護',
                    shortTitle: '保存安全',
                    paragraphs: [
                        '我們會在實現處理目的所必需的期限內保存個人資訊。法律法規另有規定、爭議處理或安全審計確有必要的，將在必要期限內依法保存；超出保存期限後，我們會刪除或進行匿名化處理。',
                        '我們透過存取控制、權限分級、傳輸加密、日誌審計、備份恢復和安全監測等措施保護資訊安全。同時，你也應妥善保管帳號、密碼、驗證碼和登入設備。'
                    ]
                },
                {
                    id: 'rights',
                    badge: '07',
                    title: '你的個人資訊權利',
                    shortTitle: '你的權利',
                    paragraphs: ['在法律法規規定範圍內，你可以依法行使查詢、複製、更正、補充、刪除、撤回同意、註銷帳號、解釋說明和投訴回饋等權利。'],
                    items: [
                        '你可以在產品功能中維護帳號資料、主頁資料、作品資料和部分互動展示資訊。',
                        '你可以透過本頁面聯繫方式提交個人資訊權利請求，我們將在核驗身分後依法處理。',
                        '對於因合規、安全、審計或爭議處理需要暫時無法刪除的資訊，我們會在必要範圍內進行限制處理。'
                    ]
                },
                {
                    id: 'minor',
                    badge: '08',
                    title: '未成年人保護',
                    shortTitle: '未成年人',
                    paragraphs: [
                        '我們重視未成年人個人資訊保護。未成年人使用本服務前，應取得監護人同意，並在監護人指導下閱讀本政策和使用相關服務。',
                        '如監護人發現未成年人資訊被不當處理，或需要行使相關權利，可以透過本頁面聯繫方式與我們聯繫。'
                    ]
                },
                {
                    id: 'change',
                    badge: '09',
                    title: '政策更新',
                    shortTitle: '政策更新',
                    paragraphs: [
                        '當產品功能、業務場景、個人資訊處理規則或法律法規要求發生變化時，我們可能更新本政策。',
                        '涉及重大變更的，我們將透過頁面提示、公告或其他合理方式告知。更新後的政策自公布或通知載明的日期起生效。'
                    ]
                }
            ]
        }
    }

    return {
        title: '隐私政策',
        documentTitle: `隐私政策 - ${product}`,
        summary: `本隐私政策说明${product}在提供内容浏览、作品发布、活动参与、创作者主页、互动反馈及运营管理服务时，如何收集、使用、保存、共享和保护你的个人信息，以及你依法享有的相关权利。`,
        metas: [
            productMeta(locale),
            { label: '生效日期', value: dateText[locale] },
            { label: '更新日期', value: dateText[locale] },
            { label: '适用场景', value: '网页端、移动端网页、App 及相关服务' }
        ],
        sections: [
            {
                id: 'scope',
                badge: '01',
                title: '适用范围与处理原则',
                shortTitle: '适用范围',
                paragraphs: [
                    `本政策适用于你访问或使用${product}提供的网页端、移动端网页、App、内容服务、活动服务、作品展示、创作者主页以及相关运营管理能力的场景。`,
                    '我们遵循合法、正当、必要、诚信、目的明确、最小必要和公开透明的原则处理个人信息，并采取与处理活动相匹配的安全保护措施。',
                    '如果某项具体功能另行提供隐私说明、授权提示或第三方服务规则，相关说明将与本政策共同构成该功能的个人信息处理规则。'
                ]
            },
            {
                id: 'collection',
                badge: '02',
                title: '我们如何收集和使用个人信息',
                shortTitle: '信息收集',
                paragraphs: ['为了向你提供基础服务、保障账号安全、完成内容展示和活动管理，我们会在必要范围内处理以下类型的信息。'],
                items: [
                    '账号与身份信息：用于注册、登录、身份校验、账号安全、创作者主页展示和必要的服务通知。',
                    '资料与内容信息：用于头像、昵称、主页资料、图文、视频、封面、作品、合集、投稿记录等内容的发布、审核、展示和管理。',
                    '互动与活动信息：用于评论、收藏、关注、报名、投票、浏览记录、活动进展、结果公示和反馈统计。',
                    '设备与日志信息：用于服务运行、安全风控、异常排查、基础统计分析以及防止账号或系统被异常使用。',
                    '客服与申诉信息：用于处理咨询、投诉、反馈、权利请求、账号争议和必要的身份核验。'
                ]
            },
            {
                id: 'permission',
                badge: '03',
                title: '设备权限与敏感信息说明',
                shortTitle: '设备权限',
                paragraphs: [
                    '当你使用图片上传、视频发布、扫码、消息提醒等功能时，我们可能向你申请相册、相机、麦克风、通知等系统权限。你可以在系统设置中关闭相关权限，关闭后仅影响对应功能。',
                    '如某项功能涉及敏感个人信息或系统权限，我们会在具体场景中单独提示处理目的、方式和范围，并在取得你的授权后使用。'
                ],
                items: [
                    '相册或存储权限用于选择图片、视频、封面素材以及保存必要文件。',
                    '相机权限用于拍摄内容、扫码或完成你主动发起的相关操作。',
                    '麦克风权限用于视频录制或其他需要采集声音的功能。',
                    '通知权限用于接收活动进展、审核结果、互动提醒和系统公告。'
                ]
            },
            {
                id: 'cookies-sdk',
                badge: '04',
                title: 'Cookie、同类技术与第三方服务',
                shortTitle: '第三方服务',
                paragraphs: [
                    '为保障网页访问、登录状态、基础统计和安全风控，我们可能使用 Cookie 或同类技术。你可以通过浏览器设置管理相关能力，但部分设置可能影响服务体验。',
                    '为实现文件存储、消息推送、统计分析、安全防护、二维码生成等必要能力，我们可能接入第三方服务或 SDK。我们会对合作方进行必要评估，并要求其按照约定目的和范围处理信息。'
                ],
                items: [
                    '我们不会要求第三方将个人信息用于与本产品服务无关的目的。',
                    '涉及第三方页面、服务或链接时，请同时阅读对应第三方规则。',
                    '如第三方服务清单发生重要变化，我们将通过合理方式更新说明。'
                ]
            },
            {
                id: 'share',
                badge: '05',
                title: '信息共享、委托处理与公开展示',
                shortTitle: '共享展示',
                paragraphs: [
                    '我们不会出售你的个人信息。因服务实现、技术支持、客服处理、安全保障或依法合规需要与合作方共享或委托处理信息时，我们会遵循合法、正当、必要原则，并通过协议约束合作方。',
                    '你主动发布的内容、创作者主页、投稿作品、活动榜单、评论及互动信息，可能根据产品功能和活动规则向其他用户展示。请避免在公开区域主动披露不必要的个人信息。'
                ]
            },
            {
                id: 'storage-security',
                badge: '06',
                title: '信息保存与安全保护',
                shortTitle: '保存安全',
                paragraphs: [
                    '我们会在实现处理目的所必需的期限内保存个人信息。法律法规另有规定、争议处理或安全审计确有必要的，将在必要期限内依法保存；超出保存期限后，我们会删除或进行匿名化处理。',
                    '我们通过访问控制、权限分级、传输加密、日志审计、备份恢复和安全监测等措施保护信息安全。同时，你也应妥善保管账号、密码、验证码和登录设备。'
                ]
            },
            {
                id: 'rights',
                badge: '07',
                title: '你的个人信息权利',
                shortTitle: '你的权利',
                paragraphs: ['在法律法规规定范围内，你可以依法行使查询、复制、更正、补充、删除、撤回同意、注销账号、解释说明和投诉反馈等权利。'],
                items: [
                    '你可以在产品功能中维护账号资料、主页资料、作品资料和部分互动展示信息。',
                    '你可以通过本页面联系方式提交个人信息权利请求，我们将在核验身份后依法处理。',
                    '对于因合规、安全、审计或争议处理需要暂时无法删除的信息，我们会在必要范围内进行限制处理。'
                ]
            },
            {
                id: 'minor',
                badge: '08',
                title: '未成年人保护',
                shortTitle: '未成年人',
                paragraphs: [
                    '我们重视未成年人个人信息保护。未成年人使用本服务前，应取得监护人同意，并在监护人指导下阅读本政策和使用相关服务。',
                    '如监护人发现未成年人信息被不当处理，或需要行使相关权利，可以通过本页面联系方式与我们联系。'
                ]
            },
            {
                id: 'change',
                badge: '09',
                title: '政策更新',
                shortTitle: '政策更新',
                paragraphs: [
                    '当产品功能、业务场景、个人信息处理规则或法律法规要求发生变化时，我们可能更新本政策。',
                    '涉及重大变更的，我们将通过页面提示、公告或其他合理方式告知。更新后的政策自公布或通知载明的日期起生效。'
                ]
            }
        ] satisfies LegalSection[]
    }
}

function createAgreementContent(locale: SupportLocale): LegalDocumentContent {
    const product = serviceName[locale]
    if (locale === 'en-US') {
        return {
            title: 'User Agreement',
            documentTitle: `User Agreement - ${product}`,
            summary:
                'This Agreement sets out the terms between you and CeBa regarding account registration, content publishing, activities, work display, creator profiles, interactions, and related services. Please read it carefully before using the services.',
            metas: [
                productMeta(locale),
                { label: 'Effective date', value: dateText[locale] },
                { label: 'Last updated', value: dateText[locale] },
                { label: 'Applies to', value: 'Registered users, creators, activity participants, and operators' }
            ],
            sections: [
                {
                    id: 'scope',
                    badge: '01',
                    title: 'Scope of Agreement',
                    shortTitle: 'Scope',
                    paragraphs: [
                        'This Agreement applies when you access, register, log in to, or use CeBa web pages, mobile web pages, the app, and related content services.',
                        'By using the services, you acknowledge that you have read, understood, and agreed to this Agreement. If you do not agree, please stop using the services.',
                        'This Agreement, together with the Privacy Policy, activity rules, publishing rules, management notices, and other rules published by the platform, constitutes the complete rules for your use of the services.'
                    ]
                },
                {
                    id: 'account',
                    badge: '02',
                    title: 'Account Registration and Use',
                    shortTitle: 'Account',
                    paragraphs: [
                        'You shall register and use your account with true, lawful, and valid information, and you are responsible for actions taken through your account.'
                    ],
                    items: [
                        'Do not impersonate another person, organization, or use information that may cause confusion.',
                        'Keep your account, password, verification code, and login device secure. Do not lend, transfer, rent, or sell accounts.',
                        'If you discover abnormal account activity or security risks, contact the platform promptly.',
                        'Losses caused by your disclosure, transfer, or improper custody of account credentials shall be borne by you according to law.'
                    ]
                },
                {
                    id: 'service',
                    badge: '03',
                    title: 'Platform Services',
                    shortTitle: 'Services',
                    paragraphs: [
                        'CeBa may provide content browsing, publishing, work display, activities, creator profiles, interaction feedback, review workflows, and backend management services according to operation arrangements.',
                        'The platform may continue to optimize service functions and presentation, and may adjust specific functions, display rules, activity entries, or operation strategies based on business needs.'
                    ],
                    items: [
                        'General users may browse content, participate in interactions, follow creators, or join activities.',
                        'Creators may publish content, maintain profile information, manage works, and submit works to activities.',
                        'Operators may review content, manage activities and works, and maintain data within authorized permissions.'
                    ]
                },
                {
                    id: 'content-rule',
                    badge: '04',
                    title: 'Content Publishing and Activity Rules',
                    shortTitle: 'Content rules',
                    paragraphs: [
                        'Text, images, videos, comments, submissions, work materials, and other content you publish shall comply with applicable laws, public order, good customs, and platform rules.',
                        'You shall ensure that you have lawful rights or necessary authorization for the content you publish and do not infringe intellectual property, portrait, reputation, privacy, or other lawful rights of others.'
                    ],
                    items: [
                        'Do not publish information prohibited by law, information that infringes others’ rights, or information that disrupts platform order.',
                        'Do not affect normal service operation through batch operations, abnormal interactions, inducement, or malicious complaints.',
                        'Activity submissions, evaluations, displays, and result publication shall follow applicable activity rules and review arrangements.',
                        'If you reproduce, quote, or use third-party materials, you shall obtain lawful authorization and retain necessary proof.'
                    ]
                },
                {
                    id: 'management',
                    badge: '05',
                    title: 'Platform Management Measures',
                    shortTitle: 'Management',
                    paragraphs: [
                        'To maintain service order, user rights, and system security, the platform may manage content or accounts based on laws, this Agreement, and relevant rules.',
                        'For content that may affect platform security, infringe others’ rights, violate activity rules, or fail to meet display requirements, the platform may remind, request correction, limit display, remove content, or suspend related functions.'
                    ],
                    items: [
                        'Management measures will be assessed based on specific circumstances, impact, appeals, and verifiable materials.',
                        'You may submit feedback or appeals through platform channels, and we will handle them within a reasonable period.',
                        'The platform will cooperate with lawful requests from competent authorities and retain or provide relevant records where necessary.'
                    ]
                },
                {
                    id: 'ip',
                    badge: '06',
                    title: 'Intellectual Property and Content License',
                    shortTitle: 'IP rights',
                    paragraphs: [
                        'You retain the rights you lawfully own in content you publish.',
                        'To provide content display, recommendation, activity selection, ranking publication, work preservation, operation promotion, and service optimization, you grant the platform a necessary license to use, display, reproduce, distribute, and adjust the display format within the service scope.',
                        'Product interfaces, technical capabilities, operation materials, logos, page designs, and related platform content are owned by the platform or relevant rights holders unless they legally belong to users or third parties.'
                    ]
                },
                {
                    id: 'privacy',
                    badge: '07',
                    title: 'Personal Information Protection',
                    shortTitle: 'Privacy',
                    paragraphs: [
                        'The platform processes and protects your personal information according to the Privacy Policy.',
                        'When using public display features such as avatars, nicknames, profiles, submitted works, and comments, avoid disclosing unnecessary personal information.',
                        'If you need to access, correct, delete personal information, or close your account, you may submit a request through product features or contact methods on this page.'
                    ]
                },
                {
                    id: 'minor',
                    badge: '08',
                    title: 'Rules for Minors',
                    shortTitle: 'Minors',
                    paragraphs: [
                        'Minors should obtain guardian consent and use the services under guardian guidance. Guardians should pay attention to account use, content publishing, and interactions by minors.',
                        'If a guardian believes a minor’s use of the service or information processing is inappropriate, the guardian may contact us through the platform contact methods.'
                    ]
                },
                {
                    id: 'risk',
                    badge: '09',
                    title: 'Service Risks and Liability',
                    shortTitle: 'Liability',
                    paragraphs: [
                        'The platform will make reasonable efforts to keep services stable and secure. For interruptions, delays, or data abnormalities caused by network failures, system maintenance, third-party service issues, force majeure, or user reasons, the platform will repair and handle them within a reasonable scope.',
                        'You should independently evaluate the applicability of information, activity arrangements, and interactive content obtained through the platform and be responsible for your use.'
                    ]
                },
                {
                    id: 'change',
                    badge: '10',
                    title: 'Agreement Updates and Dispute Handling',
                    shortTitle: 'Updates',
                    paragraphs: [
                        'The platform may update this Agreement due to business development, service adjustments, or legal changes, and notify you through announcements, in-site prompts, or other reasonable methods.',
                        'The updated Agreement takes effect from the publication date or the date stated in the notice. Continued use of the services means acceptance of the updated Agreement.',
                        'The formation, performance, interpretation, and dispute resolution of this Agreement are governed by the laws of the People’s Republic of China.'
                    ]
                }
            ]
        }
    }

    if (locale === 'zh-TW') {
        return {
            title: '使用者協議',
            documentTitle: `使用者協議 - ${product}`,
            summary: `本協議是你與${product}之間關於帳號註冊、內容發布、活動參與、作品展示、創作者主頁、互動交流及相關服務使用的約定。請在使用服務前仔細閱讀並充分理解。`,
            metas: [
                productMeta(locale),
                { label: '生效日期', value: dateText[locale] },
                { label: '更新日期', value: dateText[locale] },
                { label: '適用對象', value: '註冊使用者、創作者、活動參與者、營運人員' }
            ],
            sections: [
                {
                    id: 'scope',
                    badge: '01',
                    title: '協議範圍',
                    shortTitle: '協議範圍',
                    paragraphs: [
                        `本協議適用於你訪問、註冊、登入或使用${product}提供的網頁端、行動端網頁、App 及配套內容服務。`,
                        '你開始使用本服務即表示已閱讀、理解並同意本協議。如你不同意本協議內容，應停止使用相關服務。',
                        '本協議與平台已發布或後續發布的隱私政策、活動規則、發布規範、管理公告等共同構成你使用本服務的完整規則。'
                    ]
                },
                {
                    id: 'account',
                    badge: '02',
                    title: '帳號註冊與使用',
                    shortTitle: '帳號使用',
                    paragraphs: ['你應使用真實、合法、有效的資訊註冊和使用帳號，並對透過帳號進行的操作承擔相應責任。'],
                    items: [
                        '不得冒用他人身分、機構名稱或其他可能造成混淆的資訊。',
                        '應妥善保管帳號、密碼、驗證碼和登入設備，不得出借、轉讓、出租或售賣帳號。',
                        '發現帳號異常、被他人使用或存在安全風險時，應及時透過平台提供的方式處理。',
                        '因你主動洩露、轉讓或保管不當導致的損失，由你依法自行承擔。'
                    ]
                },
                {
                    id: 'service',
                    badge: '03',
                    title: '平台服務內容',
                    shortTitle: '服務內容',
                    paragraphs: [
                        `${product}可根據營運安排提供內容瀏覽、內容發布、作品展示、活動服務、創作者主頁、互動回饋、審核流程和後台管理等服務。`,
                        '平台會持續優化服務功能和頁面呈現，並可能根據業務情況對具體功能、展示規則、活動入口或營運策略進行調整。'
                    ],
                    items: [
                        '普通使用者可以瀏覽內容、參與互動、關注創作者或參與活動。',
                        '創作者可以發布內容、維護主頁資料、管理作品和參與活動投稿。',
                        '營運人員可以在授權範圍內進行內容審核、活動管理、作品管理和資料維護。'
                    ]
                },
                {
                    id: 'content-rule',
                    badge: '04',
                    title: '內容發布與活動規則',
                    shortTitle: '內容規則',
                    paragraphs: [
                        '你發布的文字、圖片、影片、評論、活動投稿、作品資料等內容應符合法律法規、公序良俗和平台管理規範。',
                        '你應確保對所發布內容擁有合法權利或已取得必要授權，不得侵犯他人知識產權、肖像權、名譽權、隱私權等合法權益。'
                    ],
                    items: [
                        '不得發布法律法規禁止的資訊、侵犯他人權益的資訊或擾亂平台秩序的資訊。',
                        '不得透過批量操作、異常互動、誘導行為、惡意投訴等方式影響服務正常運行。',
                        '活動投稿、評選、展示、結果公示等事項應遵守對應活動規則和審核安排。',
                        '涉及轉載、引用或使用第三方素材的，應自行取得合法授權並保留必要證明。'
                    ]
                },
                {
                    id: 'management',
                    badge: '05',
                    title: '平台管理措施',
                    shortTitle: '平台管理',
                    paragraphs: [
                        '為維護服務秩序、使用者權益和系統安全，平台有權依據法律法規、本協議及相關規則，對內容或帳號進行必要管理。',
                        '對於可能影響平台安全、侵犯他人權益、違反活動規則或不符合展示要求的內容，平台可採取提醒、要求修改、限制展示、下架、暫停相關功能等措施。'
                    ],
                    items: [
                        '平台處理措施將結合具體情形、影響程度、使用者申訴和可核驗材料綜合判斷。',
                        '你可以按照平台提供的方式提交回饋或申訴，我們會在合理期限內處理。',
                        '平台依法配合有權機關要求，並在必要範圍內保存或提供相關記錄。'
                    ]
                },
                {
                    id: 'ip',
                    badge: '06',
                    title: '知識產權與內容授權',
                    shortTitle: '知識產權',
                    paragraphs: [
                        '你保留對自己合法發布內容依法享有的權利。',
                        '為實現內容展示、推薦、活動評選、榜單公示、作品沉澱、營運推廣和服務優化，你同意授予平台在服務範圍內使用、展示、複製、傳播和調整展示形式的必要授權。',
                        '平台自身的產品介面、技術能力、營運資料、標識、頁面設計及相關內容，除依法屬於第三方或使用者的內容外，由平台或相應權利人依法享有權利。'
                    ]
                },
                {
                    id: 'privacy',
                    badge: '07',
                    title: '個人資訊保護',
                    shortTitle: '個人資訊',
                    paragraphs: [
                        '平台將按照《隱私政策》處理和保護你的個人資訊。',
                        '你在使用頭像、暱稱、主頁資料、投稿作品、評論互動等公開展示功能時，應注意避免主動披露不必要的個人資訊。',
                        '如你需要查詢、更正、刪除個人資訊或註銷帳號，可以透過產品功能或本頁面聯繫方式提交請求。'
                    ]
                },
                {
                    id: 'minor',
                    badge: '08',
                    title: '未成年人使用規則',
                    shortTitle: '未成年人',
                    paragraphs: [
                        '未成年人使用本服務前，應取得監護人同意並在監護人指導下使用。監護人應關注未成年人帳號使用、內容發布和互動行為。',
                        '如監護人認為未成年人使用服務或資訊處理存在不當情形，可透過平台聯繫方式與我們聯繫。'
                    ]
                },
                {
                    id: 'risk',
                    badge: '09',
                    title: '服務風險與責任說明',
                    shortTitle: '責任說明',
                    paragraphs: [
                        '平台將盡合理努力保障服務穩定和安全，但因網路故障、系統維護、第三方服務異常、不可抗力或使用者自身原因導致的服務中斷、延遲或資料異常，平台將在合理範圍內進行修復和處理。',
                        '你應自行判斷透過平台取得的資訊、活動安排和互動內容的適用性，並對自己的使用行為承擔相應責任。'
                    ]
                },
                {
                    id: 'change',
                    badge: '10',
                    title: '協議更新與爭議處理',
                    shortTitle: '協議更新',
                    paragraphs: [
                        '平台可根據業務發展、服務調整或法律法規變化更新本協議，並透過頁面公告、站內提示或其他合理方式告知。',
                        '更新後的協議自公布或通知載明的日期起生效。你繼續使用服務的，視為接受更新後的協議。',
                        '本協議的訂立、履行、解釋及爭議解決適用中華人民共和國法律。'
                    ]
                }
            ]
        }
    }

    return {
        title: '用户协议',
        documentTitle: `用户协议 - ${product}`,
        summary: `本协议是你与${product}之间关于账号注册、内容发布、活动参与、作品展示、创作者主页、互动交流及相关服务使用的约定。请在使用服务前仔细阅读并充分理解。`,
        metas: [
            productMeta(locale),
            { label: '生效日期', value: dateText[locale] },
            { label: '更新日期', value: dateText[locale] },
            { label: '适用对象', value: '注册用户、创作者、活动参与者、运营人员' }
        ],
        sections: [
            {
                id: 'scope',
                badge: '01',
                title: '协议范围',
                shortTitle: '协议范围',
                paragraphs: [
                    `本协议适用于你访问、注册、登录或使用${product}提供的网页端、移动端网页、App 及配套内容服务。`,
                    '你开始使用本服务即表示已阅读、理解并同意本协议。如你不同意本协议内容，应停止使用相关服务。',
                    '本协议与平台已发布或后续发布的隐私政策、活动规则、发布规范、管理公告等共同构成你使用本服务的完整规则。'
                ]
            },
            {
                id: 'account',
                badge: '02',
                title: '账号注册与使用',
                shortTitle: '账号使用',
                paragraphs: ['你应使用真实、合法、有效的信息注册和使用账号，并对通过账号进行的操作承担相应责任。'],
                items: [
                    '不得冒用他人身份、机构名称或其他可能造成混淆的信息。',
                    '应妥善保管账号、密码、验证码和登录设备，不得出借、转让、出租或售卖账号。',
                    '发现账号异常、被他人使用或存在安全风险时，应及时通过平台提供的方式处理。',
                    '因你主动泄露、转让或保管不当导致的损失，由你依法自行承担。'
                ]
            },
            {
                id: 'service',
                badge: '03',
                title: '平台服务内容',
                shortTitle: '服务内容',
                paragraphs: [
                    `${product}可根据运营安排提供内容浏览、内容发布、作品展示、活动服务、创作者主页、互动反馈、审核流程和后台管理等服务。`,
                    '平台会持续优化服务功能和页面呈现，并可能根据业务情况对具体功能、展示规则、活动入口或运营策略进行调整。'
                ],
                items: [
                    '普通用户可以浏览内容、参与互动、关注创作者或参与活动。',
                    '创作者可以发布内容、维护主页资料、管理作品和参与活动投稿。',
                    '运营人员可以在授权范围内进行内容审核、活动管理、作品管理和数据维护。'
                ]
            },
            {
                id: 'content-rule',
                badge: '04',
                title: '内容发布与活动规则',
                shortTitle: '内容规则',
                paragraphs: [
                    '你发布的文字、图片、视频、评论、活动投稿、作品资料等内容应符合法律法规、公序良俗和平台管理规范。',
                    '你应确保对所发布内容拥有合法权利或已取得必要授权，不得侵犯他人知识产权、肖像权、名誉权、隐私权等合法权益。'
                ],
                items: [
                    '不得发布法律法规禁止的信息、侵犯他人权益的信息或扰乱平台秩序的信息。',
                    '不得通过批量操作、异常互动、诱导行为、恶意投诉等方式影响服务正常运行。',
                    '活动投稿、评选、展示、结果公示等事项应遵守对应活动规则和审核安排。',
                    '涉及转载、引用或使用第三方素材的，应自行取得合法授权并保留必要证明。'
                ]
            },
            {
                id: 'management',
                badge: '05',
                title: '平台管理措施',
                shortTitle: '平台管理',
                paragraphs: [
                    '为维护服务秩序、用户权益和系统安全，平台有权依据法律法规、本协议及相关规则，对内容或账号进行必要管理。',
                    '对于可能影响平台安全、侵犯他人权益、违反活动规则或不符合展示要求的内容，平台可采取提醒、要求修改、限制展示、下架、暂停相关功能等措施。'
                ],
                items: [
                    '平台处理措施将结合具体情形、违规影响、用户申诉和可核验材料综合判断。',
                    '你可以按照平台提供的方式提交反馈或申诉，我们会在合理期限内处理。',
                    '平台依法配合有权机关要求，并在必要范围内保存或提供相关记录。'
                ]
            },
            {
                id: 'ip',
                badge: '06',
                title: '知识产权与内容授权',
                shortTitle: '知识产权',
                paragraphs: [
                    '你保留对自己合法发布内容依法享有的权利。',
                    '为实现内容展示、推荐、活动评选、榜单公示、作品沉淀、运营推广和服务优化，你同意授予平台在服务范围内使用、展示、复制、传播和调整展示形式的必要授权。',
                    '平台自身的产品界面、技术能力、运营资料、标识、页面设计及相关内容，除依法属于第三方或用户的内容外，由平台或相应权利人依法享有权利。'
                ]
            },
            {
                id: 'privacy',
                badge: '07',
                title: '个人信息保护',
                shortTitle: '个人信息',
                paragraphs: [
                    '平台将按照《隐私政策》处理和保护你的个人信息。',
                    '你在使用头像、昵称、主页资料、投稿作品、评论互动等公开展示功能时，应注意避免主动披露不必要的个人信息。',
                    '如你需要查询、更正、删除个人信息或注销账号，可以通过产品功能或本页面联系方式提交请求。'
                ]
            },
            {
                id: 'minor',
                badge: '08',
                title: '未成年人使用规则',
                shortTitle: '未成年人',
                paragraphs: [
                    '未成年人使用本服务前，应取得监护人同意并在监护人指导下使用。监护人应关注未成年人账号使用、内容发布和互动行为。',
                    '如监护人认为未成年人使用服务或信息处理存在不当情形，可通过平台联系方式与我们联系。'
                ]
            },
            {
                id: 'risk',
                badge: '09',
                title: '服务风险与责任说明',
                shortTitle: '责任说明',
                paragraphs: [
                    '平台将尽合理努力保障服务稳定和安全，但因网络故障、系统维护、第三方服务异常、不可抗力或用户自身原因导致的服务中断、延迟或数据异常，平台将在合理范围内进行修复和处理。',
                    '你应自行判断通过平台获取的信息、活动安排和互动内容的适用性，并对自己的使用行为承担相应责任。'
                ]
            },
            {
                id: 'change',
                badge: '10',
                title: '协议更新与争议处理',
                shortTitle: '协议更新',
                paragraphs: [
                    '平台可根据业务发展、服务调整或法律法规变化更新本协议，并通过页面公告、站内提示或其他合理方式告知。',
                    '更新后的协议自公布或通知载明的日期起生效。你继续使用服务的，视为接受更新后的协议。',
                    '本协议的订立、履行、解释及争议解决适用中华人民共和国法律。'
                ]
            }
        ] satisfies LegalSection[]
    }
}

function normalizeAgreementBadges(sections: LegalSection[]) {
    return sections.map((section, index) => ({
        ...section,
        badge: String(index + 1).padStart(2, '0')
    }))
}

function insertAfterSection(sections: LegalSection[], targetId: string, newSection: LegalSection) {
    const nextSections: LegalSection[] = []
    for (const section of sections) {
        nextSections.push(section)
        if (section.id === targetId) {
            nextSections.push(newSection)
        }
    }
    return nextSections
}

function createAssessmentSection(locale: SupportLocale): LegalSection {
    if (locale === 'en-US') {
        return {
            id: 'career-assessment',
            badge: '',
            title: 'Career Assessment Service Notice',
            shortTitle: 'Assessments',
            paragraphs: [
                'Career assessment tools provided by the platform, including personality or career preference assessments, are intended only to support self-understanding and career planning discussion.',
                'Assessment outputs are not professional psychological diagnoses, medical opinions, employment qualification conclusions, or guaranteed career advice.',
                'Assessment results may be affected by the user’s environment, understanding of questions, current mood, and subjective choices. The platform does not guarantee absolute accuracy, completeness, or applicability of assessment results.'
            ]
        }
    }

    if (locale === 'zh-TW') {
        return {
            id: 'career-assessment',
            badge: '',
            title: '職業測評服務特別說明',
            shortTitle: '職業測評',
            paragraphs: [
                '平台提供的職業測評工具，包括職業性格、職業偏好或類似自我認知測評，僅作為使用者了解自身特點和開展職業規劃討論的參考。',
                '測評結果不構成專業心理診斷、醫療意見、職業准入結論或保證性職業建議。',
                '測評結果可能受到使用者答題環境、題目理解、當前狀態及主觀選擇等因素影響。平台不對測評結果的絕對準確性、完整性或適用性作出保證。'
            ]
        }
    }

    return {
        id: 'career-assessment',
        badge: '',
        title: '职业测评服务特别说明',
        shortTitle: '职业测评',
        paragraphs: [
            '平台提供的职业测评工具，包括职业性格、职业偏好或类似自我认知测评，仅作为用户了解自身特点和开展职业规划讨论的参考。',
            '测评结果不构成专业心理诊断、医疗意见、职业准入结论或保证性职业建议。',
            '测评结果可能受到用户答题环境、题目理解、当前状态及主观选择等因素影响。平台不对测评结果的绝对准确性、完整性或适用性作出保证。'
        ]
    }
}

function createCampusEventSection(locale: SupportLocale): LegalSection {
    if (locale === 'en-US') {
        return {
            id: 'campus-event',
            badge: '',
            title: 'Campus Events and Activity Information',
            shortTitle: 'Events',
            paragraphs: [
                'Campus event and activity information displayed on the platform, including registration periods, participation requirements, awards, schedules, and organizer information, may come from public channels, users, or third-party organizers.',
                'Unless expressly stated, CeBa is not the organizer, sponsor, or guarantor of third-party events. Before participating, submitting works, providing personal materials, or paying fees, users should independently verify the organizer’s identity, rules, and risk information.',
                'Disputes arising from third-party events shall be handled by the relevant parties according to applicable rules and laws. The platform may provide necessary assistance within a reasonable scope.'
            ]
        }
    }

    if (locale === 'zh-TW') {
        return {
            id: 'campus-event',
            badge: '',
            title: '校園賽事與活動資訊',
            shortTitle: '賽事活動',
            paragraphs: [
                '平台展示的校園賽事及活動資訊，包括報名時間、參與條件、獎項設定、活動流程和主辦方資訊等，可能來源於公開渠道、使用者或第三方主辦方。',
                '除非頁面明確標註，測吧不作為第三方賽事或活動的主辦方、承辦方或保證方。使用者在參與活動、提交作品、提供個人資料或支付相關費用前，應自行核實主辦方身份、活動規則及風險資訊。',
                '因第三方賽事或活動產生的爭議，應由相關方依據活動規則和法律規定處理。平台可在合理範圍內提供必要協助。'
            ]
        }
    }

    return {
        id: 'campus-event',
        badge: '',
        title: '校园赛事与活动信息',
        shortTitle: '赛事活动',
        paragraphs: [
            '平台展示的校园赛事及活动信息，包括报名时间、参与条件、奖项设置、活动流程和主办方信息等，可能来源于公开渠道、用户或第三方主办方。',
            '除非页面明确标注，测吧不作为第三方赛事或活动的主办方、承办方或保证方。用户在参与活动、提交作品、提供个人资料或支付相关费用前，应自行核实主办方身份、活动规则及风险信息。',
            '因第三方赛事或活动产生的争议，应由相关方依据活动规则和法律规定处理。平台可在合理范围内提供必要协助。'
        ]
    }
}

function enhanceAgreementContent(locale: SupportLocale, agreement: LegalDocumentContent): LegalDocumentContent {
    const product = serviceName[locale]

    if (locale === 'en-US') {
        const sections = agreement.sections.map(section => {
            if (section.id === 'service') {
                return {
                    ...section,
                    paragraphs: [
                        'CeBa is an interactive community focused on campus career planning, career assessments, and campus event information sharing. The platform provides career growth references and activity information through text, images, short videos, works, and related interactive features.',
                        'The platform may provide content browsing, publishing, work display, activities, creator profiles, interaction feedback, review workflows, and backend management services according to operation arrangements.'
                    ],
                    items: [
                        'General users may browse career planning content, activity information, works, and creator profiles.',
                        'Creators may publish career planning content, campus event experiences, works, and related image or video materials.',
                        'Operators may review content, manage activities and works, maintain basic data, and handle necessary service feedback within authorized permissions.'
                    ]
                }
            }
            if (section.id === 'content-rule') {
                return {
                    ...section,
                    paragraphs: [
                        ...section.paragraphs,
                        'When sharing campus event experiences, career planning videos, graphic content, or works, users shall ensure originality or lawful authorization and shall not copy, rewrite, repost, or publish third-party works without authorization.',
                        'Users shall not publish content involving unfair competition, personal attacks, discriminatory expressions, derogatory statements toward schools, regions, occupations, or groups, or other content inconsistent with laws and platform rules.'
                    ],
                    items: [
                        ...(section.items || []),
                        'If content includes third-party materials, event works, interview materials, charts, images, music, or video clips, users shall obtain necessary authorization and retain proof.',
                        'Public content posted by users may be used by the platform within the scope permitted by law and necessary for platform display, activity promotion, case presentation, recommendation, and service optimization.'
                    ]
                }
            }
            if (section.id === 'management') {
                return {
                    ...section,
                    paragraphs: [
                        ...section.paragraphs,
                        'If a user publishes false event information, interferes with rankings or activity results through vote manipulation or cheating, conducts personal attacks, or otherwise disrupts platform order, the platform may take necessary measures according to the circumstances.'
                    ],
                    items: [
                        ...(section.items || []),
                        'Management measures may include content deletion, correction requests, display restrictions, function limitations, account suspension, or permanent account closure where necessary.'
                    ]
                }
            }
            if (section.id === 'minor') {
                return {
                    ...section,
                    paragraphs: [
                        'The platform attaches importance to protecting minors and student users. Minors should obtain guardian consent and use the services under guardian guidance.',
                        'Users shall not publish content that misleads student groups or promotes inappropriate career views, occupational discrimination, harmful workplace narratives, or other content unsuitable for minors or student users.',
                        'If a guardian believes a minor’s use of the service or information processing is inappropriate, the guardian may contact us through the platform contact methods.'
                    ]
                }
            }
            if (section.id === 'risk') {
                return {
                    ...section,
                    paragraphs: [
                        'Career planning, interview experience, campus event experience, and similar content shared by platform users represents the publisher’s personal experience or opinion only. Users should make prudent decisions based on their own circumstances.',
                        'The platform does not guarantee that users will obtain specific positions, awards, qualifications, opportunities, or results by relying on platform content, assessment results, or activity information.',
                        'The platform will make reasonable efforts to keep services stable and secure. For interruptions, delays, data abnormalities, or losses caused by system maintenance, network failures, third-party service issues, security incidents, force majeure, or user reasons, the platform will repair and handle them within a reasonable scope according to law.'
                    ]
                }
            }
            return section
        })

        return {
            ...agreement,
            title: 'CeBa User Service Agreement',
            documentTitle: `CeBa User Service Agreement - ${product}`,
            summary:
                'This Agreement sets out the terms for using CeBa, an interactive community for campus career planning, career assessments, event information, content publishing, works display, creator profiles, and related services.',
            sections: normalizeAgreementBadges(
                insertAfterSection(insertAfterSection(sections, 'service', createAssessmentSection(locale)), 'content-rule', createCampusEventSection(locale))
            )
        }
    }

    if (locale === 'zh-TW') {
        const sections = agreement.sections.map(section => {
            if (section.id === 'service') {
                return {
                    ...section,
                    paragraphs: [
                        '測吧是專注於校園職場規劃、職業測評及校園賽事資訊分享的互動社區。平台透過文字、圖片、短影片、作品展示及互動功能，為使用者提供職業成長參考與活動資訊。',
                        `${product}可根據營運安排提供內容瀏覽、內容發布、作品展示、活動服務、創作者主頁、互動回饋、審核流程和後台管理等服務。`
                    ],
                    items: [
                        '普通使用者可以瀏覽職業規劃內容、活動資訊、作品展示和創作者主頁。',
                        '創作者可以發布職業規劃內容、校園賽事心得、作品及相關圖文或影片資料。',
                        '營運人員可以在授權範圍內進行內容審核、活動管理、作品管理、基礎資料維護和必要服務回饋。'
                    ]
                }
            }
            if (section.id === 'content-rule') {
                return {
                    ...section,
                    paragraphs: [
                        ...section.paragraphs,
                        '使用者在平台分享校園賽事心得、職場規劃影片、圖文內容或作品資料時，應確保內容為原創或已取得合法授權，不得抄襲、搬運、改寫或未經授權發布他人作品。',
                        '使用者不得發布涉及不正當競爭、人身攻擊、歧視性表述，或貶損特定院校、地域、職業或群體，以及其他不符合法律法規和平台規則的內容。'
                    ],
                    items: [
                        ...(section.items || []),
                        '內容涉及第三方素材、賽事作品、訪談資料、圖表、圖片、音樂或影片片段的，使用者應自行取得必要授權並保留證明。',
                        '使用者在平台發布的公開內容，可由平台在法律許可及服務必要範圍內，用於平台展示、活動推廣、案例呈現、內容推薦和服務優化。'
                    ]
                }
            }
            if (section.id === 'management') {
                return {
                    ...section,
                    paragraphs: [
                        ...section.paragraphs,
                        '如使用者發布虛假賽事資訊、透過刷票或作弊干擾排名或活動結果、進行人身攻擊，或以其他方式破壞平台秩序，平台可根據具體情形採取必要處理措施。'
                    ],
                    items: [...(section.items || []), '處理措施包括但不限於刪除內容、要求改正、限制展示、限制功能、暫停使用或在必要時永久關閉帳號。']
                }
            }
            if (section.id === 'minor') {
                return {
                    ...section,
                    paragraphs: [
                        '平台重視未成年人及學生群體保護。未成年人使用本服務前，應取得監護人同意並在監護人指導下使用。',
                        '使用者不得發布誤導學生群體，或宣揚不當職業觀、職業歧視、不良職場敘事，以及其他不適合未成年人或學生群體接觸的內容。',
                        '如監護人認為未成年人使用服務或資訊處理存在不當情形，可透過平台聯繫方式與我們聯繫。'
                    ]
                }
            }
            if (section.id === 'risk') {
                return {
                    ...section,
                    paragraphs: [
                        '平台使用者分享的職場規劃、面試經驗、校園賽事心得等內容，僅代表發布者個人經驗或觀點。使用者應結合自身情況審慎參考。',
                        '平台不保證使用者依據平台內容、測評結果或活動資訊即可取得特定職位、獎項、資格、機會或結果。',
                        '平台將盡合理努力保障服務穩定和安全，但因系統維護、網路故障、第三方服務異常、安全事件、不可抗力或使用者自身原因導致的服務中斷、延遲、資料異常或損失，平台將依法在合理範圍內進行修復和處理。'
                    ]
                }
            }
            return section
        })

        return {
            ...agreement,
            title: `${product}使用者服務協議`,
            documentTitle: `${product}使用者服務協議`,
            summary: `本協議是你與${product}之間關於校園職場規劃、職業測評、賽事活動資訊、內容發布、作品展示、創作者主頁、互動交流及相關服務使用的約定。請在使用服務前仔細閱讀並充分理解。`,
            sections: normalizeAgreementBadges(
                insertAfterSection(insertAfterSection(sections, 'service', createAssessmentSection(locale)), 'content-rule', createCampusEventSection(locale))
            )
        }
    }

    const sections = agreement.sections.map(section => {
        if (section.id === 'service') {
            return {
                ...section,
                paragraphs: [
                    '测吧是专注于校园职场规划、职业测评及校园赛事信息分享的互动社区。平台通过文字、图片、短视频、作品展示及互动功能，为用户提供职业成长参考与活动资讯。',
                    `${product}可根据运营安排提供内容浏览、内容发布、作品展示、活动服务、创作者主页、互动反馈、审核流程和后台管理等服务。`
                ],
                items: [
                    '普通用户可以浏览职业规划内容、活动资讯、作品展示和创作者主页。',
                    '创作者可以发布职业规划内容、校园赛事心得、作品及相关图文或视频资料。',
                    '运营人员可以在授权范围内进行内容审核、活动管理、作品管理、基础资料维护和必要服务反馈。'
                ]
            }
        }
        if (section.id === 'content-rule') {
            return {
                ...section,
                paragraphs: [
                    ...section.paragraphs,
                    '用户在平台分享校园赛事心得、职场规划视频、图文内容或作品资料时，应确保内容为原创或已取得合法授权，不得抄袭、搬运、改写或未经授权发布他人作品。',
                    '用户不得发布涉及不正当竞争、人身攻击、歧视性表述，或贬损特定院校、地域、职业或群体，以及其他不符合法律法规和平台规则的内容。'
                ],
                items: [
                    ...(section.items || []),
                    '内容涉及第三方素材、赛事作品、访谈资料、图表、图片、音乐或视频片段的，用户应自行取得必要授权并保留证明。',
                    '用户在平台发布的公开内容，可由平台在法律许可及服务必要范围内，用于平台展示、活动推广、案例呈现、内容推荐和服务优化。'
                ]
            }
        }
        if (section.id === 'management') {
            return {
                ...section,
                paragraphs: [
                    ...section.paragraphs,
                    '如用户发布虚假赛事信息、通过刷票或作弊干扰排名或活动结果、进行人身攻击，或以其他方式破坏平台秩序，平台可根据具体情形采取必要处理措施。'
                ],
                items: [...(section.items || []), '处理措施包括但不限于删除内容、要求改正、限制展示、限制功能、暂停使用或在必要时永久关闭账号。']
            }
        }
        if (section.id === 'minor') {
            return {
                ...section,
                paragraphs: [
                    '平台重视未成年人及学生群体保护。未成年人使用本服务前，应取得监护人同意并在监护人指导下使用。',
                    '用户不得发布误导学生群体，或宣扬不当职业观、职业歧视、不良职场叙事，以及其他不适合未成年人或学生群体接触的内容。',
                    '如监护人认为未成年人使用服务或信息处理存在不当情形，可通过平台联系方式与我们联系。'
                ]
            }
        }
        if (section.id === 'risk') {
            return {
                ...section,
                paragraphs: [
                    '平台用户分享的职场规划、面试经验、校园赛事心得等内容，仅代表发布者个人经验或观点。用户应结合自身情况审慎参考。',
                    '平台不保证用户依据平台内容、测评结果或活动信息即可取得特定岗位、奖项、资格、机会或结果。',
                    '平台将尽合理努力保障服务稳定和安全，但因系统维护、网络故障、第三方服务异常、安全事件、不可抗力或用户自身原因导致的服务中断、延迟、数据异常或损失，平台将依法在合理范围内进行修复和处理。'
                ]
            }
        }
        return section
    })

    return {
        ...agreement,
        title: `${product}用户服务协议`,
        documentTitle: `${product}用户服务协议`,
        summary: `本协议是你与${product}之间关于校园职场规划、职业测评、赛事活动信息、内容发布、作品展示、创作者主页、互动交流及相关服务使用的约定。请在使用服务前仔细阅读并充分理解。`,
        sections: normalizeAgreementBadges(
            insertAfterSection(insertAfterSection(sections, 'service', createAssessmentSection(locale)), 'content-rule', createCampusEventSection(locale))
        )
    }
}

function createContactLabels(locale: SupportLocale): LegalContactLabels {
    if (locale === 'en-US') {
        return {
            title: 'Contact Us',
            intro: 'If you have any questions, comments, suggestions, or rights requests related to this page, you may contact us through the following methods.',
            companyName: 'Entity',
            serviceName: 'Product',
            email: 'Email',
            address: 'Address',
            responseTime: 'Response time'
        }
    }
    if (locale === 'zh-TW') {
        return {
            title: '聯繫我們',
            intro: '如你對本頁面內容或相關權利行使存在疑問，可透過以下方式與我們聯繫。',
            companyName: '主體名稱',
            serviceName: '產品名稱',
            email: '聯繫信箱',
            address: '聯繫地址',
            responseTime: '處理時效'
        }
    }
    return {
        title: '联系我们',
        intro: '如你对本页面内容或相关权利行使存在疑问，可通过以下方式与我们联系。',
        companyName: '主体名称',
        serviceName: '产品名称',
        email: '联系邮箱',
        address: '联系地址',
        responseTime: '处理时效'
    }
}

function createNavLabels(locale: SupportLocale): LegalNavLabels {
    if (locale === 'en-US') return { portal: 'Portal', agreement: 'User Service Agreement', privacy: 'Privacy Policy' }
    if (locale === 'zh-TW') return { portal: '門戶首頁', agreement: '使用者服務協議', privacy: '隱私政策' }
    return { portal: '门户首页', agreement: '用户服务协议', privacy: '隐私政策' }
}

export function getLegalContent(locale?: string | null): LegalBundle {
    const normalizedLocale = normalizeLocale(locale)
    return {
        privacy: createPrivacyContent(normalizedLocale),
        agreement: enhanceAgreementContent(normalizedLocale, createAgreementContent(normalizedLocale)),
        contact: createContactLabels(normalizedLocale),
        nav: createNavLabels(normalizedLocale)
    }
}

export function getLocalizedContact(locale?: string | null) {
    const normalizedLocale = normalizeLocale(locale)
    return {
        companyName: companyName[normalizedLocale],
        serviceName: serviceName[normalizedLocale],
        email: platformContact.email,
        address: addressText[normalizedLocale],
        responseTime: responseTime[normalizedLocale]
    }
}

export const privacyContent = getLegalContent('zh-CN').privacy
export const agreementContent = getLegalContent('zh-CN').agreement
