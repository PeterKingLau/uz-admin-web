import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import createVitePlugins from './vite/plugins'
import UnoCSS from 'unocss/vite'

const baseUrl = 'http://192.168.10.17:8080/api' // 后端接口

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd())
    const { VITE_APP_ENV } = env

    // 兼容 createVitePlugins 返回 plugin 或 plugin[]
    const basePlugins = createVitePlugins(env, command === 'build')
    const plugins = Array.isArray(basePlugins) ? [...basePlugins, UnoCSS()] : [basePlugins, UnoCSS()]

    return {
        base: VITE_APP_ENV === 'production' ? '/' : '/',
        plugins,
        resolve: {
            alias: {
                '~': path.resolve(__dirname, './'),
                '@': path.resolve(__dirname, './src')
            },
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
        },
        build: {
            sourcemap: command === 'build' ? false : 'inline',
            outDir: 'dist',
            assetsDir: 'assets',
            chunkSizeWarningLimit: 2000,
            rollupOptions: {
                output: {
                    chunkFileNames: 'static/js/[name]-[hash].js',
                    entryFileNames: 'static/js/[name]-[hash].js',
                    assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
                }
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
        },
        css: {
            postcss: {
                plugins: [
                    {
                        postcssPlugin: 'internal:charset-removal',
                        AtRule: {
                            charset: atRule => {
                                if (atRule.name === 'charset') atRule.remove()
                            }
                        }
                    }
                ]
            }
        }
    }
})
