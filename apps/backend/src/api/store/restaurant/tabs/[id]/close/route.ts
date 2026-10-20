import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../../../../../modules/restaurant"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { id } = req.params

  const [tab] = (await restaurant.listTabs({ id })) as any[]

  if (!tab) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Comanda com id "${id}" nao encontrada`
    )
  }

  if (tab.status !== "open") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Comanda "${id}" nao esta aberta (status: ${tab.status})`
    )
  }

  const [closedTab] = (await restaurant.updateTabs([
    { id, status: "closed" },
  ])) as any[]

  let updatedTable: any = null

  if (tab.restaurant_table_id) {
    const [result] = (await restaurant.updateRestaurantTables([
      { id: tab.restaurant_table_id, status: "billing" },
    ])) as any[]
    updatedTable = result ?? null
  }

  res.json({ tab: closedTab, table: updatedTable })
}
