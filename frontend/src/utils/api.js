import axios from 'axios';

// create axios instance with base url
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// add token to every request
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('ttm_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// handle 401 errors - user session expired or invalid
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // clear saved user data
      localStorage.removeItem('ttm_token');
      localStorage.removeItem('ttm_user');
      // tell react to logout user without full page reload
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export default api;
