import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import createVitePlugins from './vite/plugins/index.ts'
import zipPack from 'vite-plugin-zip-pack'
import { visualizer } from 'rollup-plugin-visualizer'

const projectRootDir = fileURLToPath(new URL('.', import.meta.url))
const srcDir = fileURLToPath(new URL('./src', import.meta.url))

const proxyTargets = {
    wired: 'http://192.168.10.7:8080/api',
    wireless: 'http://192.168.100.26:8080/api',
    // production: 'http://47.109.96.135'
    production: 'http://47.108.212.205/'
} as const

type ProxyMode = keyof typeof proxyTargets

interface ViteRuntimeEnv {
    VITE_BUILD_COMPRESS?: string
    VITE_BUILD_ZIP?: string
    VITE_BUILD_ANALYZE?: string
    VITE_PROXY_TARGET?: string
    VITE_PROXY_MODE?: ProxyMode
    VITE_DROP_CONSOLE?: string
    VITE_GENERATE_SOURCEMAP?: string
    VITE_ENABLE_OBFUSCATION?: string
    VITE_USE_TERSER?: string
}

function resolveProxyTarget(env: ViteRuntimeEnv): string {
    const targetFromEnv = env.VITE_PROXY_TARGET?.trim()
    if (targetFromEnv) return targetFromEnv

    const proxyMode = env.VITE_PROXY_MODE as ProxyMode | undefined
    if (proxyMode && proxyTargets[proxyMode]) {
        return proxyTargets[proxyMode]
    }

    return proxyTargets.wireless
}

function manualChunks(id: string): string | undefined {
    if (!id.includes('node_modules')) return undefined
    const normalizedId = id.replace(/\\/g, '/')

    if (
        normalizedId.includes('/vue/') ||
        normalizedId.includes('/vue-router/') ||
        normalizedId.includes('/pinia/') ||
        normalizedId.includes('/element-plus/') ||
        normalizedId.includes('/@element-plus/icons-vue/') ||
        normalizedId.includes('/@popperjs/') ||
        normalizedId.includes('/@floating-ui/') ||
        normalizedId.includes('/async-validator/') ||
        normalizedId.includes('/@ctrl/tinycolor/') ||
        normalizedId.includes('/normalize-wheel-es/') ||
        normalizedId.includes('/memoize-one/')
    ) {
        return 'vendor-framework'
    }
    if (normalizedId.includes('/echarts/') || normalizedId.includes('/zrender/')) return 'vendor-echarts'
    if (
        normalizedId.includes('/video.js/') ||
        normalizedId.includes('/@videojs/') ||
        normalizedId.includes('/videojs-vtt.js/') ||
        normalizedId.includes('/m3u8-parser/') ||
        normalizedId.includes('/url-toolkit/') ||
        normalizedId.includes('/mpd-parser/') ||
        normalizedId.includes('/@xmldom/') ||
        normalizedId.includes('/mux.js/')
    ) {
        return 'vendor-videojs'
    }
    if (normalizedId.includes('/vue-cropper/')) return 'vendor-cropper'
    if (normalizedId.includes('/splitpanes/')) return 'vendor-layout'
    if (normalizedId.includes('/sortablejs/') || normalizedId.includes('/vue-draggable-plus/')) return 'vendor-dnd'
    if (normalizedId.includes('/clipboard/') || normalizedId.includes('/js-beautify/')) return 'vendor-builder'
    if (normalizedId.includes('/js-cookie/')) return 'vendor-auth'
    if (normalizedId.includes('/vue3-next-qrcode/') || normalizedId.includes('/js-binary-schema-parser/') || normalizedId.includes('/qrcode/')) {
        return 'vendor-qrcode'
    }
    if (
        normalizedId.includes('/codemirror/') ||
        normalizedId.includes('/@codemirror/') ||
        normalizedId.includes('/@lezer/') ||
        normalizedId.includes('/@marijn/') ||
        normalizedId.includes('/style-mod/') ||
        normalizedId.includes('/w3c-keyname/') ||
        normalizedId.includes('/crelt/')
    ) {
        return 'vendor-markdown-codemirror'
    }
    if (
        normalizedId.includes('/mermaid/') ||
        normalizedId.includes('/katex/') ||
        normalizedId.includes('/highlight.js/') ||
        normalizedId.includes('/medium-zoom/') ||
        normalizedId.includes('/jszip/')
    ) {
        return 'vendor-markdown-plugins'
    }
    if (
        normalizedId.includes('/md-editor-v3/') ||
        normalizedId.includes('/markdown-it/') ||
        normalizedId.includes('/markdown-it-image-figures/') ||
        normalizedId.includes('/markdown-it-sub/') ||
        normalizedId.includes('/markdown-it-sup/') ||
        normalizedId.includes('/linkify-it/') ||
        normalizedId.includes('/mdurl/') ||
        normalizedId.includes('/uc.micro/') ||
        normalizedId.includes('/xss/')
    ) {
        return 'vendor-markdown'
    }
    if (normalizedId.includes('/prettier/')) return 'vendor-prettier'
    if (normalizedId.includes('/dayjs/')) return 'vendor-date'
    if (normalizedId.includes('/fuse.js/') || normalizedId.includes('/pinyin-match/')) return 'vendor-search'
    if (
        normalizedId.includes('/lodash/') ||
        normalizedId.includes('/lodash-es/') ||
        normalizedId.includes('/lodash-unified/') ||
        normalizedId.includes('/lodash.clonedeep/') ||
        normalizedId.includes('/lodash.isequal/') ||
        normalizedId.includes('/lodash.merge/') ||
        normalizedId.includes('/lodash.truncate/')
    ) {
        return 'vendor-lodash'
    }
    if (normalizedId.includes('/@iconify-json/mdi/')) return 'vendor-iconify-mdi'
    if (normalizedId.includes('/@iconify-json/ep/')) return 'vendor-iconify-ep'
    if (normalizedId.includes('/@iconify-json/material-symbols/') || normalizedId.includes('/@iconify-json/simple-icons/')) return 'vendor-iconify-extra'
    if (normalizedId.includes('/@iconify/')) return 'vendor-iconify-core'
    if (normalizedId.includes('/axios/') || normalizedId.includes('/nprogress/') || normalizedId.includes('/file-saver/')) return 'vendor-network'
    if (normalizedId.includes('/@vueuse/core/') || normalizedId.includes('/@zeronejs/utils/')) return 'vendor-utils'
    return 'vendor-misc'
}

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, projectRootDir, '') as ViteRuntimeEnv
    const isBuild = command === 'build'
    const isProdBuild = isBuild && mode === 'production'
    const proxyTarget = resolveProxyTarget(env)
    const useTerserMinify = isProdBuild && env.VITE_USE_TERSER === 'true'
    const enableObfuscation = useTerserMinify && env.VITE_ENABLE_OBFUSCATION !== 'false'
    const shouldDropConsole = isProdBuild && env.VITE_DROP_CONSOLE !== 'false'
    const shouldGenerateSourceMap = env.VITE_GENERATE_SOURCEMAP === 'true' || (isBuild && !isProdBuild)
    const shouldGenerateZip = isBuild && env.VITE_BUILD_ZIP === 'true'
    const shouldAnalyzeBuild = isBuild && env.VITE_BUILD_ANALYZE === 'true'

    return {
        base: '/',
        plugins: [
            ...createVitePlugins(env, isBuild),
            shouldGenerateZip && zipPack({ outDir: 'dist', outFileName: 'dist.zip' }),
            shouldAnalyzeBuild &&
                visualizer({
                    filename: 'dist/stats.html',
                    template: 'treemap',
                    gzipSize: true,
                    brotliSize: true,
                    emitFile: false
                }),
            shouldAnalyzeBuild &&
                visualizer({
                    filename: 'dist/stats.json',
                    template: 'raw-data',
                    gzipSize: true,
                    brotliSize: true,
                    emitFile: false
                })
        ].filter(Boolean),

        resolve: {
            alias: {
                '~': resolve(projectRootDir),
                '@': srcDir
            },
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
        },

        build: {
            target: 'esnext',
            sourcemap: shouldGenerateSourceMap,
            outDir: 'dist',
            assetsDir: 'assets',
            chunkSizeWarningLimit: 2000,
            reportCompressedSize: false,
            cssMinify: 'esbuild',
            minify: isProdBuild && useTerserMinify ? 'terser' : 'esbuild',
            terserOptions: useTerserMinify
                ? {
                      compress: {
                          passes: enableObfuscation ? 2 : 1,
                          drop_console: shouldDropConsole,
                          drop_debugger: shouldDropConsole
                      },
                      mangle: enableObfuscation
                          ? {
                                safari10: true,
                                toplevel: true
                            }
                          : {
                                safari10: true
                            },
                      format: {
                          comments: false,
                          beautify: false
                      }
                  }
                : undefined,
            rolldownOptions: {
                output: {
                    manualChunks,
                    chunkFileNames: 'static/js/[name]-[hash].js',
                    entryFileNames: 'static/js/[name]-[hash].js',
                    assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
                }
            },
            esbuild: {
                drop: shouldDropConsole ? ['console', 'debugger'] : [],
                legalComments: 'none'
            }
        },

        server: {
            port: 80,
            host: true,
            open: false,
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true,
                    rewrite: p => p.replace(/^\/api/, '')
                },
                '^/v3/api-docs/(.*)': {
                    target: proxyTarget,
                    changeOrigin: true
                }
            }
        }
    }
})
