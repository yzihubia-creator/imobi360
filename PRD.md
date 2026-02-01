# 📋 PRD - IMOBI360 CRM Imobiliário

**Versão:** 1.0
**Data:** 27 de Janeiro de 2026
**Status:** Em Desenvolvimento

---

## 🎯 Visão Geral do Produto

### Problema
Imobiliárias e corretores precisam de um sistema completo para gerenciar leads, imóveis, contratos e financeiro de forma integrada, com automação e inteligência artificial.

### Solução
IMOBI360 é um CRM completo para o mercado imobiliário que unifica gestão de leads (com Kanban e IA), catálogo de imóveis, contratos e controle financeiro em uma única plataforma moderna e intuitiva.

### Objetivos
- ✅ Centralizar gestão de leads com funil visual (Kanban)
- ✅ Automatizar qualificação de leads com IA
- ✅ Gerenciar portfólio completo de imóveis
- ✅ Controlar contratos e assinaturas
- ✅ Acompanhar receitas, despesas e comissões
- ✅ Integrar com n8n para automações
- ✅ Suportar multi-tenancy (múltiplas imobiliárias)

---

## 👥 Personas

### 1. Corretor de Imóveis
- **Objetivo:** Gerenciar leads e fechar vendas
- **Necessidades:**
  - Ver leads em Kanban visual
  - Agendar visitas rapidamente
  - Acessar informações de imóveis facilmente
  - Registrar atividades com clientes

### 2. Gestor/Dono da Imobiliária
- **Objetivo:** Supervisionar operação e resultados
- **Necessidades:**
  - Dashboard com métricas consolidadas
  - Relatórios financeiros
  - Controle de contratos
  - Visão geral do funil de vendas

### 3. Administrativo/Financeiro
- **Objetivo:** Controlar receitas e despesas
- **Necessidades:**
  - Lançar receitas e despesas
  - Acompanhar comissões
  - Controlar pagamentos de anúncios
  - Gerar relatórios financeiros

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

**Frontend:**
- Next.js 16.1.5 (App Router)
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui (componentes)
- Lucide React (ícones)

**State Management:**
- Zustand (estado global)
- @tanstack/react-query (cache e sincronização)

**Formulários:**
- React Hook Form
- Zod (validação)

**Drag & Drop:**
- @dnd-kit (Kanban)

**Backend/Database:**
- Supabase (PostgreSQL)
- Supabase Auth (autenticação)
- Supabase Realtime (atualizações em tempo real)

**Integrações:**
- n8n (automações via webhook)
- OpenAI API (IA para qualificação de leads)

**Deployment:**
- Vercel (frontend)
- Supabase Cloud (backend)

---

## 🗄️ Modelo de Dados

### Tabelas Principais

#### `tenants` (Multi-tenancy)
```sql
- id (uuid, PK)
- name (text)
- slug (text, unique)
- email (text)
- plan (enum: free, pro, enterprise)
- status (enum: active, suspended, cancelled)
- created_at (timestamp)
```

#### `users`
```sql
- id (uuid, PK)
- tenant_id (uuid, FK)
- name (text)
- email (text, unique)
- role (enum: admin, corretor, financeiro)
- is_active (boolean)
- created_at (timestamp)
```

#### `leads`
```sql
- id (uuid, PK)
- tenant_id (uuid, FK)
- name (text)
- email (text)
- phone (text)
- status (enum: novo, qualificando, lead_quente, visita_agendada, proposta, negociacao, fechado, perdido)
- score (enum: alto, medio, baixo)
- source (enum: google_ads, meta_ads, instagram, whatsapp_site, indicacao, outro)
- interest_type (enum: compra, aluguel, ambos)
- budget_range (jsonb: {min, max})
- desired_region (text[])
- profile_summary (text) -- Gerado por IA
- last_interaction (timestamp)
- visit_scheduled_at (timestamp)
- webhook_url (text) -- Para n8n
- temperature (enum: quente, morno, frio)
- imovel_interesse (text)
- assigned_to (uuid, FK users)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `imoveis` (Imóveis)
```sql
- id (uuid, PK)
- tenant_id (uuid, FK)
- property_code (text, unique)
- type (enum: apartamento, casa, terreno, comercial, rural)
- purpose (enum: compra, aluguel, temporada)
- title (text)
- description (text)
- address (text)
- neighborhood (text)
- city (text)
- state (text)
- orientation (enum: norte, sul, leste, oeste, nordeste, noroeste, sudeste, sudoeste)
- amenities (text[])
- area (numeric)
- bedrooms (integer)
- suites (integer)
- bathrooms (integer)
- parking_spaces (integer)
- price (numeric)
- broker_code (text)
- photos (text[]) -- URLs das fotos
- status (enum: disponivel, reservado, vendido, alugado, inativo)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `contratos`
```sql
- id (uuid, PK)
- tenant_id (uuid, FK)
- contract_code (text, unique)
- lead_id (uuid, FK, nullable)
- imovel_id (uuid, FK, nullable)
- client_name (text)
- client_email (text)
- client_phone (text)
- client_cpf_cnpj (text)
- client_address (text)
- type (enum: compra_venda, locacao, temporada)
- status (enum: preparacao, enviado, aguardando, assinado, cancelado)
- sent_at (timestamp)
- signed_at (timestamp)
- days_without_return (integer)
- document_url (text)
- manager_notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `financeiro`
```sql
- id (uuid, PK)
- tenant_id (uuid, FK)
- financial_code (text, unique)
- type (enum: receita, despesa)
- description (text)
- category (enum: comissao, aluguel, anuncios, fixo, portal_imobiliario, operacional, outro)
- expected_amount (numeric)
- received_amount (numeric)
- expected_date (date)
- payment_date (date)
- reference_month (text) -- formato: YYYY-MM
- status (enum: previsto, a_receber, recebido, atrasado)
- days_overdue (integer)
- revenue_source (text)
- contract_id (uuid, FK, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `atividades`
```sql
- id (uuid, PK)
- tenant_id (uuid, FK)
- lead_id (uuid, FK)
- user_id (uuid, FK)
- type (enum: ligacao, email, whatsapp, visita, proposta, negociacao, reuniao, outro)
- description (text)
- scheduled_at (timestamp)
- completed_at (timestamp)
- status (enum: pendente, concluida, cancelada)
- created_at (timestamp)
```

---

## 🎨 Módulos e Funcionalidades

### 1. 🔐 Autenticação

**Funcionalidades:**
- Login com email/senha (Supabase Auth)
- Logout
- Proteção de rotas via middleware
- Redirecionamento automático

**Rotas:**
- `/login` - Página de login
- `/api/auth/signout` - Endpoint de logout

**Status:** ✅ Implementado

---

### 2. 📊 Dashboard

**Funcionalidades:**
- Visão geral com métricas principais
- Cards de estatísticas:
  - Total de Leads (+ variação %)
  - Imóveis Ativos
  - Contratos Ativos
  - Receita do Mês (+ variação %)
- Gráficos (futuro):
  - Funil de conversão
  - Receita vs Despesa
  - Leads por origem

**Rotas:**
- `/dashboard` - Dashboard principal

**Status:** ✅ Implementado (métricas estáticas)

---

### 3. 👥 Gestão de Leads (Kanban)

**Funcionalidades:**

#### 3.1 Kanban Board
- Colunas do funil:
  1. 🆕 Novo
  2. 🟡 Qualificando (IA)
  3. 🔥 Lead Quente
  4. 📞 Em Contato
  5. 🎯 Qualificado
  6. 📅 Visita Agendada
  7. 💰 Proposta
  8. 🤝 Negociação
  9. ✅ Fechado
  10. ❌ Perdido

- Drag & Drop entre colunas (@dnd-kit)
- Contadores por coluna
- Cards de lead com:
  - Nome e telefone
  - Score (🟢 Alto, 🟡 Médio, 🔴 Baixo)
  - Temperatura (🔥 Quente, 🌡️ Morno, ❄️ Frio)
  - Origem (badge)
  - Imóvel de interesse
  - Última interação

#### 3.2 Detalhes do Lead
- Modal/drawer com informações completas
- Timeline de atividades
- Formulário de edição
- Botões de ação:
  - Ligar (integra com WhatsApp/telefone)
  - Enviar WhatsApp
  - Agendar visita
  - Criar proposta
  - Enviar para corretor (webhook n8n)

#### 3.3 Qualificação com IA
- Análise automática do perfil do lead
- Geração de resumo (profile_summary)
- Sugestão de score (alto/médio/baixo)
- Recomendação de imóveis compatíveis
- Integração com OpenAI API

#### 3.4 Filtros e Busca
- Buscar por nome, email, telefone
- Filtrar por:
  - Status
  - Origem
  - Score
  - Temperatura
  - Data de criação
  - Corretor responsável

#### 3.5 Novo Lead
- Formulário com campos:
  - Nome*
  - Telefone*
  - Email
  - Origem*
  - Interesse (compra/aluguel/ambos)
  - Faixa de orçamento
  - Regiões de interesse (multi-select)
  - Observações
- Validação com Zod
- Qualificação automática com IA (opcional)

**Rotas:**
- `/dashboard/leads` - Kanban de leads
- `/dashboard/leads/new` - Novo lead
- `/dashboard/leads/[id]` - Detalhes do lead

**Integrações:**
- OpenAI API (qualificação)
- n8n webhook (enviar para corretor)
- WhatsApp API (futuro)

**Status:** 🚧 A Implementar (próximo)

---

### 4. 🏢 Gestão de Imóveis

**Funcionalidades:**

#### 4.1 Lista de Imóveis
- Tabela com colunas:
  - Código
  - Título
  - Tipo
  - Finalidade
  - Cidade/Bairro
  - Valor
  - Status
  - Ações
- Filtros:
  - Tipo
  - Finalidade
  - Status
  - Faixa de preço
  - Cidade
- Busca por texto
- Ordenação por colunas

#### 4.2 Card View (alternativa)
- Cards com foto principal
- Informações resumidas
- Badges de status
- Ícones de características (quartos, vagas, área)

#### 4.3 Detalhes do Imóvel
- Galeria de fotos (carousel)
- Informações completas:
  - Código e título
  - Tipo e finalidade
  - Descrição
  - Endereço completo
  - Características (quartos, suítes, vagas, área)
  - Orientação
  - Amenidades (lista)
  - Valor
  - Código do corretor
- Histórico de leads interessados
- Botões de ação:
  - Editar
  - Compartilhar
  - Gerar proposta
  - Marcar como vendido/alugado

#### 4.4 Novo/Editar Imóvel
- Formulário com abas:
  1. **Informações Básicas:**
     - Código
     - Título*
     - Tipo*
     - Finalidade*
     - Status*
  2. **Localização:**
     - Endereço completo
     - Bairro*
     - Cidade*
     - Estado*
     - Orientação
  3. **Características:**
     - Área (m²)*
     - Quartos
     - Suítes
     - Banheiros
     - Vagas
  4. **Descrição e Amenidades:**
     - Descrição detalhada (rich text)
     - Amenidades (multi-select)
  5. **Fotos:**
     - Upload múltiplo
     - Drag & drop para reordenar
     - Definir foto principal
  6. **Financeiro:**
     - Valor*
     - Código do corretor

**Rotas:**
- `/dashboard/imoveis` - Lista de imóveis
- `/dashboard/imoveis/new` - Novo imóvel
- `/dashboard/imoveis/[id]` - Detalhes
- `/dashboard/imoveis/[id]/edit` - Editar

**Status:** 🚧 A Implementar

---

### 5. 📄 Gestão de Contratos

**Funcionalidades:**

#### 5.1 Lista de Contratos
- Tabela com:
  - Código
  - Cliente
  - Tipo
  - Status
  - Data de envio
  - Data de assinatura
  - Dias sem retorno
  - Ações
- Filtros:
  - Status
  - Tipo
  - Período
- Busca por cliente ou código

#### 5.2 Detalhes do Contrato
- Informações completas:
  - Código e tipo
  - Dados do cliente (nome, email, telefone, CPF/CNPJ, endereço)
  - Status e datas
  - Imóvel vinculado (se houver)
  - Lead vinculado (se houver)
  - Notas do gestor
- Documento do contrato (visualizar/baixar)
- Timeline de status
- Botões de ação:
  - Enviar contrato
  - Marcar como assinado
  - Cancelar
  - Editar
  - Baixar PDF

#### 5.3 Novo/Editar Contrato
- Formulário com:
  - Código do contrato*
  - Vincular lead (busca)
  - Vincular imóvel (busca)
  - Dados do cliente*:
    - Nome
    - Email
    - Telefone
    - CPF/CNPJ
    - Endereço
  - Tipo de contrato*
  - Status*
  - Upload do documento
  - Notas do gestor (textarea)

#### 5.4 Alertas
- Badge vermelho para contratos sem retorno há mais de X dias
- Notificação de contratos aguardando assinatura

**Rotas:**
- `/dashboard/contratos` - Lista
- `/dashboard/contratos/new` - Novo
- `/dashboard/contratos/[id]` - Detalhes
- `/dashboard/contratos/[id]/edit` - Editar

**Status:** 🚧 A Implementar

---

### 6. 💰 Gestão Financeira

**Funcionalidades:**

#### 6.1 Dashboard Financeiro
- Cards com métricas:
  - Receita do mês (prevista vs realizada)
  - Despesa do mês (prevista vs realizada)
  - Saldo (receita - despesa)
  - Receitas atrasadas
- Gráfico de barras: Receita vs Despesa (mensal)
- Gráfico de pizza: Despesas por categoria

#### 6.2 Lista de Transações
- Tabela com:
  - Código
  - Tipo (receita/despesa)
  - Descrição
  - Categoria
  - Valor previsto
  - Valor realizado
  - Data prevista
  - Data de pagamento
  - Status
  - Dias de atraso
  - Ações
- Filtros:
  - Tipo
  - Categoria
  - Status
  - Mês de referência
- Busca por descrição ou código

#### 6.3 Detalhes da Transação
- Informações completas
- Contrato vinculado (se houver)
- Histórico de alterações

#### 6.4 Nova/Editar Transação
- Formulário com:
  - Código*
  - Tipo* (receita/despesa)
  - Descrição*
  - Categoria*
  - Valor previsto*
  - Valor realizado
  - Data prevista*
  - Data de pagamento
  - Mês de referência*
  - Status*
  - Vincular contrato (busca)
  - Origem da receita (se receita)

#### 6.5 Categorias Pré-definidas
**Receitas:**
- Comissão
- Aluguel
- Taxa de administração
- Outro

**Despesas:**
- Anúncios (Google Ads, Meta Ads)
- Portal Imobiliário (ZAP, Viva Real, etc.)
- Fixo (salários, aluguel, contas)
- Operacional
- Outro

#### 6.6 Relatórios
- Relatório mensal (PDF/Excel)
- DRE simplificado
- Fluxo de caixa
- Comissões por corretor

**Rotas:**
- `/dashboard/financeiro` - Dashboard + lista
- `/dashboard/financeiro/new` - Nova transação
- `/dashboard/financeiro/[id]` - Detalhes
- `/dashboard/financeiro/[id]/edit` - Editar
- `/dashboard/financeiro/relatorios` - Relatórios

**Status:** 🚧 A Implementar

---

## 🔗 Integrações

### 1. OpenAI API

**Uso:** Qualificação automática de leads

**Funcionalidades:**
- Analisar informações do lead (orçamento, região, interesse)
- Gerar profile_summary (resumo do perfil)
- Sugerir score (alto/médio/baixo)
- Recomendar imóveis compatíveis do catálogo

**Endpoint:** GPT-4 Chat Completion

**Variável:** `OPENAI_API_KEY`

---

### 2. n8n Webhook

**Uso:** Automações e envio de leads para corretores

**Funcionalidades:**
- Enviar dados do lead para fluxo n8n
- Notificar corretor via WhatsApp/email
- Criar tarefas automatizadas
- Sincronizar com outros sistemas

**Variável:** `N8N_WEBHOOK_URL`

**Payload exemplo:**
```json
{
  "lead_id": "uuid",
  "name": "João Silva",
  "phone": "(11) 98765-4321",
  "email": "joao@email.com",
  "status": "lead_quente",
  "imovel_interesse": "Apartamento 3 quartos Centro",
  "budget_range": {"min": 400000, "max": 500000}
}
```

---

### 3. WhatsApp API (Futuro)

**Uso:** Enviar mensagens diretamente do CRM

**Funcionalidades:**
- Enviar mensagem de boas-vindas
- Compartilhar imóveis
- Confirmar agendamentos
- Notificações automáticas

---

## 📱 Interface e UX

### Design System

**Cores:**
- Primary: Gray/Zinc (neutro, profissional)
- Success: Green (fechamentos, receitas)
- Warning: Yellow (pendências, alertas)
- Danger: Red (atrasados, perdidos)
- Info: Blue (informações, links)

**Tipografia:**
- Font: Inter (Google Fonts)
- Títulos: 2xl-4xl, bold
- Corpo: sm-base, regular/medium
- Labels: xs-sm, medium

**Componentes (shadcn/ui):**
- Button, Input, Label, Select
- Card, Dialog, Dropdown Menu
- Table, Tabs, Badge
- Avatar, Toast, Form

**Ícones:**
- Lucide React
- Consistência visual
- Tamanhos: 16px (sm), 20px (md), 24px (lg)

### Layout

**Estrutura:**
```
┌─────────────────────────────────────┐
│ Header (logo + user menu)          │
├─────────┬───────────────────────────┤
│         │                           │
│ Sidebar │   Main Content            │
│ (nav)   │   (módulo atual)          │
│         │                           │
│         │                           │
└─────────┴───────────────────────────┘
```

**Sidebar (fixed):**
- Logo IMOBI360
- Menu de navegação:
  - Dashboard
  - Leads
  - Imóveis
  - Contratos
  - Financeiro
- Estado ativo com background
- Ícones + labels

**Header (fixed):**
- Breadcrumb (opcional)
- Busca global (futuro)
- Notificações (futuro)
- User menu:
  - Email do usuário
  - Configurações (futuro)
  - Sair

### Responsividade

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Comportamento:**
- Mobile: Sidebar vira drawer/bottom sheet
- Tablet: Sidebar colapsável
- Desktop: Sidebar fixa

---

## 🚀 Roadmap

### ✅ Fase 1: Base (Concluída)
- [x] Setup do projeto (Next.js + TypeScript + Tailwind)
- [x] Configuração Supabase (clients)
- [x] Autenticação (login/logout)
- [x] Middleware de proteção de rotas
- [x] Layout do dashboard (sidebar + header)
- [x] Dashboard inicial com métricas
- [x] Providers (React Query)
- [x] Componentes UI (shadcn/ui)

### 🚧 Fase 2: Leads Kanban (Em Progresso)
- [ ] Kanban board com drag & drop
- [ ] CRUD de leads
- [ ] Modal de detalhes do lead
- [ ] Timeline de atividades
- [ ] Qualificação com IA (OpenAI)
- [ ] Integração webhook n8n
- [ ] Filtros e busca

### 📋 Fase 3: Imóveis
- [ ] Lista de imóveis (tabela + cards)
- [ ] CRUD de imóveis
- [ ] Upload de fotos
- [ ] Galeria de fotos (carousel)
- [ ] Filtros avançados
- [ ] Vinculação lead <> imóvel

### 📋 Fase 4: Contratos
- [ ] Lista de contratos
- [ ] CRUD de contratos
- [ ] Upload de documentos
- [ ] Visualizador de PDF
- [ ] Alertas de pendências
- [ ] Geração de PDF (futuro)

### 📋 Fase 5: Financeiro
- [ ] Dashboard financeiro
- [ ] CRUD de transações
- [ ] Categorização
- [ ] Relatórios básicos
- [ ] Gráficos (recharts)
- [ ] Exportação (CSV/Excel)

### 📋 Fase 6: Melhorias
- [ ] Notificações em tempo real (Supabase Realtime)
- [ ] Busca global
- [ ] Configurações de conta
- [ ] Gestão de usuários (admin)
- [ ] Permissões por role
- [ ] Auditoria (logs)
- [ ] WhatsApp API
- [ ] Templates de mensagens
- [ ] Assinatura eletrônica
- [ ] App mobile (React Native)

---

## 🔒 Segurança e Permissões

### Row Level Security (RLS)

Todas as tabelas devem ter políticas RLS no Supabase:

```sql
-- Exemplo para tabela leads
CREATE POLICY "Users can view leads from their tenant"
ON leads FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create leads for their tenant"
ON leads FOR INSERT
WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

### Roles e Permissões

| Funcionalidade | Admin | Corretor | Financeiro |
|---|---|---|---|
| Ver Dashboard | ✅ | ✅ | ✅ |
| Gerenciar Leads | ✅ | ✅ | ❌ |
| Gerenciar Imóveis | ✅ | ✅ (próprios) | ❌ |
| Gerenciar Contratos | ✅ | ✅ (próprios) | ✅ |
| Gerenciar Financeiro | ✅ | ❌ | ✅ |
| Configurações | ✅ | ❌ | ❌ |
| Gerenciar Usuários | ✅ | ❌ | ❌ |

---

## 📊 Métricas e KPIs

### Dashboard Principal
- Total de Leads (+ variação mensal)
- Taxa de Conversão (%)
- Leads por Estágio (funil)
- Imóveis Ativos
- Contratos Ativos
- Receita do Mês (+ variação)
- Ticket Médio

### Leads
- Leads por Origem
- Leads por Score
- Tempo Médio por Estágio
- Taxa de Conversão por Estágio

### Financeiro
- Receita vs Despesa (mensal)
- Despesas por Categoria
- Receitas Atrasadas
- Comissões por Corretor

---

## 🧪 Testes

### Tipos de Teste (Futuro)
- Unit tests (Jest + Testing Library)
- Integration tests (Supabase)
- E2E tests (Playwright)
- Visual regression (Chromatic)

---

## 📝 Notas Técnicas

### Convenções de Código
- **Nomenclatura:** camelCase para variáveis/funções, PascalCase para componentes
- **Arquivos:** kebab-case para arquivos, ex: `dashboard-nav.tsx`
- **Imports:** Absolute imports com `@/` alias
- **Commits:** Conventional Commits (feat, fix, docs, style, refactor, test, chore)

### Estrutura de Pastas
```
app/
├── (auth)/           # Rotas de autenticação
├── (dashboard)/      # Rotas protegidas do dashboard
├── api/              # API routes
├── layout.tsx        # Root layout
├── page.tsx          # Home page
└── providers.tsx     # Client providers

components/
├── ui/               # shadcn/ui components
├── dashboard/        # Dashboard específicos
├── leads/            # Lead components
├── kanban/           # Kanban components
└── ...

lib/
├── supabase/         # Supabase clients
└── utils/            # Utility functions

types/
└── database.ts       # Database types

hooks/                # Custom React hooks
```

### Boas Práticas
- ✅ Server Components por padrão
- ✅ 'use client' apenas quando necessário
- ✅ Validação com Zod em formulários
- ✅ Error boundaries
- ✅ Loading states
- ✅ Otimistic updates (React Query)
- ✅ Debounce em buscas
- ✅ Infinite scroll/pagination
- ✅ Suspense para lazy loading

---

## 🤝 Migração de Dados

### Script de Migração (Airtable → Supabase)

Arquivo: `migrate-transform.js`

**Mapeamentos:**

**Status de Leads:**
- '🆕 Novo' → 'novo'
- '🟡 Qualificando (IA)' → 'qualificando'
- '🔥 Lead Quente' → 'lead_quente'
- '📅 Visita Agendada' → 'visita_agendada'
- '✅ Fechado' → 'fechado'

**Score:**
- '🟢 Alto' → 'alto'
- '🟡 Médio' → 'medio'
- '🔴 Baixo' → 'baixo'

**Status de Contratos:**
- '🟡 Em preparação' → 'preparacao'
- '📤 Enviado' → 'enviado'
- '⏳ Aguardando' → 'aguardando'
- '✍️ Assinado' → 'assinado'

**Status Financeiro:**
- '🟡 Previsto' → 'previsto'
- '🔵 A Receber' → 'a_receber'
- '🟢 Recebido' → 'recebido'
- '🔴 Atrasado' → 'atrasado'

---

## 📞 Suporte e Documentação

### Links Úteis
- **Documentação Next.js:** https://nextjs.org/docs
- **Documentação Supabase:** https://supabase.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs

### Contato
- **Email:** contato@imobi360.com
- **Suporte:** suporte@imobi360.com

---

## 📄 Licença

Proprietary - Todos os direitos reservados © 2026 IMOBI360

---

**Última atualização:** 27 de Janeiro de 2026
**Versão do PRD:** 1.0
**Autor:** Equipe IMOBI360
