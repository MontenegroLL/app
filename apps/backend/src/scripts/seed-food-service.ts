import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  createProductsWorkflow,
  createProductTagsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { RESTAURANT_MODULE } from "../modules/restaurant"

export default async function seedFoodService({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const restaurantModuleService: any = container.resolve(RESTAURANT_MODULE)

    const { data: existingCollections } = await query.graph({
      entity: "product_collection",
      fields: ["id", "handle"],
    })
    let pizzasCol = existingCollections.find((c: any) => c.handle === "pizzas")
    if (!pizzasCol) {
      await createCollectionsWorkflow(container).run({
        input: { collections: [{ title: "Pizzas", handle: "pizzas" }] },
      })
      const { data: coll2 } = await query.graph({
        entity: "product_collection",
        fields: ["id", "handle"],
      })
      pizzasCol = coll2.find((c: any) => c.handle === "pizzas")
    }

    const { data: existingTags } = await query.graph({
      entity: "product_tag",
      fields: ["id", "value"],
    })
    const needed = ["pizza", "calabresa", "bordas"].filter(
      (h) => !existingTags.find((t: any) => t.value === h)
    )
    if (needed.length > 0) {
      await createProductTagsWorkflow(container).run({
        input: {
          product_tags: needed.map((handle) => ({ handle, value: handle })),
        },
      })
    }

    const { data: tag2 } = await query.graph({
      entity: "product_tag",
      fields: ["id", "value"],
    })
    const pizzaTag = tag2.find((t: any) => t.value === "pizza")
    const calabresaTag = tag2.find((t: any) => t.value === "calabresa")

    const productHandle = "pizza-calabresa"
    const { data: existingProds } = await query.graph({
      entity: "product",
      fields: ["id", "handle"],
    })
    if (!existingProds.find((p: any) => p.handle === productHandle)) {
      await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: "Pizza Calabresa",
              handle: productHandle,
              status: ProductStatus.PUBLISHED,
              is_giftcard: false,
              collection_id: pizzasCol?.id,
              tag_ids: [pizzaTag, calabresaTag]
                .filter(Boolean)
                .map((t: any) => t.id),
              options: [{ title: "Borda", values: ["Catupiry", "Cheddar"] }],
              variants: [
                {
                  title: "Pizza Calabresa Catupiry",
                  options: { Borda: "Catupiry" },
                  manage_inventory: false,
                  prices: [{ currency_code: "brl", amount: 4500 }],
                },
                {
                  title: "Pizza Calabresa Cheddar",
                  options: { Borda: "Cheddar" },
                  manage_inventory: false,
                  prices: [{ currency_code: "brl", amount: 4700 }],
                },
              ],
            },
          ],
        },
      })
    }

    const { data: seededProds } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "variants.id", "variants.manage_inventory"],
      filters: { handle: productHandle },
    })
    const seededProduct = seededProds[0] as any
    const trackedVariants = (seededProduct?.variants ?? []).filter(
      (v: any) => v.manage_inventory
    )
    if (trackedVariants.length > 0) {
      await updateProductsWorkflow(container).run({
        input: {
          products: [
            {
              id: seededProduct.id,
              variants: trackedVariants.map((v: any) => ({
                id: v.id,
                manage_inventory: false,
              })),
            },
          ],
        },
      })
    }

    const existingTables = await restaurantModuleService.listRestaurantTables()
    if (!existingTables.some((t: any) => t.name_or_number === "Mesa 01")) {
      await restaurantModuleService.createRestaurantTables([
        {
          name_or_number: "Mesa 01",
          capacity: 4,
          status: "available",
          qr_code_token: "mesa-01",
        },
      ])
    } else {
      const mesa01 = existingTables.find(
        (t: any) => t.name_or_number === "Mesa 01"
      )!
      if (!mesa01.qr_code_token) {
        await restaurantModuleService.updateRestaurantTables([
          { id: mesa01.id, qr_code_token: "mesa-01" },
        ])
      }
    }

    const existingGroups = await restaurantModuleService.listModifierGroups()
    let borderGroup = existingGroups.find((g: any) => g.name === "Bordas")
    if (!borderGroup) {
      borderGroup = (
        await restaurantModuleService.createModifierGroups([
          {
            name: "Bordas",
            description: "Opcoes de borda",
            min_selection: 1,
            max_selection: 1,
            is_required: true,
          },
        ])
      )[0]
    }

    if (seededProduct && borderGroup.product_id !== seededProduct.id) {
      borderGroup = (
        await restaurantModuleService.updateModifierGroups([
          { id: borderGroup.id, product_id: seededProduct.id },
        ])
      )[0]
    }

    const existingMods = await restaurantModuleService.listModifiers()
    for (const modName of ["Catupiry", "Cheddar"]) {
      if (
        !existingMods.some(
          (m: any) =>
            m.name === modName && m.modifier_group_id === borderGroup.id
        )
      ) {
        await restaurantModuleService.createModifiers([
          {
            name: modName,
            price: 200,
            is_default: false,
            modifier_group_id: borderGroup.id,
          },
        ])
      }
    }

    logger.info("FOOD_SERVICE_SEED_DONE")
  } catch (error: any) {
    logger.error("FOOD_SERVICE_SEED_ERROR: " + error.message)
  }
}
