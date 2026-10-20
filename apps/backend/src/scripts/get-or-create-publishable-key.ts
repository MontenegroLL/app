import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function getOrCreatePublishableKey({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // 1. Buscar api keys do tipo publishable
  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "title", "type"],
    filters: { type: "publishable" },
  })

  let publishableToken: string | undefined = keys[0]?.token
  let publishableKeyId: string | undefined = keys[0]?.id

  if (!publishableToken) {
    logger.info("Nenhuma publishable key encontrada. Criando uma nova...")
    const { result: keyResult } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Storefront Publishable API Key",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })
    publishableToken = keyResult[0].token
    publishableKeyId = keyResult[0].id

    // Vincular ao sales channel padrao
    const { data: salesChannels } = await query.graph({
      entity: "sales_channel",
      fields: ["id"],
    })

    if (salesChannels.length > 0 && publishableKeyId) {
      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: {
          id: publishableKeyId,
          add: [salesChannels[0].id],
        },
      })
    }
  }

  logger.info(`PUBLISHABLE_KEY_TOKEN: ${publishableToken}`)
}
