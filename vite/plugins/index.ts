import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import { compression } from 'vite-plugin-compression2'

interface ViteEnv {
    VITE_BUILD_COMPRESS?: string
}

export default function createVitePlugins(env: ViteEnv, isBuild = false): PluginOption[] {
    return [
        vue(),
        autoImport({
            imports: ['vue', 'vue-router', 'pinia'],
            include: [/\.[jt]s$/, /\.vue$/],
            exclude: [/[/\\]node_modules[/\\]/, /[/\\]dist[/\\]/, /[/\\]public[/\\]/],
            dts: false,
            vueTemplate: false
        }),
        ...createCompression(env, isBuild)
    ]
}

function createCompression(env: ViteEnv, isBuild: boolean): PluginOption[] {
    if (!isBuild || !env.VITE_BUILD_COMPRESS) return []

    const algorithmMap = {
        gzip: 'gzip',
        brotli: 'brotliCompress'
    } as const
    const algorithms = env.VITE_BUILD_COMPRESS.split(',')
        .map(type => String(type || '').trim().toLowerCase())
        .map(type => algorithmMap[type as keyof typeof algorithmMap])
        .filter((type): type is (typeof algorithmMap)[keyof typeof algorithmMap] => Boolean(type))

    if (!algorithms.length) return []

    return [
        compression({
            algorithms,
            deleteOriginalAssets: false
        })
    ]
}
