import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RESTAURANT_MODULE } from "../../../../modules/restaurant"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const productId = req.query.product_id as string | undefined

  const groups = (await restaurant.listModifierGroups(
    productId ? { product_id: productId } : {}
  )) as any[]

  const groupsWithModifiers = await Promise.all(
    groups.map(async (group) => {
      const modifiers = (await restaurant.listModifiers({
        modifier_group_id: group.id,
      })) as any[]

      return {
        ...group,
        modifiers,
      }
    })
  )

  res.json({
    modifier_groups: groupsWithModifiers,
  })
}
