import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { RESTAURANT_MODULE } from "../../../../../modules/restaurant"

type SelectedModifierBody = {
  id: string
  quantity?: number
}

type AddRestaurantItemBody = {
  variant_id: string
  quantity?: number
  modifiers?: SelectedModifierBody[]
}

export async function POST(
  req: MedusaRequest<AddRestaurantItemBody>,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const pricing: any = req.scope.resolve(Modules.PRICING)

  const cartId = req.params.id
  const { variant_id, quantity = 1, modifiers = [] } = req.body ?? {}

  if (!variant_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "O campo variant_id e obrigatorio"
    )
  }

  if (quantity <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A quantidade deve ser maior que zero"
    )
  }

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "currency_code", "region_id", "customer_id"],
    filters: { id: cartId },
  })

  const cart = carts[0] as any

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Carrinho com id "${cartId}" nao encontrado`
    )
  }

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "product_id", "price_set.id"],
    filters: { id: variant_id },
  })

  const variant = variants[0] as any

  if (!variant) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Variante com id "${variant_id}" nao encontrada`
    )
  }

  const modifierIds = modifiers
    .map((modifier) => modifier.id)
    .filter((id): id is string => !!id)

  const modifierEntities = (await restaurant.listModifiers(
    modifierIds.length ? { id: modifierIds } : { id: [] }
  )) as any[]
  const modifierById = new Map(
    modifierEntities.map((modifier) => [modifier.id, modifier])
  )

  const modifiersMetadata = modifiers.map((modifier) => {
    const entity = modifierById.get(modifier.id)

    if (!entity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Modificador "${modifier.id}" nao encontrado`
      )
    }

    return {
      id: entity.id,
      name: entity.name,
      price: entity.price,
      quantity: modifier.quantity ?? 1,
      modifier_group_id: entity.modifier_group_id,
    }
  })

  const modifiersTotal = modifiersMetadata.reduce(
    (total, modifier) => total + Number(modifier.price) * modifier.quantity,
    0
  )

  let basePrice = 0

  if (variant.price_set?.id) {
    const calculatedPriceSets = await pricing.calculatePrices(
      { id: [variant.price_set.id] },
      {
        context: {
          currency_code: cart.currency_code,
          region_id: cart.region_id,
          customer_id: cart.customer_id,
        },
      }
    )

    basePrice = Number(calculatedPriceSets?.[0]?.calculated_amount ?? 0)
  }

  const unitPrice = Math.round(basePrice + modifiersTotal)

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id: cartId,
      items: [
        {
          variant_id,
          quantity,
          unit_price: unitPrice,
          metadata: {
            selected_modifiers: modifiersMetadata,
          },
        },
      ],
    },
  })

  const { data: refreshed } = await query.graph({
    entity: "cart",
    fields: ["*", "items.*"],
    filters: { id: cartId },
  })

  res.status(200).json({ cart: refreshed[0] })
}
