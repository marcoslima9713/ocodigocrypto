-- Adicionar módulo de Máquina de Alavancagem 2
INSERT INTO modules (
  id,
  name,
  description,
  order_index,
  is_active,
  created_at,
  updated_at
) VALUES (
  'maquina-alavancagem-2',
  'Máquina de Alavancagem 2',
  'Estratégia de renda passiva através de posições neutras no mercado de futuros perpétuos. Aprenda a capturar funding rates positivos enquanto mantém exposição neutra ao preço.',
  7,
  true,
  NOW(),
  NOW()
);

-- Adicionar capa personalizada para o módulo
INSERT INTO module_covers (
  slug,
  cover_url
) VALUES (
  'maquina-alavancagem-2',
  '/lovable-uploads/4dfe53fa-27f3-4715-921d-e467cf2c5f75.png'
);

-- Adicionar vídeos de exemplo para o módulo
INSERT INTO video_lessons (
  id,
  title,
  description,
  file_path,
  module_id,
  estimated_minutes,
  order_index,
  is_public,
  status,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Introdução à Arbitragem de Funding Rate',
  'Conceitos básicos da estratégia de arbitragem de funding rate e como funciona o mercado de futuros perpétuos.',
  '/videos/maquina-alavancagem-2/intro.mp4',
  'maquina-alavancagem-2',
  15,
  1,
  true,
  'publicado',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Como Montar uma Posição Neutra',
  'Passo a passo para montar uma posição neutra: compra no spot e venda no futuro.',
  '/videos/maquina-alavancagem-2/posicao-neutra.mp4',
  'maquina-alavancagem-2',
  20,
  2,
  true,
  'publicado',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Monitoramento e Gestão de Risco',
  'Como monitorar funding rates em tempo real e gerenciar os riscos da estratégia.',
  '/videos/maquina-alavancagem-2/monitoramento.mp4',
  'maquina-alavancagem-2',
  18,
  3,
  true,
  'publicado',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Exemplos Práticos e Simulações',
  'Exemplos práticos de cálculo de retornos e simulações de diferentes cenários de mercado.',
  '/videos/maquina-alavancagem-2/exemplos.mp4',
  'maquina-alavancagem-2',
  25,
  4,
  true,
  'publicado',
  NOW(),
  NOW()
);

-- Verificar se o módulo foi criado corretamente
SELECT 
  m.id,
  m.name,
  m.description,
  m.order_index,
  m.is_active,
  mc.cover_url,
  COUNT(v.id) as video_count
FROM modules m
LEFT JOIN module_covers mc ON m.id = mc.slug
LEFT JOIN video_lessons v ON m.id = v.module_id
WHERE m.id = 'maquina-alavancagem-2'
GROUP BY m.id, m.name, m.description, m.order_index, m.is_active, mc.cover_url;
