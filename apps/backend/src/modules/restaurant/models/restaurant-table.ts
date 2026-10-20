import { model } from "@medusajs/framework/utils"

import Tab from "./tab"

const RestaurantTable = model
  .define("RestaurantTable", {
    id: model.id({ prefix: "tab" }).primaryKey(),
    name_or_number: model.text().searchable(),
    capacity: model.number().default(4),
    status: model
      .enum(["available", "occupied", "reserved", "billing"])
      .default("available"),
    qr_code_token: model.text().nullable(),
    tabs: model.hasMany(() => Tab, {
      mappedBy: "restaurant_table",
    }),
  })
  .cascades({
    delete: ["tabs"],
  })

export default RestaurantTable
