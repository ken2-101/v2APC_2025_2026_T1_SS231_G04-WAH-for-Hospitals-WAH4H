import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://sturdy-adventure-r4pv79wg54qxc5rwx-8000.app.github.dev',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
