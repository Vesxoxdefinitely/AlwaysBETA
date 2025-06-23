import axios from 'axios';

const apiMessenger = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/messenger` : '/api/messenger',
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
