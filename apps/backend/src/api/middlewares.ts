import { configureStoreSearch, defineMiddlewares } from '@medusajs/framework/http'

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    {
      method: ['GET'],
      matcher: '/admin/stores*',
      middlewares: [
        (req: any, res: any, next: any) => {
          const restaurantName =
            process.env.NEXT_PUBLIC_RESTAURANT_NAME ||
            process.env.RESTAURANT_NAME
          if (!restaurantName) return next()

          const originalJson = res.json.bind(res)
          res.json = (body: any) => {
            if (body && typeof body === 'object') {
              if (body.store) {
                body.store.name = restaurantName
              }
              if (Array.isArray(body.stores)) {
                body.stores.forEach((s: any) => {
                  if (s) s.name = restaurantName
                })
              }
            }
            return originalJson(body)
          }
          next()
        },
      ],
    },
  ],
})
