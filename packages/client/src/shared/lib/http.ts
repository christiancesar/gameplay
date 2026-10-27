import axios from 'axios'

import { currentPlatform } from '@/shared/platform/current-platform'

import { toApiError } from './api-error'

/**
 * Client REST da API. No web o nginx (e o proxy do Vite em dev) servem a API no mesmo domínio e a sessão é um
 * cookie. No desktop o endereço é o do servidor escolhido e a sessão vai no header Authorization. Os dois são
 * lidos da plataforma a cada chamada, porque ela só existe depois que o app monta.
 */
const http = axios.create({ withCredentials: true })

http.interceptors.request.use((config) => {
  const { server } = currentPlatform()
  config.baseURL = `${server.baseUrl()}/api`
  const token = server.session.getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(undefined, (error: unknown) => Promise.reject(toApiError(error)))

export { http }
