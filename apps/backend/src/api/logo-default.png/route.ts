import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs"
import path from "path"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logoPath = path.resolve(process.cwd(), "logo-default.png")
  if (fs.existsSync(logoPath)) {
    const file = fs.readFileSync(logoPath)
    res.setHeader("Content-Type", "image/png")
    res.setHeader("Cache-Control", "public, max-age=86400")
    return res.end(file)
  }
  return res.sendStatus(404)
}
