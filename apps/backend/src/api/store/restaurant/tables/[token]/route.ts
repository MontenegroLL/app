import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../../../../modules/restaurant"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { token } = req.params

  const [table] = (await restaurant.listRestaurantTables({
    qr_code_token: token,
  })) as any[]

  if (!table) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Mesa com o token "${token}" nao encontrada`
    )
  }

  const [tab] = (await restaurant.listTabs({
    restaurant_table_id: table.id,
    status: "open",
  })) as any[]

  res.json({
    table,
    tab: tab ?? null,
  })
}
