import { parseTime } from './utils'




export function formatDate(cellValue: string | null | undefined): string {
    if (cellValue == null || cellValue == '') return ''
    const date = new Date(cellValue)
    const year = date.getFullYear()
    const month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
    const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
    const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
    const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
    const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}







export function formatTime(time: number | string, option?: string): any {
    
    if (('' + time).length === 10) {
        time = parseInt(time as string) * 1000 
    } else {
        time = +time 
    }

    const d: Date = new Date(time) 
    const now: number = Date.now() 

    const diff: number = (now - d.getTime()) / 1000 

    if (diff < 30) {
        return '刚刚'
    } else if (diff < 3600) {
        
        return Math.ceil(diff / 60) + '分钟前'
    } else if (diff < 3600 * 24) {
        return Math.ceil(diff / 3600) + '小时前'
    } else if (diff < 3600 * 24 * 2) {
        return '1天前'
    }

    if (option) {
        return parseTime(time, option) 
    } else {
        
        return `${d.getMonth() + 1}月${d.getDate()}日${d.getHours()}时${d.getMinutes()}分`
    }
}






export function getQueryObject(url?: string): Record<string, string> {
    url = url ?? window.location.href
    const search = url.substring(url.lastIndexOf('?') + 1)
    const obj: Record<string, string> = {}
    const reg = /([^?&=]+)=([^?&=]*)/g
    search.replace(reg, (rs, $1, $2) => {
        const name = decodeURIComponent($1)
        let val = decodeURIComponent($2)
        val = String(val)
        obj[name] = val
        return rs
    })
    return obj
}






export function byteLength(str: string): number {
    let s = str.length
    for (let i = str.length - 1; i >= 0; i--) {
        const code = str.charCodeAt(i)
        if (code > 0x7f && code <= 0x7ff) s++
        else if (code > 0x7ff && code <= 0xffff) s += 2
        if (code >= 0xdc00 && code <= 0xdfff) i--
    }
    return s
}






export function cleanArray(actual: any[]): any[] {
    const newArray: any[] = []
    for (let i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i])
        }
    }
    return newArray
}






export function param(json: Record<string, any>): string {
    if (!json) return ''
    return cleanArray(
        Object.keys(json).map(key => {
            if (json[key] === undefined) return ''
            return `${encodeURIComponent(key)}=${encodeURIComponent(json[key])}`
        })
    ).join('&')
}






export function param2Obj(url: string): Record<string, string> {
    const search = decodeURIComponent(url.split('?')[1]).replace(/\+/g, ' ')
    if (!search) {
        return {}
    }
    const obj: Record<string, string> = {}
    const searchArr = search.split('&')
    searchArr.forEach(v => {
        const index = v.indexOf('=')
        if (index !== -1) {
            const name = v.substring(0, index)
            const val = v.substring(index + 1, v.length)
            obj[name] = val
        }
    })
    return obj
}






export function html2Text(val: string): string {
    const div = document.createElement('div')
    div.innerHTML = val
    return div.textContent || div.innerText
}







export function objectMerge(target: Record<string, any>, source: Record<string, any> | any[]): Record<string, any> {
    if (typeof target !== 'object') {
        target = {}
    }
    if (Array.isArray(source)) {
        return source.slice()
    }
    Object.keys(source).forEach(property => {
        const sourceProperty = source[property]
        if (typeof sourceProperty === 'object') {
            target[property] = objectMerge(target[property], sourceProperty)
        } else {
            target[property] = sourceProperty
        }
    })
    return target
}






export function toggleClass(element: HTMLElement, className: string): void {
    if (!element || !className) {
        return
    }
    let classString = element.className
    const nameIndex = classString.indexOf(className)
    if (nameIndex === -1) {
        classString += '' + className
    } else {
        classString = classString.substr(0, nameIndex) + classString.substr(nameIndex + className.length)
    }
    element.className = classString
}






export function getTime(type: string): any {
    if (type === 'start') {
        return new Date().getTime() - 3600 * 1000 * 24 * 90
    } else {
        return new Date(new Date().toDateString())
    }
}








export function debounce(func: (...args: any[]) => void, wait: number, immediate: boolean): (...args: any[]) => void {
    let timeout: NodeJS.Timeout | null = null
    let args: any[] = []
    let context: any
    let timestamp: number
    let result: any

    const later = function () {
        const last = +new Date() - timestamp

        if (last < wait && last > 0) {
            timeout = setTimeout(later, wait - last)
        } else {
            timeout = null
            if (!immediate) {
                result = func.apply(context, args)
                if (!timeout) {
                    context = null
                    args = []
                }
            }
        }
    }

    return function (this: any, ...callArgs: any[]) {
        context = this
        args = callArgs
        timestamp = +new Date()
        const callNow = immediate && !timeout
        if (!timeout) timeout = setTimeout(later, wait)
        if (callNow) {
            result = func.apply(context, args)
            context = null
            args = []
        }

        return result
    }
}






export function deepClone(source: Record<string, any> | null | undefined): Record<string, any> {
    
    if (source === null || typeof source !== 'object') {
        throw new Error('error arguments, deepClone: source must be a non-null object')
    }

    
    const targetObj: Record<string, any> = Array.isArray(source) ? [] : {}

    
    Object.keys(source).forEach((key: string) => {
        const value = source[key]

        if (value && typeof value === 'object') {
            targetObj[key] = deepClone(value)
        } else {
            targetObj[key] = value
        }
    })

    return targetObj
}






export function uniqueArr(arr: any[]): any[] {
    return Array.from(new Set(arr))
}





export function createUniqueString(): string {
    const timestamp: string = Date.now().toString()
    const randomNum: string = Math.floor((1 + Math.random()) * 65536).toString()
    return BigInt(randomNum + timestamp).toString(32)
}







export function hasClass(ele: HTMLElement, cls: string): boolean {
    return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'))
}






export function addClass(ele: HTMLElement, cls: string): void {
    if (!hasClass(ele, cls)) ele.className += ' ' + cls
}






export function removeClass(ele: HTMLElement, cls: string): void {
    if (hasClass(ele, cls)) {
        const reg = new RegExp('(\\s|^)' + cls + '(\\s|$)')
        ele.className = ele.className.replace(reg, ' ')
    }
}

export function makeMap(str: string, expectsLowerCase = false): (val: string) => boolean {
    const map: Record<string, boolean> = Object.create(null)
    const list = str.split(',')

    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true
    }

    return expectsLowerCase ? (val: string) => !!map[val.toLowerCase()] : (val: string) => !!map[val]
}

export const exportDefault = 'export default '


export function titleCase(str: string): string {
    return str.replace(/( |^)[a-z]/g, L => L.toUpperCase())
}


export function camelCase(str: string): string {
    return str.replace(/_[a-z]/g, str1 => str1.substr(-1).toUpperCase())
}

export function isNumberStr(str: string): boolean {
    return /^[+-]?(0|([1-9]\d*))(\.\d+)?$/g.test(str)
}
