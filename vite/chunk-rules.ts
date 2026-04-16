export type ManualChunkRule = {
    name: string
    includes: string[]
}

const manualChunkRules: ManualChunkRule[] = [
    {
        name: 'vendor-framework',
        includes: [
            '/vue/',
            '/vue-router/',
            '/pinia/',
            '/element-plus/',
            '/@element-plus/icons-vue/',
            '/@popperjs/',
            '/@floating-ui/',
            '/async-validator/',
            '/@ctrl/tinycolor/',
            '/normalize-wheel-es/',
            '/memoize-one/'
        ]
    },
    { name: 'vendor-echarts', includes: ['/echarts/', '/zrender/'] },
    {
        name: 'vendor-videojs',
        includes: ['/video.js/', '/@videojs/', '/videojs-vtt.js/', '/m3u8-parser/', '/url-toolkit/', '/mpd-parser/', '/@xmldom/', '/mux.js/']
    },
    { name: 'vendor-cropper', includes: ['/vue-cropper/'] },
    { name: 'vendor-layout', includes: ['/splitpanes/'] },
    { name: 'vendor-dnd', includes: ['/sortablejs/', '/vue-draggable-plus/'] },
    { name: 'vendor-builder', includes: ['/clipboard/', '/js-beautify/'] },
    { name: 'vendor-auth', includes: ['/js-cookie/'] },
    { name: 'vendor-qrcode', includes: ['/vue3-next-qrcode/', '/js-binary-schema-parser/', '/qrcode/'] },
    { name: 'vendor-markdown-codemirror', includes: ['/codemirror/', '/@codemirror/', '/@lezer/', '/@marijn/', '/style-mod/', '/w3c-keyname/', '/crelt/'] },
    { name: 'vendor-markdown-plugins', includes: ['/mermaid/', '/katex/', '/highlight.js/', '/medium-zoom/', '/jszip/'] },
    {
        name: 'vendor-markdown',
        includes: [
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
    },
    { name: 'vendor-prettier', includes: ['/prettier/'] },
    { name: 'vendor-date', includes: ['/dayjs/'] },
    { name: 'vendor-search', includes: ['/fuse.js/', '/pinyin-match/'] },
    {
        name: 'vendor-lodash',
        includes: ['/lodash/', '/lodash-es/', '/lodash-unified/', '/lodash.clonedeep/', '/lodash.isequal/', '/lodash.merge/', '/lodash.truncate/']
    },
    { name: 'vendor-iconify-mdi', includes: ['/@iconify-json/mdi/'] },
    { name: 'vendor-iconify-ep', includes: ['/@iconify-json/ep/'] },
    { name: 'vendor-iconify-extra', includes: ['/@iconify-json/material-symbols/', '/@iconify-json/simple-icons/'] },
    { name: 'vendor-iconify-core', includes: ['/@iconify/'] },
    { name: 'vendor-network', includes: ['/axios/', '/nprogress/', '/file-saver/'] },
    { name: 'vendor-utils', includes: ['/@vueuse/core/', '/@zeronejs/utils/'] }
]

export function manualChunks(id: string): string | undefined {
    if (!id.includes('node_modules')) return undefined
    const normalizedId = id.replace(/\\/g, '/')
    const matched = manualChunkRules.find(rule => rule.includes.some(token => normalizedId.includes(token)))
    return matched?.name || 'vendor-misc'
}
