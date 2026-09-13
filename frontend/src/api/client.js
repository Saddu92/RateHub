import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL
const apiBaseUrl = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/$/, '')}${configuredApiUrl.endsWith('/api') ? '' : '/api'}`
  : '/api'

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ratehub-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getApiError = (error, fallback = 'Something went wrong. Please try again.') =>
  error.response?.data?.message || error.message || fallback

export default api
