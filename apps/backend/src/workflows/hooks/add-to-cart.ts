import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../modules/restaurant"

type SelectedModifier = {
  id?: string
  modifier_group_id?: string
  quantity?: number
}

function getSelectedModifiers(metadata: any): SelectedModifier[] {
  const selected = metadata?.selected_modifiers ?? metadata?.modifiers
  return Array.isArray(selected) ? (selected as SelectedModifier[]) : []
}

addToCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const items = ((input?.items ?? []) as any[]).filter(
    (item) => !!item?.variant_id
  )

  if (!items.length) {
    return
  }

  const restaurant: any = container.resolve(RESTAURANT_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const variantIds = items
    .map((item) => item.variant_id)
    .filter((id): id is string => !!id)

  const productIdByVariant = new Map<string, string>()
  if (variantIds.length) {
    const { data: variants } = await query.graph({
      entity: "variant",
      fields: ["id", "product_id"],
      filters: { id: variantIds },
    })
    for (const variant of variants as any[]) {
      if (variant.product_id) {
        productIdByVariant.set(variant.id, variant.product_id)
      }
    }
  }

  const modifierIds = [
    ...new Set(
      items.flatMap((item) =>
        (getSelectedModifiers(item?.metadata) as SelectedModifier[])
          .map((selected) => selected.id)
          .filter((id): id is string => !!id)
      )
    ),
  ]

  const modifiers = (await restaurant.listModifiers(
    modifierIds.length ? { id: modifierIds } : { id: [] }
  )) as any[]
  const modifierById = new Map(modifiers.map((modifier) => [modifier.id, modifier]))

  const groupIds = [
    ...new Set(
      modifiers
        .map((modifier) => modifier.modifier_group_id)
        .filter((id): id is string => !!id)
    ),
  ] as string[]

  const groups = (await restaurant.listModifierGroups(
    groupIds.length ? { id: groupIds } : { id: [] }
  )) as any[]
  const groupById = new Map(groups.map((group) => [group.id, group]))

  for (const item of items) {
    const selected = getSelectedModifiers(item?.metadata)
    const productId = item.variant_id
      ? productIdByVariant.get(item.variant_id)
      : undefined

    for (const selectedModifier of selected) {
      const modifier = selectedModifier.id
        ? modifierById.get(selectedModifier.id)
        : undefined

      if (!modifier) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Modificador "${selectedModifier.id}" nao encontrado`
        )
      }

      if (
        selectedModifier.modifier_group_id &&
        selectedModifier.modifier_group_id !== modifier.modifier_group_id
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Modificador "${modifier.name}" nao pertence ao grupo informado`
        )
      }

      const group = groupById.get(modifier.modifier_group_id)

      if (group?.product_id && productId && group.product_id !== productId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Grupo "${group.name}" nao pertence ao produto do item`
        )
      }

      const quantity = selectedModifier.quantity ?? 1

      if (modifier.max_quantity != null && quantity > modifier.max_quantity) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Quantidade do modificador "${modifier.name}" excede o maximo permitido (${modifier.max_quantity})`
        )
      }
    }

    const selectedByGroup = new Map<string, number>()
    for (const selectedModifier of selected) {
      const modifier = selectedModifier.id
        ? modifierById.get(selectedModifier.id)
        : undefined
      const groupId = modifier?.modifier_group_id
      if (!groupId) continue
      selectedByGroup.set(
        groupId,
        (selectedByGroup.get(groupId) ?? 0) + (selectedModifier.quantity ?? 1)
      )
    }

    selectedByGroup.forEach((count, groupId) => {
      const group = groupById.get(groupId)
      if (!group) return

      if (count < group.min_selection) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Grupo "${group.name}" exige no minimo ${group.min_selection} selecao(oes)`
        )
      }

      if (count > group.max_selection) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Grupo "${group.name}" permite no maximo ${group.max_selection} selecao(oes)`
        )
      }
    })

    if (productId) {
      const productGroups = (await restaurant.listModifierGroups({
        product_id: productId,
      })) as any[]

      for (const group of productGroups.filter((g) => g.is_required)) {
        if (!selectedByGroup.has(group.id)) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Grupo obrigatorio "${group.name}" nao foi selecionado`
          )
        }
      }
    }
  }
})
