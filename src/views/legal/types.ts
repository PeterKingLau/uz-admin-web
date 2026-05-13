export interface LegalMetaItem {
    label: string
    value: string
}

export interface LegalSection {
    id: string
    badge: string
    title: string
    shortTitle?: string
    paragraphs: string[]
    items?: string[]
}

export interface LegalContactLabels {
    title: string
    intro: string
    companyName: string
    serviceName: string
    email: string
    address: string
    responseTime: string
}

export interface LegalNavLabels {
    portal: string
    agreement: string
    privacy: string
}

export interface LegalDocumentContent {
    title: string
    documentTitle: string
    summary: string
    metas: LegalMetaItem[]
    sections: LegalSection[]
}
