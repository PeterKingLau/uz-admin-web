// 定义表单节点结构
export interface FormItemNode {
    tag: string
    children?: FormItemNode[]
    // props?: Record<string, any>
    // model?: string
}

// makeUpCss 入参结构
export interface MakeUpCssConf {
    fields: FormItemNode[]
}

const styles: Record<string, string> = {
    'el-rate': '.el-rate{display: inline-block; vertical-align: text-top;}',
    'el-upload': '.el-upload__tip{line-height: 1.2;}'
}

function addCss(cssList: string[], el: FormItemNode): void {
    const css = styles[el.tag]
    if (css && !cssList.includes(css)) {
        cssList.push(css)
    }
    if (el.children && el.children.length) {
        el.children.forEach(child => addCss(cssList, child))
    }
}

export function makeUpCss(conf: MakeUpCssConf): string {
    const cssList: string[] = []
    if (Array.isArray(conf.fields)) {
        conf.fields.forEach(el => addCss(cssList, el))
    }
    return cssList.join('\n')
}
