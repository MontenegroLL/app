import { model } from "@medusajs/framework/utils"

import ModifierGroup from "./modifier-group"

const Modifier = model
  .define("Modifier", {
    id: model.id({ prefix: "mod" }).primaryKey(),
    name: model.text().searchable(),
    price: model.bigNumber(),
    is_default: model.boolean().default(false),
    max_quantity: model.number().nullable(),
    modifier_group: model.belongsTo(() => ModifierGroup, {
      mappedBy: "modifiers",
    }),
  })

export default Modifier
