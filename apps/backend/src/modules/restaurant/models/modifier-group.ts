import { model } from "@medusajs/framework/utils"

import Modifier from "./modifier"

const ModifierGroup = model
  .define("ModifierGroup", {
    id: model.id({ prefix: "modgrp" }).primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    min_selection: model.number().default(0),
    max_selection: model.number().default(1),
    is_required: model.boolean().default(false),
    product_id: model.text().nullable(),
    modifiers: model.hasMany(() => Modifier, {
      mappedBy: "modifier_group",
    }),
  })
  .cascades({
    delete: ["modifiers"],
  })

export default ModifierGroup
