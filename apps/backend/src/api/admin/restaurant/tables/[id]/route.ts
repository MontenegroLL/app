import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../../../../modules/restaurant"
import { TABLE_STATUSES } from "../../constants"

type UpdateTableBody = {
  name_or_number?: string
  capacity?: number
  status?: string
  qr_code_token?: string | null
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { id } = req.params

  const [table] = (await restaurant.listRestaurantTables({ id })) as any[]

  if (!table) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Mesa com id "${id}" nao encontrada`
    )
  }

  const [activeTab] = (await restaurant.listTabs({
    restaurant_table_id: id,
    status: "open",
  })) as any[]

  res.json({ table: { ...table, active_tab: activeTab ?? null } })
}

export async function PUT(
  req: MedusaRequest<UpdateTableBody>,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { id } = req.params
  const { name_or_number, capacity, status, qr_code_token } = req.body ?? {}

  const [existing] = (await restaurant.listRestaurantTables({ id })) as any[]

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Mesa com id "${id}" nao encontrada`
    )
  }

  if (status && !(TABLE_STATUSES as readonly string[]).includes(status)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Status "${status}" invalido. Valores aceitos: ${TABLE_STATUSES.join(", ")}`
    )
  }

  const update: Record<string, any> = { id }

  if (name_or_number !== undefined) {
    if (!String(name_or_number).trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "O campo name_or_number nao pode ser vazio"
      )
    }
    update.name_or_number = String(name_or_number).trim()
  }

  if (capacity !== undefined) {
    const parsedCapacity = Number(capacity)
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A capacidade deve ser um numero maior ou igual a 1"
      )
    }
    update.capacity = Math.trunc(parsedCapacity)
  }

  if (status !== undefined) {
    update.status = status
  }

  if (qr_code_token !== undefined) {
    update.qr_code_token = qr_code_token
  }

  const [updated] = (await restaurant.updateRestaurantTables([update])) as any[]

  const [activeTab] = (await restaurant.listTabs({
    restaurant_table_id: id,
    status: "open",
  })) as any[]

  res.json({ table: { ...updated, active_tab: activeTab ?? null } })
}
