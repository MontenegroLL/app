import { getRegion } from "@lib/data/regions"
import StoreTemplate from "@modules/store/templates"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Loja",
  description: "Explore todos os nossos produtos.",
}

export default async function StorePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  return <StoreTemplate currencyCode={region.currency_code} />
}
