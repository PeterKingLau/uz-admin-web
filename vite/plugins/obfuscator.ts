import type { Plugin } from 'vite'
import JavaScriptObfuscator from 'javascript-obfuscator'

const isNodeModuleId = (id: string) => /[/\\]node_modules[/\\]/.test(id)

const hasBusinessModules = (moduleIds: string[]) => moduleIds.some(id => !isNodeModuleId(id))

export function createObfuscatorPlugin(enabled: boolean): Plugin {
    return {
        name: 'app-javascript-obfuscator',
        apply: 'build',
        enforce: 'post',
        renderChunk(code, chunk) {
            if (!enabled) return null
            if (!chunk.fileName.endsWith('.js')) return null

            const moduleIds = Object.keys(chunk.modules || {})
            if (!moduleIds.length) return null
            if (!hasBusinessModules(moduleIds)) return null

            const result = JavaScriptObfuscator.obfuscate(code, {
                compact: true,
                target: 'browser',
                identifierNamesGenerator: 'hexadecimal',
                stringArray: true,
                stringArrayThreshold: 0.75,
                stringArrayEncoding: ['base64'],
                simplify: true,
                transformObjectKeys: true,
                unicodeEscapeSequence: false,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                renameGlobals: false,
                selfDefending: false,
                disableConsoleOutput: true
            })

            return {
                code: result.getObfuscatedCode(),
                map: null
            }
        }
    }
}
