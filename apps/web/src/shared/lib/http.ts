import axios from 'axios'

import { toApiError } from './api-error'

/** Client REST da API. O nginx (e o proxy do Vite em dev) servem a API no mesmo domínio. */
const http = axios.create({ baseURL: '/api', withCredentials: true })

http.interceptors.response.use(undefined, (error: unknown) => Promise.reject(toApiError(error)))

export { http }
