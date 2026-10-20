import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IfoodService } from "../services/ifood"

/**
 * Scheduled Job para Polling de Pedidos do iFood
 * Executa a cada 30 segundos consumindo a fila de eventos do iFood
 */
export default async function ifoodPollingJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const ifoodService = new IfoodService(container)

  // Se o lojista ainda nao preencheu as credenciais do iFood no .env, pula a execucao
  if (!ifoodService.isConfigured()) {
    return
  }

  try {
    const events = await ifoodService.pollEvents()

    if (!events || events.length === 0) {
      return
    }

    const acknowledgedEventIds: string[] = []

    for (const event of events) {
      acknowledgedEventIds.push(event.id)

      // Evento PLC: Pedido Colocado (Novo Pedido)
      if (event.code === "PLC") {
        logger.info(
          `[iFood] Novo pedido recebido - Preparando injeção no Medusa (Order ID: ${event.orderId})`
        )
      } else if (event.code === "CAN") {
        logger.warn(
          `[iFood] Pedido cancelado no iFood (Order ID: ${event.orderId})`
        )
      }
    }

    // Confirma ao iFood que os eventos foram recebidos com sucesso
    if (acknowledgedEventIds.length > 0) {
      await ifoodService.acknowledgeEvents(acknowledgedEventIds)
    }
  } catch (error: any) {
    logger.error(`[iFood] Erro durante o polling de pedidos: ${error.message}`)
  }
}

export const config = {
  name: "ifood-polling",
  schedule: "*/30 * * * * *",
}
