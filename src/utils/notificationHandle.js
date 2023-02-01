import {notification} from "antd"

export const NotificationType = {
    SUCCESS: 'success',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
}
export const openNotification = (type, message) => {
    notification[type]({
        message: message,
    })
}