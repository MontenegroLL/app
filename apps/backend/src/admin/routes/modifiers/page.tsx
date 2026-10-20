import React, { useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EllipsisHorizontal, Plus, Spinner, Swatch } from "@medusajs/icons"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  DropdownMenu,
  FocusModal,
  Heading,
  IconButton,
  Input,
  Label,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ModifierGroup,
  brandButtonStyle,
  createModifier,
  createModifierGroup,
  formatBRL,
  listModifierGroups,
  toCents,
  updateModifierGroup,
} from "../../lib/restaurant-api"
import "../../styles/global.css"

const GROUPS_QUERY_KEY = ["nucleo-restaurant-modifier-groups"]

const errorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : "Erro inesperado ao chamar o servidor"

const ModifiersPage = () => {
  const queryClient = useQueryClient()

  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [groupMin, setGroupMin] = useState("0")
  const [groupMax, setGroupMax] = useState("1")
  const [groupRequired, setGroupRequired] = useState(false)

  const [modifierGroup, setModifierGroup] = useState<ModifierGroup | null>(null)
  const [modifierName, setModifierName] = useState("")
  const [modifierPrice, setModifierPrice] = useState("")

  const { data, isLoading, isError, error } = useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: listModifierGroups,
  })

  const groups = data?.modifier_groups ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })

  const createGroupMutation = useMutation({
    mutationFn: createModifierGroup,
    onSuccess: (result) => {
      invalidate()
      setGroupModalOpen(false)
      setGroupName("")
      setGroupDescription("")
      setGroupMin("0")
      setGroupMax("1")
      setGroupRequired(false)
      toast.success(`Grupo "${result.modifier_group.name}" criado com sucesso`)
    },
    onError: (mutationError) => {
      toast.error(errorMessage(mutationError))
    },
  })

  const toggleRequiredMutation = useMutation({
    mutationFn: (payload: { id: string; is_required: boolean }) =>
      updateModifierGroup(payload.id, { is_required: payload.is_required }),
    onSuccess: (result) => {
      invalidate()
      toast.success(
        `Grupo "${result.modifier_group.name}" agora é ${
          result.modifier_group.is_required ? "obrigatório" : "opcional"
        }`
      )
    },
    onError: (mutationError) => {
      toast.error(errorMessage(mutationError))
    },
  })

  const createModifierMutation = useMutation({
    mutationFn: (payload: {
      groupId: string
      name: string
      price: number
    }) =>
      createModifier(payload.groupId, {
        name: payload.name,
        price: payload.price,
      }),
    onSuccess: (result) => {
      invalidate()
      setModifierGroup(null)
      setModifierName("")
      setModifierPrice("")
      toast.success(`Modificador "${result.modifier.name}" adicionado`)
    },
    onError: (mutationError) => {
      toast.error(errorMessage(mutationError))
    },
  })

  const handleCreateGroup = () => {
    const min = Number(groupMin)
    const max = Number(groupMax)

    if (!groupName.trim()) {
      toast.error("Informe o nome do grupo de modificadores")
      return
    }

    if (!Number.isFinite(min) || min < 0) {
      toast.error("A seleção mínima deve ser maior ou igual a 0")
      return
    }

    if (!Number.isFinite(max) || max < 1) {
      toast.error("A seleção máxima deve ser maior ou igual a 1")
      return
    }

    if (max < min) {
      toast.error("A seleção máxima não pode ser menor que a mínima")
      return
    }

    createGroupMutation.mutate({
      name: groupName.trim(),
      description: groupDescription.trim() || null,
      min_selection: Math.trunc(Number(groupMin)),
      max_selection: Math.trunc(Number(groupMax)),
      is_required: groupRequired,
    })
  }

  const handleCreateModifier = () => {
    if (!modifierGroup) {
      return
    }

    if (!modifierName.trim()) {
      toast.error("Informe o nome do modificador")
      return
    }

    const cents = toCents(modifierPrice)

    createModifierMutation.mutate({
      groupId: modifierGroup.id,
      name: modifierName.trim(),
      price: cents,
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Modificadores &amp; Adicionais</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Grupos de complementos, regras de seleção e preços adicionais em BRL.
          </Text>
        </div>
        <Button
          size="small"
          variant="primary"
          style={brandButtonStyle}
          onClick={() => setGroupModalOpen(true)}
        >
          <Plus /> Novo grupo
        </Button>
      </div>

      <div className="flex flex-col gap-y-4 px-6 py-6">
        {isLoading && (
          <div className="flex items-center gap-x-2 py-8">
            <Spinner className="animate-spin" />
            <Text size="small" className="text-ui-fg-subtle">
              Carregando grupos de modificadores...
            </Text>
          </div>
        )}

        {isError && (
          <Text size="small" className="text-ui-fg-error">
            {errorMessage(error)}
          </Text>
        )}

        {!isLoading && !isError && groups.length === 0 && (
          <Text size="small" className="text-ui-fg-subtle">
            Nenhum grupo cadastrado. Crie um grupo para começar.
          </Text>
        )}

        {!isLoading &&
          !isError &&
          groups.map((group) => (
            <div
              key={group.id}
              className="bg-ui-bg-base border-ui-border-base shadow-elevation-card-rest rounded-lg border"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="flex flex-col gap-y-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <Text weight="plus" size="base">
                      {group.name}
                    </Text>
                    <Badge size="2xsmall" color="grey">
                      min {group.min_selection}
                    </Badge>
                    <Badge size="2xsmall" color="grey">
                      max {group.max_selection}
                    </Badge>
                    {group.is_required ? (
                      <Badge size="2xsmall" color="orange">
                        obrigatório
                      </Badge>
                    ) : (
                      <Badge size="2xsmall" color="grey">
                        opcional
                      </Badge>
                    )}
                  </div>
                  {group.description && (
                    <Text size="small" className="text-ui-fg-subtle">
                      {group.description}
                    </Text>
                  )}
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {group.modifiers.length} modificador(es)
                    {group.product_id
                      ? ` • vinculado ao produto ${group.product_id}`
                      : " • disponível para todos os produtos"}
                  </Text>
                </div>

                <div className="flex items-center gap-x-2">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => {
                      setModifierName("")
                      setModifierPrice("")
                      setModifierGroup(group)
                    }}
                  >
                    <Plus /> Adicionar modificador
                  </Button>
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <IconButton size="small" variant="transparent">
                        <EllipsisHorizontal />
                      </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item
                        onClick={() =>
                          toggleRequiredMutation.mutate({
                            id: group.id,
                            is_required: !group.is_required,
                          })
                        }
                      >
                        {group.is_required
                          ? "Tornar opcional"
                          : "Tornar obrigatório"}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                </div>
              </div>

              <div className="border-ui-border-base border-t">
                {group.modifiers.length === 0 ? (
                  <div className="px-6 py-4">
                    <Text size="small" className="text-ui-fg-subtle">
                      Nenhum modificador vinculado a este grupo.
                    </Text>
                  </div>
                ) : (
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Modificador</Table.HeaderCell>
                        <Table.HeaderCell>Preço adicional</Table.HeaderCell>
                        <Table.HeaderCell>Padrão</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {group.modifiers.map((modifier) => (
                        <Table.Row key={modifier.id}>
                          <Table.Cell>{modifier.name}</Table.Cell>
                          <Table.Cell>+ {formatBRL(modifier.price)}</Table.Cell>
                          <Table.Cell>
                            {modifier.is_default ? (
                              <Badge size="2xsmall" color="green">
                                padrão
                              </Badge>
                            ) : (
                              <Text size="small" className="text-ui-fg-muted">
                                —
                              </Text>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                  </Table.Body>
                </Table>
              )}
            </div>
          </div>
        ))}
      </div>

      <FocusModal open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <Heading level="h2">Novo grupo de modificadores</Heading>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col gap-y-4 p-6">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="group-name">Nome do grupo</Label>
              <Input
                id="group-name"
                placeholder="Ex.: Bordas Recheadas"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="group-description">Descrição (opcional)</Label>
              <Input
                id="group-description"
                placeholder="Ex.: Escolha 1 borda para a pizza"
                value={groupDescription}
                onChange={(event) => setGroupDescription(event.target.value)}
              />
            </div>
            <div className="flex gap-x-4">
              <div className="flex flex-1 flex-col gap-y-2">
                <Label htmlFor="group-min">Mínimo de seleções</Label>
                <Input
                  id="group-min"
                  type="number"
                  min={0}
                  value={groupMin}
                  onChange={(event) => setGroupMin(event.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-y-2">
                <Label htmlFor="group-max">Máximo de seleções</Label>
                <Input
                  id="group-max"
                  type="number"
                  min={1}
                  value={groupMax}
                  onChange={(event) => setGroupMax(event.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              <Checkbox
                id="group-required"
                checked={groupRequired}
                onCheckedChange={(checked) =>
                  setGroupRequired(checked === true)
                }
              />
              <Label htmlFor="group-required">
                Grupo obrigatório (o cliente precisa escolher)
              </Label>
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
                isLoading={createGroupMutation.isPending}
                onClick={handleCreateGroup}
              >
                Criar grupo
              </Button>
            </div>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>

      <FocusModal
        open={!!modifierGroup}
        onOpenChange={(open) => {
          if (!open) {
            setModifierGroup(null)
          }
        }}
      >
        <FocusModal.Content>
          <FocusModal.Header>
            <Heading level="h2">
              Novo modificador
              {modifierGroup ? ` — ${modifierGroup.name}` : ""}
            </Heading>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col gap-y-4 p-6">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="modifier-name">Nome do modificador</Label>
              <Input
                id="modifier-name"
                placeholder="Ex.: Catupiry"
                value={modifierName}
                onChange={(event) => setModifierName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="modifier-price">Preço adicional (R$)</Label>
              <Input
                id="modifier-price"
                placeholder="Ex.: 2,00"
                value={modifierPrice}
                onChange={(event) => setModifierPrice(event.target.value)}
              />
              <Text size="xsmall" className="text-ui-fg-subtle">
                Valor somado ao preço da variante. Exibição atual:{" "}
                {formatBRL(toCents(modifierPrice))}
              </Text>
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
                isLoading={createModifierMutation.isPending}
                onClick={handleCreateModifier}
              >
                Adicionar
              </Button>
            </div>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Modificadores",
  icon: Swatch,
  rank: 2,
})

export default ModifiersPage
