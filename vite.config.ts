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

const baseUrl = proxyTargets.wireless
// const baseUrl = proxyTargets.wired

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd())
    const isBuild = command === 'build'

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
            sourcemap: false,
            outDir: 'dist',
            assetsDir: 'assets',
            chunkSizeWarningLimit: 2000,
            minify: 'esbuild',
            rollupOptions: {
                output: {
                    chunkFileNames: 'static/js/[name]-[hash].js',
                    entryFileNames: 'static/js/[name]-[hash].js',
                    assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
                }
            },
            esbuild: {
                drop: isBuild ? ['console', 'debugger'] : []
            }
        },

        server: {
            port: 80,
            host: true,
            open: false,
            proxy: {
                '/api': {
                    target: baseUrl,
                    changeOrigin: true,
                    rewrite: p => p.replace(/^\/api/, '')
                },
                '^/v3/api-docs/(.*)': {
                    target: baseUrl,
                    changeOrigin: true
                }
            }
        }
    }
})
