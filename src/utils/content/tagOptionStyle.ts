export type OptionTagVariant = 'normal' | 'batch' | 'query'

type TagLike = {
    id?: number | string
    name?: string
    label?: string
} | null | undefined

const styleCache = new Map<string, Record<string, string>>()

function hashSeed(value: string): number {
    let hash = 0
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 131 + value.charCodeAt(index)) >>> 0
    }
    return hash
}

function getVariantConfig(variant: OptionTagVariant) {
    if (variant === 'batch') {
        return {
            saturation: 84,
            lightness: 90,
            borderLightness: 72,
            textLightness: 25,
            borderStyle: 'dashed',
            borderRadius: '0'
        }
    }

    if (variant === 'query') {
        return {
            saturation: 80,
            lightness: 92,
            borderLightness: 76,
            textLightness: 28,
            borderStyle: 'solid',
            borderRadius: '10px'
        }
    }

    return {
        saturation: 82,
        lightness: 93,
        borderLightness: 78,
        textLightness: 29,
        borderStyle: 'solid',
        borderRadius: '0'
    }
}

export function resolveOptionTagStyle(tag: TagLike, variant: OptionTagVariant = 'normal'): Record<string, string> {
    const rawKey = String(tag?.id ?? tag?.name ?? tag?.label ?? '').trim()
    const cacheKey = `${variant}:${rawKey || 'default'}`
    const cached = styleCache.get(cacheKey)
    if (cached) return cached

    const seed = hashSeed(cacheKey)
    const hue = seed % 360
    const { saturation, lightness, borderLightness, textLightness, borderStyle, borderRadius } = getVariantConfig(variant)
    const hoverLightness = Math.max(80, lightness - 5)
    const selectedLightness = Math.max(74, lightness - 12)

    const background = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.88)`
    const border = `hsla(${hue}, ${Math.min(92, saturation + 8)}%, ${borderLightness}%, 0.98)`
    const text = `hsl(${hue}, ${Math.min(96, saturation + 12)}%, ${textLightness}%)`
    const hoverBackground = `hsla(${hue}, ${Math.min(94, saturation + 10)}%, ${hoverLightness}%, 0.95)`
    const hoverBorder = `hsla(${hue}, ${Math.min(96, saturation + 14)}%, ${Math.max(58, borderLightness - 10)}%, 1)`
    const selectedBackground = `hsla(${hue}, ${Math.min(98, saturation + 18)}%, ${selectedLightness}%, 0.98)`
    const selectedBorder = `hsla(${hue}, ${Math.min(99, saturation + 24)}%, ${Math.max(46, borderLightness - 20)}%, 1)`
    const selectedText = `hsl(${hue}, ${Math.min(99, saturation + 20)}%, ${Math.max(18, textLightness - 11)}%)`

    const style = {
        '--tag-pill-bg': background,
        '--tag-pill-border': border,
        '--tag-pill-text': text,
        '--tag-pill-bg-hover': hoverBackground,
        '--tag-pill-border-hover': hoverBorder,
        '--tag-pill-bg-selected': selectedBackground,
        '--tag-pill-border-selected': selectedBorder,
        '--tag-pill-text-selected': selectedText,
        '--tag-pill-shadow': `0 1px 2px hsla(${hue}, 64%, 32%, 0.16)`,
        backgroundColor: background,
        borderColor: border,
        color: text,
        borderStyle,
        borderRadius,
        borderWidth: '1px'
    } as Record<string, string>

    styleCache.set(cacheKey, style)
    return style
}
