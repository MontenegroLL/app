import { model } from "@medusajs/framework/utils"

import RestaurantTable from "./restaurant-table"

const Tab = model.define("Tab", {
  id: model.id({ prefix: "tabid" }).primaryKey(),
  customer_name: model.text().nullable(),
  status: model.enum(["open", "closed", "cancelled"]).default("open"),
  restaurant_table: model.belongsTo(() => RestaurantTable, {
    mappedBy: "tabs",
  }),
})

export default Tab
