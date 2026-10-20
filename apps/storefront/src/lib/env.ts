import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

/**
 * Validação centralizada de variáveis de ambiente do storefront (Next.js).
 *
 * - `server`: acessível apenas no servidor.
 * - `client`: acessível no browser (precisa do prefixo NEXT_PUBLIC_).
 * - `runtimeEnv`: mapeamento explícito para o t3-env validar no build/runtime.
 *
 * Segue o protocolo do projeto: BRL e país "br" como padrão.
 * Docs: https://env.t3.gg
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  client: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: z
      .string()
      .url()
      .default("http://localhost:9000"),
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_DEFAULT_REGION: z.string().min(2).default("br"),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),

    // White-label / branding
    NEXT_PUBLIC_RESTAURANT_NAME: z.string().default("Nucleo Delivery"),
    NEXT_PUBLIC_LOGO_URL: z.string().default("/logo-default.png"),
    NEXT_PUBLIC_PRIMARY_COLOR: z
      .string()
      .regex(
        /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
        "Cor deve ser hex (ex.: #E53935)"
      )
      .default("#E53935"),

    // Pagamentos (opcional)
    NEXT_PUBLIC_STRIPE_KEY: z.string().optional(),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    NEXT_PUBLIC_DEFAULT_REGION: process.env.NEXT_PUBLIC_DEFAULT_REGION,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_RESTAURANT_NAME: process.env.NEXT_PUBLIC_RESTAURANT_NAME,
    NEXT_PUBLIC_LOGO_URL: process.env.NEXT_PUBLIC_LOGO_URL,
    NEXT_PUBLIC_PRIMARY_COLOR: process.env.NEXT_PUBLIC_PRIMARY_COLOR,
    NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY,
  },

  // Não lançar em build se variáveis opcionais estiverem ausentes.
  emptyStringAsUndefined: true,
})
