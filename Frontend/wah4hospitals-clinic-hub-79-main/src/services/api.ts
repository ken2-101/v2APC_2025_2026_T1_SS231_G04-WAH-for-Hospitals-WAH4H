import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://scaling-memory-jj56p55q79g42qwq5-8000.app.github.dev/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
