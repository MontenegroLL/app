import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createCartWorkflow, refreshCartItemsWorkflow } from "@medusajs/medusa/core-flows"
import { RESTAURANT_MODULE } from "../modules/restaurant"
import * as modifierGroupsRoute from "../api/store/restaurant/modifier-groups/route"
import * as tablesRoute from "../api/store/restaurant/tables/[token]/route"
import * as openTabRoute from "../api/store/restaurant/tabs/route"
import * as closeTabRoute from "../api/store/restaurant/tabs/[id]/close/route"
import * as cartItemsRoute from "../api/store/carts/[id]/restaurant-items/route"

type Handler = (req: any, res: any) => Promise<void>

type RouteResult = {
  ok: boolean
  status: number
  payload?: any
  error?: string
}

function makeRes() {
  const res: any = {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(body: any) {
      res.payload = body
      return res
    },
  }
  return res
}

async function call(
  handler: Handler,
  container: any,
  params: any,
  body: any = {},
  query: any = {}
): Promise<RouteResult> {
  const res = makeRes()
  try {
    await handler({ scope: container, params, body, query } as any, res)
    return { ok: true, status: res.statusCode, payload: res.payload }
  } catch (error: any) {
    return { ok: false, status: 0, error: error.message }
  }
}

export default async function verifyRestaurantRoutes({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const restaurant: any = container.resolve(RESTAURANT_MODULE)

  let failures = 0
  const check = (label: string, condition: boolean, detail: string) => {
    if (condition) {
      logger.info(`PASS ${label}: ${detail}`)
    } else {
      failures += 1
      logger.error(`FAIL ${label}: ${detail}`)
    }
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.title"],
    filters: { handle: "pizza-calabresa" },
  })
  const product = products[0] as any
  const catupiryVariant = product.variants.find((variant: any) =>
    variant.title.includes("Catupiry")
  )

  const allModifiers = (await restaurant.listModifiers({})) as any[]
  const catupiry = allModifiers.find((modifier) => modifier.name === "Catupiry")
  const cheddar = allModifiers.find((modifier) => modifier.name === "Cheddar")

  const groupsResult = await call(modifierGroupsRoute.GET, container, {}, {}, {
    product_id: product.id,
  })
  const group = groupsResult.payload?.modifier_groups?.[0]
  check(
    "modifier-groups",
    groupsResult.ok && groupsResult.payload.modifier_groups.length === 1,
    `groups=${groupsResult.payload?.modifier_groups?.length} modifiers=${group?.modifiers?.length}`
  )
  check(
    "modifier-groups-product-filter",
    group?.modifiers?.some((modifier: any) => modifier.id === cheddar.id),
    `group.product_id=${group?.product_id}`
  )

  const tableResult = await call(tablesRoute.GET, container, { token: "mesa-01" })
  check(
    "table-by-token",
    tableResult.ok && tableResult.payload?.table?.name_or_number === "Mesa 01",
    `table=${tableResult.payload?.table?.id} tab=${tableResult.payload?.tab}`
  )
  const tableId = tableResult.payload?.table?.id

  const badTokenResult = await call(tablesRoute.GET, container, {
    token: "token-inexistente",
  })
  check(
    "table-by-token-not-found",
    !badTokenResult.ok && /nao encontrada/.test(badTokenResult.error ?? ""),
    badTokenResult.error ?? ""
  )

  const staleTabs = (await restaurant.listTabs({ status: "open" })) as any[]
  if (staleTabs.length) {
    await restaurant.updateTabs(
      staleTabs.map((tab: any) => ({ id: tab.id, status: "closed" }))
    )
    await restaurant.updateRestaurantTables([
      { id: tableId, status: "available" },
    ])
  }

  const openResult = await call(openTabRoute.POST, container, {}, {
    restaurant_table_id: tableId,
    customer_name: "Cliente Teste",
  })
  const openedTabId = openResult.payload?.tab?.id
  check(
    "open-tab",
    openResult.ok && !!openedTabId && openResult.payload?.table?.status === "occupied",
    `tab=${openedTabId} table.status=${openResult.payload?.table?.status}`
  )

  const reopenResult = await call(openTabRoute.POST, container, {}, {
    restaurant_table_id: tableId,
  })
  check(
    "open-tab-idempotent",
    reopenResult.ok && reopenResult.status === 200 && reopenResult.payload?.tab?.id === openedTabId,
    `status=${reopenResult.status} tab=${reopenResult.payload?.tab?.id}`
  )

  const tableWithTab = await call(tablesRoute.GET, container, { token: "mesa-01" })
  check(
    "table-by-token-open-tab",
    tableWithTab.payload?.tab?.id === openedTabId,
    `tab=${tableWithTab.payload?.tab?.id}`
  )

  const { result: cart } = await createCartWorkflow(container).run({
    input: {
      currency_code: "brl",
      metadata: { table_id: tableId, tab_id: openedTabId },
    } as any,
  })
  check("create-cart-with-metadata", !!cart.id, `cart=${cart.id}`)

  const invalidTableCart = await createCartWorkflow(container)
    .run({
      input: {
        currency_code: "brl",
        metadata: { table_id: "rtable_inexistente" },
      } as any,
    })
    .then(() => "CREATED")
    .catch((error: any) => `BLOCKED: ${error.message}`)
  check(
    "hook-create-cart-invalid-table",
    /BLOCKED/.test(invalidTableCart),
    invalidTableCart
  )

  const withModifier = await call(cartItemsRoute.POST, container, { id: cart.id }, {
    variant_id: catupiryVariant.id,
    quantity: 1,
    modifiers: [{ id: catupiry.id, quantity: 1 }],
  })
  const item = withModifier.payload?.cart?.items?.[0]
  check(
    "add-item-with-modifier",
    withModifier.ok && Number(item?.unit_price) === 4700,
    `status=${withModifier.status} unit_price=${item?.unit_price} expected=4700`
  )
  check(
    "add-item-metadata",
    item?.metadata?.selected_modifiers?.length === 1 &&
      item.metadata.selected_modifiers[0].id === catupiry.id,
    JSON.stringify(item?.metadata?.selected_modifiers)
  )

  await refreshCartItemsWorkflow(container).run({
    input: { cart_id: cart.id },
  })
  const { data: refreshedCarts } = await query.graph({
    entity: "cart",
    fields: ["id", "items.unit_price", "items.metadata"],
    filters: { id: cart.id },
  })
  const refreshedItem = (refreshedCarts[0] as any)?.items?.[0]
  check(
    "unit-price-survives-refresh",
    Number(refreshedItem?.unit_price) === 4700,
    `unit_price=${refreshedItem?.unit_price} metadata=${JSON.stringify(refreshedItem?.metadata?.selected_modifiers)}`
  )

  const tooManyModifiers = await call(
    cartItemsRoute.POST,
    container,
    { id: cart.id },
    {
      variant_id: catupiryVariant.id,
      quantity: 1,
      modifiers: [
        { id: catupiry.id, quantity: 1 },
        { id: cheddar.id, quantity: 1 },
      ],
    }
  )
  check(
    "max-selection-blocked",
    !tooManyModifiers.ok && /maximo/.test(tooManyModifiers.error ?? ""),
    tooManyModifiers.error ?? `status=${tooManyModifiers.status}`
  )

  const unknownModifier = await call(
    cartItemsRoute.POST,
    container,
    { id: cart.id },
    {
      variant_id: catupiryVariant.id,
      quantity: 1,
      modifiers: [{ id: "mod_inexistente", quantity: 1 }],
    }
  )
  check(
    "unknown-modifier-blocked",
    !unknownModifier.ok && /nao encontrado/.test(unknownModifier.error ?? ""),
    unknownModifier.error ?? `status=${unknownModifier.status}`
  )

  const requiredMissing = await call(
    cartItemsRoute.POST,
    container,
    { id: cart.id },
    { variant_id: catupiryVariant.id, quantity: 1 }
  )
  check(
    "required-group-blocked",
    !requiredMissing.ok && /obrigator/.test(requiredMissing.error ?? ""),
    requiredMissing.error ?? `status=${requiredMissing.status}`
  )

  const invalidCart = await call(
    cartItemsRoute.POST,
    container,
    { id: "cart_inexistente" },
    { variant_id: catupiryVariant.id, quantity: 1 }
  )
  check(
    "cart-not-found",
    !invalidCart.ok && /nao encontrado/.test(invalidCart.error ?? ""),
    invalidCart.error ?? `status=${invalidCart.status}`
  )

  const closeResult = await call(closeTabRoute.POST, container, {
    id: openedTabId,
  })
  check(
    "close-tab",
    openResult.ok &&
      closeResult.ok &&
      closeResult.payload?.tab?.status === "closed" &&
      closeResult.payload?.table?.status === "billing",
    `tab.status=${closeResult.payload?.tab?.status} table.status=${closeResult.payload?.table?.status}`
  )

  const closeAgain = await call(closeTabRoute.POST, container, {
    id: openedTabId,
  })
  check(
    "close-tab-twice-blocked",
    !closeAgain.ok && /nao esta aberta/.test(closeAgain.error ?? ""),
    closeAgain.error ?? `status=${closeAgain.status}`
  )

  logger.info(
    `ROUTES_VERIFICATION_DONE failures=${failures} cart=${cart.id}`
  )
}
