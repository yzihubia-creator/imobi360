-- ============================================
-- IMOBI360 - Dados de Teste
-- ============================================

-- 1. Criar tenant de teste
INSERT INTO tenants (name, slug, email, plan, status)
VALUES ('Minha Imobiliária', 'minha-imobiliaria', 'contato@minhaimo.com', 'pro', 'active')
RETURNING id;

-- IMPORTANTE: Pegue o ID retornado acima e substitua {TENANT_ID} abaixo

-- 2. Criar usuário admin (substitua {TENANT_ID} pelo ID real do tenant)
INSERT INTO users (tenant_id, name, email, role, is_active)
VALUES (
  '{TENANT_ID}', -- SUBSTITUA pelo ID do tenant retornado acima
  'Admin',
  'admin@imobi360.com',
  'admin',
  true
);

-- NOTA: O usuário também precisa existir no Supabase Auth
-- 1. Vá em Authentication > Users no Supabase Dashboard
-- 2. Crie um usuário com email: admin@imobi360.com
-- 3. O INSERT acima vincula esse usuário ao tenant

-- 3. Criar imóveis de exemplo (substitua {TENANT_ID})
INSERT INTO imoveis (tenant_id, titulo, tipo, status, valor, endereco, cidade, estado, quartos, banheiros, area)
VALUES
  ('{TENANT_ID}', 'Apartamento 3 quartos Centro', 'apartamento', 'disponivel', 450000, 'Rua das Flores, 123', 'São Paulo', 'SP', 3, 2, 85),
  ('{TENANT_ID}', 'Casa Condomínio Fechado', 'casa', 'disponivel', 850000, 'Alameda dos Jardins, 456', 'São Paulo', 'SP', 4, 3, 180),
  ('{TENANT_ID}', 'Cobertura Vista Mar', 'apartamento', 'disponivel', 1200000, 'Av. Atlântica, 789', 'Rio de Janeiro', 'RJ', 4, 4, 220),
  ('{TENANT_ID}', 'Apartamento Studio Mobiliado', 'apartamento', 'disponivel', 280000, 'Rua Augusta, 321', 'São Paulo', 'SP', 1, 1, 45),
  ('{TENANT_ID}', 'Casa em Condomínio', 'casa', 'vendido', 650000, 'Rua dos Pinheiros, 654', 'Campinas', 'SP', 3, 2, 150);

-- 4. Criar leads de exemplo (substitua {TENANT_ID})
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

-- 5. Criar atividades para os leads (substitua {TENANT_ID} e {LEAD_ID})
-- Exemplo para o primeiro lead:
-- INSERT INTO atividades (tenant_id, lead_id, tipo, descricao, realizado_por)
-- VALUES
--   ('{TENANT_ID}', {LEAD_ID}, 'ligacao', 'Primeira ligação - Lead interessado em conhecer o imóvel', 'João Corretor'),
--   ('{TENANT_ID}', {LEAD_ID}, 'email', 'Enviado material do imóvel por email', 'João Corretor'),
--   ('{TENANT_ID}', {LEAD_ID}, 'visita', 'Visita agendada para amanhã às 15h', 'João Corretor');

-- 6. Criar contratos de exemplo (substitua {TENANT_ID}, {IMOVEL_ID}, {LEAD_ID})
-- INSERT INTO contratos (tenant_id, imovel_id, lead_id, tipo, valor, status, data_inicio)
-- VALUES
--   ('{TENANT_ID}', {IMOVEL_ID}, {LEAD_ID}, 'venda', 650000, 'ativo', CURRENT_DATE);

-- ============================================
-- INSTRUÇÕES:
-- ============================================
-- 1. Execute o INSERT do tenant primeiro
-- 2. Copie o ID retornado
-- 3. Substitua todos os {TENANT_ID} pelo ID real
-- 4. Execute os outros INSERTs
-- 5. No Supabase Auth, crie um usuário
-- 6. Vincule o usuário ao tenant com UPDATE em profiles
-- ============================================
