import VerifyAccount from "@modules/account/components/verify-account"
import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Verifique seu e-mail",
  description: "Verifique seu endereço de e-mail para concluir seu cadastro.",
}

export default function VerifyAccountPage() {
  return (
    <div className="w-full flex justify-center px-8 py-12">
      <Suspense
        fallback={
          <p className="text-base-regular text-ui-fg-base">
            Verificando seu e-mail...
          </p>
        }
      >
        <VerifyAccount />
      </Suspense>
    </div>
  )
}
