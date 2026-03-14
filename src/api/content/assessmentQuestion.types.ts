export interface AssessmentQuestionItem {
    [key: string]: any
}

export interface AssessmentQuestionResponse {
    code?: number
    msg?: string
    total?: number
    data?: AssessmentQuestionItem[] | Record<string, any>
    rows?: AssessmentQuestionItem[]
}

export interface AssessmentQuestionListParams {
    pageNum?: number
    pageSize?: number
    title?: string
}

export interface DimensionNode {
    id?: number
    pid?: number
    category?: string
    dimensionCode?: string
    dimensionName?: string
    sortOrder?: number
    isActive?: string
    children?: DimensionNode[]
}

export interface DimensionTreeResponse {
    code?: number
    msg?: string
    data?: DimensionNode[] | Record<string, any>
    rows?: DimensionNode[]
}

export interface AddAssessmentQuestionPayload {
    moduleCode?: string
    type?: string
    content: string
    questionType: string
    correctAnswer?: string
    sortOrder: number
    status?: string
}

export interface UpdateAssessmentQuestionPayload extends AddAssessmentQuestionPayload {
    id: number
}
