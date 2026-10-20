import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function verifyRestaurantModule({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // 1. Tentar consultar os modelos do módulo restaurant
    const { data: tables } = await query.graph({
      entity: "restaurant_table",
      fields: ["id", "name_or_number", "capacity", "status"],
    })
    logger.info(`RESTAURANT_TABLES_COUNT: ${tables.length}`)

    const { data: groups } = await query.graph({
      entity: "modifier_group",
      fields: ["id", "name", "min_selection", "max_selection"],
    })
    logger.info(`MODIFIER_GROUPS_COUNT: ${groups.length}`)

    const { data: modifiers } = await query.graph({
      entity: "modifier",
      fields: ["id", "name", "price"],
    })
    logger.info(`MODIFIERS_COUNT: ${modifiers.length}`)

    const { data: tabs } = await query.graph({
      entity: "tab",
      fields: ["id", "customer_name", "status"],
    })
    logger.info(`TABS_COUNT: ${tabs.length}`)

    logger.info("VERIFICATION_SUCCESS: Todas as 4 entidades DML estao ativas e consultaveis no Medusa!")
  } catch (error: any) {
    logger.error(`VERIFICATION_ERROR: ${error.message}`)
  }
}
