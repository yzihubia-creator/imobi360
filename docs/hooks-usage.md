# Hooks de Leitura - Documentação

## Hooks Disponíveis

### 1. `useKanban` (já existente)
Endpoint: `/api/kanban`
- Retorna deals **agrupados por estágios**
- Ideal para visualização Kanban
- Já integrado no Dashboard

### 2. `useDeals` (novo)
Endpoint: `/api/deals`
- Retorna lista **simples de deals** (não agrupada)
- Suporta filtros opcionais
- Ideal para listas, tabelas, relatórios

### 3. `useDeal` (novo)
Endpoint: `/api/deals/[id]`
- Retorna **um deal específico** por ID
- Inclui dados expandidos (contact, pipeline, stage, assigned_user)
- Ideal para views de detalhe (DealDrawer)

---

## `useDeals` - Lista de Deals

### Uso Básico

```typescript
import { useDeals } from '@/hooks/use-deals'

function DealsList() {
  const { deals, isLoading, error, refetch } = useDeals()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {deals.map((deal) => (
        <li key={deal.id}>{deal.title} - {deal.value}</li>
      ))}
    </ul>
  )
}
```

### Com Filtros

```typescript
const { deals, isLoading } = useDeals({
  pipelineId: 'pipeline-123',
  stageId: 'stage-456',
  contactId: 'contact-789',
})
```

### Opções Disponíveis

```typescript
interface UseDealsOptions {
  pipelineId?: string  // Filtrar por pipeline
  stageId?: string     // Filtrar por estágio
  contactId?: string   // Filtrar por contato
}
```

### Retorno

```typescript
interface UseDealsReturn {
  deals: Deal[]        // Array de deals
  isLoading: boolean   // Estado de carregamento
  error: Error | null  // Erro (se houver)
  refetch: () => void  // Função para recarregar
}
```

---

## `useDeal` - Deal Individual

### Uso Básico

```typescript
import { useDeal } from '@/hooks/use-deal'

function DealDetail({ dealId }: { dealId: string }) {
  const { deal, isLoading, error, refetch } = useDeal(dealId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!deal) return <div>Deal not found</div>

  return (
    <div>
      <h2>{deal.title}</h2>
      <p>Value: {deal.value}</p>
      <p>Status: {deal.status}</p>
      <p>Contact: {deal.contact?.name}</p>
      <p>Pipeline: {deal.pipeline?.name}</p>
      <p>Stage: {deal.stage?.name}</p>
    </div>
  )
}
```

### Com Estado Condicional

```typescript
const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
const { deal, isLoading } = useDeal(selectedDealId)

// Hook retorna null se dealId for null
// Útil para modals/drawers que abrem/fecham
```

### Retorno

```typescript
interface UseDealReturn {
  deal: Deal | null    // Deal completo ou null
  isLoading: boolean   // Estado de carregamento
  error: Error | null  // Erro (se houver)
  refetch: () => void  // Função para recarregar
}
```

---

## Integração com DealDrawer (Exemplo)

### Opção 1: Passar deal completo via props (atual)

```typescript
// Dashboard já faz isso
const handleDealClick = (deal: KanbanDeal, stageName: string) => {
  setSelectedDeal({
    id: deal.id,
    title: deal.title,
    value: deal.value,
    status: deal.status,
    stageName,
    pipelineName: 'Sales Pipeline',
    contact: deal.contact,
  })
}

<DealDrawer deal={selectedDeal} />
```

### Opção 2: Fetch dentro do DealDrawer (futuro)

```typescript
function DealDrawer({ dealId, open, onOpenChange }) {
  const { deal, isLoading } = useDeal(dealId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {isLoading ? (
        <DealDrawerSkeleton />
      ) : deal ? (
        <DealDrawerContent deal={deal} />
      ) : (
        <DealNotFound />
      )}
    </Sheet>
  )
}
```

---

## Tipos

### Deal (completo)

```typescript
interface Deal {
  id: string
  title: string
  value: number | null
  status: string
  tenant_id: string
  pipeline_id: string
  stage_id: string
  contact_id: string | null
  assigned_to: string | null
  expected_close_date: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  custom_fields: Record<string, unknown> | null

  // Expandido do backend
  contact: {
    id: string
    name: string
    email: string | null
    phone: string | null
    type: string
    status: string
  } | null

  pipeline: {
    id: string
    name: string
    is_default: boolean
    is_active: boolean
  } | null

  stage: {
    id: string
    name: string
    color: string | null
    position: number
    is_won: boolean | null
    is_lost: boolean | null
  } | null

  assigned_user: {
    id: string
    name: string
    email: string
  } | null
}
```

---

## Cenários de Uso

### 1. Dashboard Kanban
✅ Usa: `useKanban` (já implementado)
- Visualização por colunas/estágios

### 2. Lista de Deals (futura)
✅ Usa: `useDeals`
- Tabela de deals
- Filtros por pipeline/stage/contact

### 3. DealDrawer
✅ Usa: `useDeal` (quando quiser fetch dentro do Drawer)
- Detalhes completos de um deal
- Dados sempre atualizados

### 4. Contact Details (futura)
✅ Usa: `useDeals({ contactId: 'contact-123' })`
- Ver todos os deals de um contato

---

## Features dos Hooks

### ✅ Implementado
- Fetch nativo (sem React Query ainda)
- Estados de loading/error
- Função refetch()
- Headers automáticos (x-tenant-id do middleware)
- Tipagem completa com TypeScript

### 🔜 Futuro (quando migrar para React Query)
- Cache automático
- Invalidação inteligente
- Otimistic updates
- Retry automático
- Background refetch

---

## Troubleshooting

### Erro: "Unauthorized: Missing tenant context"
✅ Solução: O middleware deve adicionar `x-tenant-id` no header
- Verificar se middleware está configurado corretamente

### Erro: "Deal not found"
✅ Solução: Verificar se o ID é válido e se o deal pertence ao tenant

### Deal não carrega
✅ Solução: Verificar se dealId não é null/undefined
- Hook retorna sem fazer fetch se dealId for null
