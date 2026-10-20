import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RESTAURANT_MODULE } from "../../../../../../modules/restaurant"

function loadQrCodeLibrary(): any {
  try {
    return require("qrcode")
  } catch {
    return null
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const restaurant: any = req.scope.resolve(RESTAURANT_MODULE)
  const { id } = req.params

  const [table] = (await restaurant.listRestaurantTables({ id })) as any[]

  if (!table) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Mesa com id "${id}" nao encontrada`
    )
  }

  if (!table.qr_code_token) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `A mesa "${table.name_or_number}" nao possui QR Code configurado`
    )
  }

  const storefrontUrl = (
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "http://localhost:8000"
  ).replace(/\/$/, "")

  const targetUrl = `${storefrontUrl}/mesa/${table.qr_code_token}`

  const QRCode = loadQrCodeLibrary()
  let dataUrl: string | null = null

  if (QRCode) {
    dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 1,
      color: { dark: "#111827", light: "#FFFFFF" },
    })
  }

  res.json({
    table_id: table.id,
    name_or_number: table.name_or_number,
    qr_code_token: table.qr_code_token,
    target_url: targetUrl,
    data_url: dataUrl,
  })
}
