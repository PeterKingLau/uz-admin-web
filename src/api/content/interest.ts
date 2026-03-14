import request from '@/utils/request'
import type { InterestCategoryAppItem } from './interest.types'

export type { InterestCategoryAppItem } from './interest.types'

export function getInterestAll() {
    return request<InterestCategoryAppItem[]>({
        url: '/content/interestCategory/app/v1/findInterestAll',
        method: 'get'
    })
}
