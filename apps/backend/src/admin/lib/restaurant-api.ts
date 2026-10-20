import type { CSSProperties } from "react"

export type TableStatus = "available" | "occupied" | "reserved" | "billing"

export type StatusBadgeColor =
  | "green"
  | "red"
  | "orange"
  | "blue"
  | "grey"
  | "purple"

export type RestaurantTab = {
  id: string
  customer_name: string | null
  status: string
  restaurant_table_id: string | null
}

export type RestaurantTable = {
  id: string
  name_or_number: string
  capacity: number
  status: TableStatus
  qr_code_token: string | null
  active_tab: RestaurantTab | null
}

export type Modifier = {
  id: string
  name: string
  price: number | string
  is_default: boolean
  max_quantity: number | null
  modifier_group_id: string | null
}

export type ModifierGroup = {
  id: string
  name: string
  description: string | null
  min_selection: number
  max_selection: number
  is_required: boolean
  product_id: string | null
  modifiers: Modifier[]
}

export type TableQrCode = {
  table_id: string
  name_or_number: string
  qr_code_token: string
  target_url: string
  data_url: string | null
}

export const TABLE_STATUS_META: Record<
  TableStatus,
  { label: string; color: StatusBadgeColor; dot: string }
> = {
  available: { label: "Disponível", color: "green", dot: "#12B76A" },
  occupied: { label: "Ocupada", color: "red", dot: "#F04438" },
  billing: { label: "Conta Solicitada", color: "orange", dot: "#F79009" },
  reserved: { label: "Reservada", color: "blue", dot: "#2E90FA" },
}

export const TABLE_STATUS_ORDER: TableStatus[] = [
  "available",
  "occupied",
  "billing",
  "reserved",
]

export async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  const text = await response.text()
  let body: any = null

  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }

  if (!response.ok) {
    throw new Error(body?.message ?? `Falha na requisição (${response.status})`)
  }

  return body as T
}

export function listTables(): Promise<{ tables: RestaurantTable[] }> {
  return adminFetch<{ tables: RestaurantTable[] }>("/admin/restaurant/tables")
}

export function createTable(payload: {
  name_or_number: string
  capacity: number
}): Promise<{ table: RestaurantTable }> {
  return adminFetch<{ table: RestaurantTable }>("/admin/restaurant/tables", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateTable(
  id: string,
  payload: Partial<{
    name_or_number: string
    capacity: number
    status: TableStatus
  }>
): Promise<{ table: RestaurantTable }> {
  return adminFetch<{ table: RestaurantTable }>(
    `/admin/restaurant/tables/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  )
}

export function getTableQrCode(id: string): Promise<TableQrCode> {
  return adminFetch<TableQrCode>(`/admin/restaurant/tables/${id}/qr-code`)
}

export function listModifierGroups(): Promise<{
  modifier_groups: ModifierGroup[]
}> {
  return adminFetch<{ modifier_groups: ModifierGroup[] }>(
    "/admin/restaurant/modifier-groups"
  )
}

export function createModifierGroup(payload: {
  name: string
  description?: string | null
  min_selection?: number
  max_selection?: number
  is_required?: boolean
  modifiers?: { name: string; price: number }[]
}): Promise<{ modifier_group: ModifierGroup }> {
  return adminFetch<{ modifier_group: ModifierGroup }>(
    "/admin/restaurant/modifier-groups",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export function updateModifierGroup(
  id: string,
  payload: Partial<{
    name: string
    description: string | null
    min_selection: number
    max_selection: number
    is_required: boolean
    product_id: string | null
  }>
): Promise<{ modifier_group: ModifierGroup }> {
  return adminFetch<{ modifier_group: ModifierGroup }>(
    `/admin/restaurant/modifier-groups/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  )
}

export function createModifier(
  groupId: string,
  payload: { name: string; price: number; is_default?: boolean }
): Promise<{ modifier: Modifier }> {
  return adminFetch<{ modifier: Modifier }>(
    `/admin/restaurant/modifier-groups/${groupId}/modifiers`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export function formatBRL(value: number | string | null | undefined): string {
  const cents = Number(value ?? 0)

  if (!Number.isFinite(cents)) {
    return "R$ 0,00"
  }

  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function toCents(value: string): number {
  const normalized = value.replace(/\s/g, "").replace(",", ".")
  const parsed = Number(normalized)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return Math.round(parsed * 100)
}

export const BRAND_COLOR_FALLBACK = "#E53935"

export const brandButtonStyle: CSSProperties = {
  backgroundColor: `var(--brand-color, ${BRAND_COLOR_FALLBACK})`,
  borderColor: `var(--brand-color, ${BRAND_COLOR_FALLBACK})`,
  color: "#FFFFFF",
}
