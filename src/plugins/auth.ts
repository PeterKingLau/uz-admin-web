import useUserStore from '@/store/modules/user'

function authPermission(permission: any) {
    const all_permission = '*:*:*'
    const permissions = useUserStore().permissions
    if (permission && permission.length > 0) {
        return permissions.some(v => {
            return all_permission === v || v === permission
        })
    } else {
        return false
    }
}

function authRole(role: string) {
    const super_admin = 'admin'
    const roles = useUserStore().roles
    if (role && role.length > 0) {
        return roles.some(v => {
            return super_admin === v || v === role
        })
    } else {
        return false
    }
}

export default {
    
    hasPermi(permission: any) {
        return authPermission(permission)
    },
    
    hasPermiOr(permissions: any[]) {
        return permissions.some(item => {
            return authPermission(item)
        })
    },
    
    hasPermiAnd(permissions: any[]) {
        return permissions.every(item => {
            return authPermission(item)
        })
    },
    
    hasRole(role: any) {
        return authRole(role)
    },
    
    hasRoleOr(roles: any[]) {
        return roles.some(item => {
            return authRole(item)
        })
    },
    
    hasRoleAnd(roles: any[]) {
        return roles.every(item => {
            return authRole(item)
        })
    }
}
