import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import createVitePlugins from './vite/plugins'
import zipPack from 'vite-plugin-zip-pack'

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
        normalizedId.includes('/element-plus/')
    ) {
        return 'vendor-framework'
    }
    if (normalizedId.includes('/echarts/')) return 'vendor-echarts'
    if (normalizedId.includes('/video.js/')) return 'vendor-videojs'
    if (normalizedId.includes('/vue-cropper/')) return 'vendor-cropper'
    if (normalizedId.includes('/splitpanes/')) return 'vendor-layout'
    if (normalizedId.includes('/sortablejs/') || normalizedId.includes('/vue-draggable-plus/')) return 'vendor-dnd'
    if (normalizedId.includes('/clipboard/') || normalizedId.includes('/js-beautify/')) return 'vendor-builder'
    if (normalizedId.includes('/jsencrypt/') || normalizedId.includes('/js-cookie/')) return 'vendor-auth'
    if (normalizedId.includes('/vue3-next-qrcode/') || normalizedId.includes('/js-binary-schema-parser/')) return 'vendor-misc'
    if (
        normalizedId.includes('/md-editor-v3/') ||
        normalizedId.includes('/codemirror/') ||
        normalizedId.includes('/@codemirror/') ||
        normalizedId.includes('/@lezer/') ||
        normalizedId.includes('/@marijn/') ||
        normalizedId.includes('/style-mod/') ||
        normalizedId.includes('/w3c-keyname/') ||
        normalizedId.includes('/crelt/') ||
        normalizedId.includes('/markdown-it/') ||
        normalizedId.includes('/markdown-it-image-figures/') ||
        normalizedId.includes('/markdown-it-sub/') ||
        normalizedId.includes('/markdown-it-sup/') ||
        normalizedId.includes('/linkify-it/') ||
        normalizedId.includes('/mdurl/') ||
        normalizedId.includes('/uc.micro/') ||
        normalizedId.includes('/medium-zoom/') ||
        normalizedId.includes('/xss/') ||
        normalizedId.includes('/jszip/')
    ) {
        return 'vendor-markdown'
    }
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
    const env = loadEnv(mode, process.cwd()) as ViteRuntimeEnv
    const isBuild = command === 'build'
    const isProdBuild = isBuild && mode === 'production'
    const proxyTarget = resolveProxyTarget(env)
    const useTerserMinify = isProdBuild && env.VITE_USE_TERSER === 'true'
    const enableObfuscation = useTerserMinify && env.VITE_ENABLE_OBFUSCATION !== 'false'
    const shouldDropConsole = isProdBuild && env.VITE_DROP_CONSOLE !== 'false'
    const shouldGenerateSourceMap = env.VITE_GENERATE_SOURCEMAP === 'true' || (isBuild && !isProdBuild)
    const shouldGenerateZip = isBuild && env.VITE_BUILD_ZIP === 'true'

    return {
        base: '/',
        plugins: [...createVitePlugins(env, isBuild), shouldGenerateZip && zipPack({ outDir: 'dist', outFileName: 'dist.zip' })].filter(Boolean),

        resolve: {
            alias: {
                '~': resolve(__dirname, './'),
                '@': resolve(__dirname, './src')
            },
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
        },

        build: {
            sourcemap: shouldGenerateSourceMap,
            outDir: 'dist',
            assetsDir: 'assets',
            chunkSizeWarningLimit: 2000,
            reportCompressedSize: false,
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
            rollupOptions: {
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
