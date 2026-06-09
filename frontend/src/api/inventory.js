import api from './axios';

export const getInventoryMovements = (params) => api.get('inventory/', { params });
export const createStockMovement = (data) => api.post('inventory/', data);
