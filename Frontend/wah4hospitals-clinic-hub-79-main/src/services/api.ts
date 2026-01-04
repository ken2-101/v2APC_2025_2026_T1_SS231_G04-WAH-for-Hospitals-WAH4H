import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://curly-couscous-wrgjv6x7j6v4hgvrw-8000.app.github.dev',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
