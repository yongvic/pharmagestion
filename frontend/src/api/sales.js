import api from './axios';

export const getSales = (params) => api.get('sales/', { params });
export const getSale = (id) => api.get(`sales/${id}/`);
export const createSale = (data) => api.post('sales/', data);
export const updateSale = (id, data) => api.patch(`sales/${id}/`, data);
export const getSalesStats = () => api.get('sales/stats/');
export const getInsurances = (params) => api.get('insurance/', { params });
