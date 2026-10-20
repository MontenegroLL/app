import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../../../modules/restaurant"

type OpenTabBody = {
  restaurant_table_id?: string
  customer_name?: string
}

export async function POST(
  req: MedusaRequest<OpenTabBody>,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { restaurant_table_id, customer_name } = req.body ?? {}

  if (!restaurant_table_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "O campo restaurant_table_id e obrigatorio para abrir uma comanda"
    )
  }

  const [table] = (await restaurant.listRestaurantTables({
    id: restaurant_table_id,
  })) as any[]

  if (!table) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Mesa com id "${restaurant_table_id}" nao encontrada`
    )
  }

  const [existingTab] = (await restaurant.listTabs({
    restaurant_table_id,
    status: "open",
  })) as any[]

  if (existingTab) {
    res.status(200).json({ tab: existingTab })
    return
  }

  const [tab] = (await restaurant.createTabs([
    {
      restaurant_table_id,
      customer_name: customer_name ?? null,
      status: "open",
    },
  ])) as any[]

  const [updatedTable] = (await restaurant.updateRestaurantTables([
    { id: restaurant_table_id, status: "occupied" },
  ])) as any[]

  res.status(201).json({ tab, table: updatedTable })
}
