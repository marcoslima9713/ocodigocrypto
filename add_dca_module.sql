-- Adicionar módulo DCA (Dollar Cost Averaging) ao banco de dados
INSERT INTO public.modules (
  id, name, description, order_index, is_active, created_at, updated_at
) VALUES (
  'dca',
  'DCA - Dollar Cost Averaging',
  'Domine a estratégia de investimento mais eficaz para acumular Bitcoin ao longo do tempo. Aprenda como o DCA pode reduzir riscos e maximizar seus retornos no mercado de criptomoedas.',
  8, -- Próximo número após os módulos existentes
  true,
  NOW(),
  NOW()
);

-- Inserir aulas do módulo DCA (exemplo de estrutura)
-- Estas aulas podem ser adicionadas através do painel administrativo

-- Aula 1: Introdução ao DCA
INSERT INTO public.video_lessons (
  id, title, description, module_id, order_index, status, is_public, difficulty_level, estimated_minutes, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'O que é Dollar Cost Averaging?',
  'Entenda os fundamentos do DCA e por que é uma das estratégias mais eficazes para investir em Bitcoin.',
  'dca',
  1,
  'publicado',
  true,
  'iniciante',
  15,
  NOW(),
  NOW()
);

-- Aula 2: Vantagens do DCA
INSERT INTO public.video_lessons (
  id, title, description, module_id, order_index, status, is_public, difficulty_level, estimated_minutes, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Vantagens e Benefícios do DCA',
  'Descubra como o DCA reduz a volatilidade, elimina o timing do mercado e constrói riqueza a longo prazo.',
  'dca',
  2,
  'publicado',
  true,
  'iniciante',
  18,
  NOW(),
  NOW()
);

-- Aula 3: Implementando DCA
INSERT INTO public.video_lessons (
  id, title, description, module_id, order_index, status, is_public, difficulty_level, estimated_minutes, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Como Implementar DCA na Prática',
  'Aprenda a criar um plano de DCA personalizado, definir frequência e valores de investimento.',
  'dca',
  3,
  'publicado',
  true,
  'intermediario',
  20,
  NOW(),
  NOW()
);

-- Aula 4: Plataformas e Ferramentas
INSERT INTO public.video_lessons (
  id, title, description, module_id, order_index, status, is_public, difficulty_level, estimated_minutes, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Melhores Plataformas para DCA',
  'Conheça as principais exchanges e ferramentas para automatizar seus investimentos DCA em Bitcoin.',
  'dca',
  4,
  'publicado',
  true,
  'intermediario',
  22,
  NOW(),
  NOW()
);

-- Aula 5: Estratégias Avançadas
INSERT INTO public.video_lessons (
  id, title, description, module_id, order_index, status, is_public, difficulty_level, estimated_minutes, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Estratégias Avançadas de DCA',
  'Explore variações do DCA como Value Averaging, DCA com stop-loss e otimização de timing.',
  'dca',
  5,
  'publicado',
  true,
  'avancado',
  25,
  NOW(),
  NOW()
);

-- Aula 6: Análise de Performance
INSERT INTO public.video_lessons (
  id, title, description, module_id, order_index, status, is_public, difficulty_level, estimated_minutes, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Analisando Performance do DCA',
  'Aprenda a acompanhar e analisar o desempenho de sua estratégia DCA ao longo do tempo.',
  'dca',
  6,
  'publicado',
  true,
  'intermediario',
  18,
  NOW(),
  NOW()
);

-- Aula 7: Psicologia do Investimento
INSERT INTO public.video_lessons (
  id, title, description, module_id, order_index, status, is_public, difficulty_level, estimated_minutes, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Psicologia e Disciplina no DCA',
  'Desenvolva a mentalidade correta para manter consistência e disciplina em sua estratégia DCA.',
  'dca',
  7,
  'publicado',
  true,
  'intermediario',
  16,
  NOW(),
  NOW()
);

-- Aula 8: DCA vs Outras Estratégias
INSERT INTO public.video_lessons (
  id, title, description, module_id, order_index, status, is_public, difficulty_level, estimated_minutes, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'DCA vs Outras Estratégias de Investimento',
  'Compare o DCA com outras estratégias como lump sum, timing do mercado e trading ativo.',
  'dca',
  8,
  'publicado',
  true,
  'avancado',
  20,
  NOW(),
  NOW()
); 