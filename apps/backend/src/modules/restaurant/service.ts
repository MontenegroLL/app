import { MedusaService } from "@medusajs/framework/utils"
import { Modifier, ModifierGroup, RestaurantTable, Tab } from "./models"

class RestaurantModuleService extends MedusaService({
  ModifierGroup,
  Modifier,
  RestaurantTable,
  Tab,
}) {}

export default RestaurantModuleService
