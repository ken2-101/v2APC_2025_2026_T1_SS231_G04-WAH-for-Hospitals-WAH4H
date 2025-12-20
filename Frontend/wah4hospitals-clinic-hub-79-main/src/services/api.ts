import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://supreme-memory-5w9pg5gjv59379g7-8000.app.github.dev/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
