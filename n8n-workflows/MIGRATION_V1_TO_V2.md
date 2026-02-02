# Migração: Onboarding Workflow v1 → v2

## 🎯 Por Que Migrar?

### Problemas da v1
- ❌ Validações UUID com regex complexo falhando
- ❌ Estrutura de merge muito complexa
- ❌ Não aceita `enabled_modules` como array
- ❌ Retorna erros 400/500 que travam o frontend
- ❌ Type coercion inconsistente
- ❌ Difícil de debugar

### Benefícios da v2
- ✅ Validação mínima (apenas existência)
- ✅ Aceita múltiplos formatos de input
- ✅ **Sempre** retorna status 200
- ✅ Type enforcement consistente
- ✅ Código limpo e fácil de manter
- ✅ Logs claros para debugging

---

## 📊 Comparação Técnica

### Input Handling

#### v1 (Antiga)
```javascript
// Falha com regex UUID
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant_id)) {
  throw new Error('Invalid UUID');
}

// Só aceita object
if (typeof enabled_modules !== 'object' || Array.isArray(enabled_modules)) {
  throw new Error('enabled_modules must be object');
}
```

#### v2 (Nova)
```javascript
// Apenas verifica existência
if (!tenant_id || !auth_user_id) {
  throw new Error('Missing required fields');
}

// Aceita array OU object
if (Array.isArray(enabled_modules)) {
  // Converte automaticamente para object
  const modulesObject = {};
  enabled_modules.forEach(module => {
    modulesObject[module] = { enabled: true };
  });
  enabled_modules = modulesObject;
}
```

---

### Error Handling

#### v1 (Antiga)
```javascript
// Retorna erro HTTP que quebra frontend
return {
  statusCode: 400,
  body: { error: 'Validation failed' }
};
```

#### v2 (Nova)
```javascript
// SEMPRE retorna 200
return {
  statusCode: 200,
  body: {
    status: 'error',
    message: 'Missing required fields',
    timestamp: new Date().toISOString()
  }
};
```

---

### Module Normalization

#### v1 (Antiga)
```javascript
// Merge complexo com múltiplos passos
const mergedModules = {};
Object.keys(templateModules).forEach(key => {
  mergedModules[key] = {
    ...templateModules[key],
    ...(enabled_modules[key] || {})
  };
});

// Depois ainda precisa transformar em array
const finalModules = Object.entries(mergedModules).map(...);
```

#### v2 (Nova)
```javascript
// Normalização direta e simples
const normalized_modules = [];
Object.keys(enabled_modules).forEach(moduleId => {
  normalized_modules.push({
    id: moduleId,
    enabled: enabled_modules[moduleId].enabled !== false
  });
});
```

---

## 🔄 Passos de Migração

### Passo 1: Backup do Workflow Atual

```bash
# Exportar workflow v1 atual
# n8n UI → Workflow → Menu → Export
# Salvar como: yzihub-onboarding-v1-backup.json
```

### Passo 2: Importar Workflow v2

1. Abra n8n (`http://localhost:5678`)
2. Click em **"+"** (New Workflow)
3. Menu → **"Import from File"**
4. Selecione: `yzihub-onboarding-core-v2.json`

### Passo 3: Configurar Credenciais

Mesmas credenciais da v1:
- **Supabase URL:** `https://cbyeextsavlhgquekbks.supabase.co`
- **Service Role Key:** (mesma da v1)

### Passo 4: Testar em Paralelo

**NÃO desative a v1 ainda!** Execute testes na v2:

```bash
# Teste v2
curl -X POST https://seu-n8n.com/webhook/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test-123",
    "auth_user_id": "test-456",
    "template_id": "imobi360",
    "user_role": "admin",
    "enabled_modules": ["leads", "deals"]
  }'
```

Verifique no Supabase se os dados foram salvos corretamente.

### Passo 5: Atualizar Frontend

Edite `.env.local`:

```diff
- NEXT_PUBLIC_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/onboarding/finalize
+ NEXT_PUBLIC_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/onboarding/complete
```

### Passo 6: Deploy Gradual

1. **Staging:** Testar v2 em ambiente de staging
2. **Canary:** 10% do tráfego para v2
3. **Full:** 100% do tráfego para v2
4. **Cleanup:** Desativar v1 após 7 dias

### Passo 7: Monitorar

```bash
# Check n8n executions
# n8n UI → Executions → Filter by workflow v2

# Verificar sucesso
SELECT COUNT(*) FROM tenants
WHERE onboarding_completed_at > '2026-02-02'
AND status = 'active';
```

---

## 🧪 Testes de Compatibilidade

### Teste 1: Formato Object (v1 compatível)
```json
{
  "tenant_id": "abc-123",
  "auth_user_id": "def-456",
  "enabled_modules": {
    "leads": { "enabled": true },
    "deals": { "enabled": true }
  }
}
```
**Status v2:** ✅ Funciona

### Teste 2: Formato Array (v1 falhava)
```json
{
  "tenant_id": "abc-123",
  "auth_user_id": "def-456",
  "enabled_modules": ["leads", "deals", "contacts"]
}
```
**Status v1:** ❌ Falha
**Status v2:** ✅ Funciona

### Teste 3: UUID com espaços (v1 falhava)
```json
{
  "tenant_id": " abc-123 ",
  "auth_user_id": " def-456 "
}
```
**Status v1:** ❌ Falha (regex)
**Status v2:** ✅ Funciona (trim)

---

## 🔍 Checklist de Migração

- [ ] Backup do workflow v1 exportado
- [ ] Workflow v2 importado no n8n
- [ ] Credenciais Supabase configuradas
- [ ] Teste manual via n8n UI passou
- [ ] Teste via cURL passou
- [ ] Dados salvos corretamente no Supabase
- [ ] Frontend `.env.local` atualizado
- [ ] Teste end-to-end com frontend passou
- [ ] Monitoring configurado
- [ ] Workflow v2 ativado em produção
- [ ] Workflow v1 desativado após 7 dias

---

## 🐛 Troubleshooting na Migração

### Problema: "Workflow v2 não recebe requests"

**Causa:** URL do webhook diferente da v1

**Solução:**
1. Copie a URL exata do webhook v2
2. Atualize `.env.local`
3. Rebuild frontend: `npm run build`

### Problema: "Dados não aparecem no Supabase"

**Causa:** Credenciais incorretas

**Verificar:**
```sql
-- Test Supabase connection
SELECT current_user, current_database();
```

### Problema: "Frontend mostra erro mesmo com status 200"

**Causa:** Frontend esperando campo específico

**Solução:** Verifique que response tem `status: "ok"`

---

## 📈 Monitoramento Pós-Migração

### Métricas a Acompanhar

```sql
-- Taxa de sucesso onboarding
SELECT
  DATE(onboarding_completed_at) as date,
  COUNT(*) as completions
FROM tenants
WHERE onboarding_completed_at > '2026-02-02'
GROUP BY DATE(onboarding_completed_at);

-- Tenants ativos
SELECT COUNT(*)
FROM tenants
WHERE status = 'active'
AND onboarding_completed_at > '2026-02-02';

-- Erros no onboarding
-- (verificar logs do n8n)
```

### Dashboard n8n

Monitore:
- ✅ Execution success rate
- ⏱️ Average execution time
- ❌ Failed executions
- 📊 Executions per hour

---

## 🎯 Rollback Plan

Se precisar voltar para v1:

### Passo 1: Desativar v2
```bash
# n8n UI → Workflow v2 → Toggle "Active" OFF
```

### Passo 2: Reativar v1
```bash
# n8n UI → Workflow v1 → Toggle "Active" ON
```

### Passo 3: Reverter Frontend
```diff
- NEXT_PUBLIC_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/onboarding/complete
+ NEXT_PUBLIC_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/onboarding/finalize
```

### Passo 4: Rebuild e Deploy
```bash
npm run build
# Deploy frontend
```

**Tempo estimado de rollback:** ~5 minutos

---

## 📞 Suporte na Migração

**Documentação:**
- v2 Guide: `YZIHUB_ONBOARDING_V2_GUIDE.md`
- Workflow JSON: `yzihub-onboarding-core-v2.json`

**Contato:** YZIHUB Team

**Versão:** v2-resilient
**Data:** 2026-02-02
