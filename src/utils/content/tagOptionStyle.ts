export type OptionTagVariant = 'normal' | 'batch' | 'query'

type TagLike =
    | {
          id?: number | string
          name?: string
          label?: string
      }
    | null
    | undefined

const styleCache = new Map<string, Record<string, string>>()

function hashSeed(value: string): number {
    let hash = 0
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 131 + value.charCodeAt(index)) >>> 0
    }
    return hash
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
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
    const seedA = seed & 0xff
    const seedB = (seed >>> 8) & 0xff
    const seedC = (seed >>> 16) & 0xff
    const seedD = (seed >>> 24) & 0xff
    const hueBase = seed % 360
    const hueShift = Math.round(((seedA / 255) * 2 - 1) * 14)
    const hue = (hueBase + hueShift + 360) % 360
    const { saturation, lightness, borderLightness, textLightness, borderStyle, borderRadius } = getVariantConfig(variant)
    const saturationVar = Math.round(((seedB / 255) * 2 - 1) * 12)
    const lightnessVar = Math.round(((seedC / 255) * 2 - 1) * 8)
    const borderVar = Math.round(((seedD / 255) * 2 - 1) * 10)
    const sat = clamp(saturation + saturationVar, 64, 96)
    const baseLight = clamp(lightness + lightnessVar, 84, 96)
    const borderBaseLight = clamp(borderLightness + borderVar, 56, 88)
    const textBaseLight = clamp(textLightness - Math.round(lightnessVar / 2), 18, 36)
    const hoverLightness = clamp(baseLight - (4 + (seedA % 3)), 76, 94)
    const selectedLightness = clamp(baseLight - (10 + (seedB % 4)), 68, 90)
    const bgAlpha = (0.82 + (seedC % 10) * 0.01).toFixed(2)
    const hoverAlpha = (0.9 + (seedD % 8) * 0.01).toFixed(2)
    const selectedAlpha = (0.94 + (seedA % 5) * 0.01).toFixed(2)

    const background = `hsla(${hue}, ${sat}%, ${baseLight}%, ${bgAlpha})`
    const border = `hsla(${hue}, ${clamp(sat + 8, 66, 98)}%, ${borderBaseLight}%, 0.98)`
    const text = `hsl(${hue}, ${clamp(sat + 12, 68, 99)}%, ${textBaseLight}%)`
    const hoverBackground = `hsla(${hue}, ${clamp(sat + 10, 70, 99)}%, ${hoverLightness}%, ${hoverAlpha})`
    const hoverBorder = `hsla(${hue}, ${clamp(sat + 14, 74, 99)}%, ${clamp(borderBaseLight - 10, 44, 84)}%, 1)`
    const selectedBackground = `hsla(${hue}, ${clamp(sat + 18, 78, 99)}%, ${selectedLightness}%, ${selectedAlpha})`
    const selectedBorder = `hsla(${hue}, ${clamp(sat + 24, 80, 99)}%, ${clamp(borderBaseLight - 20, 36, 76)}%, 1)`
    const selectedText = `hsl(${hue}, ${clamp(sat + 20, 78, 99)}%, ${clamp(textBaseLight - 11, 12, 28)}%)`

    const style = {
        '--tag-pill-bg': background,
        '--tag-pill-border': border,
        '--tag-pill-text': text,
        '--tag-pill-font-weight': '400',
        '--tag-pill-bg-hover': hoverBackground,
        '--tag-pill-border-hover': hoverBorder,
        '--tag-pill-bg-selected': selectedBackground,
        '--tag-pill-border-selected': selectedBorder,
        '--tag-pill-text-selected': selectedText,
        '--tag-pill-font-weight-selected': '700',
        '--tag-pill-shadow': `0 1px 2px hsla(${hue}, ${clamp(sat - 8, 50, 90)}%, 32%, 0.16)`,
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
