import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../../../modules/restaurant"

type CreateModifierInput = {
  name?: string
  price?: number | string
  is_default?: boolean
  max_quantity?: number | null
}

type CreateModifierGroupBody = {
  name?: string
  description?: string | null
  min_selection?: number
  max_selection?: number
  is_required?: boolean
  product_id?: string | null
  modifiers?: CreateModifierInput[]
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)

  const groups = (await restaurant.listModifierGroups()) as any[]
  const modifiers = (await restaurant.listModifiers()) as any[]

  const modifiersByGroup = new Map<string, any[]>()
  for (const modifier of modifiers) {
    const groupId = modifier.modifier_group_id
    if (!groupId) continue
    const list = modifiersByGroup.get(groupId) ?? []
    list.push(modifier)
    modifiersByGroup.set(groupId, list)
  }

  groups.sort((a, b) =>
    String(a.name ?? "").localeCompare(String(b.name ?? ""), "pt-BR")
  )

  res.json({
    modifier_groups: groups.map((group) => ({
      ...group,
      modifiers: (modifiersByGroup.get(group.id) ?? []).sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? ""), "pt-BR")
      ),
    })),
  })
}

export async function POST(
  req: MedusaRequest<CreateModifierGroupBody>,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const {
    name,
    description,
    min_selection,
    max_selection,
    is_required,
    product_id,
    modifiers,
  } = req.body ?? {}

  if (!name || !String(name).trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "O campo name e obrigatorio para criar um grupo de modificadores"
    )
  }

  const parsedMin = min_selection === undefined ? 0 : Number(min_selection)
  const parsedMax = max_selection === undefined ? 1 : Number(max_selection)

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

  const [group] = (await restaurant.createModifierGroups([
    {
      name: String(name).trim(),
      description: description ?? null,
      min_selection: Math.trunc(parsedMin),
      max_selection: Math.trunc(parsedMax),
      is_required: !!is_required,
      product_id: product_id ?? null,
    },
  ])) as any[]

  const createdModifiers: any[] = []

  for (const modifier of modifiers ?? []) {
    if (!modifier?.name || !String(modifier.name).trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cada modificador precisa de um campo name"
      )
    }

    const price = Number(modifier.price ?? 0)

    if (!Number.isFinite(price) || price < 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Preco invalido para o modificador "${modifier.name}"`
      )
    }

    const [created] = (await restaurant.createModifiers([
      {
        name: String(modifier.name).trim(),
        price: Math.round(price),
        is_default: !!modifier.is_default,
        max_quantity:
          modifier.max_quantity === undefined || modifier.max_quantity === null
            ? null
            : Math.trunc(Number(modifier.max_quantity)),
        modifier_group_id: group.id,
      },
    ])) as any[]

    createdModifiers.push(created)
  }

  res.status(201).json({
    modifier_group: { ...group, modifiers: createdModifiers },
  })
}
