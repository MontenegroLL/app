import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Nucleo Delivery",
    template: `%s | ${process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Nucleo Delivery"}`,
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const primaryColor = process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#E53935"

  return (
    <html
      lang="pt-BR"
      data-mode="light"
      style={{ "--brand-color": primaryColor } as React.CSSProperties}
    >
      <head>
        <style
          id="dynamic-brand-color"
          dangerouslySetInnerHTML={{
            __html: `:root { --brand-color: ${primaryColor}; }`,
          }}
        />
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
