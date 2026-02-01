# YZIHUB CRM — Canonical Context

## Scope
Core CRM multi-tenant for YZIHUB.
IMOBI360 is the first tenant/module.

## Stack
- Next.js 16.1.5 + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Supabase (Auth, Database, Storage)
- @dnd-kit (Kanban), @tanstack/react-query, zustand
- OpenAI API (lead qualification), n8n webhooks

## Database Schema (Supabase)
**Tables:** tenants, users, leads, imoveis, contratos, financeiro, atividades
**Multi-tenancy:** All tables have tenant_id with RLS policies
**ENUMs:** lead_status, lead_score, lead_source, property_type, property_status, contract_status, financial_status

## Current State
- [x] Auth (login/logout/middleware)
- [x] Dashboard layout (sidebar/header/nav)
- [x] Providers (React Query)
- [x] UI components (button, input, card, label)
- [ ] Supabase schema (NEXT)
- [ ] Kanban leads
- [ ] Imóveis CRUD
- [ ] Contratos CRUD
- [ ] Financeiro dashboard

## Immediate Priority
1. Create `supabase-schema.sql` with full schema
2. Execute in Supabase SQL Editor
3. Update `types/database.ts` with generated types

## Routes
- `/login` - Auth
- `/dashboard` - Overview
- `/dashboard/leads` - Kanban
- `/dashboard/imoveis` - Properties
- `/dashboard/contratos` - Contracts
- `/dashboard/financeiro` - Financial

## Migration
Source: Airtable → Target: Supabase
Scripts: migrate-export.js, migrate-transform.js, migrate-import.js

## Environment
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
OPENAI_API_KEY
N8N_WEBHOOK_URL
```
