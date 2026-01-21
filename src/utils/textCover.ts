import textCoverTemplate from '@/assets/image/text-cover-template.svg?raw'

export type TextCoverPaletteItem = {
    bg: string
    accent: string
    quote: string
}

const hashSeed = (value: string) => {
    let hash = 0
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0
    }
    return hash || 1
}

const createSeededRandom = (seed: string) => {
    let t = hashSeed(seed)
    return () => {
        t += 0x6d2b79f5
        let r = Math.imul(t ^ (t >>> 15), t | 1)
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
}

const hslToHex = (h: number, s: number, l: number) => {
    const sat = s / 100
    const light = l / 100
    const c = (1 - Math.abs(2 * light - 1)) * sat
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = light - c / 2
    let r = 0
    let g = 0
    let b = 0

    if (h < 60) {
        r = c
        g = x
    } else if (h < 120) {
        r = x
        g = c
    } else if (h < 180) {
        g = c
        b = x
    } else if (h < 240) {
        g = x
        b = c
    } else if (h < 300) {
        r = x
        b = c
    } else {
        r = c
        b = x
    }

    const toHex = (value: number) =>
        Math.round((value + m) * 255)
            .toString(16)
            .padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const createRandomPalette = (seed: string): TextCoverPaletteItem => {
    const random = seed ? createSeededRandom(seed) : Math.random
    const hue = Math.floor(random() * 360)
    const bg = hslToHex(hue, 28 + random() * 18, 74 + random() * 10)
    const accentHue = (hue + 25 + random() * 40) % 360
    const accent = hslToHex(accentHue, 45 + random() * 25, 45 + random() * 12)
    const quote = `rgba(255,255,255,${(0.42 + random() * 0.08).toFixed(2)})`
    return { bg, accent, quote }
}

export const resolveTextCoverPalette = (seed = '') => createRandomPalette(seed)

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&apos;')

const applySvgTemplate = (template: string, replacements: Record<string, string>) => {
    let output = template
    Object.entries(replacements).forEach(([key, value]) => {
        output = output.split(key).join(value)
    })
    return output
}

const buildTextCoverLines = (value: string, maxCharsPerLine = 10, maxLines = 4) => {
    const trimmed = String(value ?? '').trim()
    if (!trimmed) return ['\u6682\u65e0\u6587\u5b57']
    const rawLines = trimmed.split(/\r?\n/).filter(line => line.trim())
    const expanded: string[] = []

    for (const rawLine of rawLines) {
        const chars = Array.from(rawLine)
        while (chars.length) {
            expanded.push(chars.splice(0, maxCharsPerLine).join(''))
        }
    }

    if (!expanded.length) return ['\u6682\u65e0\u6587\u5b57']
    const overflow = expanded.length > maxLines
    const lines = expanded.slice(0, maxLines)
    if (overflow) {
        const lastIndex = Math.max(0, lines.length - 1)
        const base = lines[lastIndex].slice(0, Math.max(0, maxCharsPerLine - 3)).trim()
        lines[lastIndex] = base ? `${base}...` : '...'
    }
    return lines
}

export const buildTextCoverDataUrl = (content: string, seed: string) => {
    const palette = resolveTextCoverPalette(seed || '')
    const height = 1200
    const fontSize = 64
    const lineHeight = Math.round(fontSize * 1.45)
    const lines = buildTextCoverLines(content, 10, 4)
    const totalHeight = (lines.length - 1) * lineHeight
    const startY = height / 2 - totalHeight / 2
    const textNodes = lines
        .map((line, index) => {
            const y = Math.round(startY + index * lineHeight)
            return `<text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" font-weight="600" fill="#2f2f2f" font-family="Microsoft YaHei, PingFang SC, sans-serif">${escapeXml(line)}</text>`
        })
        .join('')

    const svg = applySvgTemplate(textCoverTemplate, {
        __BG__: palette.bg,
        __ACCENT__: palette.accent,
        __QUOTE__: palette.quote,
        __TEXT__: textNodes
    })

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
