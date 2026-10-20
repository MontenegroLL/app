import { MedusaError } from "@medusajs/framework/utils"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"
import { RESTAURANT_MODULE } from "../../modules/restaurant"

createCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const metadata = (input?.metadata ?? {}) as Record<string, any>
  const tableId = metadata.table_id as string | undefined
  const tabId = metadata.tab_id as string | undefined

  if (!tableId && !tabId) {
    return
  }

  const restaurant: any = container.resolve(RESTAURANT_MODULE)

  if (tableId) {
    const [table] = await restaurant.listRestaurantTables({ id: tableId })

    if (!table) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Mesa com id "${tableId}" nao encontrada`
      )
    }

    if (!["available", "occupied", "reserved"].includes(table.status)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Mesa "${table.name_or_number}" nao esta disponivel para atendimento (status: ${table.status})`
      )
    }
  }

  if (tabId) {
    const [tab] = await restaurant.listTabs({ id: tabId })

    if (!tab) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Comanda com id "${tabId}" nao encontrada`
      )
    }

    if (tab.status !== "open") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Comanda "${tab.id}" nao esta aberta (status: ${tab.status})`
      )
    }

    if (
      tableId &&
      tab.restaurant_table_id &&
      tab.restaurant_table_id !== tableId
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Comanda "${tab.id}" nao pertence a mesa "${tableId}"`
      )
    }
  }
})
