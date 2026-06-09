import api from './axios';

export const getSettings = () => api.get('settings/');
export const updateSettings = (id, data) => api.patch(`settings/${id}/`, data);
