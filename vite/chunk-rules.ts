type ChunkRule = readonly [name: string, tokens: readonly string[]]

const NODE_MODULES_TOKEN = '/node_modules/'
const DEFAULT_VENDOR_CHUNK = 'vendor-misc'

const chunkRules = [
    [
        'vendor-framework',
        [
            '/vue/',
            '/vue-router/',
            '/pinia/',
            '/element-plus/',
            '/@popperjs/',
            '/@floating-ui/',
            '/async-validator/',
            '/@ctrl/tinycolor/',
            '/normalize-wheel-es/',
            '/memoize-one/'
        ]
    ],
    ['vendor-echarts', ['/echarts/', '/zrender/']],
    ['vendor-videojs', ['/video.js/', '/@videojs/', '/videojs-vtt.js/', '/m3u8-parser/', '/url-toolkit/', '/mpd-parser/', '/@xmldom/', '/mux.js/']],
    ['vendor-cropper', ['/vue-cropper/']],
    ['vendor-mobile-ui', ['/@varlet/ui/']],
    ['vendor-dnd', ['/sortablejs/', '/vue-draggable-plus/']],
    ['vendor-builder', ['/clipboard/', '/js-beautify/']],
    ['vendor-auth', ['/js-cookie/', '/pinia-plugin-persistedstate/']],
    ['vendor-qrcode', ['/vue3-next-qrcode/', '/qr-code-styling/', '/js-binary-schema-parser/', '/qrcode/']],
    ['vendor-markdown-codemirror', ['/codemirror/', '/@codemirror/', '/@lezer/', '/@marijn/', '/style-mod/', '/w3c-keyname/', '/crelt/']],
    ['vendor-markdown-plugins', ['/mermaid/', '/katex/', '/highlight.js/', '/medium-zoom/', '/jszip/']],
    [
        'vendor-markdown',
        [
            '/md-editor-v3/',
            '/markdown-it/',
            '/markdown-it-image-figures/',
            '/markdown-it-sub/',
            '/markdown-it-sup/',
            '/linkify-it/',
            '/mdurl/',
            '/uc.micro/',
            '/xss/'
        ]
    ],
    ['vendor-prettier', ['/prettier/']],
    ['vendor-date', ['/dayjs/']],
    ['vendor-search', ['/fuse.js/', '/pinyin-match/']],
    ['vendor-mock', ['/@faker-js/faker/']],
    ['vendor-lodash', ['/lodash/', '/lodash-es/', '/lodash-unified/', '/lodash.clonedeep/', '/lodash.isequal/', '/lodash.merge/', '/lodash.truncate/']],
    ['vendor-iconify-mdi', ['/@iconify-json/mdi/']],
    ['vendor-iconify-ep', ['/@iconify-json/ep/']],
    ['vendor-iconify-extra', ['/@iconify-json/material-symbols/', '/@iconify-json/simple-icons/']],
    ['vendor-iconify-core', ['/@iconify/']],
    ['vendor-network', ['/axios/', '/nprogress/', '/file-saver/']],
    ['vendor-utils', ['/@vueuse/core/', '/@zeronejs/utils/']]
] as const satisfies readonly ChunkRule[]

const chunkMatchers = chunkRules.flatMap(([name, tokens]) => tokens.map(token => [token, name] as const))

const normalizeModuleId = (id: string) => id.replace(/\\/g, '/').replace(/[?#].*$/, '')

export function manualChunks(id: string): string | undefined {
    const normalizedId = normalizeModuleId(id)
    if (!normalizedId.includes(NODE_MODULES_TOKEN)) return undefined

    return chunkMatchers.find(([token]) => normalizedId.includes(token))?.[1] || DEFAULT_VENDOR_CHUNK
}
