import React, { useEffect } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import "../styles/global.css"

const HIDE_SETTINGS_STYLE_ID = "nucleo-hide-global-settings-style"

const HIDE_SETTINGS_CSS_RULE = `
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

const FORBIDDEN_PATHS = [
  "/settings/regions",
  "/settings/tax-regions",
  "/settings/locations",
  "/settings/return-reasons",
  "/settings/refund-reasons",
  "/settings/translations",
]

const HideGlobalSettingsWidget = () => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    // 1. Inject protective global CSS into head
    if (!document.getElementById(HIDE_SETTINGS_STYLE_ID)) {
      const styleEl = document.createElement("style")
      styleEl.id = HIDE_SETTINGS_STYLE_ID
      styleEl.innerHTML = HIDE_SETTINGS_CSS_RULE
      document.head.appendChild(styleEl)
    }

    // 2. Prevent manual URL access to macro pages by redirecting to safe settings store
    const checkAndRedirect = () => {
      const currentPath = window.location.pathname
      const isForbidden = FORBIDDEN_PATHS.some((path) => currentPath.includes(path))
      if (isForbidden) {
        window.location.replace("/app/settings/store")
      }
    }

    checkAndRedirect()
    window.addEventListener("popstate", checkAndRedirect)

    // 3. Fallback DOM observer to ensure elements stay hidden even if dynamically mounted
    const observer = new MutationObserver(() => {
      const selector = [
        'a[href*="/settings/regions"]',
        'a[href*="/settings/tax-regions"]',
        'a[href*="/settings/locations"]',
        'a[href*="/settings/return-reasons"]',
        'a[href*="/settings/refund-reasons"]',
        'a[href*="/settings/translations"]',
      ].join(", ")

      const elements = document.querySelectorAll(selector)
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement
        htmlEl.style.setProperty("display", "none", "important")
        const parentLi = htmlEl.closest("li")
        if (parentLi) {
          parentLi.style.setProperty("display", "none", "important")
        }
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener("popstate", checkAndRedirect)
      observer.disconnect()
    }
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "login.after",
    "order.list.before",
    "product.list.before",
    "customer.list.before",
    "store.details.before",
    "profile.details.before",
  ],
})

export default HideGlobalSettingsWidget
