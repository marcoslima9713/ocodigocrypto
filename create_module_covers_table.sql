-- Script para criar a tabela module_covers no Supabase
-- Execute este script no Supabase SQL Editor

-- Criar tabela module_covers
CREATE TABLE IF NOT EXISTS public.module_covers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  cover_image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_module_covers_module_id ON public.module_covers(module_id);
CREATE INDEX IF NOT EXISTS idx_module_covers_created_at ON public.module_covers(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.module_covers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para module_covers
-- Permitir que administradores vejam todas as capas
CREATE POLICY "Admins can view all module covers" ON public.module_covers
  FOR SELECT USING (true);

-- Permitir que administradores insiram novas capas
CREATE POLICY "Admins can insert module covers" ON public.module_covers
  FOR INSERT WITH CHECK (true);

-- Permitir que administradores atualizem capas existentes
CREATE POLICY "Admins can update module covers" ON public.module_covers
  FOR UPDATE USING (true);

-- Permitir que administradores deletem capas
CREATE POLICY "Admins can delete module covers" ON public.module_covers
  FOR DELETE USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_module_covers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_module_covers_updated_at
  BEFORE UPDATE ON public.module_covers
  FOR EACH ROW
  EXECUTE FUNCTION update_module_covers_updated_at();

-- Verificar se a tabela foi criada corretamente
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'module_covers' 
ORDER BY ordinal_position;

-- Verificar as políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'module_covers'; 