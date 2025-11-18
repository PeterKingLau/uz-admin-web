import { defineComponent, h, resolveComponent } from 'vue'
import { makeMap } from '@/utils/index'

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

function useVModel(props, emit) {
    return {
        modelValue: props.defaultValue,
        'onUpdate:modelValue': val => emit('update:modelValue', val)
    }
}

const componentChild = {
    'el-button': {
        default(h, conf, key) {
            return conf[key]
        }
    },
    'el-select': {
        options(h, conf, key) {
            return conf.options.map(item =>
                h(resolveComponent('el-option'), {
                    label: item.label,
                    value: item.value
                })
            )
        }
    },
    'el-radio-group': {
        options(h, conf, key) {
            return conf.optionType === 'button'
                ? conf.options.map(item =>
                      h(
                          resolveComponent('el-radio-button'),
                          {
                              label: item.value
                          },
                          () => item.label
                      )
                  )
                : conf.options.map(item =>
                      h(
                          resolveComponent('el-radio'),
                          {
                              label: item.value,
                              border: conf.border
                          },
                          () => item.label
                      )
                  )
        }
    },
    'el-checkbox-group': {
        options(h, conf, key) {
            return conf.optionType === 'button'
                ? conf.options.map(item =>
                      h(
                          resolveComponent('el-checkbox-button'),
                          {
                              label: item.value
                          },
                          () => item.label
                      )
                  )
                : conf.options.map(item =>
                      h(
                          resolveComponent('el-checkbox'),
                          {
                              label: item.value,
                              border: conf.border
                          },
                          () => item.label
                      )
                  )
        }
    },
    'el-upload': {
        'list-type': (h, conf, key) => {
            const option = {}
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

const componentSlot = {
    'el-upload': {
        tip: (h, conf) => {
            if (!conf.showTip) return
            return () => h('div', { class: 'el-upload__tip' }, '只能上传不超过' + conf.fileSize + conf.sizeUnit + '的' + conf.accept + '文件')
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
    render() {
        const dataObject = {
            attrs: {},
            props: {},
            on: {},
            style: {}
        }

        const confClone = JSON.parse(JSON.stringify(this.conf))
        const children = []
        const slot = {}

        const childObjs = componentChild[confClone.tag]
        if (childObjs) {
            Object.keys(childObjs).forEach(key => {
                const childFunc = childObjs[key]
                if (confClone[key]) {
                    children.push(childFunc(h, confClone, key))
                }
            })
        }

        const slotObjs = componentSlot[confClone.tag]
        if (slotObjs) {
            Object.keys(slotObjs).forEach(key => {
                const childFunc = slotObjs[key]
                const vnode = childFunc(h, confClone, key)
                if (vnode) {
                    slot[key] = vnode
                }
            })
        }

        Object.keys(confClone).forEach(key => {
            const val = confClone[key]
            if (dataObject[key]) {
                dataObject[key] = val
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
            resolveComponent(this.conf.tag),
            {
                modelValue: this.$attrs.modelValue,
                ...dataObject.props,
                ...dataObject.attrs,
                style: {
                    ...dataObject.style
                }
            },
            slot ?? null
        )
    },
    props: {
        conf: {
            type: Object,
            required: true
        }
    }
})
