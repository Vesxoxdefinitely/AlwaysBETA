import axios from 'axios';

const apiMessenger = axios.create({
  baseURL: 'http://localhost:5000/api/messenger',
  withCredentials: true,
});

// Добавляем перехватчик для подстановки токена
apiMessenger.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiMessenger;
