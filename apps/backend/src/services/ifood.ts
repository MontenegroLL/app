import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import axios, { type AxiosInstance } from "axios"

export type IfoodEventCode =
  | "PLC" // Placed (Pedido Colocado)
  | "CFM" // Confirmed (Confirmado pela loja)
  | "DSP" // Dispatched (Em rota de entrega / Despachado)
  | "CON" // Concluded (Entregue / Concluído)
  | "CAN" // Cancelled (Cancelado)
  | "CAR" // Cancellation Requested (Cancelamento Solicitado)
  | string

export interface IfoodEvent {
  id: string
  code: IfoodEventCode
  fullCode?: string
  orderId: string
  merchantId?: string
  createdAt?: string
  metadata?: Record<string, unknown>
}

export interface IfoodTokenResponse {
  accessToken: string
  type: string
  expiresIn: number
}

export interface IfoodServiceConfig {
  clientId?: string
  clientSecret?: string
  merchantId?: string
  baseUrl?: string
}

export class IfoodService {
  protected logger?: any
  protected clientId: string
  protected clientSecret: string
  protected merchantId: string
  protected baseUrl: string
  protected client: AxiosInstance

  private cachedToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor(containerOrConfig?: MedusaContainer | IfoodServiceConfig) {
    let config: IfoodServiceConfig = {}

    // Verifica se recebeu o container do Medusa
    if (containerOrConfig && "resolve" in containerOrConfig) {
      try {
        this.logger = containerOrConfig.resolve(
          ContainerRegistrationKeys.LOGGER
        )
      } catch {
        // Logger opcional
      }
    } else if (containerOrConfig) {
      config = containerOrConfig
    }

    this.clientId = config.clientId || process.env.IFOOD_CLIENT_ID || ""
    this.clientSecret =
      config.clientSecret || process.env.IFOOD_CLIENT_SECRET || ""
    this.merchantId = config.merchantId || process.env.IFOOD_MERCHANT_ID || ""
    this.baseUrl = config.baseUrl || "https://merchant-api.ifood.com.br"

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
    })
  }

  /**
   * Verifica se as credenciais do iFood estao preenchidas no ambiente
   */
  public isConfigured(): boolean {
    return Boolean(this.clientId.trim() && this.clientSecret.trim())
  }

  /**
   * Autenticacao OAuth2 - Gera ou reaproveita o Bearer Token
   * Endpoint: /authentication/v1.0/oauth/token
   */
  public async getAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(
        "[iFood] Credenciais nao configuradas. Defina IFOOD_CLIENT_ID e IFOOD_CLIENT_SECRET no .env"
      )
    }

    // Retorna token em cache se ainda for valido (com margem de 60 segundos)
    const now = Date.now()
    if (this.cachedToken && this.tokenExpiresAt > now + 60000) {
      return this.cachedToken
    }

    try {
      const params = new URLSearchParams()
      params.append("grantType", "client_credentials")
      params.append("clientId", this.clientId)
      params.append("clientSecret", this.clientSecret)

      const response = await this.client.post<IfoodTokenResponse>(
        "/authentication/v1.0/oauth/token",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      )

      const data = response.data
      this.cachedToken = data.accessToken
      // expiresIn vem em segundos (geralmente 21600s = 6h)
      this.tokenExpiresAt = now + (data.expiresIn || 3600) * 1000

      this.log("debug", "[iFood] Token OAuth2 obtido com sucesso.")
      return this.cachedToken
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message
      this.log("error", `[iFood] Erro na autenticacao OAuth2: ${errMsg}`)
      throw error
    }
  }

  /**
   * Polling de Eventos - Busca novos pedidos e alteracoes de status
   * Endpoint: /order/1.0/events:polling
   */
  public async pollEvents(): Promise<IfoodEvent[]> {
    if (!this.isConfigured()) {
      return []
    }

    try {
      const token = await this.getAccessToken()

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      }

      if (this.merchantId) {
        headers["x-polling-merchants"] = this.merchantId
      }

      const response = await this.client.get<IfoodEvent[]>(
        "/order/1.0/events:polling",
        { headers }
      )

      // HTTP 204: sem novos eventos no momento
      if (response.status === 204 || !response.data) {
        return []
      }

      return Array.isArray(response.data) ? response.data : []
    } catch (error: any) {
      // Se for 204 via erro ou timeout esperado no long polling
      if (error.response?.status === 204) {
        return []
      }

      const errMsg = error.response?.data?.message || error.message
      this.log(
        "error",
        `[iFood] Falha ao consultar eventos (polling): ${errMsg}`
      )
      return []
    }
  }

  /**
   * Reconhecimento de Eventos (Acknowledgment)
   * Avisa ao iFood que os eventos foram recebidos e processados para nao serem reenviados
   * Endpoint: /order/1.0/events/acknowledgment
   */
  public async acknowledgeEvents(
    eventIds: (string | { id: string })[]
  ): Promise<boolean> {
    if (!eventIds || eventIds.length === 0) {
      return true
    }

    try {
      const token = await this.getAccessToken()

      const payload = eventIds.map((item) =>
        typeof item === "string" ? { id: item } : { id: item.id }
      )

      await this.client.post("/order/1.0/events/acknowledgment", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      this.log(
        "debug",
        `[iFood] ${payload.length} evento(s) reconhecido(s) com sucesso.`
      )
      return true
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message
      this.log("error", `[iFood] Falha ao confirmar acknowledgment: ${errMsg}`)
      return false
    }
  }

  /**
   * Obtem detalhes completos de um pedido
   * Endpoint: /order/1.0/orders/{orderId}
   */
  public async getOrderDetails(orderId: string): Promise<any> {
    const token = await this.getAccessToken()

    const response = await this.client.get(`/order/1.0/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data
  }

  /**
   * Confirma um pedido no iFood
   * Endpoint: /order/1.0/orders/{orderId}/confirm
   */
  public async confirmOrder(orderId: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken()

      await this.client.post(
        `/order/1.0/orders/${orderId}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      this.log("info", `[iFood] Pedido ${orderId} confirmado com sucesso.`)
      return true
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message
      this.log(
        "error",
        `[iFood] Falha ao confirmar pedido ${orderId}: ${errMsg}`
      )
      return false
    }
  }

  /**
   * Despacha um pedido no iFood (saiu para entrega)
   * Endpoint: /order/1.0/orders/{orderId}/dispatch
   */
  public async dispatchOrder(orderId: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken()

      await this.client.post(
        `/order/1.0/orders/${orderId}/dispatch`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      this.log("info", `[iFood] Pedido ${orderId} despachado com sucesso.`)
      return true
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message
      this.log(
        "error",
        `[iFood] Falha ao despachar pedido ${orderId}: ${errMsg}`
      )
      return false
    }
  }

  private log(level: "info" | "warn" | "error" | "debug", message: string) {
    if (this.logger && typeof this.logger[level] === "function") {
      this.logger[level](message)
    } else {
      console[level === "debug" ? "log" : level](message)
    }
  }
}

export default IfoodService
