import { defineComponent, h, resolveComponent, PropType } from 'vue'
import { makeMap } from '@/utils/index'

/**
 * HTML 原生属性
 */
const isAttr = makeMap(
    'accept,accept-charset,accesskey,action,align,alt,async,autocomplete,' +
        'autofocus,autoplay,autosave,bgcolor,border,buffered,challenge,charset,' +
        'checked,cite,class,code,codebase,color,cols,colspan,content,http-equiv,' +
        'name,contenteditable,contextmenu,controls,coords,data,datetime,default,' +
        'defer,dir,dirname,disabled,download,draggable,dropzone,enctype,method,for,' +
        'form,formaction,headers,height,hidden,high,href,hreflang,http-equiv,' +
        'icon,id,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,' +
        'manifest,max,maxlength,media,method,GET,POST,min,multiple,email,file,' +
        'muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,' +
        'preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,' +
        'scope,scoped,seamless,selected,shape,size,type,text,password,sizes,span,' +
        'spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,' +
        'target,title,type,usemap,value,width,wrap'
)

const isNotProps = makeMap('layout,prepend,regList,tag,document,changeTag,defaultValue,prefix-icon,suffix-icon')

/**
 * 统一配置类型
 */
interface FormConf {
    tag: string
    options?: any[]
    optionType?: string
    border?: boolean
    buttonText?: string
    showTip?: boolean
    fileSize?: number
    sizeUnit?: string
    accept?: string
    [key: string]: any
}

/**
 * 子组件特殊处理
 */
const componentChild: Record<string, Record<string, (h: typeof import('vue').h, conf: FormConf, key: string) => any>> = {
    'el-button': {
        default(h, conf, key) {
            return conf[key]
        }
    },
    'el-select': {
        options(h, conf) {
            return conf.options?.map((item: any) =>
                h(resolveComponent('el-option'), {
                    label: item.label,
                    value: item.value
                })
            )
        }
    },
    'el-radio-group': {
        options(h, conf) {
            return conf.optionType === 'button'
                ? conf.options?.map((item: any) => h(resolveComponent('el-radio-button'), { label: item.value }, () => item.label))
                : conf.options?.map((item: any) => h(resolveComponent('el-radio'), { label: item.value, border: conf.border }, () => item.label))
        }
    },
    'el-checkbox-group': {
        options(h, conf) {
            return conf.optionType === 'button'
                ? conf.options?.map((item: any) => h(resolveComponent('el-checkbox-button'), { label: item.value }, () => item.label))
                : conf.options?.map((item: any) => h(resolveComponent('el-checkbox'), { label: item.value, border: conf.border }, () => item.label))
        }
    },
    'el-upload': {
        'list-type': (h, conf) => {
            const option: Record<string, any> = {}

            if (conf['list-type'] === 'picture-card') {
                return h(resolveComponent('el-icon'), option, () => h(resolveComponent('Plus')))
            } else {
                option.type = 'primary'
                option.icon = 'Upload'
                return h(resolveComponent('el-button'), option, () => conf.buttonText)
            }
        }
    }
}

/**
 * 插槽处理
 */
const componentSlot: Record<string, Record<string, (h: typeof import('vue').h, conf: FormConf) => (() => any) | undefined>> = {
    'el-upload': {
        tip: (h, conf) => {
            if (!conf.showTip) return
            return () => h('div', { class: 'el-upload__tip' }, `只能上传不超过${conf.fileSize}${conf.sizeUnit}的${conf.accept}文件`)
        }
    },
    'el-input': {
        prefix: (h, conf) => {
            if (!conf['prefix-icon']) return
            return () =>
                h(resolveComponent('svg-icon'), {
                    'icon-class': conf['prefix-icon']
                })
        },
        suffix: (h, conf) => {
            if (!conf['suffix-icon']) return
            return () =>
                h(resolveComponent('svg-icon'), {
                    'icon-class': conf['suffix-icon']
                })
        }
    }
}

export default defineComponent({
    name: 'DynamicComponent',

    props: {
        conf: {
            type: Object as PropType<FormConf>,
            required: true
        }
    },

    render() {
        const dataObject: {
            attrs: Record<string, any>
            props: Record<string, any>
            on: Record<string, any>
            style: Record<string, any>
        } = {
            attrs: {},
            props: {},
            on: {},
            style: {}
        }

        const confClone: FormConf = JSON.parse(JSON.stringify(this.conf))
        const children: any[] = []
        const slot: Record<string, any> = {}

        /** 生成子节点 */
        const childObjs = componentChild[confClone.tag]
        if (childObjs) {
            Object.keys(childObjs).forEach(key => {
                const childFunc = childObjs[key]
                if (confClone[key]) {
                    const node = childFunc(h, confClone, key)
                    if (node) {
                        children.push(node)
                    }
                }
            })
        }

        /** 生成 slot */
        const slotObjs = componentSlot[confClone.tag]
        if (slotObjs) {
            Object.keys(slotObjs).forEach(key => {
                const childFunc = slotObjs[key]
                const vnode = childFunc(h, confClone)
                if (vnode) {
                    slot[key] = vnode
                }
            })
        }

        /** 分类属性 */
        Object.keys(confClone).forEach((key: string) => {
            const val = confClone[key]

            if ((dataObject as any)[key]) {
                ;(dataObject as any)[key] = val
            } else if (isAttr(key)) {
                dataObject.attrs[key] = val
            } else if (!isNotProps(key)) {
                dataObject.props[key] = val
            }
        })

        if (children.length > 0) {
            slot.default = () => children
        }

        return h(
            resolveComponent(confClone.tag),
            {
                modelValue: (this.$attrs as any).modelValue,
                ...dataObject.props,
                ...dataObject.attrs,
                style: {
                    ...dataObject.style
                }
            },
            slot
        )
    }
})
