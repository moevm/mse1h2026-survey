import axios from 'axios'

const baseURL = '/api'

export const api = axios.create({
  baseURL: baseURL,
  withCredentials: true
})

// Для логики с refresh_token
// const refreshTokens = async () => {
//   const response = await axios.post(
//     `${baseURL}/auth/refresh`,
//     {},
//     { withCredentials: true}
//   )
// }

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config
//     if (
//       error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true
//       try {
//         await refreshTokens()
//         return api(originalRequest)
//       } catch (refreshError) {
//         window.dispatchEvent(new Event('unauthorized'))
//         return Promise.reject(refreshError)
//       }
//     }
//     return Promise.reject(error)
//   }
// )

export const request = async (
  method,
  url,
  data = {}
) => {
  try {
    const isGet = method.toLowerCase() === 'get'
    const response = await api({
      method,
      url,
      params: isGet ? data : null,
      data: isGet ? null : data
    });
    return response.data
  } catch (error) {
    const errorMessage = error.response?.data?.detail
    throw errorMessage
  }
}