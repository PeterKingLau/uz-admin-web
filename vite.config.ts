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
    VITE_PROXY_TARGET?: string
    VITE_PROXY_MODE?: ProxyMode
    VITE_DROP_CONSOLE?: string
    VITE_GENERATE_SOURCEMAP?: string
    VITE_ENABLE_OBFUSCATION?: string
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

    // Keep framework ecosystem in one chunk to avoid circular chunk warnings.
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
    if (normalizedId.includes('/@iconify-json/mdi/')) return 'vendor-iconify-mdi'
    if (normalizedId.includes('/@iconify-json/ep/')) return 'vendor-iconify-ep'
    if (normalizedId.includes('/@iconify-json/simple-icons/')) return 'vendor-iconify-simple'
    if (normalizedId.includes('/@iconify-json/material-symbols/')) return 'vendor-iconify-material'
    if (normalizedId.includes('/@iconify/')) return 'vendor-iconify-core'
    if (normalizedId.includes('/@vueup/vue-quill/') || normalizedId.includes('/quill/')) return 'vendor-editor'
    return 'vendor-misc'
}

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd()) as ViteRuntimeEnv
    const isBuild = command === 'build'
    const isProductionMode = mode === 'production'
    const proxyTarget = resolveProxyTarget(env)
    const enableObfuscation = isBuild && isProductionMode && env.VITE_ENABLE_OBFUSCATION === 'true'
    const shouldDropConsole = isBuild && isProductionMode && env.VITE_DROP_CONSOLE !== 'false'
    const shouldGenerateSourceMap = env.VITE_GENERATE_SOURCEMAP === 'true' || (isBuild && !isProductionMode)

    return {
        base: '/',
        plugins: [...createVitePlugins(env, isBuild), isBuild && zipPack({ outDir: 'dist', outFileName: 'dist.zip' })].filter(Boolean),

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
            minify: enableObfuscation ? 'terser' : 'esbuild',
            terserOptions: enableObfuscation
                ? {
                      compress: {
                          passes: 2,
                          drop_console: shouldDropConsole,
                          drop_debugger: shouldDropConsole
                      },
                      mangle: {
                          safari10: true
                      },
                      format: {
                          comments: false
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
                drop: enableObfuscation ? [] : shouldDropConsole ? ['console', 'debugger'] : []
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
