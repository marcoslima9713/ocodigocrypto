-- Script para adicionar o módulo "Pool de Liquidez" ao banco de dados
-- Execute este script no Supabase SQL Editor

-- Inserir o novo módulo
INSERT INTO public.modules (
  id,
  name,
  description,
  order_index,
  is_active,
  created_at,
  updated_at
) VALUES (
  'pool-de-liquidez',
  'Pool de Liquidez',
  'Domine os conceitos fundamentais de pools de liquidez e yield farming no ecossistema DeFi. Aprenda sobre AMMs, impermanent loss, yield farming e estratégias avançadas de investimento em DeFi.',
  7, -- Próximo número após os módulos existentes
  true,
  NOW(),
  NOW()
);

-- Verificar se foi inserido corretamente
SELECT * FROM public.modules WHERE id = 'pool-de-liquidez';

-- Listar todos os módulos ativos para verificar a ordem
SELECT id, name, order_index, is_active FROM public.modules WHERE is_active = true ORDER BY order_index; 