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

export const importMedications = (file, updateExisting = true) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('update_existing', updateExisting ? 'true' : 'false');
  return api.post('medications/bulk-import/', formData);
};

export const downloadImportTemplate = async (format = 'xlsx') => {
  const response = await api.get(`medications/download-template/?format=${format}`, {
    responseType: 'blob',
  });
  const ext = format === 'csv' ? 'csv' : 'xlsx';
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `modele_medicaments.${ext}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
