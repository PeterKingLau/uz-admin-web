import { titleCase } from '@/utils/index'
import { trigger } from './config'

// 文件大小设置
const units: Record<'KB' | 'MB' | 'GB', string> = {
    KB: '1024',
    MB: '1024 / 1024',
    GB: '1024 / 1024 / 1024'
}

/**
 * 生成 js 代码字符串
 * @param conf 设计器生成的表单配置
 * @param type 'dialog' | 其他（普通表单）
 */
export function makeUpJs(conf: any, type: string): string {
    const confCopy = JSON.parse(JSON.stringify(conf)) as any

    const dataList: string[] = []
    const ruleList: string[] = []
    const optionsList: string[] = []
    const propsList: string[] = []
    const methodList: string[] = []
    const uploadVarList: string[] = []

    ;(confCopy.fields || []).forEach((el: any) => {
        buildAttributes(el, dataList, ruleList, optionsList, methodList, propsList, uploadVarList)
    })

    const script = buildexport(
        confCopy,
        type,
        dataList.join('\n'),
        ruleList.join('\n'),
        optionsList.join('\n'),
        uploadVarList.join('\n'),
        propsList.join('\n'),
        methodList.join('\n')
    )

    return script
}

/**
 * 收集：formData / rules / options / props / upload 相关代码
 */
function buildAttributes(
    el: any,
    dataList: string[],
    ruleList: string[],
    optionsList: string[],
    methodList: string[],
    propsList: string[],
    uploadVarList: string[]
): void {
    buildData(el, dataList)
    buildRules(el, ruleList)

    if (el.options && Array.isArray(el.options) && el.options.length) {
        buildOptions(el, optionsList)

        if (el.dataType === 'dynamic') {
            const model = `${el.vModel}Options`
            const optionsName = titleCase(model)
            buildOptionMethod(`get${optionsName}`, model, methodList)
        }
    }

    if (el.props && el.props.props) {
        buildProps(el, propsList)
    }

    if (el.action && el.tag === 'el-upload') {
        uploadVarList.push(
            `
      // 上传请求路径
      const ${el.vModel}Action = ref('${el.action}')
      // 上传文件列表
      const ${el.vModel}fileList =  ref([])`
        )

        const beforeUploadCode = buildBeforeUpload(el)
        beforeUploadCode && methodList.push(beforeUploadCode)

        if (!el['auto-upload']) {
            methodList.push(buildSubmitUpload(el))
        }
    }

    if (el.children && Array.isArray(el.children)) {
        el.children.forEach((child: any) => {
            buildAttributes(child, dataList, ruleList, optionsList, methodList, propsList, uploadVarList)
        })
    }
}

/**
 * 生成 formModel 字段
 */
function buildData(conf: any, dataList: string[]): void {
    if (conf.vModel === undefined) return

    let defaultValue: string

    if (typeof conf.defaultValue === 'string' && !conf.multiple) {
        defaultValue = `'${conf.defaultValue}'`
    } else {
        defaultValue = `${JSON.stringify(conf.defaultValue)}`
    }

    dataList.push(`${conf.vModel}: ${defaultValue},`)
}

/**
 * 生成 formRules 字段
 */
function buildRules(conf: any, ruleList: string[]): void {
    if (conf.vModel === undefined) return

    const rules: string[] = []

    if (trigger[conf.tag]) {
        if (conf.required) {
            const type = Array.isArray(conf.defaultValue) ? "type: 'array'," : ''
            let message = Array.isArray(conf.defaultValue) ? `请至少选择一个${conf.vModel}` : conf.placeholder
            if (message === undefined) message = `${conf.label}不能为空`
            rules.push(`{ required: true, ${type} message: '${message}', trigger: '${trigger[conf.tag]}' }`)
        }

        if (conf.regList && Array.isArray(conf.regList)) {
            conf.regList.forEach((item: any) => {
                if (item.pattern) {
                    rules.push(`{ pattern: new RegExp(${item.pattern}), message: '${item.message}', trigger: '${trigger[conf.tag]}' }`)
                }
            })
        }

        ruleList.push(`${conf.vModel}: [${rules.join(',')}],`)
    }
}

/**
 * 生成下拉 / 多选等选项数据
 */
function buildOptions(conf: any, optionsList: string[]): void {
    if (conf.vModel === undefined) return

    const confCopy = { ...conf }

    if (confCopy.dataType === 'dynamic') {
        confCopy.options = []
    }

    const str = `const ${confCopy.vModel}Options = ref(${JSON.stringify(confCopy.options)})`
    optionsList.push(str)
}

/**
 * 生成远程 options 加载方法
 */
function buildOptionMethod(methodName: string, model: string, methodList: string[]): void {
    const str = `function ${methodName}() {
    // TODO 发起请求获取数据
    ${model}.value
  }`
    methodList.push(str)
}

/**
 * 生成组件 props 配置（如级联）
 */
function buildProps(conf: any, propsList: string[]): void {
    const confCopy = { ...conf }

    if (confCopy.dataType === 'dynamic' && confCopy.props && confCopy.props.props) {
        const propsConf = confCopy.props.props
        confCopy.valueKey !== 'value' && (propsConf.value = confCopy.valueKey)
        confCopy.labelKey !== 'label' && (propsConf.label = confCopy.labelKey)
        confCopy.childrenKey !== 'children' && (propsConf.children = confCopy.childrenKey)
    }

    const str = `
  // props设置
  const ${confCopy.vModel}Props = ref(${JSON.stringify(confCopy.props.props)})`
    propsList.push(str)
}

/**
 * 生成上传组件 beforeUpload 逻辑
 */
function buildBeforeUpload(conf: any): string {
    const unitNum = units[conf.sizeUnit as keyof typeof units] || '1024'
    let rightSizeCode = ''
    let acceptCode = ''
    const returnList: string[] = []

    if (conf.fileSize) {
        rightSizeCode = `let isRightSize = file.size / ${unitNum} < ${conf.fileSize}
    if(!isRightSize){
      proxy.$modal.msgError('文件大小超过 ${conf.fileSize}${conf.sizeUnit}')
    }`
        returnList.push('isRightSize')
    }

    if (conf.accept) {
        acceptCode = `let isAccept = new RegExp('${conf.accept}').test(file.type)
    if(!isAccept){
      proxy.$modal.msgError('应该选择${conf.accept}类型的文件')
    }`
        returnList.push('isAccept')
    }

    if (!returnList.length) return ''

    const str = `
  function ${conf.vModel}BeforeUpload(file) {
    ${rightSizeCode}
    ${acceptCode}
    return ${returnList.join('&&')}
  }`
    return str
}

/**
 * 生成手动提交上传的方法
 */
function buildSubmitUpload(conf: any): string {
    return `function submitUpload() {
    this.$refs['${conf.vModel}'].submit()
  }`
}

/**
 * 组装最终 js 代码字符串
 */
function buildexport(conf: any, type: string, data: string, rules: string, selectOptions: string, uploadVar: string, props: string, methods: string): string {
    let str = `
    const { proxy } = getCurrentInstance()
    const ${conf.formRef} = ref()
    const data = reactive({
      ${conf.formModel}: {
        ${data}
      },
      ${conf.formRules}: {
        ${rules}
      }
    })

    const {${conf.formModel}, ${conf.formRules}} = toRefs(data)

    ${selectOptions}

    ${uploadVar}

    ${props}

    ${methods}
  `

    if (type === 'dialog') {
        str += `
      const dialogVisible = defineModel()
      const emit = defineEmits(['confirm'])

      function onOpen(){

      }

      function onClose(){
        ${conf.formRef}.value.resetFields()
      }

      function close(){
        dialogVisible.value = false
      }

      function handelConfirm(){
        ${conf.formRef}.value.validate((valid) => {
          if (!valid) return
          // TODO 提交表单

          close()
          emit('confirm')
        })
      }
    `
    } else {
        str += `
    function submitForm() {
      ${conf.formRef}.value.validate((valid) => {
        if (!valid) return
        // TODO 提交表单
      })
    }

    function resetForm() {
      ${conf.formRef}.value.resetFields()
    }
    `
    }

    return str
}
