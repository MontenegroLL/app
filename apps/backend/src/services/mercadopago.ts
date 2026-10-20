import { MercadoPagoConfig, Payment, Preference } from "mercadopago"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export interface MercadoPagoConfigOptions {
  accessToken?: string
  publicKey?: string
  webhookSecret?: string
}

export interface CreatePixPaymentInput {
  amount: number
  description: string
  orderId?: string
  customerEmail?: string
  customerName?: string
  customerDocument?: string
  metadata?: Record<string, any>
}

export interface PixPaymentResponse {
  paymentId: string
  status: string
  statusDetail: string
  qrCode: string
  qrCodeBase64: string
  ticketUrl: string
  expirationDate: string
}

export class MercadoPagoService {
  protected logger?: any
  protected client: MercadoPagoConfig
  protected paymentClient: Payment
  protected preferenceClient: Preference

  constructor(containerOrConfig?: MedusaContainer | MercadoPagoConfigOptions) {
    let accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || ""

    if (containerOrConfig && "resolve" in containerOrConfig) {
      try {
        this.logger = containerOrConfig.resolve(ContainerRegistrationKeys.LOGGER)
      } catch {
        // Logger opcional
      }
    } else if (containerOrConfig && "accessToken" in containerOrConfig && containerOrConfig.accessToken) {
      accessToken = containerOrConfig.accessToken
    }

    if (!accessToken) {
      this.log("warn", "[MercadoPago] MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente.")
    }

    this.client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: {
        timeout: 10000,
      },
    })

    this.paymentClient = new Payment(this.client)
    this.preferenceClient = new Preference(this.client)
  }

  protected log(level: "info" | "warn" | "error" | "debug", message: string): void {
    if (this.logger && typeof this.logger[level] === "function") {
      this.logger[level](message)
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`)
    }
  }

  /**
   * Cria um PIX Dinâmico Instantâneo para Balcão ou Comanda de Mesa
   */
  public async createPixPayment(input: CreatePixPaymentInput): Promise<PixPaymentResponse> {
    try {
      this.log("info", `[MercadoPago] Gerando PIX de R$ ${(input.amount).toFixed(2)} para pedido: ${input.orderId || "Balcão"}`)

      const body: any = {
        transaction_amount: Number(input.amount),
        description: input.description,
        payment_method_id: "pix",
        payer: {
          email: input.customerEmail || "cliente@nucleopdv.com.br",
          first_name: input.customerName || "Cliente",
        },
        metadata: {
          order_id: input.orderId,
          ...input.metadata,
        },
      }

      if (input.customerDocument) {
        body.payer.identification = {
          type: input.customerDocument.length > 11 ? "CNPJ" : "CPF",
          number: input.customerDocument.replace(/\D/g, ""),
        }
      }

      const response = await this.paymentClient.create({ body })

      const pointOfInteraction = response.point_of_interaction
      const transactionData = pointOfInteraction?.transaction_data

      return {
        paymentId: String(response.id),
        status: response.status || "pending",
        statusDetail: response.status_detail || "",
        qrCode: transactionData?.qr_code || "",
        qrCodeBase64: transactionData?.qr_code_base64 || "",
        ticketUrl: transactionData?.ticket_url || "",
        expirationDate: response.date_of_expiration || "",
      }
    } catch (error: any) {
      const errMsg = error?.message || JSON.stringify(error)
      this.log("error", `[MercadoPago] Falha ao criar pagamento PIX: ${errMsg}`)
      throw new Error(`Falha no Mercado Pago: ${errMsg}`)
    }
  }

  /**
   * Consulta o status atualizado de um pagamento
   */
  public async getPaymentStatus(paymentId: string | number): Promise<any> {
    try {
      const payment = await this.paymentClient.get({ id: paymentId })
      return {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        isApproved: payment.status === "approved",
        amount: payment.transaction_amount,
        metadata: payment.metadata,
      }
    } catch (error: any) {
      this.log("error", `[MercadoPago] Erro ao consultar pagamento ${paymentId}: ${error.message}`)
      throw error
    }
  }

  /**
   * Realiza estorno total ou parcial de um pagamento
   */
  public async refundPayment(paymentId: string | number, amount?: number): Promise<any> {
    try {
      this.log("info", `[MercadoPago] Estornando pagamento ${paymentId}`)
      const refund = await this.paymentClient.cancel({ id: paymentId })
      return refund
    } catch (error: any) {
      this.log("error", `[MercadoPago] Erro ao estornar pagamento ${paymentId}: ${error.message}`)
      throw error
    }
  }
}
