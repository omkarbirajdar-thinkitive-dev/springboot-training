import axios, { type AxiosRequestConfig } from 'axios'

// Intercept 401 responses to clear expired tokens and redirect to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = Boolean(localStorage.getItem('workforce.token'))
      if (hadToken) {
        localStorage.removeItem('workforce.token')
        localStorage.removeItem('workforce.username')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=1'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const token = localStorage.getItem('workforce.token')
  const baseURL = (window as Window & { __API_BASE_URL__?: string }).__API_BASE_URL__ ?? ''
  return axios.request<T>({
    ...config,
    baseURL,
    headers: {
      ...config.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then(({ data }) => data)
}