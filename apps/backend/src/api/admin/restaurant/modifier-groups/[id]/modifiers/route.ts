import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../../../../../modules/restaurant"

type CreateModifierBody = {
  name?: string
  price?: number | string
  is_default?: boolean
  max_quantity?: number | null
}

export async function POST(
  req: MedusaRequest<CreateModifierBody>,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { id } = req.params
  const { name, price, is_default, max_quantity } = req.body ?? {}

  const [group] = (await restaurant.listModifierGroups({ id })) as any[]

  if (!group) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Grupo de modificadores "${id}" nao encontrado`
    )
  }

  if (!name || !String(name).trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "O campo name e obrigatorio para criar um modificador"
    )
  }

  const parsedPrice = Number(price ?? 0)

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "O preco do modificador deve ser um numero maior ou igual a 0"
    )
  }

  const [created] = (await restaurant.createModifiers([
    {
      name: String(name).trim(),
      price: Math.round(parsedPrice),
      is_default: !!is_default,
      max_quantity:
        max_quantity === undefined || max_quantity === null
          ? null
          : Math.trunc(Number(max_quantity)),
      modifier_group_id: id,
    },
  ])) as any[]

  res.status(201).json({ modifier: created })
}
