import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Buildings,
  EllipsisHorizontal,
  Plus,
  Spinner,
  Users,
} from "@medusajs/icons"
import {
  Button,
  Container,
  Copy,
  DropdownMenu,
  FocusModal,
  Heading,
  IconButton,
  Input,
  Label,
  StatusBadge,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import React, { useState } from "react"
import {
  brandButtonStyle,
  createTable,
  getTableQrCode,
  listTables,
  type RestaurantTable,
  TABLE_STATUS_META,
  TABLE_STATUS_ORDER,
  type TableQrCode,
  type TableStatus,
  updateTable,
} from "../../lib/restaurant-api"
import "../../styles/global.css"

const TABLES_QUERY_KEY = ["nucleo-restaurant-tables"]

const errorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : "Erro inesperado ao chamar o servidor"

const TablesPage = () => {
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState("4")

  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null)
  const [qrData, setQrData] = useState<TableQrCode | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: TABLES_QUERY_KEY,
    queryFn: listTables,
  })

  const tables = data?.tables ?? []

  const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: TABLES_QUERY_KEY })
      setCreateOpen(false)
      setName("")
      setCapacity("4")
      toast.success(`Mesa "${result.table.name_or_number}" criada com sucesso`)
    },
    onError: (mutationError) => {
      toast.error(errorMessage(mutationError))
    },
  })

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: TableStatus }) =>
      updateTable(payload.id, { status: payload.status }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: TABLES_QUERY_KEY })
      toast.success(
        `Mesa "${result.table.name_or_number}" agora está ${
          TABLE_STATUS_META[result.table.status].label
        }`
      )
    },
    onError: (mutationError) => {
      toast.error(errorMessage(mutationError))
    },
  })

  const handleOpenQrCode = async (table: RestaurantTable) => {
    setQrTable(table)
    setQrData(null)
    setQrLoading(true)

    try {
      setQrData(await getTableQrCode(table.id))
    } catch (qrError) {
      toast.error(errorMessage(qrError))
      setQrTable(null)
    } finally {
      setQrLoading(false)
    }
  }

  const handleCreate = () => {
    const parsedCapacity = Number(capacity)

    if (!name.trim()) {
      toast.error("Informe o nome ou número da mesa")
      return
    }

    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      toast.error("A capacidade deve ser maior ou igual a 1")
      return
    }

    createMutation.mutate({
      name_or_number: name.trim(),
      capacity: Math.trunc(parsedCapacity),
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Salão &amp; Mesas</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Status, capacidade, comanda aberta e QR Code de cada mesa do salão.
          </Text>
        </div>
        <Button
          size="small"
          variant="primary"
          style={brandButtonStyle}
          onClick={() => setCreateOpen(true)}
        >
          <Plus /> Nova mesa
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
        {TABLE_STATUS_ORDER.map((status) => (
          <div key={status} className="flex items-center gap-x-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TABLE_STATUS_META[status].dot }}
            />
            <Text size="small" className="text-ui-fg-subtle">
              {TABLE_STATUS_META[status].label}:{" "}
              <span className="text-ui-fg-base font-medium">
                {tables.filter((table) => table.status === status).length}
              </span>
            </Text>
          </div>
        ))}
      </div>

      <div className="px-6 py-6">
        {isLoading && (
          <div className="flex items-center gap-x-2 py-8">
            <Spinner className="animate-spin" />
            <Text size="small" className="text-ui-fg-subtle">
              Carregando mesas...
            </Text>
          </div>
        )}

        {isError && (
          <Text size="small" className="text-ui-fg-error">
            {errorMessage(error)}
          </Text>
        )}

        {!isLoading && !isError && tables.length === 0 && (
          <Text size="small" className="text-ui-fg-subtle">
            Nenhuma mesa cadastrada. Crie a primeira mesa para começar.
          </Text>
        )}

        {!isLoading && !isError && tables.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables.map((table) => {
              const meta = TABLE_STATUS_META[table.status]

              return (
                <div
                  key={table.id}
                  className="bg-ui-bg-base border-ui-border-base shadow-elevation-card-rest flex flex-col gap-y-3 rounded-lg border p-4"
                  style={{ borderLeft: `4px solid ${meta.dot}` }}
                >
                  <div className="flex items-start justify-between gap-x-2">
                    <div>
                      <Text weight="plus" size="base">
                        {table.name_or_number}
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {table.id}
                      </Text>
                    </div>
                    <StatusBadge color={meta.color}>{meta.label}</StatusBadge>
                  </div>

                  <div className="flex items-center gap-x-2">
                    <Users className="text-ui-fg-subtle" />
                    <Text size="small" className="text-ui-fg-subtle">
                      Capacidade: {table.capacity} lugares
                    </Text>
                  </div>

                  {table.active_tab ? (
                    <div className="bg-ui-bg-subtle rounded-md p-2">
                      <Text size="small" className="text-ui-fg-subtle">
                        Comanda aberta
                      </Text>
                      <Text size="small" weight="plus">
                        {table.active_tab.customer_name || "Sem nome"}
                      </Text>
                    </div>
                  ) : (
                    <Text size="small" className="text-ui-fg-muted">
                      Sem comanda ativa
                    </Text>
                  )}

                  <div className="mt-auto flex items-center gap-x-2">
                    <Button
                      size="small"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleOpenQrCode(table)}
                    >
                      QR Code
                    </Button>
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <IconButton
                          size="small"
                          variant="transparent"
                          isLoading={statusMutation.isPending}
                        >
                          <EllipsisHorizontal />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        {TABLE_STATUS_ORDER.map((status) => (
                          <DropdownMenu.Item
                            key={status}
                            disabled={table.status === status}
                            onClick={() =>
                              statusMutation.mutate({ id: table.id, status })
                            }
                          >
                            {TABLE_STATUS_META[status].label}
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <FocusModal open={createOpen} onOpenChange={setCreateOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <Heading level="h2">Nova mesa</Heading>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col gap-y-4 p-6">
            <div className="flex flex-col gap-y-2">
              <Label size="small" htmlFor="table-name">
                Nome ou número
              </Label>
              <Input
                id="table-name"
                placeholder="Ex: Mesa 02"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="table-capacity">Capacidade (lugares)</Label>
              <Input
                id="table-capacity"
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
              />
            </div>
          </FocusModal.Body>
          <FocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  Cancelar
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                variant="primary"
                style={brandButtonStyle}
                isLoading={createMutation.isPending}
                onClick={handleCreate}
              >
                Criar mesa
              </Button>
            </div>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>

      <FocusModal
        open={!!qrTable}
        onOpenChange={(open) => {
          if (!open) {
            setQrTable(null)
            setQrData(null)
          }
        }}
      >
        <FocusModal.Content>
          <FocusModal.Header>
            <Heading level="h2">
              QR Code {qrTable ? `— ${qrTable.name_or_number}` : ""}
            </Heading>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center gap-y-4 p-6">
            {qrLoading && <Spinner className="animate-spin" />}

            {!qrLoading && qrData?.data_url && (
              <img
                src={qrData.data_url}
                alt={`QR Code da mesa ${qrData.name_or_number}`}
                className="bg-ui-bg-base border-ui-border-base rounded-lg border p-2"
                style={{ width: 288, height: 288 }}
              />
            )}

            {!qrLoading && qrData && !qrData.data_url && (
              <Text size="small" className="text-ui-fg-subtle">
                Não foi possível gerar a imagem do QR Code. Use o link abaixo.
              </Text>
            )}

            {qrData && (
              <>
                <Text size="small" className="text-ui-fg-subtle">
                  Token: {qrData.qr_code_token}
                </Text>
                <Text
                  size="small"
                  className="bg-ui-bg-subtle max-w-full truncate rounded-md px-3 py-2"
                >
                  {qrData.target_url}
                </Text>
                <Copy content={qrData.target_url} asChild>
                  <Button size="small" variant="secondary">
                    Copiar link da mesa
                  </Button>
                </Copy>
              </>
            )}
          </FocusModal.Body>
          <FocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  Fechar
                </Button>
              </FocusModal.Close>
            </div>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Salão & Mesas",
  icon: Buildings,
  rank: 1,
})

export default TablesPage
