import IfoodService from "../ifood"

describe("IfoodService", () => {
  describe("isConfigured", () => {
    it("retorna true quando clientId e clientSecret estao preenchidos", () => {
      const service = new IfoodService({
        clientId: "abc",
        clientSecret: "xyz",
      })

      expect(service.isConfigured()).toBe(true)
    })

    it("retorna false quando clientSecret esta ausente", () => {
      const service = new IfoodService({ clientId: "abc", clientSecret: "" })

      expect(service.isConfigured()).toBe(false)
    })

    it("retorna false quando apenas espacos em branco sao informados", () => {
      const service = new IfoodService({ clientId: "   ", clientSecret: "  " })

      expect(service.isConfigured()).toBe(false)
    })
  })

  describe("getAccessToken", () => {
    it("rejeita quando as credenciais nao estao configuradas", async () => {
      const service = new IfoodService({ clientId: "", clientSecret: "" })

      await expect(service.getAccessToken()).rejects.toThrow(
        /Credenciais nao configuradas/
      )
    })

    it("reaproveita o token em cache em chamadas subsequentes", async () => {
      const service = new IfoodService({
        clientId: "abc",
        clientSecret: "xyz",
      })

      const post = jest.fn().mockResolvedValue({
        data: { accessToken: "token-123", type: "bearer", expiresIn: 3600 },
      })
      // @ts-expect-error — substitui o cliente HTTP por um duble de teste
      service.client.post = post

      const first = await service.getAccessToken()
      const second = await service.getAccessToken()

      expect(first).toBe("token-123")
      expect(second).toBe("token-123")
      // A segunda chamada NAO deve bater na API de novo.
      expect(post).toHaveBeenCalledTimes(1)
    })

    it("renova o token quando o cache esta expirado", async () => {
      const service = new IfoodService({
        clientId: "abc",
        clientSecret: "xyz",
      })

      const post = jest
        .fn()
        .mockResolvedValueOnce({
          data: { accessToken: "token-1", type: "bearer", expiresIn: 3600 },
        })
        .mockResolvedValueOnce({
          data: { accessToken: "token-2", type: "bearer", expiresIn: 3600 },
        })
      // @ts-expect-error — substitui o cliente HTTP por um duble de teste
      service.client.post = post

      const first = await service.getAccessToken()
      expect(first).toBe("token-1")

      // Forca a expiracao do cache (margem de 60s).
      // @ts-expect-error — acessa estado interno para simular expiracao
      service.tokenExpiresAt = Date.now() - 1

      const second = await service.getAccessToken()
      expect(second).toBe("token-2")
      expect(post).toHaveBeenCalledTimes(2)
    })
  })

  describe("acknowledgeEvents", () => {
    it("retorna true quando nao recebe eventos", async () => {
      const service = new IfoodService({ clientId: "a", clientSecret: "b" })

      const result = await service.acknowledgeEvents([])
      expect(result).toBe(true)
    })

    it("envia payload normalizado (array de objetos) e retorna true em sucesso", async () => {
      const service = new IfoodService({ clientId: "a", clientSecret: "b" })

      // @ts-expect-error
      service.getAccessToken = jest.fn().mockResolvedValue("tkn")
      const post = jest.fn().mockResolvedValue({})
      // @ts-expect-error
      service.client.post = post

      const result = await service.acknowledgeEvents(["evt1", { id: "evt2" }])
      expect(result).toBe(true)
      expect(post).toHaveBeenCalledTimes(1)
      const [, payload] = post.mock.calls[0]
      expect(payload).toEqual([{ id: "evt1" }, { id: "evt2" }])
    })

    it("retorna false em caso de erro", async () => {
      const service = new IfoodService({ clientId: "a", clientSecret: "b" })

      // @ts-expect-error
      service.getAccessToken = jest.fn().mockResolvedValue("tkn")
      const post = jest.fn().mockRejectedValue(new Error("falha"))
      // @ts-expect-error
      service.client.post = post

      const result = await service.acknowledgeEvents(["evt1"])
      expect(result).toBe(false)
    })
  })

  describe("pollEvents", () => {
    it("retorna array vazio quando nao configurado", async () => {
      const service = new IfoodService({ clientId: "", clientSecret: "" })
      const res = await service.pollEvents()
      expect(res).toEqual([])
    })

    it("retorna array vazio quando status 204", async () => {
      const service = new IfoodService({ clientId: "a", clientSecret: "b" })
      // @ts-expect-error
      service.getAccessToken = jest.fn().mockResolvedValue("tkn")
      const get = jest.fn().mockRejectedValue({ response: { status: 204 } })
      // @ts-expect-error
      service.client.get = get

      const res = await service.pollEvents()
      expect(res).toEqual([])
    })

    it("retorna eventos quando resposta for array", async () => {
      const service = new IfoodService({ clientId: "a", clientSecret: "b" })
      // @ts-expect-error
      service.getAccessToken = jest.fn().mockResolvedValue("tkn")
      const events = [{ id: "1", code: "PLC", orderId: "o1" }]
      const get = jest.fn().mockResolvedValue({ status: 200, data: events })
      // @ts-expect-error
      service.client.get = get

      const res = await service.pollEvents()
      expect(res).toEqual(events)
    })
  })
})
