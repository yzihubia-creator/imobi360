# Guia de Teste - Middleware Module Protection (Fase 7.3)

## 🎯 Objetivo

Verificar que o middleware está bloqueando acesso a módulos desabilitados e fazendo redirect para o primeiro módulo ativo.

---

## ⚠️ Pré-requisitos

1. **Tenant criado** - Você precisa ter completado o onboarding
2. **Servidor rodando** - `npm run dev`
3. **Usuário logado** - Fazer login no sistema

---

## 🧪 Procedimento de Teste

### Passo 1: Completar Onboarding

Se ainda não tiver um tenant criado:

```bash
npm run dev
```

1. Acesse `http://localhost:3000`
2. Complete o fluxo de onboarding
3. Escolha um template (ex: IMOBI360)
4. Faça login no sistema

### Passo 2: Desabilitar um Módulo

Após o onboarding estar completo e você estar logado, execute:

```bash
node test-disable-module.mjs
```

Isso irá:
- Buscar seu tenant no banco
- Desabilitar o módulo "properties"
- Mostrar as configurações atualizadas

**Saída esperada:**
```
🔧 Desabilitando módulo "properties"...

📋 Tenant encontrado: [Nome do seu tenant]
🆔 Tenant ID: [ID do tenant]

✅ Módulo "properties" DESABILITADO com sucesso!

📝 Settings atualizados:
{
  "modules": [
    {
      "id": "properties",
      "enabled": false
    }
  ]
}

🧪 Agora você pode testar acessando: http://localhost:3000/dashboard/properties
   Deve redirecionar para o primeiro módulo ativo.
```

### Passo 3: Testar Acesso ao Módulo Desabilitado

1. **Abra o browser** em `http://localhost:3000/dashboard/properties`

2. **Observe o console do terminal** onde o servidor está rodando

Você deve ver logs do middleware como:

```
[Middleware] 🔐 Module access check: {
  module: 'properties',
  tenant_id: '[seu-tenant-id]',
  user_role: 'admin',
  path: '/dashboard/properties'
}

[Middleware] 📋 Module found: {
  exists: true,
  enabled: false,
  label: 'Imóveis',
  route: '/dashboard/properties'
}

[Middleware] ⚠️ Access DENIED - Redirecting to: /dashboard/leads
```

3. **Verifique o redirect**

O browser deve ser automaticamente redirecionado para `/dashboard/leads` (o primeiro módulo ativo)

---

## ✅ Critérios de Sucesso

| Verificação | Status | Resultado Esperado |
|-------------|--------|-------------------|
| x-tenant-id no console | ⬜ | Deve aparecer no log do middleware |
| Módulo detectado | ⬜ | `exists: true, enabled: false` |
| Access DENIED logado | ⬜ | Mensagem ⚠️ aparece |
| Redirect executado | ⬜ | Browser vai para /dashboard/leads |
| URL não fica em /properties | ⬜ | Não mostra página 404 |
| Primeiro módulo ativo carrega | ⬜ | Página de leads aparece normalmente |

---

## 🔄 Passo 4: Habilitar Módulo Novamente

Após o teste, para habilitar o módulo novamente:

```bash
node test-disable-module.mjs enable
```

**Saída esperada:**
```
🔧 Habilitando módulo "properties" novamente...
✅ Módulo "properties" HABILITADO novamente!
```

Agora você pode acessar `/dashboard/properties` normalmente.

---

## 🐛 Troubleshooting

### Problema: "Cannot coerce the result to a single JSON object"

**Causa:** Não há tenant no banco (onboarding não foi completado)

**Solução:** Complete o onboarding primeiro

### Problema: Redirect não acontece

**Causa:** Middleware pode não estar sendo executado

**Verificação:**
1. Check se o arquivo `middleware.ts` está na raiz do projeto
2. Verifique se há erros no console do servidor
3. Restart o dev server

### Problema: Logs não aparecem

**Causa:** Os logs do middleware podem não estar sendo capturados

**Solução:**
1. Verifique o terminal onde `npm run dev` está rodando
2. Se estiver usando outro terminal, os logs podem estar lá
3. Adicione mais console.logs se necessário

---

## 📊 Testes Adicionais

### Teste 2: RBAC (Role-Based Access Control)

Se você tiver acesso ao banco, pode testar RBAC:

1. Crie um usuário com role='viewer'
2. Tente acessar um módulo que requer 'manager'
3. Deve ver log: `🚫 RBAC DENIED - Redirecting to: ...`

### Teste 3: Módulo Inexistente

1. Acesse um módulo que não existe: `/dashboard/modulo-fake`
2. Deve redirecionar para primeiro módulo ativo
3. Log: `exists: false`

### Teste 4: Sidebar Atualizado

1. Com módulo desabilitado, vá para o dashboard
2. Verifique a sidebar
3. "Imóveis" NÃO deve aparecer na navegação
4. Apenas módulos enabled aparecem

---

## 🎨 Visual Testing

Com o módulo habilitado:
1. Abra `/dashboard/properties`
2. Verifique se o visual está com o tema dark (Fase 7.3)
3. Sidebar deve ter background `slate-950/95`
4. Navegação deve ter transições suaves (200ms)
5. Item ativo deve ter barra azul na esquerda

---

## 📝 Notas

- O middleware executa **antes** da página carregar
- Logs aparecem no **terminal do servidor**, não no browser console
- O `x-tenant-id` é injetado nos headers da request
- O redirect é **server-side**, não client-side
- A configuração é **dinâmica** - mudanças no banco refletem imediatamente

---

## 🎯 Resumo

Este teste valida que:

1. ✅ Middleware detecta módulos desabilitados
2. ✅ x-tenant-id é lido corretamente
3. ✅ Redirect automático para primeiro módulo ativo
4. ✅ Não mostra página 404 ou erro
5. ✅ Sidebar remove módulos desabilitados da navegação
6. ✅ Sistema permanece totalmente funcional

---

## 🚀 Próximos Passos

Após validar o middleware:

1. Commit das mudanças
2. Testar com diferentes roles (admin, manager, member, viewer)
3. Testar com múltiplos módulos desabilitados
4. Verificar performance (latência do middleware)
5. Documentar padrões de segurança implementados
