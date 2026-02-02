# YZIHUB Onboarding Core v2 - Workflow n8n

## 🎯 Visão Geral

Workflow resiliente e simplificado para persistir dados do onboarding sem validações excessivas. Focado em **robustez** e **manutenibilidade**.

---

## 📋 Arquitetura do Workflow

```
┌─────────────────┐
│ Webhook Trigger │
│ POST /onboarding│
│    /complete    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Sanitizer     │
│  (Code Node)    │
│                 │
│ • Clean inputs  │
│ • Convert types │
│ • Build settings│
└────────┬────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ Update Tenant   │  │  Upsert User    │
│  (Supabase)     │  │  (Supabase)     │
│                 │  │                 │
│ • settings      │  │ • role          │
│ • completed_at  │  │ • tenant_id     │
│ • status:active │  │                 │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └──────────┬─────────┘
                    ▼
           ┌─────────────────┐
           │Success Response │
           │  Status: 200    │
           │ { status: ok }  │
           └─────────────────┘
```

---

## 🔧 Nodes Explicados

### 1. **Webhook Trigger**
**Tipo:** `n8n-nodes-base.webhook`
**Path:** `onboarding/complete`
**Método:** `POST`

**Payload Esperado:**
```json
{
  "tenant_id": "uuid-do-tenant",
  "auth_user_id": "uuid-do-usuario",
  "template_id": "imobi360",
  "user_role": "admin",
  "enabled_modules": {
    "leads": { "enabled": true },
    "deals": { "enabled": true },
    "properties": { "enabled": false }
  }
}
```

**Suporta também array:**
```json
{
  "enabled_modules": ["leads", "deals", "contacts"]
}
```

---

### 2. **Sanitizer (Code Node)**
**Tipo:** `n8n-nodes-base.code`
**Linguagem:** JavaScript

**Funcionalidades:**

#### ✅ Validação Mínima
```javascript
// Apenas verifica existência (não UUID regex)
if (!tenant_id || !auth_user_id) {
  throw new Error('Missing required fields');
}
```

#### 🔄 Conversão de Tipos
```javascript
// Garante que IDs sejam strings
const tenant_id = String(input.tenant_id || '').trim();
const auth_user_id = String(input.auth_user_id || '').trim();
```

#### 📦 Normalização de Módulos
```javascript
// Converte array → object
if (Array.isArray(enabled_modules)) {
  const modulesObject = {};
  enabled_modules.forEach(module => {
    if (typeof module === 'string') {
      modulesObject[module] = { enabled: true };
    }
  });
  enabled_modules = modulesObject;
}

// Normaliza para array final
const normalized_modules = [];
Object.keys(enabled_modules).forEach(moduleId => {
  normalized_modules.push({
    id: moduleId,
    enabled: module.enabled !== false
  });
});
```

#### 🏗️ Build final_settings
```javascript
const final_settings = {
  template_id: template_id,
  template_version: '1.0.0',
  template_applied_at: now,
  onboarding_completed_at: now,
  overrides: {
    modules: normalized_modules
  }
};
```

---

## 🚀 Como Importar no n8n

### Passo 1: Abrir n8n
```bash
# Se estiver rodando localmente
http://localhost:5678
```

### Passo 2: Importar Workflow
1. Click em **"+"** (New Workflow)
2. Click nos **"..."** (menu)
3. Selecione **"Import from File"**
4. Escolha o arquivo: `yzihub-onboarding-core-v2.json`

### Passo 3: Configurar Credenciais Supabase
1. Click no node **"Update Tenant"**
2. Click em **"Supabase API"**
3. Adicione as credenciais:
   - **Host:** `https://cbyeextsavlhgquekbks.supabase.co`
   - **Service Role Key:** (use sua key do .env.local)

### Passo 4: Ativar Workflow
1. Click em **"Active"** no canto superior direito
2. Copie a URL do webhook gerada

### Passo 5: Atualizar Frontend
Edite `.env.local`:
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/onboarding/complete
```

---

## 🧪 Testar o Workflow

### Teste Manual no n8n

1. Click no node **"Webhook Trigger"**
2. Click em **"Execute Workflow"**
3. Use o botão **"Test Step"**
4. Cole o JSON de teste:

```json
{
  "tenant_id": "test-tenant-123",
  "auth_user_id": "test-user-456",
  "template_id": "imobi360",
  "user_role": "admin",
  "enabled_modules": {
    "leads": { "enabled": true },
    "deals": { "enabled": true },
    "contacts": { "enabled": true },
    "properties": { "enabled": false }
  }
}
```

### Teste via cURL

```bash
curl -X POST https://seu-n8n.com/webhook/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test-tenant-123",
    "auth_user_id": "test-user-456",
    "template_id": "imobi360",
    "user_role": "admin",
    "enabled_modules": {
      "leads": { "enabled": true },
      "deals": { "enabled": true }
    }
  }'
```

**Resposta Esperada:**
```json
{
  "status": "ok",
  "tenant_id": "test-tenant-123",
  "timestamp": "2026-02-02T17:30:00.000Z"
}
```

---

## 🛡️ Resiliência

### ✅ O Que Este Workflow FAZ

- ✅ Aceita `enabled_modules` como **object** ou **array**
- ✅ Converte todos IDs para **strings limpas**
- ✅ Normaliza módulos para formato consistente
- ✅ **Sempre** retorna status 200 (nunca trava frontend)
- ✅ Usa **upsert** para evitar duplicatas
- ✅ Atualiza tenant status para `active`
- ✅ Tratamento de erro gracioso

### ❌ O Que Este Workflow NÃO FAZ

- ❌ **Não** valida UUID com regex complexo
- ❌ **Não** valida schema JSON rigoroso
- ❌ **Não** falha se campos opcionais faltarem
- ❌ **Não** retorna status 400/500 (sempre 200)
- ❌ **Não** faz múltiplas validações desnecessárias

---

## 📊 Exemplo de Fluxo Completo

### Input (Frontend)
```json
{
  "tenant_id": "abc-123",
  "auth_user_id": "def-456",
  "template_id": "imobi360",
  "user_role": "admin",
  "enabled_modules": ["leads", "deals", "contacts"]
}
```

### Após Sanitizer
```json
{
  "tenant_id": "abc-123",
  "auth_user_id": "def-456",
  "user_role": "admin",
  "template_id": "imobi360",
  "final_settings": {
    "template_id": "imobi360",
    "template_version": "1.0.0",
    "template_applied_at": "2026-02-02T17:30:00.000Z",
    "onboarding_completed_at": "2026-02-02T17:30:00.000Z",
    "overrides": {
      "modules": [
        { "id": "leads", "enabled": true },
        { "id": "deals", "enabled": true },
        { "id": "contacts", "enabled": true }
      ]
    }
  },
  "onboarding_completed_at": "2026-02-02T17:30:00.000Z"
}
```

### Response (Frontend)
```json
{
  "status": "ok",
  "tenant_id": "abc-123",
  "timestamp": "2026-02-02T17:30:00.000Z"
}
```

---

## 🔍 Debugging

### Verificar Dados no Supabase

```sql
-- Check tenant settings
SELECT id, settings, onboarding_completed_at, status
FROM tenants
WHERE id = 'seu-tenant-id';

-- Check user
SELECT auth_user_id, tenant_id, role
FROM users
WHERE auth_user_id = 'seu-user-id';
```

---

## 📚 Troubleshooting

### Erro: "Missing required fields"

**Causa:** `tenant_id` ou `auth_user_id` vazio

**Solução:** Verifique se o frontend está enviando os campos

### Erro: "Cannot find table tenants"

**Causa:** Credenciais Supabase incorretas

**Solução:** Re-configure as credenciais no n8n

---

## 🎯 Diferenças da v1

| Aspecto | v1 (Antiga) | v2 (Nova) |
|---------|-------------|-----------|
| Validação UUID | Regex complexo | Apenas existência |
| enabled_modules | Só object | Object OU array |
| Type safety | Inconsistente | String enforcement |
| Error handling | Status 400/500 | Sempre 200 |
| Complexidade | Alta | Baixa |
| Manutenibilidade | Difícil | Fácil |

---

## 📞 Suporte

**Workflow Version:** v2-resilient
**Created:** 2026-02-02
**Author:** YZIHUB Team
