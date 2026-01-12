import mdiIcons from '@iconify-json/mdi/icons.json'
import epIcons from '@iconify-json/ep/icons.json'
import simpleIcons from '@iconify-json/simple-icons/icons.json'
import materialSymbols from '@iconify-json/material-symbols/icons.json'

interface IconifyJSON {
    prefix: string
    icons: Record<string, any>
    [key: string]: any
}

const icons: string[] = []

function addCollection(collection: any) {
    const data = collection as IconifyJSON
    const prefix = data.prefix

    if (data.icons) {
        Object.keys(data.icons).forEach(name => {
            icons.push(`${prefix}:${name}`)
        })
    }
}

addCollection(epIcons)
addCollection(mdiIcons)
addCollection(materialSymbols)
addCollection(simpleIcons)

export default icons
