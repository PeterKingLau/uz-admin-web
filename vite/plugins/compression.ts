import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import setupExtend from 'unplugin-vue-setup-extend-plus/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import compression from 'vite-plugin-compression'
import { resolve } from 'path'

interface ViteEnv {
    VITE_BUILD_COMPRESS?: string
}

export default function createVitePlugins(env: ViteEnv, isBuild = false): PluginOption[] {
    return [
        vue(),
        autoImport({
            imports: ['vue', 'vue-router', 'pinia'],
            dts: false
        }),
        setupExtend({}),
        createSvgIconsPlugin({
            iconDirs: [resolve(process.cwd(), 'src/assets/icons/svg')],
            symbolId: 'icon-[dir]-[name]',
            svgoOptions: isBuild
        }),
        ...createCompression(env, isBuild)
    ]
}

function createCompression(env: ViteEnv, isBuild: boolean): PluginOption[] {
    if (!isBuild || !env.VITE_BUILD_COMPRESS) return []

    const compressTypes = env.VITE_BUILD_COMPRESS.split(',')
    const configs = [
        { type: 'gzip', ext: '.gz', algorithm: undefined },
        { type: 'brotli', ext: '.br', algorithm: 'brotliCompress' as const }
    ]

    return configs
        .filter(c => compressTypes.includes(c.type))
        .map(c =>
            compression({
                ext: c.ext,
                algorithm: c.algorithm,
                deleteOriginFile: false
            })
        )
}
