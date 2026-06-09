import api from './axios';

export const getNotifications = () => api.get('notifications/');
export const getUnreadCount = () => api.get('notifications/unread_count/');
export const markNotificationRead = (id) => api.post(`notifications/${id}/mark_read/`);
export const markAllNotificationsRead = () => api.post('notifications/mark_all_read/');
