import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code = "brl",
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  locale = "pt-BR",
}: ConvertToLocaleParams) => {
  const normalizedCurrency =
    !currency_code || isEmpty(currency_code) ? "BRL" : currency_code.toUpperCase()

  return new Intl.NumberFormat(locale || "pt-BR", {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}
