import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../../../../modules/restaurant"

type UpdateModifierGroupBody = {
  name?: string
  description?: string | null
  min_selection?: number
  max_selection?: number
  is_required?: boolean
  product_id?: string | null
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { id } = req.params

  const [group] = (await restaurant.listModifierGroups({ id })) as any[]

  if (!group) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Grupo de modificadores "${id}" nao encontrado`
    )
  }

  const modifiers = (await restaurant.listModifiers({
    modifier_group_id: id,
  })) as any[]

  res.json({ modifier_group: { ...group, modifiers } })
}

export async function PUT(
  req: MedusaRequest<UpdateModifierGroupBody>,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { id } = req.params
  const {
    name,
    description,
    min_selection,
    max_selection,
    is_required,
    product_id,
  } = req.body ?? {}

  const [existing] = (await restaurant.listModifierGroups({ id })) as any[]

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Grupo de modificadores "${id}" nao encontrado`
    )
  }

  const update: Record<string, any> = { id }

  if (name !== undefined) {
    if (!String(name).trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "O campo name nao pode ser vazio"
      )
    }
    update.name = String(name).trim()
  }

  if (description !== undefined) {
    update.description = description
  }

  const parsedMin =
    min_selection === undefined ? existing.min_selection : Number(min_selection)
  const parsedMax =
    max_selection === undefined ? existing.max_selection : Number(max_selection)

  if (!Number.isFinite(parsedMin) || parsedMin < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "min_selection deve ser um numero maior ou igual a 0"
    )
  }

  if (!Number.isFinite(parsedMax) || parsedMax < 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "max_selection deve ser um numero maior ou igual a 1"
    )
  }

  if (parsedMax < parsedMin) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "max_selection nao pode ser menor que min_selection"
    )
  }

  if (min_selection !== undefined) {
    update.min_selection = Math.trunc(parsedMin)
  }

  if (max_selection !== undefined) {
    update.max_selection = Math.trunc(parsedMax)
  }

  if (is_required !== undefined) {
    update.is_required = !!is_required
  }

  if (product_id !== undefined) {
    update.product_id = product_id
  }

  const [updated] = (await restaurant.updateModifierGroups([update])) as any[]

  const modifiers = (await restaurant.listModifiers({
    modifier_group_id: id,
  })) as any[]

  res.json({ modifier_group: { ...updated, modifiers } })
}
