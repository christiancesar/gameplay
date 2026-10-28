import axios from 'axios'

import { currentPlatform } from '@/shared/platform/current-platform'

import { toApiError } from './api-error'

/**
 * Client REST da API. No web o nginx (e o proxy do Vite em dev) servem a API no mesmo domínio. No desktop o endereço é
 * o do servidor escolhido. Nos dois a sessão é um cookie. O endereço é lido da plataforma a cada chamada, porque ela só
 * existe depois que o app monta.
 */
const http = axios.create({ withCredentials: true })

http.interceptors.request.use((config) => {
  config.baseURL = `${currentPlatform().server.baseUrl()}/api`
  return config
})

http.interceptors.response.use(undefined, (error: unknown) => Promise.reject(toApiError(error)))

export { http }
