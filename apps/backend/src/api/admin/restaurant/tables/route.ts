import { randomUUID } from "node:crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../../../modules/restaurant"
import { TABLE_STATUSES } from "../constants"

type CreateTableBody = {
  name_or_number?: string
  capacity?: number
  status?: string
  qr_code_token?: string
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)

  const tables = (await restaurant.listRestaurantTables()) as any[]
  const openTabs = (await restaurant.listTabs({ status: "open" })) as any[]

  const openTabByTable = new Map<string, any>()
  for (const tab of openTabs) {
    if (tab.restaurant_table_id) {
      openTabByTable.set(tab.restaurant_table_id, tab)
    }
  }

  tables.sort((a, b) =>
    String(a.name_or_number ?? "").localeCompare(
      String(b.name_or_number ?? ""),
      "pt-BR",
      { numeric: true }
    )
  )

  res.json({
    tables: tables.map((table) => ({
      ...table,
      active_tab: openTabByTable.get(table.id) ?? null,
    })),
  })
}

export async function POST(
  req: MedusaRequest<CreateTableBody>,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { name_or_number, capacity, status, qr_code_token } = req.body ?? {}

  if (!name_or_number || !String(name_or_number).trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "O campo name_or_number e obrigatorio para criar uma mesa"
    )
  }

  if (status && !(TABLE_STATUSES as readonly string[]).includes(status)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Status "${status}" invalido. Valores aceitos: ${TABLE_STATUSES.join(", ")}`
    )
  }

  const parsedCapacity =
    capacity === undefined || capacity === null ? 4 : Number(capacity)

  if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A capacidade deve ser um numero maior ou igual a 1"
    )
  }

  const [created] = (await restaurant.createRestaurantTables([
    {
      name_or_number: String(name_or_number).trim(),
      capacity: Math.trunc(parsedCapacity),
      status: status ?? "available",
      qr_code_token:
        qr_code_token?.trim() || `mesa-${randomUUID().slice(0, 8)}`,
    },
  ])) as any[]

  res.status(201).json({ table: { ...created, active_tab: null } })
}
