// modal.ts
import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus'

let loadingInstance: ReturnType<typeof ElLoading.service>

interface ModalMethods {
    msg(content: string): void
    msgError(content: string): void
    msgSuccess(content: string): void
    msgWarning(content: string): void
    alert(content: string): void
    alertError(content: string): void
    alertSuccess(content: string): void
    alertWarning(content: string): void
    notify(content: string): void
    notifyError(content: string): void
    notifySuccess(content: string): void
    notifyWarning(content: string): void
    confirm(content: string): Promise<any>
    prompt(content: string): Promise<any>
    loading(content: string): void
    closeLoading(): void
}

const modal: ModalMethods = {
    msg(content: string) {
        ElMessage.info(content)
    },
    msgError(content: string) {
        ElMessage.error(content)
    },
    msgSuccess(content: string) {
        ElMessage.success(content)
    },
    msgWarning(content: string) {
        ElMessage.warning(content)
    },
    alert(content: string) {
        ElMessageBox.alert(content, '系统提示')
    },
    alertError(content: string) {
        ElMessageBox.alert(content, '系统提示', { type: 'error' })
    },
    alertSuccess(content: string) {
        ElMessageBox.alert(content, '系统提示', { type: 'success' })
    },
    alertWarning(content: string) {
        ElMessageBox.alert(content, '系统提示', { type: 'warning' })
    },
    notify(content: string) {
        ElNotification.info(content)
    },
    notifyError(content: string) {
        ElNotification.error(content)
    },
    notifySuccess(content: string) {
        ElNotification.success(content)
    },
    notifyWarning(content: string) {
        ElNotification.warning(content)
    },
    confirm(content: string) {
        return ElMessageBox.confirm(content, '系统提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
    },
    prompt(content: string) {
        return ElMessageBox.prompt(content, '系统提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
    },
    loading(content: string) {
        loadingInstance = ElLoading.service({
            lock: true,
            text: content,
            background: 'rgba(0, 0, 0, 0.7)'
        })
    },
    closeLoading() {
        loadingInstance?.close()
    }
}

export default modal
