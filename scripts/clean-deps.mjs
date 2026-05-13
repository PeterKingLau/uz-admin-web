import fs from 'node:fs'
import path from 'node:path'
import { rimrafSync } from 'rimraf'

const root = process.cwd()
const targets = ['node_modules', 'yarn.lock']

function resolveProjectTarget(target) {
    const targetPath = path.resolve(root, target)
    const relativePath = path.relative(root, targetPath)

    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error(`[clean] unsafe target path: ${targetPath}`)
    }

    return targetPath
}

function removeTarget(target) {
    const targetPath = resolveProjectTarget(target)

    if (!fs.existsSync(targetPath)) {
        console.log(`[clean] skip ${target}, not found`)
        return
    }

    rimrafSync(targetPath, {
        glob: false,
        maxRetries: 10,
        preserveRoot: true,
        retryDelay: 300
    })

    console.log(`[clean] removed ${target}`)
}

for (const target of targets) {
    removeTarget(target)
}
