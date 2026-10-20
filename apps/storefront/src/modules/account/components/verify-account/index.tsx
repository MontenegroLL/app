"use client"

import { confirmEmailVerification } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type VerificationState = "verifying" | "success" | "error"

const VerifyAccount = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [state, setState] = useState<VerificationState>("verifying")
  // Guard against the effect running twice in React Strict Mode, which would
  // consume the single-use token before the customer sees the result.
  const confirmed = useRef(false)

  useEffect(() => {
    if (confirmed.current) {
      return
    }
    confirmed.current = true

    if (!token) {
      setState("error")
      return
    }

    confirmEmailVerification(token).then(({ success }) =>
      setState(success ? "success" : "error")
    )
  }, [token])

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center text-center gap-y-4"
      data-testid="verify-account-page"
    >
      <h1 className="text-large-semi uppercase">Verificação de e-mail</h1>

      {state === "verifying" && (
        <p className="text-base-regular text-ui-fg-base">
          Verificando seu e-mail...
        </p>
      )}

      {state === "success" && (
        <>
          <p className="text-base-regular text-ui-fg-base">
            Seu e-mail foi verificado. Agora você pode entrar em sua conta.
          </p>
          <LocalizedClientLink href="/account">
            <Button variant="primary">Ir para entrar</Button>
          </LocalizedClientLink>
        </>
      )}

      {state === "error" && (
        <>
          <p className="text-base-regular text-ui-fg-base">
            Este link de verificação é inválido ou expirou. Entre para receber
            um novo e-mail de verificação.
          </p>
          <LocalizedClientLink href="/account">
            <Button variant="secondary">Ir para entrar</Button>
          </LocalizedClientLink>
        </>
      )}
    </div>
  )
}

export default VerifyAccount
