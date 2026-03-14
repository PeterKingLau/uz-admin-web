export type TableId = string | number | string[]
export type TableName = string

export interface GenTableQuery extends Record<string, any> {}

export interface GenTablePayload extends Record<string, any> {}

export interface ImportTablePayload {
    tables: any
}

export interface CreateTablePayload {
    sql: any
}
