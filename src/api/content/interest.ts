import request from '@/utils/request'

export function getInterestAll() {
    return request({
        url: '/content/interestCategory/app/v1/findInterestAll',
        method: 'get'
    })
}
