import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import createVitePlugins from './vite/plugins'
import { createObfuscatorPlugin } from './vite/plugins/obfuscator'
import { manualChunks } from './vite/chunk-rules'
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
    VITE_OBSCURE_BUNDLE_NAMES?: string
}

function resolveProxyTarget(env: ViteRuntimeEnv, mode: string): string {
    const targetFromEnv = env.VITE_PROXY_TARGET?.trim()
    if (targetFromEnv) return targetFromEnv

    const proxyMode = env.VITE_PROXY_MODE as ProxyMode | undefined
    if (proxyMode && proxyTargets[proxyMode]) {
        return proxyTargets[proxyMode]
    }

    return mode === 'development' ? proxyTargets.production : proxyTargets.wireless
}

function resolveProxyRewrite(env: ViteRuntimeEnv, mode: string) {
    const targetFromEnv = env.VITE_PROXY_TARGET?.trim()
    const proxyMode = env.VITE_PROXY_MODE as ProxyMode | undefined
    const useProductionGateway = proxyMode === 'production' || (!targetFromEnv && mode === 'development') || targetFromEnv === proxyTargets.production

    return (path: string) => {
        if (useProductionGateway) {
            return path.replace(/^\/api/, '/prod')
        }
        return path.replace(/^\/api/, '')
    }
}

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, projectRootDir, '') as ViteRuntimeEnv
    const isBuild = command === 'build'
    const isProdBuild = isBuild && mode === 'production'
    const proxyTarget = resolveProxyTarget(env, mode)
    const proxyRewrite = resolveProxyRewrite(env, mode)
    const useTerserMinify = isProdBuild && env.VITE_USE_TERSER === 'true'
    const enableObfuscation = useTerserMinify && env.VITE_ENABLE_OBFUSCATION !== 'false'
    const obscureBundleNames = isProdBuild && env.VITE_OBSCURE_BUNDLE_NAMES !== 'false'
    const shouldDropConsole = isProdBuild && env.VITE_DROP_CONSOLE !== 'false'
    const shouldGenerateSourceMap = env.VITE_GENERATE_SOURCEMAP === 'true' || (isBuild && !isProdBuild)
    const shouldGenerateZip = isBuild && env.VITE_BUILD_ZIP === 'true'
    const shouldAnalyzeBuild = isBuild && env.VITE_BUILD_ANALYZE === 'true'

    return {
        base: '/',
        plugins: [
            ...createVitePlugins(env, isBuild),
            isProdBuild && createObfuscatorPlugin(enableObfuscation),
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

        define: {
            __VUE_PROD_DEVTOOLS__: false,
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
        },

        build: {
            target: 'esnext',
            modulePreload: {
                polyfill: false
            },
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
                    chunkFileNames: obscureBundleNames ? 'static/js/[hash].js' : 'static/js/[name]-[hash].js',
                    entryFileNames: obscureBundleNames ? 'static/js/[hash].js' : 'static/js/[name]-[hash].js',
                    assetFileNames: obscureBundleNames ? 'static/[ext]/[hash].[ext]' : 'static/[ext]/[name]-[hash].[ext]'
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
                    rewrite: proxyRewrite
                },
                '^/v3/api-docs/(.*)': {
                    target: proxyTarget,
                    changeOrigin: true
                }
            }
        }
    }
})
