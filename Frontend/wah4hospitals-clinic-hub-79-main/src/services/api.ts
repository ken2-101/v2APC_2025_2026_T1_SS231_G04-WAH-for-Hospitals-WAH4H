import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.LOCAL_8080 ||
    import.meta.env.STURDY_ADVENTURE_BASE ||
    'https://sturdy-adventure-r4pv79wg54qxc5rwx-8000.app.github.dev',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
