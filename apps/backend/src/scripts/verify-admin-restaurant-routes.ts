import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import * as modifierGroupModifiersRoute from "../api/admin/restaurant/modifier-groups/[id]/modifiers/route"
import * as modifierGroupRoute from "../api/admin/restaurant/modifier-groups/[id]/route"
import * as modifierGroupsRoute from "../api/admin/restaurant/modifier-groups/route"
import * as qrCodeRoute from "../api/admin/restaurant/tables/[id]/qr-code/route"
import * as tableRoute from "../api/admin/restaurant/tables/[id]/route"
import * as tablesRoute from "../api/admin/restaurant/tables/route"
import { RESTAURANT_MODULE } from "../modules/restaurant"

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
  params: any = {},
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

export default async function verifyAdminRestaurantRoutes({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
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

  const listResult = await call(tablesRoute.GET, container, {})
  const tables = listResult.payload?.tables ?? []
  const names = tables.map((table: any) => String(table.name_or_number))
  const sortedNames = [...names].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true })
  )
  check(
    "admin-tables-list",
    listResult.ok && tables.length >= 1,
    `tables=${tables.length} names=${names.join(", ")}`
  )
  check(
    "admin-tables-sorted",
    JSON.stringify(names) === JSON.stringify(sortedNames),
    `names=${names.join(", ")}`
  )
  check(
    "admin-tables-seeded",
    names.includes("Mesa 01"),
    `mesa01=${JSON.stringify(
      tables.find((table: any) => table.name_or_number === "Mesa 01")
    )}`
  )

  const createResult = await call(
    tablesRoute.POST,
    container,
    {},
    {
      name_or_number: "Mesa Verificacao",
      capacity: 6,
    }
  )
  const createdTable = createResult.payload?.table
  const createdTableId = createdTable?.id
  check(
    "admin-table-create",
    createResult.ok &&
      createResult.status === 201 &&
      createdTable?.name_or_number === "Mesa Verificacao" &&
      createdTable?.capacity === 6 &&
      createdTable?.status === "available" &&
      typeof createdTable?.qr_code_token === "string" &&
      createdTable.qr_code_token.startsWith("mesa-"),
    `status=${createResult.status} table=${JSON.stringify(createdTable)}`
  )

  const invalidStatusCreate = await call(
    tablesRoute.POST,
    container,
    {},
    {
      name_or_number: "Mesa Invalida",
      status: "voando",
    }
  )
  check(
    "admin-table-create-invalid-status",
    !invalidStatusCreate.ok && /invalido/.test(invalidStatusCreate.error ?? ""),
    invalidStatusCreate.error ?? `status=${invalidStatusCreate.status}`
  )

  const missingNameCreate = await call(
    tablesRoute.POST,
    container,
    {},
    {
      capacity: 2,
    }
  )
  check(
    "admin-table-create-missing-name",
    !missingNameCreate.ok && /obrigatorio/.test(missingNameCreate.error ?? ""),
    missingNameCreate.error ?? `status=${missingNameCreate.status}`
  )

  const updateTable = await call(
    tableRoute.PUT,
    container,
    { id: createdTableId },
    { status: "occupied", capacity: 8 }
  )
  check(
    "admin-table-update",
    updateTable.ok &&
      updateTable.payload?.table?.status === "occupied" &&
      updateTable.payload?.table?.capacity === 8,
    `table=${JSON.stringify(updateTable.payload?.table)}`
  )

  const updateInvalidStatus = await call(
    tableRoute.PUT,
    container,
    { id: createdTableId },
    { status: "nope" }
  )
  check(
    "admin-table-update-invalid-status",
    !updateInvalidStatus.ok && /invalido/.test(updateInvalidStatus.error ?? ""),
    updateInvalidStatus.error ?? `status=${updateInvalidStatus.status}`
  )

  const getTable = await call(tableRoute.GET, container, { id: createdTableId })
  check(
    "admin-table-get",
    getTable.ok &&
      getTable.payload?.table?.id === createdTableId &&
      getTable.payload?.table?.active_tab === null,
    `table=${JSON.stringify(getTable.payload?.table)}`
  )

  const getMissingTable = await call(tableRoute.GET, container, {
    id: "tab_inexistente",
  })
  check(
    "admin-table-not-found",
    !getMissingTable.ok && /nao encontrada/.test(getMissingTable.error ?? ""),
    getMissingTable.error ?? `status=${getMissingTable.status}`
  )

  const qrResult = await call(qrCodeRoute.GET, container, {
    id: createdTableId,
  })
  check(
    "admin-table-qr-code-target",
    qrResult.ok &&
      qrResult.payload?.qr_code_token === createdTable?.qr_code_token &&
      String(qrResult.payload?.target_url).endsWith(
        `/mesa/${createdTable?.qr_code_token}`
      ),
    `target_url=${qrResult.payload?.target_url}`
  )
  check(
    "admin-table-qr-code-data-url",
    typeof qrResult.payload?.data_url === "string" &&
      qrResult.payload.data_url.startsWith("data:image/png;base64,"),
    `data_url=${String(qrResult.payload?.data_url).slice(0, 32)}...`
  )

  const qrMissing = await call(qrCodeRoute.GET, container, {
    id: "tab_inexistente",
  })
  check(
    "admin-table-qr-code-not-found",
    !qrMissing.ok && /nao encontrada/.test(qrMissing.error ?? ""),
    qrMissing.error ?? `status=${qrMissing.status}`
  )

  const groupsResult = await call(modifierGroupsRoute.GET, container)
  const groups = groupsResult.payload?.modifier_groups ?? []
  check(
    "admin-modifier-groups-list",
    groupsResult.ok &&
      groups.length >= 1 &&
      groups.some((group: any) => (group.modifiers ?? []).length >= 1),
    `groups=${groups.length} names=${groups
      .map((group: any) => `${group.name}(${(group.modifiers ?? []).length})`)
      .join(", ")}`
  )

  const createGroup = await call(
    modifierGroupsRoute.POST,
    container,
    {},
    {
      name: "Grupo Verificacao",
      min_selection: 1,
      max_selection: 2,
      is_required: true,
      modifiers: [{ name: "Extra Verificacao", price: 350 }],
    }
  )
  const createdGroup = createGroup.payload?.modifier_group
  const createdGroupId = createdGroup?.id
  const createdModifier = createdGroup?.modifiers?.[0]
  check(
    "admin-modifier-group-create",
    createGroup.ok &&
      createGroup.status === 201 &&
      createdGroup?.name === "Grupo Verificacao" &&
      createdGroup?.min_selection === 1 &&
      createdGroup?.max_selection === 2 &&
      createdGroup?.is_required === true &&
      Number(createdModifier?.price) === 350 &&
      createdModifier?.modifier_group_id === createdGroupId,
    `group=${JSON.stringify(createdGroup)}`
  )

  const invalidRange = await call(
    modifierGroupsRoute.POST,
    container,
    {},
    {
      name: "Grupo Invalido",
      min_selection: 3,
      max_selection: 1,
    }
  )
  check(
    "admin-modifier-group-invalid-range",
    !invalidRange.ok &&
      /menor que min_selection/.test(invalidRange.error ?? ""),
    invalidRange.error ?? `status=${invalidRange.status}`
  )

  const missingGroupName = await call(
    modifierGroupsRoute.POST,
    container,
    {},
    {
      min_selection: 0,
    }
  )
  check(
    "admin-modifier-group-missing-name",
    !missingGroupName.ok && /obrigatorio/.test(missingGroupName.error ?? ""),
    missingGroupName.error ?? `status=${missingGroupName.status}`
  )

  const getGroup = await call(modifierGroupRoute.GET, container, {
    id: createdGroupId,
  })
  check(
    "admin-modifier-group-get",
    getGroup.ok && getGroup.payload?.modifier_group?.modifiers?.length === 1,
    `modifiers=${getGroup.payload?.modifier_group?.modifiers?.length}`
  )

  const updateGroup = await call(
    modifierGroupRoute.PUT,
    container,
    { id: createdGroupId },
    { max_selection: 3, is_required: false }
  )
  check(
    "admin-modifier-group-update",
    updateGroup.ok &&
      updateGroup.payload?.modifier_group?.max_selection === 3 &&
      updateGroup.payload?.modifier_group?.is_required === false,
    `group=${JSON.stringify(updateGroup.payload?.modifier_group)}`
  )

  const addModifier = await call(
    modifierGroupModifiersRoute.POST,
    container,
    { id: createdGroupId },
    { name: "Extra Verificacao 2", price: 150 }
  )
  check(
    "admin-modifier-add",
    addModifier.ok &&
      addModifier.status === 201 &&
      addModifier.payload?.modifier?.modifier_group_id === createdGroupId &&
      Number(addModifier.payload?.modifier?.price) === 150,
    `modifier=${JSON.stringify(addModifier.payload?.modifier)}`
  )

  const invalidModifierPrice = await call(
    modifierGroupModifiersRoute.POST,
    container,
    { id: createdGroupId },
    { name: "Extra Invalido", price: -5 }
  )
  check(
    "admin-modifier-invalid-price",
    !invalidModifierPrice.ok &&
      /maior ou igual a 0/.test(invalidModifierPrice.error ?? ""),
    invalidModifierPrice.error ?? `status=${invalidModifierPrice.status}`
  )

  const missingGroup = await call(modifierGroupRoute.GET, container, {
    id: "modgrp_inexistente",
  })
  check(
    "admin-modifier-group-not-found",
    !missingGroup.ok && /nao encontrado/.test(missingGroup.error ?? ""),
    missingGroup.error ?? `status=${missingGroup.status}`
  )

  const createdModifiers = (await restaurant.listModifiers({
    modifier_group_id: createdGroupId,
  })) as any[]
  if (createdModifiers.length) {
    await restaurant.deleteModifiers(createdModifiers.map((m: any) => m.id))
  }
  if (createdGroupId) {
    await restaurant.deleteModifierGroups([createdGroupId])
  }
  if (createdTableId) {
    await restaurant.deleteRestaurantTables([createdTableId])
  }
  check(
    "admin-verification-cleanup",
    true,
    `removed tables=1 groups=${createdGroupId ? 1 : 0} modifiers=${createdModifiers.length}`
  )

  logger.info(
    `ADMIN_ROUTES_FAILURES=${failures} VERIFICATION_${
      failures === 0 ? "SUCCESS" : "FAILED"
    }`
  )
}
