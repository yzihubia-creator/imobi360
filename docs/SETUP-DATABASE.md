# 🗄️ Setup do Banco de Dados - IMOBI360

## 📋 Pré-requisitos

- Acesso ao Supabase Dashboard
- Credenciais já configuradas no `.env.local`

## 🚀 Passo a Passo

### 1️⃣ Acessar o SQL Editor

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto: `cbyeextsavlhgquekbks`
3. No menu lateral, clique em **SQL Editor**

---

### 2️⃣ Criar o Tenant

Execute este SQL no SQL Editor:

```sql
-- Criar tenant de teste
INSERT INTO tenants (name, slug, email, plan, status)
VALUES ('Minha Imobiliária', 'minha-imobiliaria', 'contato@minhaimo.com', 'pro', 'active')
RETURNING id;
```

**IMPORTANTE:** Copie o ID retornado (será algo como `123e4567-e89b-12d3-a456-426614174000`)

---

### 3️⃣ Criar Usuário no Supabase Auth

1. No Supabase Dashboard, vá em **Authentication > Users**
2. Clique em **Add user** > **Create new user**
3. Preencha:
   - **Email:** `admin@imobi360.com`
   - **Password:** Crie uma senha forte
   - **Auto Confirm User:** ✅ Marque esta opção
4. Clique em **Create user**

---

### 4️⃣ Vincular Usuário ao Tenant

Substitua `{TENANT_ID}` pelo ID copiado no passo 2:

```sql
-- Criar usuário admin vinculado ao tenant
INSERT INTO users (tenant_id, name, email, role, is_active)
VALUES (
  '{TENANT_ID}', -- COLE AQUI O ID DO TENANT
  'Admin',
  'admin@imobi360.com',
  'admin',
  true
);
```

---

### 5️⃣ Inserir Imóveis de Teste

```sql
-- Criar imóveis de exemplo
INSERT INTO imoveis (tenant_id, titulo, tipo, status, valor, endereco, cidade, estado, quartos, banheiros, area)
VALUES
  ('{TENANT_ID}', 'Apartamento 3 quartos Centro', 'apartamento', 'disponivel', 450000, 'Rua das Flores, 123', 'São Paulo', 'SP', 3, 2, 85),
  ('{TENANT_ID}', 'Casa Condomínio Fechado', 'casa', 'disponivel', 850000, 'Alameda dos Jardins, 456', 'São Paulo', 'SP', 4, 3, 180),
  ('{TENANT_ID}', 'Cobertura Vista Mar', 'apartamento', 'disponivel', 1200000, 'Av. Atlântica, 789', 'Rio de Janeiro', 'RJ', 4, 4, 220),
  ('{TENANT_ID}', 'Apartamento Studio Mobiliado', 'apartamento', 'disponivel', 280000, 'Rua Augusta, 321', 'São Paulo', 'SP', 1, 1, 45),
  ('{TENANT_ID}', 'Casa em Condomínio', 'casa', 'vendido', 650000, 'Rua dos Pinheiros, 654', 'Campinas', 'SP', 3, 2, 150);
```

---

### 6️⃣ Inserir Leads de Teste

```sql
-- Criar leads de exemplo
INSERT INTO leads (tenant_id, nome, email, telefone, origem, status, temperatura, imovel_interesse)
VALUES
  ('{TENANT_ID}', 'João Silva', 'joao.silva@email.com', '(11) 98765-4321', 'site', 'novo', 'quente', 'Apartamento 3 quartos Centro'),
  ('{TENANT_ID}', 'Maria Santos', 'maria.santos@email.com', '(11) 91234-5678', 'indicacao', 'contato', 'quente', 'Casa Condomínio Fechado'),
  ('{TENANT_ID}', 'Pedro Oliveira', 'pedro.oliveira@email.com', '(21) 99876-5432', 'facebook', 'qualificado', 'morno', 'Cobertura Vista Mar'),
  ('{TENANT_ID}', 'Ana Costa', 'ana.costa@email.com', '(11) 94567-8901', 'instagram', 'visita', 'quente', 'Apartamento Studio Mobiliado'),
  ('{TENANT_ID}', 'Carlos Ferreira', 'carlos.ferreira@email.com', '(19) 93456-7890', 'site', 'proposta', 'quente', 'Casa em Condomínio'),
  ('{TENANT_ID}', 'Julia Lima', 'julia.lima@email.com', '(11) 92345-6789', 'google', 'novo', 'frio', NULL),
  ('{TENANT_ID}', 'Roberto Alves', 'roberto.alves@email.com', '(11) 91111-2222', 'indicacao', 'negociacao', 'quente', 'Apartamento 3 quartos Centro'),
  ('{TENANT_ID}', 'Fernanda Souza', 'fernanda.souza@email.com', '(21) 98888-9999', 'site', 'perdido', 'frio', NULL);
```

---

## ✅ Verificação

Execute estas queries para verificar se tudo foi criado:

```sql
-- Verificar tenant
SELECT * FROM tenants;

-- Verificar usuário
SELECT * FROM users WHERE email = 'admin@imobi360.com';

-- Contar imóveis
SELECT COUNT(*) as total_imoveis FROM imoveis;

-- Contar leads
SELECT COUNT(*) as total_leads FROM leads;
```

---

## 🔐 Fazer Login

1. Acesse: http://localhost:3000/login
2. Use as credenciais:
   - **Email:** `admin@imobi360.com`
   - **Senha:** A senha que você criou no passo 3

---

## 📊 Dados Criados

Após executar todos os passos, você terá:

- ✅ 1 Tenant (Minha Imobiliária)
- ✅ 1 Usuário Admin
- ✅ 5 Imóveis (4 disponíveis, 1 vendido)
- ✅ 8 Leads em diferentes estágios do funil

---

## 🎯 Próximos Passos

Após configurar o banco:

1. Fazer login no sistema
2. Navegar pelo dashboard
3. Ver os leads no Kanban
4. Explorar as funcionalidades

---

## 🆘 Problemas Comuns

### Erro: "relation does not exist"
- As tabelas ainda não foram criadas no Supabase
- Você precisa criar o schema primeiro

### Erro de autenticação
- Verifique se o usuário foi criado no Supabase Auth
- Confirme que o email está correto
- Tente resetar a senha

### Não vê os dados
- Verifique se substituiu `{TENANT_ID}` corretamente
- Confirme que o tenant_id é o mesmo em todas as tabelas
