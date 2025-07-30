-- Adicionar campos de metadados à tabela video_lessons
ALTER TABLE public.video_lessons 
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('iniciante', 'intermediario', 'avancado')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 0;

-- Atualizar vídeos existentes para status publicado se is_public for true
UPDATE public.video_lessons 
SET status = 'publicado' 
WHERE is_public = true;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_video_lessons_module_id ON public.video_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_video_lessons_status ON public.video_lessons(status);
CREATE INDEX IF NOT EXISTS idx_video_lessons_order ON public.video_lessons(order_index);

-- Criar tabela para gerenciar módulos
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem módulos
CREATE POLICY "Admins can manage all modules" 
ON public.modules 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Política para visualização pública de módulos ativos
CREATE POLICY "Anyone can view active modules" 
ON public.modules 
FOR SELECT 
USING (is_active = true);

-- Inserir módulo existente
INSERT INTO public.modules (id, name, description, order_index, is_active)
VALUES ('origens-bitcoin', 'Origens do Bitcoin', 'Módulo introdutório sobre as origens e fundamentos do Bitcoin', 1, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Trigger para atualizar updated_at na tabela modules
CREATE OR REPLACE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();