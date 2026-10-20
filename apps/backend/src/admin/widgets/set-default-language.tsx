import { defineWidgetConfig } from "@medusajs/admin-sdk"
import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"

const DEFAULT_LANGUAGE = "ptBR"
const DEFAULT_APPLIED_KEY = "nucleo_lang_default_applied"

const SetDefaultLanguage = () => {
  const { i18n } = useTranslation()

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const alreadyApplied =
      window.localStorage.getItem(DEFAULT_APPLIED_KEY) === "true"
    if (alreadyApplied) {
      return
    }

    if (i18n.language !== DEFAULT_LANGUAGE) {
      i18n.changeLanguage(DEFAULT_LANGUAGE)
    }

    window.localStorage.setItem(DEFAULT_APPLIED_KEY, "true")
  }, [i18n])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "login.after",
    "order.list.before",
    "product.list.before",
    "customer.list.before",
    "order.details.before",
  ],
})

export default SetDefaultLanguage
