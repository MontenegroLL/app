import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  updateStockLocationsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function verifyAndPolishStore({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // 1. Obter a store atualizada
  const { data: stores } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "name",
      "default_region_id",
      "default_location_id",
      "supported_currencies.*",
    ],
  })

  const store = stores[0]
  logger.info(`Store Name: ${store.name}`)
  logger.info(`Default Region ID: ${store.default_region_id}`)
  logger.info(
    `Supported Currencies: ${JSON.stringify(store.supported_currencies)}`
  )

  // 2. Se a localização se chama "European Warehouse", renomear para "Depósito Central"
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "address.*"],
  })

  for (const loc of locations) {
    if (
      loc.name?.toLowerCase().includes("european") ||
      loc.name?.toLowerCase().includes("warehouse")
    ) {
      logger.info(
        `Renomeando stock location ${loc.name} -> Deposito Central...`
      )
      await updateStockLocationsWorkflow(container).run({
        input: {
          selector: { id: loc.id },
          update: {
            name: "Deposito Central",
            address: {
              city: "Sao Paulo",
              country_code: "BR",
              address_1: "",
            },
          },
        },
      })
    }
  }

  // 3. Garantir que apenas BRL seja a moeda suportada e padrão
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: "brl",
            is_default: true,
          },
        ],
      },
    },
  })

  const { data: updatedStores } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "name",
      "default_region_id",
      "default_location_id",
      "supported_currencies.*",
    ],
  })
  logger.info(`Estado final da Store: ${JSON.stringify(updatedStores[0])}`)
}
