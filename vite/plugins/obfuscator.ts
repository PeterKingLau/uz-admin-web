import type { Plugin } from 'vite'
import JavaScriptObfuscator from 'javascript-obfuscator'

const OBFUSCATABLE_FILE_RE = /\.[cm]?js$/i
const NODE_MODULES_RE = /[/\\]node_modules[/\\]/
const VIRTUAL_MODULE_PREFIX_RE = /^(?:\0|virtual:|vite\/)/
const MIN_OBFUSCATABLE_CODE_LENGTH = 80

type ObfuscatorOptions = NonNullable<Parameters<typeof JavaScriptObfuscator.obfuscate>[1]>

const obfuscatorOptions: ObfuscatorOptions = {
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
}

const normalizeModuleId = (id: string) => id.replace(/[?#].*$/, '')

const isNodeModuleId = (id: string) => NODE_MODULES_RE.test(normalizeModuleId(id))

const isVirtualModuleId = (id: string) => VIRTUAL_MODULE_PREFIX_RE.test(normalizeModuleId(id))

const isBusinessModuleId = (id: string) => {
    const normalizedId = normalizeModuleId(id)
    return Boolean(normalizedId) && !isNodeModuleId(normalizedId) && !isVirtualModuleId(normalizedId)
}

const hasBusinessModules = (moduleIds: string[]) => moduleIds.some(isBusinessModuleId)

const shouldObfuscateChunk = (enabled: boolean, code: string, fileName: string, moduleIds: string[]) => {
    if (!enabled) return false
    if (!OBFUSCATABLE_FILE_RE.test(fileName)) return false
    if (code.trim().length < MIN_OBFUSCATABLE_CODE_LENGTH) return false
    if (!moduleIds.length) return false
    return hasBusinessModules(moduleIds)
}

export function createObfuscatorPlugin(enabled: boolean): Plugin {
    return {
        name: 'app-javascript-obfuscator',
        apply: 'build',
        enforce: 'post',
        renderChunk(code, chunk) {
            const moduleIds = Object.keys(chunk.modules || {})
            if (!shouldObfuscateChunk(enabled, code, chunk.fileName, moduleIds)) return null

            let obfuscatedCode = ''
            try {
                obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions).getObfuscatedCode()
            } catch (error) {
                const reason = error instanceof Error ? error.message : String(error)
                this.error(`Failed to obfuscate chunk "${chunk.fileName}": ${reason}`)
            }

            if (!obfuscatedCode) return null

            return {
                code: obfuscatedCode,
                map: null
            }
        }
    }
}
