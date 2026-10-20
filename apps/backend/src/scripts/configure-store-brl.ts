import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function configureStoreBrl({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Iniciando configuracao da Loja para BRL / Brasil...")

  // 1. Obter a store atual
  const { data: stores } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "name",
      "default_sales_channel_id",
      "default_region_id",
      "default_location_id",
      "supported_currencies.*",
    ],
  })

  if (!stores || stores.length === 0) {
    logger.error("Nenhuma loja encontrada no banco de dados.")
    return
  }

  const store = stores[0]
  logger.info(`Loja encontrada: ${store.name} (ID: ${store.id})`)

  // 2. Obter ou criar a regiao Brasil
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })

  const existingBrazil = existingRegions.find(
    (r) =>
      r.currency_code === "brl" ||
      r.name?.toLowerCase().includes("brasil") ||
      r.name?.toLowerCase().includes("brazil")
  )

  let brazilRegionId: string | undefined = existingBrazil?.id

  if (!brazilRegionId) {
    logger.info("Criando regiao 'Brasil' com moeda BRL...")
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Brasil",
            currency_code: "brl",
            countries: ["br"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    })
    brazilRegionId = regionResult[0].id

    try {
      await createTaxRegionsWorkflow(container).run({
        input: [
          {
            country_code: "br",
            provider_id: "tp_system",
          },
        ],
      })
    } catch (e) {
      logger.warn(`Tax region Brasil aviso: ${e}`)
    }
  } else {
    logger.info(`Regiao Brasil encontrada ID: ${brazilRegionId}`)
  }

  // 3. Obter ou criar Stock Location "Deposito Central"
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })

  const matchedLocation =
    existingLocations.find(
      (l) =>
        l.name?.toLowerCase().includes("dep") ||
        l.name?.toLowerCase().includes("central")
    ) || existingLocations[0]

  let defaultLocationId: string | undefined = matchedLocation?.id
  let defaultLocationName: string = matchedLocation?.name || "Deposito Central"

  if (!defaultLocationId) {
    logger.info("Criando localizacao de estoque 'Deposito Central'...")
    const { result: locationResult } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Deposito Central",
            address: {
              city: "Sao Paulo",
              country_code: "BR",
              address_1: "",
            },
          },
        ],
      },
    })
    defaultLocationId = locationResult[0].id
    defaultLocationName = locationResult[0].name
  } else {
    logger.info(`Localizacao de estoque encontrada: ${defaultLocationName} (${defaultLocationId})`)
  }

  // 4. Nome da loja a partir do .env
  const restaurantName =
    process.env.NEXT_PUBLIC_RESTAURANT_NAME ||
    process.env.RESTAURANT_NAME ||
    store.name ||
    "Nucleo Delivery"

  logger.info(`Atualizando loja para Moeda BRL (Real Brasileiro) e Regiao Brasil...`)

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: restaurantName,
        supported_currencies: [
          {
            currency_code: "brl",
            is_default: true,
          },
        ],
        default_region_id: brazilRegionId,
        default_location_id: defaultLocationId,
      },
    },
  })

  // 5. Vincular sales channel a localizacao caso necessario
  if (store.default_sales_channel_id && defaultLocationId) {
    try {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
          id: defaultLocationId,
          add: [store.default_sales_channel_id],
        },
      })
    } catch {
      // Ignorar se ja vinculado
    }
  }

  logger.info(
    `Sucesso! Loja atualizada: Nome="${restaurantName}", Moeda Padrao="BRL", Regiao Padrao ID="${brazilRegionId}", Localizacao Padrao="${defaultLocationName}".`
  )
}
