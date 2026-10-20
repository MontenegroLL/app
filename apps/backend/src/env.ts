import { z } from "zod"

/**
 * Validação centralizada de variáveis de ambiente do backend (Medusa v2).
 *
 * O backend Medusa roda em CommonJS (tsconfig `module: Node16`), o que torna
 * pacotes ESM-only (ex.: `@t3-oss/env-core`) incompatíveis com import estático.
 * Por isso usamos Zod diretamente — mesmo nível de proteção (tipo/formato),
 * sem atrito de módulo.
 *
 * Regras de projeto:
 * - Todas as variáveis de integração são OPCIONAIS para não impedir o boot
 *   local quando a integração ainda não foi configurada.
 * - O objetivo é detectar *tipos* e *formatos* inválidos, não exigir segredos
 *   em desenvolvimento.
 *
 * Uso:
 *   import { env } from "../env"
 *   const url = env.REDIS_URL
 */

const hexColor = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    "Cor deve ser hex (ex.: #E53935)"
  )

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Banco de dados
  DATABASE_URL: z.string().url().optional(),
  DB_NAME: z.string().default("medusa-backend"),

  // Segurança / CORS
  JWT_SECRET: z.string().min(1).optional(),
  COOKIE_SECRET: z.string().min(1).optional(),
  STORE_CORS: z.string().optional(),
  ADMIN_CORS: z.string().optional(),
  AUTH_CORS: z.string().optional(),

  // Redis (jobs / event bus)
  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  // White-label / branding
  RESTAURANT_NAME: z.string().default("Nucleo Delivery"),
  LOGO_URL: z.string().default("/logo-default.png"),
  PRIMARY_COLOR: hexColor.default("#E53935"),

  // Integração iFood
  IFOOD_CLIENT_ID: z.string().optional(),
  IFOOD_CLIENT_SECRET: z.string().optional(),
  IFOOD_MERCHANT_ID: z.string().optional(),

  // Mercado Pago
  MERCADO_PAGO_PUBLIC_KEY: z.string().optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_CLIENT_ID: z.string().optional(),
  MERCADO_PAGO_CLIENT_SECRET: z.string().optional(),
})

// Strings vazias viram `undefined` para que os `.default()`/`.optional()` valham.
const rawEnv = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v])
)

const parsed = envSchema.safeParse(rawEnv)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n")
  throw new Error(
    `[env] Variáveis de ambiente inválidas no backend:\n${issues}\n` +
      `Corrija o apps/backend/.env (veja .env.template).`
  )
}

/** Variáveis de ambiente validadas e tipadas do backend. */
export const env = parsed.data
