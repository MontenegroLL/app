import LoginTemplate from "@modules/account/templates/login-template"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to your ${process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Nucleo Delivery"} account.`,
}

export default function Login() {
  return <LoginTemplate />
}
