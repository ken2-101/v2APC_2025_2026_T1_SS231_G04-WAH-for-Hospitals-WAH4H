import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://glowing-orbit-wrgjv6x7jpq929j9p-8000.app.github.dev',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
