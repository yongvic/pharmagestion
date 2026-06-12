import api from './axios';

export const getMedications = (params) => api.get('medications/', { params });
export const getMedication = (id) => api.get(`medications/${id}/`);
export const createMedication = (data) => api.post('medications/', data);
export const updateMedication = (id, data) => api.patch(`medications/${id}/`, data);
export const deleteMedication = (id) => api.delete(`medications/${id}/`);

export const getCategories = (params) => api.get('categories/', { params });
export const createCategory = (data) => api.post('categories/', data);
export const updateCategory = (id, data) => api.patch(`categories/${id}/`, data);
export const deleteCategory = (id) => api.delete(`categories/${id}/`);
