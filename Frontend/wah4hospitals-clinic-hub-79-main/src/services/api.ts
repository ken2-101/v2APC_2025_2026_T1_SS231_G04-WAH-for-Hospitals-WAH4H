import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://ominous-space-sniffle-4jw9q46794qpfgvq-8000.app.github.dev/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
