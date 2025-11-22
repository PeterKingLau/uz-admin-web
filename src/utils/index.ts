import { parseTime } from './ruoyi'

/**
 * 表格时间格式化
 */
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

/**
 * 格式化时间
 * @param {number | string} time 时间戳
 * @param {string} option 格式化选项
 * @returns {string} 格式化后的时间
 */
export function formatTime(time: number | string, option?: string): any {
    // 如果传入的时间是10位数的时间戳，需要转换成13位（毫秒）
    if (('' + time).length === 10) {
        time = parseInt(time as string) * 1000 // 转换为毫秒时间戳
    } else {
        time = +time // 确保是数字类型
    }

    const d: Date = new Date(time) // 创建 Date 对象
    const now: number = Date.now() // 当前时间戳（毫秒）

    const diff: number = (now - d.getTime()) / 1000 // 时间差（秒）

    if (diff < 30) {
        return '刚刚'
    } else if (diff < 3600) {
        // less 1 hour
        return Math.ceil(diff / 60) + '分钟前'
    } else if (diff < 3600 * 24) {
        return Math.ceil(diff / 3600) + '小时前'
    } else if (diff < 3600 * 24 * 2) {
        return '1天前'
    }

    if (option) {
        return parseTime(time, option) // 使用外部传入的 formatOption
    } else {
        // 默认格式：月日 时分
        return `${d.getMonth() + 1}月${d.getDate()}日${d.getHours()}时${d.getMinutes()}分`
    }
}

/**
 * 获取 URL 查询参数对象
 * @param {string} url URL地址
 * @returns {Record<string, string>} 查询参数对象
 */
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

/**
 * 获取字符串的字节长度
 * @param {string} str 输入字符串
 * @returns {number} 字节长度
 */
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

/**
 * 清理数组中的空值
 * @param {any[]} actual 输入数组
 * @returns {any[]} 清理后的数组
 */
export function cleanArray(actual: any[]): any[] {
    const newArray: any[] = []
    for (let i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i])
        }
    }
    return newArray
}

/**
 * 转换对象为 URL 查询字符串
 * @param {Record<string, any>} json 输入的对象
 * @returns {string} 转换后的查询字符串
 */
export function param(json: Record<string, any>): string {
    if (!json) return ''
    return cleanArray(
        Object.keys(json).map(key => {
            if (json[key] === undefined) return ''
            return `${encodeURIComponent(key)}=${encodeURIComponent(json[key])}`
        })
    ).join('&')
}

/**
 * 将查询字符串转换为对象
 * @param {string} url URL地址
 * @returns {Record<string, string>} 查询参数对象
 */
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

/**
 * 将HTML转换为纯文本
 * @param {string} val 输入的HTML字符串
 * @returns {string} 转换后的纯文本
 */
export function html2Text(val: string): string {
    const div = document.createElement('div')
    div.innerHTML = val
    return div.textContent || div.innerText
}

/**
 * 合并两个对象，后一个对象的属性优先
 * @param {Record<string, any>} target 目标对象
 * @param {Record<string, any> | any[]} source 源对象或数组
 * @returns {Record<string, any>} 合并后的对象
 */
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

/**
 * 切换元素的class
 * @param {HTMLElement} element 元素
 * @param {string} className class名称
 */
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

/**
 * 获取时间
 * @param {string} type 时间类型
 * @returns {Date} 当前时间或指定时间
 */
export function getTime(type: string): any {
    if (type === 'start') {
        return new Date().getTime() - 3600 * 1000 * 24 * 90
    } else {
        return new Date(new Date().toDateString())
    }
}

/**
 * 防抖函数
 * @param {Function} func 需要防抖的函数
 * @param {number} wait 防抖的等待时间
 * @param {boolean} immediate 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func: (...args: any[]) => void, wait: number, immediate: boolean): (...args: any[]) => void {
    let timeout: NodeJS.Timeout | null = null
    let args: any[] = [] // 将 args 初始化为空数组
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
                if (!timeout) context = args = []
            }
        }
    }

    return function (this: any, ...args: any[]) {
        context = this
        timestamp = +new Date()
        const callNow = immediate && !timeout
        if (!timeout) timeout = setTimeout(later, wait)
        if (callNow) {
            result = func.apply(context, args)
            context = args = []
        }

        return result
    }
}

/**
 * 深拷贝
 * @param {Record<string, any>} source 源对象
 * @returns {Record<string, any>} 拷贝后的对象
 */
export function deepClone(source: Record<string, any> | null | undefined): Record<string, any> {
    // 判断是否是有效对象
    if (source === null || typeof source !== 'object') {
        throw new Error('error arguments, deepClone: source must be a non-null object')
    }

    // 初始化目标对象或数组
    const targetObj: Record<string, any> = Array.isArray(source) ? [] : {}

    // 遍历源对象的属性
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

/**
 * 数组去重
 * @param {any[]} arr 输入数组
 * @returns {any[]} 去重后的数组
 */
export function uniqueArr(arr: any[]): any[] {
    return Array.from(new Set(arr))
}

/**
 * 创建唯一字符串
 * @returns {string} 唯一字符串
 */
export function createUniqueString(): string {
    const timestamp: string = Date.now().toString()
    const randomNum: string = Math.floor((1 + Math.random()) * 65536).toString()
    return BigInt(randomNum + timestamp).toString(32)
}

/**
 * 判断元素是否有某个 class
 * @param {HTMLElement} elm 元素
 * @param {string} cls 类名
 * @returns {boolean} 是否有指定 class
 */
export function hasClass(ele: HTMLElement, cls: string): boolean {
    return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'))
}

/**
 * 给元素添加 class
 * @param {HTMLElement} elm 元素
 * @param {string} cls 类名
 */
export function addClass(ele: HTMLElement, cls: string): void {
    if (!hasClass(ele, cls)) ele.className += ' ' + cls
}

/**
 * 移除元素的 class
 * @param {HTMLElement} elm 元素
 * @param {string} cls 类名
 */
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

export const beautifierConf = {
    html: {
        indent_size: '2',
        indent_char: ' ',
        max_preserve_newlines: '-1',
        preserve_newlines: false,
        keep_array_indentation: false,
        break_chained_methods: false,
        indent_scripts: 'separate',
        brace_style: 'end-expand',
        space_before_conditional: true,
        unescape_strings: false,
        jslint_happy: false,
        end_with_newline: true,
        wrap_line_length: '110',
        indent_inner_html: true,
        comma_first: false,
        e4x: true,
        indent_empty_lines: true
    },
    js: {
        indent_size: '2',
        indent_char: ' ',
        max_preserve_newlines: '-1',
        preserve_newlines: false,
        keep_array_indentation: false,
        break_chained_methods: false,
        indent_scripts: 'normal',
        brace_style: 'end-expand',
        space_before_conditional: true,
        unescape_strings: false,
        jslint_happy: true,
        end_with_newline: true,
        wrap_line_length: '110',
        indent_inner_html: true,
        comma_first: false,
        e4x: true,
        indent_empty_lines: true
    }
}

// 首字母大小
export function titleCase(str: string): string {
    return str.replace(/( |^)[a-z]/g, L => L.toUpperCase())
}

// 下划转驼峰
export function camelCase(str: string): string {
    return str.replace(/_[a-z]/g, str1 => str1.substr(-1).toUpperCase())
}

export function isNumberStr(str: string): boolean {
    return /^[+-]?(0|([1-9]\d*))(\.\d+)?$/g.test(str)
}
