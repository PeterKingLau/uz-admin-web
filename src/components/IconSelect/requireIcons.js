import epIcons from '@iconify-json/ep/icons.json'
import mdiIcons from '@iconify-json/mdi/icons.json'
import simpleIcons from '@iconify-json/simple-icons/icons.json'
import materialSymbols from '@iconify-json/material-symbols/icons.json'

let icons = []

icons.push(...Object.keys(epIcons.icons).map(name => `ep:${name}`))

icons.push(...Object.keys(mdiIcons.icons).map(name => `mdi:${name}`))

icons.push(...Object.keys(simpleIcons.icons).map(name => `simple-icons:${name}`))

icons.push(...Object.keys(materialSymbols.icons).map(name => `material-symbols:${name}`))

export default icons
