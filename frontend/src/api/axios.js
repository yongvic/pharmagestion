import axios from 'axios';

const DEFAULT_API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8765/api/';

const api = axios.create({ baseURL: DEFAULT_API });

let apiReady = false;
const readyPromise = (async () => {
  if (window.electronAPI?.getApiUrl) {
    try {
      const url = await window.electronAPI.getApiUrl();
      api.defaults.baseURL = url;
    } catch {
      api.defaults.baseURL = DEFAULT_API;
    }
  }
  apiReady = true;
})();

export async function waitForApi() {
  await readyPromise;
  return api;
}

api.interceptors.request.use(async (config) => {
  if (!apiReady) await readyPromise;
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refresh = localStorage.getItem('refresh');
    if (!refresh) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${api.defaults.baseURL}token/refresh/`, { refresh });
      localStorage.setItem('token', data.access);
      api.defaults.headers.Authorization = `Bearer ${data.access}`;
      processQueue(null, data.access);
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
