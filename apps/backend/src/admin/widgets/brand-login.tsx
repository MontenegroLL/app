import React, { useEffect, useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"

const RESTAURANT_NAME =
  process.env.NEXT_PUBLIC_RESTAURANT_NAME ||
  process.env.RESTAURANT_NAME ||
  "Nucleo Delivery"

const LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL ||
  process.env.LOGO_URL ||
  "/logo-default.png"

const PRIMARY_COLOR =
  process.env.NEXT_PUBLIC_PRIMARY_COLOR ||
  process.env.PRIMARY_COLOR ||
  "#E53935"

const BrandLoginWidget = () => {
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Update document title with restaurant name
    if (!document.title.includes(RESTAURANT_NAME)) {
      document.title = `${RESTAURANT_NAME} | Admin`
    }

    // Set brand color CSS variable on document element
    document.documentElement.style.setProperty("--brand-color", PRIMARY_COLOR)

    // Hide default generic Medusa icon on login page
    const styleId = "white-label-admin-brand-style"
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style")
      styleEl.id = styleId
      styleEl.innerHTML = `
        :root {
          --brand-color: ${PRIMARY_COLOR};
        }
      `
      document.head.appendChild(styleEl)
    }
  }, [])

  return (
    <div className="w-full flex flex-col items-center justify-center mb-4 text-center">
      {/* Brand Logo */}
      {!logoFailed && LOGO_URL && (
        <div
          className="flex items-center justify-center rounded-2xl p-2 mb-3 shadow-sm border border-ui-border-base bg-white overflow-hidden"
          style={{ width: "64px", height: "64px" }}
        >
          <img
            src={LOGO_URL}
            alt={RESTAURANT_NAME}
            className="w-full h-full object-contain"
            onError={() => setLogoFailed(true)}
          />
        </div>
      )}

      {/* Fallback avatar if image doesn't load */}
      {logoFailed && (
        <div
          className="flex items-center justify-center rounded-2xl mb-3 shadow-sm text-white font-bold text-2xl"
          style={{
            width: "60px",
            height: "60px",
            backgroundColor: PRIMARY_COLOR,
          }}
        >
          {RESTAURANT_NAME.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Brand Restaurant Name */}
      <h1 className="text-xl font-bold text-ui-fg-base tracking-tight">
        {RESTAURANT_NAME}
      </h1>
      <p className="text-xs text-ui-fg-subtle mt-0.5">
        Painel de Gestão e Delivery
      </p>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: ["login.before"],
})

export default BrandLoginWidget
