import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const restaurantName =
  process.env.NEXT_PUBLIC_RESTAURANT_NAME ||
  process.env.RESTAURANT_NAME ||
  "Nucleo Delivery"
const logoUrl =
  process.env.NEXT_PUBLIC_LOGO_URL ||
  process.env.LOGO_URL ||
  "/logo-default.png"
const primaryColor =
  process.env.NEXT_PUBLIC_PRIMARY_COLOR ||
  process.env.PRIMARY_COLOR ||
  "#E53935"

const HIDE_GLOBAL_SETTINGS_CSS = `
  /* Settings Sidebar - Hide macro / international configuration items */
  a[href*="/settings/regions"],
  a[href*="/settings/tax-regions"],
  a[href*="/settings/locations"],
  a[href*="/settings/return-reasons"],
  a[href*="/settings/refund-reasons"],
  a[href*="/settings/translations"],
  [id*="settings-nav:/settings/regions"],
  [id*="settings-nav:/settings/tax-regions"],
  [id*="settings-nav:/settings/locations"],
  [id*="settings-nav:/settings/return-reasons"],
  [id*="settings-nav:/settings/refund-reasons"],
  [id*="settings-nav:/settings/translations"],
  li:has(> a[href*="/settings/regions"]),
  li:has(> a[href*="/settings/tax-regions"]),
  li:has(> a[href*="/settings/locations"]),
  li:has(> a[href*="/settings/return-reasons"]),
  li:has(> a[href*="/settings/refund-reasons"]),
  li:has(> a[href*="/settings/translations"]),
  div:has(> a[href*="/settings/regions"]),
  div:has(> a[href*="/settings/tax-regions"]),
  div:has(> a[href*="/settings/locations"]),
  div:has(> a[href*="/settings/return-reasons"]),
  div:has(> a[href*="/settings/refund-reasons"]),
  div:has(> a[href*="/settings/translations"]),
  div.grid:has(a[href*="/settings/regions"]),
  div[role="option"]:has(a[href*="/settings/regions"]),
  div[role="option"]:has(a[href*="/settings/tax-regions"]),
  div[role="option"]:has(a[href*="/settings/locations"]) {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
    modules: [
    {
      resolve: "./src/modules/restaurant",
    },
  ],
    admin: {
    vite: () => {
      return {
        plugins: [
          {
            name: "admin-hide-global-settings",
            transformIndexHtml() {
              return [
                {
                  tag: "style",
                  attrs: { id: "admin-hide-global-settings-static" },
                  children: HIDE_GLOBAL_SETTINGS_CSS,
                },
              ]
            },
          },
        ],
        define: {
          "process.env.NEXT_PUBLIC_RESTAURANT_NAME": JSON.stringify(restaurantName),
          "process.env.RESTAURANT_NAME": JSON.stringify(restaurantName),
          "process.env.NEXT_PUBLIC_LOGO_URL": JSON.stringify(logoUrl),
          "process.env.LOGO_URL": JSON.stringify(logoUrl),
          "process.env.NEXT_PUBLIC_PRIMARY_COLOR": JSON.stringify(primaryColor),
          "process.env.PRIMARY_COLOR": JSON.stringify(primaryColor),
        },
      }
    },
  },
})


