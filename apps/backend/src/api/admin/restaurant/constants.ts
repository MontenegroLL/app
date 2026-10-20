export const TABLE_STATUSES = [
  "available",
  "occupied",
  "reserved",
  "billing",
] as const

export type TableStatus = (typeof TABLE_STATUSES)[number]
