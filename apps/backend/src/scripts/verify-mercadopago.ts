import { MercadoPagoService } from "../services/mercadopago"

async function testMercadoPagoConnection() {
  console.log("--------------------------------------------------")
  console.log("💳 Testando Conexão com a API do Mercado Pago...")
  console.log("--------------------------------------------------")

  const service = new MercadoPagoService()

  try {
    const pix = await service.createPixPayment({
      amount: 1.0,
      description: "Teste de Conexao PIX - Nucleo PDV",
      customerEmail: "teste@nucleopdv.com.br",
      customerName: "Teste PDV",
      customerDocument: "00000000191",
      metadata: {
        environment: "production_verification",
      },
    })

    console.log("✅ Pagamento PIX gerado com sucesso!")
    console.log(`🆔 Payment ID: ${pix.paymentId}`)
    console.log(`📊 Status: ${pix.status} (${pix.statusDetail})`)
    console.log(`⏱️ Expiração: ${pix.expirationDate}`)
    console.log(
      `🔑 QR Code Copia e Cola (início): ${pix.qrCode.substring(0, 45)}...`
    )
    console.log(`🖼️ QR Code Base64 disponível: ${Boolean(pix.qrCodeBase64)}`)

    console.log("\n🔍 Consultando status do pagamento recém-gerado...")
    const check = await service.getPaymentStatus(pix.paymentId)
    console.log(
      `✅ Status consultado: ${check.status} (Valor: R$ ${check.amount})`
    )

    console.log("\n--------------------------------------------------")
    console.log("🎉 INTEGRAÇÃO COM MERCADO PAGO VALIDADA COM SUCESSO!")
    console.log("--------------------------------------------------")
  } catch (err: any) {
    console.error("❌ Erro ao validar Mercado Pago:", err.message)
    process.exit(1)
  }
}

testMercadoPagoConnection()
