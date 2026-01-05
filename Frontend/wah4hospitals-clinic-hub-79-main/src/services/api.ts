import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.STURDY_ADVENTURE_BASE_8000 ||
    import.meta.env.LOCAL_8000 ||
    import.meta.env.STURDY_ADVENTURE_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
